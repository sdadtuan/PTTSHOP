import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import QRCode from "qrcode";
import { z } from "zod";
import { ApiError, handleApiError, jsonOk } from "@/lib/api";
import { resolveAddress } from "@/lib/address/vn-admin";
import { getOptionalSession } from "@/lib/auth-guards";
import { getCartSessionId } from "@/lib/cart-session";
import {
  computeCouponDiscount,
  consumeCoupon,
  findValidCoupon,
} from "@/lib/coupons";
import { sendOrderConfirmationEmail } from "@/lib/mail";
import { getPaymentProvider } from "@/lib/payments";
import { holdEnforceFrom, releaseExpiredUnpaid } from "@/lib/payments/hold";
import { transferEmailLogText, transferEmailText, transferView } from "@/lib/payments/instructions";
import { createPayosLink, payosEnv } from "@/lib/payments/payos";
import { checkoutMethodError, quoteFromServerPrices } from "@/lib/payments/policy";
import { gatewaySecrets, visibleGateways } from "@/lib/payments/gateways";
import { getPaymentConfig, getGatewayFlags } from "@/lib/payments/store";
import { prisma } from "@/lib/prisma";
import { NOT_FOR_SALE_MESSAGE, variantIsForSale } from "@/lib/catalog-visibility";
import { checkoutConsentPlan, clientIp, recordConsents } from "@/lib/consent";
import { orderBuyerId } from "@/lib/order-buyer";
import { nextOrderNumber } from "@/lib/order-number";
import { poFile } from "@/lib/dropship/orders";
import { planCheckoutLines, sellableTotals } from "@/lib/dropship/service";
import { claimWarehouseStock } from "@/lib/inventory/claim";
import { merchandiseAfterBundle, settleBundles } from "@/lib/bundles";
import { bundleSettings } from "@/lib/bundles-public";
import { quoteCheckout } from "@/lib/shipping/service";
import { hashReceiptToken, RECEIPT_COOKIE } from "@/lib/order-receipt-token";
import { checkoutItemSchema, checkoutPhoneSchema } from "@/lib/checkout/order-input";
import { emailSchema } from "@/lib/validation";

const bodySchema = z.object({
  customerName: z.string().trim().min(2).max(80),
  customerPhone: checkoutPhoneSchema,
  customerEmail: emailSchema.optional().or(z.literal("")),
  address: z.string().trim().min(5).max(200),
  provinceCode: z.string().trim().min(2).max(2),
  wardCode: z.string().trim().min(5).max(5),
  note: z.string().max(500).optional(),
  paymentMethod: z.enum(["COD", "BANK_TRANSFER", "PAYOS", "VIETQR", "MOMO", "ZALOPAY"]),
  couponCode: z.string().trim().max(40).optional().or(z.literal("")),
  invoiceCompanyName: z.string().trim().max(160).optional().or(z.literal("")),
  invoiceTaxCode: z.string().trim().max(14).optional().or(z.literal("")),
  invoiceAddress: z.string().trim().max(200).optional().or(z.literal("")),
  invoiceEmail: emailSchema.optional().or(z.literal("")),
  consents: z
    .array(
      z.object({
        purpose: z.enum(["delivery", "invoice", "marketing"]),
        granted: z.boolean(),
      }),
    )
    .default([]),
  items: z.array(checkoutItemSchema).min(1),
});

function orderNumber() {
  return nextOrderNumber();
}

function appBase() {
  return (process.env.AUTH_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
}

function invoiceFields(data: z.infer<typeof bodySchema>) {
  const company = data.invoiceCompanyName || "";
  const tax = data.invoiceTaxCode || "";
  const address = data.invoiceAddress || "";
  const email = data.invoiceEmail || "";
  const any = Boolean(company || tax || address || email);
  if (!any) return { company: null, tax: null, address: null, email: null };
  if (!company || !tax || !address || !email) {
    throw new ApiError("Hoá đơn công ty cần đủ tên, mã số thuế, địa chỉ và email.", 400);
  }
  if (!/^\d{10}(\d{3})?$/.test(tax)) throw new ApiError("Mã số thuế không hợp lệ.", 400);
  return { company, tax, address, email };
}

export async function POST(req: Request) {
  try {
    const data = bodySchema.parse(await req.json());
    checkoutConsentPlan(data.consents);
    const session = await getOptionalSession();
    const sessionId = await getCartSessionId();
    await releaseExpiredUnpaid(prisma, new Date(), holdEnforceFrom());

    const variants = await prisma.productVariant.findMany({
      where: { id: { in: data.items.map((i) => i.variantId) } },
      include: { product: true },
    });

    if (variants.length !== data.items.length) {
      throw new ApiError("Một số sản phẩm không còn khả dụng", 400);
    }
    if (variants.some((variant) => !variantIsForSale(variant.product))) {
      throw new ApiError(NOT_FOR_SALE_MESSAGE, 400);
    }

    const plans = await planCheckoutLines(
      prisma,
      data.items.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
      new Date(),
    );
    const lines = data.items.map((item) => {
      const variant = variants.find((v) => v.id === item.variantId)!;
      const plan = plans.find((row) => row.variantId === item.variantId);
      if (!plan?.ok) {
        throw new ApiError(`Hết hàng: ${variant.product.name} (${variant.size})`, 400);
      }
      return { item, variant, plan };
    });

    const catalogLines = lines.map((line) => ({
      price: line.variant.price,
      quantity: line.item.quantity,
    }));
    const subtotalPreview = catalogLines.reduce((sum, line) => sum + line.price * line.quantity, 0);
    const bundleIds = [...new Set(data.items.map((item) => item.bundleId).filter((id): id is string => Boolean(id)))];
    const settings = await bundleSettings();
    const bundleRows = bundleIds.length
      ? await prisma.bundle.findMany({
          where: { id: { in: bundleIds } },
          include: { items: { include: { product: { include: { variants: { select: { id: true } } } } } } },
        })
      : [];
    const submittedProducts = new Set(lines.map((line) => line.variant.productId));
    const missingProducts = bundleRows.flatMap((bundle) =>
      bundle.items.map((item) => item.product).filter((product) => !submittedProducts.has(product.id)),
    );
    const missingStock = await sellableTotals(
      prisma,
      missingProducts.flatMap((product) => product.variants.map((variant) => variant.id)),
    );
    const unavailableProductIds = missingProducts
      .filter((product) => product.variants.every((variant) => (missingStock.get(variant.id) ?? 0) <= 0))
      .map((product) => product.id);
    const settled = settleBundles({
      lines: lines.map((line) => ({
        variantId: line.variant.id,
        productId: line.variant.productId,
        unitPrice: line.variant.price,
        quantity: line.item.quantity,
        bundleId: line.item.bundleId || null,
      })),
      bundles: bundleRows.map((bundle) => ({
        id: bundle.id,
        title: bundle.title,
        isPublished: bundle.isPublished,
        startsAt: bundle.startsAt,
        endsAt: bundle.endsAt,
        priceMode: bundle.priceMode,
        priceVnd: bundle.priceVnd,
        percentOff: bundle.percentOff,
        productIds: bundle.items.map((item) => item.productId),
      })),
      now: new Date(),
      couponRequested: Boolean(data.couponCode),
      stackCoupon: settings.stackCoupon,
      outOfStockMode: settings.outOfStockMode,
      unavailableProductIds,
    });
    if (settled.error) throw new ApiError(settled.error, 400);
    const bundleDiscount = settled.discount;
    const goodsForShipping = merchandiseAfterBundle(subtotalPreview, bundleDiscount);
    const place = resolveAddress(data.provinceCode, data.wardCode);
    if (!place) throw new ApiError("Tỉnh hoặc phường/xã không hợp lệ.", 400);
    const shippingQuote = await quoteCheckout({
      db: prisma,
      subtotal: goodsForShipping,
      provinceCode: data.provinceCode,
      wardCode: data.wardCode,
    });
    const shippingFee = shippingQuote.fee;

    let discount = 0;
    let couponCode: string | null = null;
    let couponId: string | null = null;

    if (data.couponCode) {
      const couponBase = merchandiseAfterBundle(subtotalPreview, bundleDiscount);
      const coupon = await findValidCoupon(prisma, data.couponCode, couponBase);
      discount = computeCouponDiscount(coupon, couponBase);
      couponCode = coupon.code;
      couponId = coupon.id;
    }

    const priced = quoteFromServerPrices(catalogLines, shippingFee, discount + bundleDiscount);
    const subtotal = priced.subtotal;
    const total = priced.total;
    const paymentConfig = await getPaymentConfig();
    const payos = payosEnv();
    const gateway = data.paymentMethod.toLowerCase();
    if (gateway === "vietqr" || gateway === "momo" || gateway === "zalopay") {
      const flags = await getGatewayFlags();
      const visible = visibleGateways(flags, gatewaySecrets());
      if (!visible[gateway]) throw new ApiError("Cổng thanh toán chưa được cấu hình.", 400);
    }
    const methodError = checkoutMethodError(data.paymentMethod, total, paymentConfig, payos.enabled);
    if (methodError) throw new ApiError(methodError, 400);
    const invoice = invoiceFields(data);
    const provider = getPaymentProvider(data.paymentMethod);
    const receiptToken = randomBytes(16).toString("hex");
    const buyerId = orderBuyerId(session?.user);
    const paymentDueAt = new Date(
      Date.now() +
        (data.paymentMethod === "COD" ? paymentConfig.codConfirmHours : paymentConfig.holdHours) *
          60 *
          60 *
          1000,
    );
    let payosOrderCode: number | null = null;
    if (data.paymentMethod === "PAYOS") {
      for (let attempt = 0; attempt < 5; attempt++) {
        const code = Math.floor(100000000 + Math.random() * 900000000);
        const taken = await prisma.order.findUnique({ where: { payosOrderCode: code } });
        if (!taken) {
          payosOrderCode = code;
          break;
        }
      }
      if (!payosOrderCode) throw new ApiError("Không tạo được mã payOS.", 500);
    }

    const order = await prisma.$transaction(async (tx) => {
      for (const { variant, plan } of lines) {
        if (plan.warehouseQty > 0) {
          try {
            await claimWarehouseStock(tx, variant.id, plan.warehouseQty);
          } catch (error) {
            if (error instanceof ApiError) {
              throw new ApiError(`Không đủ tồn kho: ${variant.product.name} (${variant.size})`, 400);
            }
            throw error;
          }
        }
        if (plan.supplierQty > 0 && plan.supplierId) {
          const supplierSku = await tx.supplierSku.findFirst({
            where: { variantId: variant.id, supplierId: plan.supplierId, isActive: true },
          });
          if (!supplierSku) throw new ApiError(`Không đủ tồn nhà cung cấp: ${variant.product.name}`, 400);
          const updated = await tx.supplierSku.updateMany({
            where: { id: supplierSku.id, supplierStock: { gte: plan.supplierQty } },
            data: { supplierStock: { decrement: plan.supplierQty } },
          });
          if (updated.count === 0) throw new ApiError(`Không đủ tồn nhà cung cấp: ${variant.product.name}`, 400);
        }
      }

      if (couponId) {
        const coupon = await tx.coupon.findUniqueOrThrow({
          where: { id: couponId },
        });
        await consumeCoupon(tx, coupon);
      }

      const created = await tx.order.create({
        data: {
          orderNumber: orderNumber(),
          userId: buyerId,
          status: "PENDING",
          paymentMethod: data.paymentMethod,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          customerEmail: data.customerEmail || null,
          address: `${data.address}, ${place.wardName}, ${place.provinceName}`,
          provinceCode: place.provinceCode,
          provinceName: place.provinceName,
          wardCode: place.wardCode,
          wardName: place.wardName,
          note: data.note || null,
          couponCode,
          subtotal,
          shippingFee,
          discount: discount + bundleDiscount,
          bundleDiscount,
          total,
          paymentDueAt,
          payosOrderCode,
          invoiceCompanyName: invoice.company,
          invoiceTaxCode: invoice.tax,
          invoiceAddress: invoice.address,
          invoiceEmail: invoice.email,
          receiptTokenHash: hashReceiptToken(receiptToken),
          items: {
            create: lines.map(({ item, variant, plan }) => ({
              variantId: variant.id,
              name: variant.product.name,
              color: variant.color,
              size: variant.size,
              price: variant.price,
              quantity: item.quantity,
              supplierQty: plan.supplierQty,
              supplierId: plan.supplierId,
              bundleId: item.bundleId || null,
            })),
          },
        },
        include: { items: true },
      });

      const warehouseLines = created.items.filter((item) => item.quantity - item.supplierQty > 0);
      const supplierGroups = new Map<string, typeof created.items>();
      for (const item of created.items) {
        if (!item.supplierId || item.supplierQty <= 0) continue;
        const group = supplierGroups.get(item.supplierId) || [];
        group.push(item);
        supplierGroups.set(item.supplierId, group);
      }
      if (warehouseLines.length > 0) {
        await tx.shipment.create({
          data: {
            orderId: created.id,
            shipmentNumber: `${created.orderNumber}-KHO`,
            idempotencyKey: `${created.orderNumber}-KHO`,
            provider: "MANUAL",
            status: "CREATED",
            fulfillmentSource: "WAREHOUSE",
            items: { create: warehouseLines.map((item) => ({ orderItemId: item.id, quantity: item.quantity - item.supplierQty })) },
          },
        });
      }
      for (const [supplierId, group] of supplierGroups) {
        const shipment = await tx.shipment.create({
          data: {
            orderId: created.id,
            shipmentNumber: `${created.orderNumber}-NCC-${supplierId.slice(-6)}`,
            idempotencyKey: `${created.orderNumber}-NCC-${supplierId}`,
            provider: "MANUAL",
            status: "CREATED",
            fulfillmentSource: "SUPPLIER",
            items: { create: group.map((item) => ({ orderItemId: item.id, quantity: item.supplierQty })) },
          },
        });
        const supplier = await tx.supplier.findUniqueOrThrow({ where: { id: supplierId } });
        const skus = await tx.supplierSku.findMany({ where: { supplierId, variantId: { in: group.map((item) => item.variantId) } } });
        const poNumber = `PO-${created.orderNumber}-${supplierId.slice(-4)}`;
        const draft = {
          poNumber,
          supplierName: supplier.name,
          lines: group.map((item) => ({
            supplierSku: skus.find((row) => row.variantId === item.variantId)?.supplierSku || item.variantId,
            name: item.name,
            color: item.color,
            size: item.size,
            quantity: item.supplierQty,
          })),
        };
        const file = poFile(draft);
        await tx.supplierOrder.create({
          data: {
            orderId: created.id,
            shipmentId: shipment.id,
            supplierId,
            status: "READY",
            poNumber,
            fileName: file.fileName,
            emailSubject: file.emailSubject,
            emailBody: file.emailBody,
          },
        });
      }

      const payment = await provider.createPayment(created);
      return tx.order.update({
        where: { id: created.id },
        data: {
          paymentStatus: payment.paymentStatus,
          paymentProvider: payment.paymentProvider,
          paymentRef: payment.paymentRef ?? null,
        },
        include: { items: true },
      });
    });

    if (data.paymentMethod === "PAYOS" && payosOrderCode) {
      try {
        const link = await createPayosLink({
          env: payos,
          orderCode: payosOrderCode,
          amount: order.total,
          description: order.orderNumber.slice(0, 25),
          returnUrl: `${appBase()}/dat-hang-thanh-cong?order=${encodeURIComponent(order.orderNumber)}`,
          cancelUrl: `${appBase()}/thanh-toan`,
          expiredAt: Math.floor(paymentDueAt.getTime() / 1000),
        });
        await prisma.order.update({
          where: { id: order.id },
          data: { payosQr: link.qrCode, paymentRef: link.paymentLinkId || link.checkoutUrl },
        });
      } catch {
        await prisma.$transaction(async (tx) => {
          await tx.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
          for (const item of order.items) {
            const ownQty = item.quantity - item.supplierQty;
            if (ownQty > 0) {
              await tx.productVariant.update({
                where: { id: item.variantId },
                data: { stock: { increment: ownQty } },
              });
            }
            if (item.supplierQty > 0 && item.supplierId) {
              await tx.supplierSku.updateMany({
                where: { supplierId: item.supplierId, variantId: item.variantId },
                data: { supplierStock: { increment: item.supplierQty } },
              });
            }
          }
        });
        throw new ApiError("payOS không tạo được mã thanh toán.", 502);
      }
    }

    const cartOwnerId = session?.user?.id ?? null;
    if (cartOwnerId) {
      const userCart = await prisma.cart.findUnique({ where: { userId: cartOwnerId } });
      if (userCart) await prisma.cartItem.deleteMany({ where: { cartId: userCart.id } });
    } else if (sessionId) {
      const guestCart = await prisma.cart.findUnique({ where: { sessionId } });
      if (guestCart) await prisma.cartItem.deleteMany({ where: { cartId: guestCart.id } });
    }

    await recordConsents({
      subject: order.customerEmail || order.customerPhone,
      userId: buyerId,
      ip: clientIp(req),
      grants: data.consents,
    });

    const view = order.paymentMethod === "BANK_TRANSFER"
      ? transferView({ config: paymentConfig, amount: order.total, orderNumber: order.orderNumber, dueAt: order.paymentDueAt })
      : null;
    const qrPng = view ? await QRCode.toBuffer(view.qrPayload) : undefined;
    void sendOrderConfirmationEmail({
      orderNumber: order.orderNumber,
      customerEmail: order.customerEmail,
      customerName: order.customerName,
      total: order.total,
      status: order.status,
      transferText: view ? transferEmailText(view) : undefined,
      transferLogText: view ? transferEmailLogText(view) : undefined,
      qrPng,
    });

    const jar = await cookies();
    jar.set(RECEIPT_COOKIE, `${order.orderNumber}.${receiptToken}`, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 30,
      secure: process.env.NODE_ENV === "production",
    });

    return jsonOk({
      orderNumber: order.orderNumber,
      receiptToken,
      total: order.total,
      discount: order.discount,
      paymentStatus: order.paymentStatus,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

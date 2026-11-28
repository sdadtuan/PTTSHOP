import { execSync } from "child_process";
import path from "path";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { testPgUrl } from "./pg";

const dbUrl = process.env.DATABASE_URL || testPgUrl();

export function resetTestDb() {
  execSync("npx prisma migrate deploy", {
    cwd: path.resolve(process.cwd()),
    env: { ...process.env, DATABASE_URL: dbUrl },
    stdio: "pipe",
  });
}

export async function cleanDb(prisma: PrismaClient) {
  await prisma.analyticsEvent.deleteMany();
  await prisma.slugRedirect.deleteMany();
  await prisma.supplierDebit.deleteMany();
  await prisma.supplierOrder.deleteMany();
  await prisma.syncRun.deleteMany();
  await prisma.supplierSku.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.consent.deleteMany();
  await prisma.reviewMedia.deleteMany();
  await prisma.review.deleteMany();
  await prisma.refundApprovalLog.deleteMany();
  await prisma.refundRequest.deleteMany();
  await prisma.returnItem.deleteMany();
  await prisma.returnRequest.deleteMany();
  await prisma.invoiceAuditLog.deleteMany();
  await prisma.invoice.updateMany({ data: { parentInvoiceId: null } });
  await prisma.invoice.deleteMany();
  await prisma.orderCancellation.deleteMany();
  await prisma.shipmentItem.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.paymentAuditLog.deleteMany();
  await prisma.webhookEvent.deleteMany();
  await prisma.codReconcileLine.deleteMany();
  await prisma.codReconcileSession.deleteMany();
  await prisma.shippingWebhookEvent.deleteMany();
  await prisma.crmSyncJob.deleteMany();
  await prisma.emailOutbox.deleteMany();
  await prisma.notificationLog.deleteMany();
  await prisma.paymentTransaction.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.productCollection.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.category.updateMany({ data: { parentId: null } });
  await prisma.category.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.flashSale.deleteMany();
  await prisma.heroBanner.deleteMany();
  await prisma.homepageVersion.deleteMany();
  await prisma.homepageSection.deleteMany();
  await prisma.siteSettings.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.adminAuditLog.deleteMany();
  await prisma.userRoleAssignment.deleteMany();
  await prisma.adminTwoFactor.deleteMany();
  await prisma.pricingRule.deleteMany();
  await prisma.user.deleteMany();
}

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Thiếu biến môi trường ${name}`);
  return value;
}

export async function seedMinimal(prisma: PrismaClient) {
  const adminEmail = requiredEnv("E2E_ADMIN_EMAIL");
  const adminPassword = requiredEnv("E2E_ADMIN_PASSWORD");
  const customerEmail = requiredEnv("E2E_CUSTOMER_EMAIL");
  const customerPassword = requiredEnv("E2E_CUSTOMER_PASSWORD");
  const admin = await prisma.user.create({
    data: {
      name: "Admin",
      email: adminEmail,
      password: await bcrypt.hash(adminPassword, 10),
      role: "ADMIN",
    },
  });
  const customer = await prisma.user.create({
    data: {
      name: "Customer",
      email: customerEmail,
      password: await bcrypt.hash(customerPassword, 10),
      role: "CUSTOMER",
    },
  });
  const product = await prisma.product.create({
    data: {
      name: "Test Tee",
      slug: "test-tee",
      description: "Test",
      gender: "UNISEX",
      images: {
        create: [
          {
            url: "/images/placeholder-product.svg",
            sortOrder: 0,
          },
        ],
      },
      variants: {
        create: [
          {
            sku: "TEST-TEE-BLACK-M",
            color: "Đen",
            colorHex: "#111",
            size: "M",
            price: 200000,
            stock: 5,
          },
        ],
      },
    },
    include: { variants: true },
  });
  await prisma.coupon.create({
    data: {
      code: "SAVE10",
      discountType: "PERCENT",
      discountValue: 10,
      minOrder: 100000,
      isActive: true,
    },
  });
  return { admin, customer, product, variant: product.variants[0]! };
}

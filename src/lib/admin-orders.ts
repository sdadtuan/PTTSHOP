import type { PaymentMethod, PaymentStatus } from "@prisma/client";
import { primaryImage } from "@/lib/product-media";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  COD: "Thu tiền khi giao (COD)",
  BANK_TRANSFER: "Chuyển khoản",
  PAYOS: "payOS",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  UNPAID: "Chưa thanh toán",
  PENDING: "Đang chờ xác nhận",
  PAID: "Đã thanh toán",
  FAILED: "Thanh toán thất bại",
};

export const adminOrderDetailInclude = {
  items: {
    orderBy: { id: "asc" as const },
    include: {
      variant: {
        include: {
          product: {
            select: {
              id: true,
              slug: true,
              images: {
                where: { isHidden: false },
                orderBy: { sortOrder: "asc" as const },
              },
            },
          },
        },
      },
    },
  },
  user: { select: { id: true, name: true, email: true } },
  shipments: { orderBy: { createdAt: "asc" as const }, include: { items: true } },
  paymentAudits: { orderBy: { createdAt: "asc" as const } },
} as const;

export function orderItemImageUrl(item: {
  variant?: {
    product?: {
      images: { url: string; type: string; color: string | null }[];
    } | null;
  } | null;
  color: string;
}): string | null {
  const images = item.variant?.product?.images;
  if (!images?.length) return null;
  const pick = primaryImage(images, item.color) ?? images.find((i) => i.type === "image");
  return pick?.url ?? null;
}

export function orderLineSummary(items: { name: string; quantity: number }[]) {
  const productNames = new Set(items.map((i) => i.name));
  const qty = items.reduce((s, i) => s + i.quantity, 0);
  return { productCount: productNames.size, lineQty: qty, label: `${productNames.size} SP · ${qty} món` };
}
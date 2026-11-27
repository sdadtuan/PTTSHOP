import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Giỏ hàng",
  description: "Sản phẩm đang chọn trước khi thanh toán.",
  alternates: { canonical: "/gio-hang" },
  robots: { index: false, follow: false },
  openGraph: { title: "Giỏ hàng", url: "/gio-hang", type: "website" },
  twitter: { card: "summary", title: "Giỏ hàng" },
};

export default function CartSectionLayout({ children }: { children: ReactNode }) {
  return children;
}

import type { Metadata } from "next";
import { Be_Vietnam_Pro, Outfit } from "next/font/google";
import { CartProvider } from "@/components/cart/cart-context";
import { FloatingSocial } from "@/components/layout/floating-social";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Providers } from "@/components/providers";
import "./globals.css";

const body = Be_Vietnam_Pro({
  variable: "--font-body",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

const display = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "VIZFAS — Thời trang mỗi ngày đều chất",
    template: "%s | VIZFAS",
  },
  description:
    "Cửa hàng thời trang & phụ kiện Nam · Nữ. Chất liệu bền, form hiện đại, dễ phối mỗi ngày.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${body.variable} ${display.variable} h-full`}>
      <body className="flex min-h-full flex-col antialiased">
        <Providers>
          <CartProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <FloatingSocial />
          </CartProvider>
        </Providers>
      </body>
    </html>
  );
}

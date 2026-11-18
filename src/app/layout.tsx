import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { Be_Vietnam_Pro, Outfit } from "next/font/google";
import { CartProvider } from "@/components/cart/cart-context";
import { SiteBrandProvider } from "@/components/cms/site-brand-context";
import { FloatingSocial } from "@/components/layout/floating-social";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Providers } from "@/components/providers";
import { getSiteSettingsForRequest } from "@/lib/cms/published";
import { DEFAULT_SITE_SETTINGS } from "@/lib/cms/types";
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

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const settings = await getSiteSettingsForRequest();
  const accent = settings.brandColor || DEFAULT_SITE_SETTINGS.brandColor;
  // Default colour keeps the exact globals.css tokens (identical to 6003c40);
  // a custom brand colour overrides --accent / --accent-soft site-wide.
  const brandStyle =
    accent.toLowerCase() === DEFAULT_SITE_SETTINGS.brandColor
      ? undefined
      : ({
          ["--accent"]: accent,
          ["--accent-soft"]: `color-mix(in oklab, ${accent} 12%, white)`,
        } as CSSProperties);

  return (
    <html lang="vi" className={`${body.variable} ${display.variable} h-full`}>
      <body
        className="flex min-h-full flex-col antialiased"
        style={brandStyle}
      >
        <Providers>
          <SiteBrandProvider settings={settings}>
            <CartProvider>
              <Header />
              <main className="min-w-0 flex-1 pb-20 md:pb-0">{children}</main>
              <Footer />
              <FloatingSocial />
            </CartProvider>
          </SiteBrandProvider>
        </Providers>
      </body>
    </html>
  );
}

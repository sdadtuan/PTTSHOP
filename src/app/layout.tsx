import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { StorefrontLayoutProvider } from "@/components/cms/storefront-layout-context";
import { Be_Vietnam_Pro } from "next/font/google";
import { CartProvider } from "@/components/cart/cart-context";
import { SiteBrandProvider } from "@/components/cms/site-brand-context";
import { FloatingSocial } from "@/components/layout/floating-social";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Providers } from "@/components/providers";
import { getSiteSettingsForRequest, getStorefrontLayoutForRequest } from "@/lib/cms/published";
import { DEFAULT_SITE_SETTINGS } from "@/lib/cms/types";
import "./globals.css";

/**
 * One family for body and display. Outfit has no Vietnamese subset, so dấu
 * (ố ạ ấ …) fell back to another face and weight 900 was synthesized.
 * Be Vietnam Pro covers latin + vietnamese at every weight the UI uses.
 */
const sans = Be_Vietnam_Pro({
  variable: "--font-body",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettingsForRequest();
  const brand = settings.brandName || DEFAULT_SITE_SETTINGS.brandName;
  return {
    title: {
      default: settings.seoTitle || DEFAULT_SITE_SETTINGS.seoTitle,
      template: `%s | ${brand}`,
    },
    description: settings.seoDescription || DEFAULT_SITE_SETTINGS.seoDescription,
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [settings, layoutCms] = await Promise.all([
    getSiteSettingsForRequest(),
    getStorefrontLayoutForRequest(),
  ]);
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
    <html lang="vi" className={`${sans.variable} h-full`}>
      <body
        className="flex min-h-full flex-col antialiased"
        style={brandStyle}
      >
        <Providers>
          <SiteBrandProvider settings={settings}>
            <StorefrontLayoutProvider value={layoutCms}>
              <CartProvider>
                <Header />
                <main className="min-w-0 flex-1 pb-20 md:pb-0">{children}</main>
                <Footer />
                <FloatingSocial />
              </CartProvider>
            </StorefrontLayoutProvider>
          </SiteBrandProvider>
        </Providers>
      </body>
    </html>
  );
}

import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { StorefrontLayoutProvider } from "@/components/cms/storefront-layout-context";
import { Be_Vietnam_Pro } from "next/font/google";
import { CartProvider } from "@/components/cart/cart-context";
import { SiteBrandProvider } from "@/components/cms/site-brand-context";
import { FloatingSocial } from "@/components/layout/floating-social";
import { Footer } from "@/components/layout/footer";
import { CookieBanner } from "@/components/legal/cookie-banner";
import { Measurement } from "@/components/legal/measurement";
import { Header } from "@/components/layout/header";
import { StorefrontFrame } from "@/components/layout/storefront-frame";
import { Providers } from "@/components/providers";
import { ShopProfileProvider } from "@/components/cms/shop-profile-context";
import { getSiteSettingsForRequest, getStorefrontLayoutForRequest } from "@/lib/cms/published";
import { getMeasurementIds } from "@/lib/analytics/load";
import { getShopProfile } from "@/lib/shop/load";
import { DEFAULT_SITE_SETTINGS } from "@/lib/cms/types";
import { displayBrandName } from "@/lib/public-brand";
import { CONSENT_DEFAULT_SCRIPT } from "@/lib/tracking";
import { jsonLdScript, organizationJsonLd, siteBaseUrl, websiteJsonLd } from "@/lib/seo";
import Script from "next/script";
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
  const brand = displayBrandName(settings.brandName || DEFAULT_SITE_SETTINGS.brandName);
  const title = displayBrandName(settings.seoTitle || DEFAULT_SITE_SETTINGS.seoTitle);
  const description = displayBrandName(settings.seoDescription || DEFAULT_SITE_SETTINGS.seoDescription);
  return {
    metadataBase: new URL(siteBaseUrl()),
    title: {
      default: title,
      template: `%s | ${brand}`,
    },
    description,
    openGraph: {
      title,
      description,
      url: "/",
      siteName: brand,
      locale: "vi_VN",
      type: "website",
    },
    icons: {
      icon: [
        { url: "/favicon.ico" },
        { url: "/icon.png", type: "image/png", sizes: "512x512" },
      ],
      apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [settings, layoutCms, shopProfile, measurementIds] = await Promise.all([
    getSiteSettingsForRequest(),
    getStorefrontLayoutForRequest(),
    getShopProfile(),
    getMeasurementIds(),
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

  const brand = displayBrandName(settings.brandName || DEFAULT_SITE_SETTINGS.brandName);
  return (
    <html lang="vi" className={`${sans.variable} h-full`}>
      <body
        className="flex min-h-full flex-col antialiased"
        style={brandStyle}
      >
        <Script id="consent-default" strategy="beforeInteractive">
          {CONSENT_DEFAULT_SCRIPT}
        </Script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLdScript([
              organizationJsonLd({
                name: brand,
                url: siteBaseUrl(),
                telephone: shopProfile.hotline,
                email: shopProfile.email,
                address: shopProfile.address,
              }),
              websiteJsonLd({ name: brand, url: siteBaseUrl() }),
            ]),
          }}
        />
        <Providers>
          <ShopProfileProvider value={shopProfile}>
          <SiteBrandProvider settings={settings}>
            <StorefrontLayoutProvider value={layoutCms}>
              <CartProvider>
                <StorefrontFrame
                  header={<Header />}
                  banner={<CookieBanner />}
                  extras={
                    <>
                      <Measurement ids={measurementIds} />
                      <FloatingSocial />
                    </>
                  }
                >
                  <main className="min-w-0 flex-1">{children}</main>
                  <Footer />
                </StorefrontFrame>
              </CartProvider>
            </StorefrontLayoutProvider>
          </SiteBrandProvider>
          </ShopProfileProvider>
        </Providers>
      </body>
    </html>
  );
}

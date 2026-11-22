import type { Metadata } from "next";
import { DemoFooter } from "@/components/demo-v2/demo-footer";
import { DemoHeader } from "@/components/demo-v2/demo-header";
import { getSiteSettingsForRequest, getStorefrontLayoutForRequest } from "@/lib/cms/published";
import "@/components/demo-v2/demo-v2.css";

export const metadata: Metadata = {
  title: "Demo V2 — PTT Shop",
  description:
    "Bản thiết kế storefront Version B (demo so sánh). Không thay thế trang chủ chính.",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default async function DemoV2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, layoutCms] = await Promise.all([
    getSiteSettingsForRequest(),
    getStorefrontLayoutForRequest(),
  ]);

  return (
    <div className="demo-v2" data-testid="demo-v2-root">
      <DemoHeader brandName={settings.brandName || "PTT Shop"} />
      {children}
      <DemoFooter settings={settings} footerLinks={layoutCms.footerLinks} />
    </div>
  );
}

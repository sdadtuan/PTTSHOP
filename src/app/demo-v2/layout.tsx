import type { Metadata } from "next";
import { DemoFooter } from "@/components/demo-v2/demo-footer";
import { DemoHeader } from "@/components/demo-v2/demo-header";
import "@/components/demo-v2/demo-v2.css";

export const metadata: Metadata = {
  title: "Demo V2 — VIZFAS",
  description:
    "Bản thiết kế storefront Version B (demo so sánh). Không thay thế trang chủ chính.",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function DemoV2Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="demo-v2" data-testid="demo-v2-root">
      <DemoHeader />
      {children}
      <DemoFooter />
    </div>
  );
}

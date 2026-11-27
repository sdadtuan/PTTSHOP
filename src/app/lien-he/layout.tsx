import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Liên hệ",
  description: "Liên hệ PTT Shop.",
  alternates: { canonical: "/lien-he" },
  openGraph: { title: "Liên hệ", url: "/lien-he", type: "website" },
  twitter: { card: "summary", title: "Liên hệ" },
};

export default function ContactSectionLayout({ children }: { children: ReactNode }) {
  return children;
}

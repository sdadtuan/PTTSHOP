import Link from "next/link";
import type { FooterLinksContent, SiteSettingsData } from "@/lib/cms/types";

export function DemoFooter({
  settings,
  footerLinks,
}: {
  settings: SiteSettingsData;
  footerLinks: FooterLinksContent;
}) {
  const brand = settings.brandName || "VIZFAS";
  const social = [
    { href: settings.socialInstagram || "https://instagram.com", label: "Instagram" },
    { href: settings.socialFacebook || "https://facebook.com", label: "Facebook" },
    { href: settings.socialTiktok || "https://tiktok.com", label: "TikTok" },
    { href: settings.socialYoutube || "https://youtube.com", label: "YouTube" },
  ];

  const columns = footerLinks.columns;
  const contactTitle = footerLinks.contactColumnTitle || "Liên hệ";

  return (
    <footer className="dv2-footer" data-testid="demo-v2-footer">
      <div className="dv2-wrap">
        <div className="dv2-footer__top">
          <div>
            <div className="dv2-footer__brand">{brand}</div>
            <p>{settings.footerTagline}</p>
            <div className="dv2-footer__social">
              {social.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                >
                  {s.label.slice(0, 2)}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="dv2-footer__grid">
          {columns.map((col) => (
            <div key={col.title}>
              <h4>{col.title}</h4>
              <ul>
                {col.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h4>{contactTitle}</h4>
            <ul>
              <li>{settings.contactAddress}</li>
              <li>
                <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>
              </li>
              <li>
                <a href={`tel:${settings.contactPhone.replace(/\s/g, "")}`}>
                  {settings.contactPhone}
                </a>
              </li>
              <li>{settings.contactHours}</li>
              {footerLinks.showHomepageSwitcher ? (
                <>
                  <li>
                    <Link href="/">Homepage A</Link>
                  </li>
                  <li>
                    <Link href="/demo-v2">Homepage B</Link>
                  </li>
                </>
              ) : null}
            </ul>
          </div>
        </div>
        <div className="dv2-footer__bottom">
          <span>
            © {new Date().getFullYear()} {brand}. Demo V2 — noindex.
          </span>
          <span>Orange · Black · White</span>
        </div>
      </div>
    </footer>
  );
}
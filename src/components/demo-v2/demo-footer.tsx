import Link from "next/link";
import type { FooterLinksContent, SiteSettingsData } from "@/lib/cms/types";
import { displayBrandName, visibleEmail, visibleHref, visiblePhone } from "@/lib/public-brand";

export function DemoFooter({
  settings,
  footerLinks,
}: {
  settings: SiteSettingsData;
  footerLinks: FooterLinksContent;
}) {
  const brand = displayBrandName(settings.brandName);
  const social = [
    { href: visibleHref(settings.socialInstagram), label: "Instagram" },
    { href: visibleHref(settings.socialFacebook), label: "Facebook" },
    { href: visibleHref(settings.socialTiktok), label: "TikTok" },
    { href: visibleHref(settings.socialYoutube), label: "YouTube" },
    { href: visibleHref(settings.messengerUrl), label: "Messenger" },
  ].filter((item) => item.href);
  const email = visibleEmail(settings.contactEmail);
  const phone = visiblePhone(settings.hotline || settings.contactPhone);

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
              {email ? (
                <li>
                  <a href={`mailto:${email}`}>{email}</a>
                </li>
              ) : null}
              {phone ? (
                <li>
                  <a href={`tel:${phone.replace(/\s/g, "")}`}>{phone}</a>
                </li>
              ) : null}
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
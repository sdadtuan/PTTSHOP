import Link from "next/link";
import type { SiteSettingsData } from "@/lib/cms/types";

const columns = [
  {
    title: "Mua sắm",
    links: [
      { href: "/san-pham?sort=newest", label: "Sản phẩm mới" },
      { href: "/san-pham?category=ao-thun", label: "Áo thun" },
      { href: "/san-pham?category=ao-khoac", label: "Áo khoác" },
      { href: "/san-pham?category=quan", label: "Quần" },
      { href: "/san-pham?category=phu-kien", label: "Phụ kiện" },
      { href: "/san-pham?sale=1", label: "Sale" },
    ],
  },
  {
    title: "Hỗ trợ",
    links: [
      { href: "/ho-tro/mua-hang", label: "Hướng dẫn mua hàng" },
      { href: "/ho-tro/doi-tra", label: "Chính sách đổi trả" },
      { href: "/ho-tro/van-chuyen", label: "Chính sách vận chuyển" },
      { href: "/ho-tro/thanh-toan", label: "Phương thức thanh toán" },
      { href: "/ho-tro/cau-hoi", label: "Câu hỏi thường gặp" },
    ],
  },
  {
    title: "Về chúng tôi",
    links: [
      { href: "/ve-chung-toi", label: "Câu chuyện thương hiệu" },
      { href: "/ve-chung-toi#gia-tri", label: "Giá trị cốt lõi" },
      { href: "/bo-suu-tap", label: "Bộ sưu tập" },
      { href: "/tin-tuc", label: "Tin tức" },
      { href: "/tuyen-dung", label: "Tuyển dụng" },
      { href: "/lien-he", label: "Liên hệ" },
    ],
  },
] as const;

export function DemoFooter({ settings }: { settings: SiteSettingsData }) {
  const brand = settings.brandName || "VIZFAS";
  const social = [
    { href: settings.socialInstagram || "https://instagram.com", label: "Instagram" },
    { href: settings.socialFacebook || "https://facebook.com", label: "Facebook" },
    { href: settings.socialTiktok || "https://tiktok.com", label: "TikTok" },
    { href: settings.socialYoutube || "https://youtube.com", label: "YouTube" },
  ];

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
            <h4>Liên hệ</h4>
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
              <li>
                <Link href="/">Homepage A</Link>
              </li>
              <li>
                <Link href="/demo-v2">Homepage B</Link>
              </li>
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

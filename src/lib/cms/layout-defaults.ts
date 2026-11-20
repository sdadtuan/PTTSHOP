import { homeImages } from "@/config/home-images";
import type { DemoHeroSlide, FooterColumn, NavLink, TrustPair } from "@/lib/cms/types";

export { type TrustPair };

export const DEFAULT_PRIMARY_NAV: NavLink[] = [
  { href: "/", label: "Trang chủ" },
  { href: "/bo-suu-tap", label: "Bộ sưu tập" },
  { href: "/san-pham", label: "Sản phẩm" },
  { href: "/danh-gia", label: "Đánh giá" },
  { href: "/ve-chung-toi", label: "Về chúng tôi" },
  { href: "/lien-he", label: "Liên hệ" },
];

export const DEFAULT_MOBILE_NAV_EXTRA: NavLink[] = [
  { href: "/san-pham?gender=MALE", label: "Nam" },
  { href: "/san-pham?gender=FEMALE", label: "Nữ" },
  { href: "/tai-khoan", label: "Tài khoản" },
  { href: "/lien-he", label: "Liên hệ" },
];

export const DEFAULT_DEMO_PRIMARY_NAV: NavLink[] = [
  { href: "/demo-v2", label: "Trang Chủ", match: "/demo-v2" },
  { href: "/bo-suu-tap", label: "Bộ Sưu Tập" },
  { href: "/san-pham", label: "Sản Phẩm" },
  { href: "/demo-v2#danh-gia", label: "ĐÁNH GIÁ", match: "/demo-v2", hash: "#danh-gia" },
  { href: "/ve-chung-toi", label: "Về VIZFAS" },
  { href: "/lien-he", label: "Liên Hệ" },
];

export const DEFAULT_DEMO_MOBILE_EXTRA: NavLink[] = [
  { href: "/san-pham?gender=MALE", label: "Nam" },
  { href: "/san-pham?gender=FEMALE", label: "Nữ" },
  { href: "/tai-khoan", label: "Tài khoản" },
  { href: "/yeu-thich", label: "Yêu thích" },
];

export const DEFAULT_FOOTER_COLUMNS: FooterColumn[] = [
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
];

export const DEFAULT_LEGAL_LINKS = [
  { href: "/chinh-sach/dieu-khoan", label: "Điều khoản sử dụng" },
  { href: "/chinh-sach/bao-mat", label: "Chính sách bảo mật" },
  { href: "/chinh-sach/cookie", label: "Chính sách cookie" },
];

export const DEFAULT_HERO_TRUST_ITEMS = [
  "Chất liệu thoáng mát",
  "Form dáng hiện đại",
  "Bền màu",
  "Free ship > 500k",
] as const;

/** Demo trust bar when titles come from hero.trustItems only — subtitles from trustPairs. */
export const DEFAULT_DEMO_TRUST_PAIRS: TrustPair[] = [
  { title: "Giao Hàng Nhanh", subtitle: "Toàn Quốc" },
  { title: "Đổi Trả Dễ Dàng", subtitle: "Trong 7 Ngày" },
  { title: "Thanh Toán An Toàn", subtitle: "Nhiều Phương Thức" },
  { title: "Hỗ Trợ 24/7", subtitle: "Luôn Sẵn Sàng" },
];

export function defaultDemoHeroSlides(ctaLabel: string): DemoHeroSlide[] {
  return [
    {
      eyebrow: "ESSENTIALS",
      title: "VIZFAS",
      subtitle: "Form rộng, chất dày — dễ mặc mỗi ngày.",
      ctaHref: "/san-pham?category=hoodie",
      ctaLabel,
      mainImage: homeImages.featured.large[0],
      sideAImage: homeImages.featured.small[1],
      sideBImage: homeImages.colorPlay.main,
    },
    {
      eyebrow: "COLOR PLAY",
      title: "VIZFAS",
      subtitle: "Phối màu tạo chất — nổi bật mà vẫn tối giản.",
      ctaHref: "/bo-suu-tap",
      ctaLabel,
      mainImage: homeImages.featured.large[1],
      sideAImage: homeImages.colorPlay.grid[2],
      sideBImage: homeImages.dualBanner.right,
    },
  ];
}
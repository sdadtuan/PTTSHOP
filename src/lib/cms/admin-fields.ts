import type { FieldDef } from "@/components/cms/cms-fields";
import type { HomepageSectionKey } from "@/lib/cms/types";

/** Layout sections are not reordered on the homepage body list. */
export const LAYOUT_SECTIONS: HomepageSectionKey[] = [
  "header",
  "navigation",
  "footer_links",
  "floating_contact",
  "reviews",
  "footer",
];

export const SECTION_HELP: Partial<Record<HomepageSectionKey, string>> = {
  header: "Logo, tên thương hiệu, màu chủ đạo và SEO mặc định toàn site.",
  navigation: "Menu điều hướng trang chủ A và demo B (desktop + menu di động).",
  footer_links: "Các cột liên kết chân trang và dòng pháp lý dưới cùng.",
  floating_contact: "Nút liên hệ nổi bên phải (Facebook, Zalo, gọi điện…).",
  reviews: "Tiêu đề và trạng thái trống của khối đánh giá trên /demo-v2.",
  hero: "Khối đầu trang: ảnh vỡ mảnh (shatter), tiêu đề lớn, nút và 4 ưu điểm.",
  dual_banner: "Banner 2 ảnh “Phong Cách Đơn Giản – Mang Đậm Tính Cá Nhân”.",
  collections: "Lưới 3 bộ sưu tập (Áo Thun / Quần / Phụ Kiện) — chọn danh mục có sẵn cho từng ô.",
  diverse: "Khối “Đa Dạng Kiểu Dáng – Dễ Phối Đồ” với ảnh người mẫu và chữ nền WEARLY.",
  featured: "Sản phẩm nổi bật (2 khung lớn + 4 khung nhỏ).",
  color_play:
    "Khối PHỐI MÀU TẠO CHẤT: ảnh lớn, 2 ảnh dưới đoạn “Xu Hướng”, lưới ảnh và chữ dọc.",
  promo_banner: "Banner quảng cáo tùy chọn (mặc định tắt để giữ đúng bố cục hiện tại).",
  footer: "Chân trang: mô tả, liên hệ, mạng xã hội (cố định ở cuối mọi trang).",
};

export const SECTION_FIELDS: Partial<Record<HomepageSectionKey, FieldDef[]>> = {
  hero: [
    { path: "badgeLine1", label: "Nhãn tròn — dòng 1", kind: "text" },
    { path: "badgeLine2", label: "Nhãn tròn — dòng 2", kind: "text" },
    { path: "title", label: "Tiêu đề chính", kind: "text" },
    { path: "subtitle", label: "Tiêu đề phụ", kind: "text" },
    { path: "description", label: "Mô tả", kind: "textarea" },
    { path: "ctaLabel", label: "Chữ nút", kind: "text" },
    { path: "ctaHref", label: "Link nút", kind: "href" },
    { path: "trustItems", label: "4 ưu điểm (mỗi dòng 1 mục)", kind: "lines", max: 4 },
    {
      path: "useHeroBanner",
      label: "Dùng ảnh từ “Banner trang chủ” (hiệu ứng vỡ ảnh)",
      kind: "bool",
      hint: "Bật: ảnh hero lấy từ banner đang hoạt động trong mục Banner trang chủ. Tắt: dùng ảnh bên dưới.",
    },
    { path: "imageUrl", label: "Ảnh hero riêng (khi không dùng Banner trang chủ)", kind: "image", hint: "Khung 4:5, nên ≥ 1200px chiều rộng." },
  ],
  dual_banner: [
    { path: "titleLine1", label: "Tiêu đề — dòng 1", kind: "text" },
    { path: "titleLine2", label: "Tiêu đề — dòng 2", kind: "text" },
    { path: "titleLine3", label: "Tiêu đề — dòng 3", kind: "text" },
    { path: "description", label: "Mô tả", kind: "textarea" },
    { path: "leftImage", label: "Ảnh trái", kind: "image" },
    { path: "rightImage", label: "Ảnh phải", kind: "image" },
  ],
  collections: [
    { path: "eyebrow", label: "Nhãn nhỏ", kind: "text" },
    { path: "titleLine1", label: "Tiêu đề — dòng 1", kind: "text" },
    { path: "titleLine2", label: "Tiêu đề — dòng 2", kind: "text" },
    { path: "ctaLabel", label: "Chữ nút", kind: "text" },
    { path: "ctaHref", label: "Link nút", kind: "href" },
  ],
  diverse: [
    { path: "eyebrow", label: "Nhãn nhỏ", kind: "text" },
    { path: "titleLine1", label: "Tiêu đề — dòng 1", kind: "text" },
    { path: "titleLine2", label: "Tiêu đề — dòng 2", kind: "text" },
    { path: "titleLine3", label: "Tiêu đề — dòng 3", kind: "text" },
    { path: "description", label: "Mô tả", kind: "textarea" },
    { path: "ctaLabel", label: "Chữ nút", kind: "text" },
    { path: "ctaHref", label: "Link nút", kind: "href" },
    { path: "watermark", label: "Chữ nền lớn", kind: "text" },
    { path: "modelImage", label: "Ảnh người mẫu", kind: "image" },
  ],
  featured: [
    { path: "titlePrefix", label: "Tiêu đề (phần đen)", kind: "text" },
    { path: "titleAccent", label: "Tiêu đề (phần màu)", kind: "text" },
    { path: "ctaLabel", label: "Chữ nút", kind: "text" },
    { path: "ctaHref", label: "Link nút", kind: "href" },
    { path: "largeImages", label: "Ảnh 2 khung lớn", kind: "images", max: 2, hint: "Ảnh hiển thị thay ảnh sản phẩm ở khung lớn. Xóa để dùng ảnh sản phẩm." },
    { path: "smallImages", label: "Ảnh 4 khung nhỏ", kind: "images", max: 4, hint: "Ảnh hiển thị thay ảnh sản phẩm ở khung nhỏ." },
  ],
  color_play: [
    { path: "brandLine1", label: "Nhãn thương hiệu (dòng 1)", kind: "text" },
    { path: "brandEmphasis", label: "Nhãn nhấn (in nghiêng)", kind: "text" },
    { path: "ctaLabel", label: "Chữ nút CTA", kind: "text" },
    { path: "ctaHref", label: "Link nút CTA", kind: "href" },
    { path: "headline", label: "Tiêu đề", kind: "textarea" },
    { path: "paragraph1", label: "Đoạn 1", kind: "textarea" },
    { path: "paragraph2", label: "Đoạn 2", kind: "textarea" },
    {
      path: "introImage1",
      label: "Ảnh intro 1 (dưới đoạn văn)",
      kind: "image",
      hint: "Hai ảnh dưới “Xu Hướng Màu Sắc” — thay bằng tải lên hoặc URL /media/uploads/…",
    },
    { path: "introImage1Alt", label: "Alt ảnh intro 1", kind: "text" },
    {
      path: "introImage2",
      label: "Ảnh intro 2 (dưới đoạn văn)",
      kind: "image",
    },
    { path: "introImage2Alt", label: "Alt ảnh intro 2", kind: "text" },
    { path: "verticalLabel", label: "Chữ dọc", kind: "text" },
    { path: "mainImage", label: "Ảnh lớn", kind: "image" },
    { path: "typeFillImage", label: "Ảnh lấp chữ MÀU / TẠO / CHẤT", kind: "image" },
    { path: "gridImages", label: "Lưới ảnh nhỏ", kind: "images", max: 9, hint: "Giữ đúng số ảnh hiện tại để bố cục không đổi." },
  ],
  promo_banner: [
    { path: "title", label: "Tiêu đề", kind: "text" },
    { path: "subtitle", label: "Mô tả", kind: "textarea" },
    { path: "ctaLabel", label: "Chữ nút", kind: "text" },
    { path: "ctaHref", label: "Link nút", kind: "href" },
    { path: "imageUrl", label: "Ảnh banner", kind: "image" },
  ],
};

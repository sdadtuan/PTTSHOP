import type { FieldDef } from "@/components/cms/cms-fields";
import type { HomepageSectionKey } from "@/lib/cms/types";

/** Header/footer are part of the site layout (fixed position); they use Site settings. */
export const LAYOUT_SECTIONS: HomepageSectionKey[] = ["header", "footer"];

export const SECTION_HELP: Partial<Record<HomepageSectionKey, string>> = {
  header: "Logo và tên thương hiệu trên thanh menu (cố định ở đầu mọi trang).",
  hero: "Khối đầu trang: ảnh vỡ mảnh (shatter), tiêu đề lớn, nút và 4 ưu điểm.",
  dual_banner: "Banner 2 ảnh “Phong Cách Đơn Giản – Mang Đậm Tính Cá Nhân”.",
  collections: "Lưới 3 bộ sưu tập (Áo Thun / Quần / Phụ Kiện) — chọn danh mục có sẵn cho từng ô.",
  diverse: "Khối “Đa Dạng Kiểu Dáng – Dễ Phối Đồ” với ảnh người mẫu và chữ nền WEARLY.",
  featured: "Sản phẩm nổi bật (2 khung lớn + 4 khung nhỏ).",
  color_play: "Khối PHỐI MÀU TẠO CHẤT với ảnh lớn, lưới ảnh và chữ dọc.",
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
    { path: "headline", label: "Tiêu đề", kind: "textarea" },
    { path: "paragraph1", label: "Đoạn 1", kind: "textarea" },
    { path: "paragraph2", label: "Đoạn 2", kind: "textarea" },
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

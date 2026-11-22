import { POLICY_PAGES } from "@/content/policies";

export type StorefrontPageSeed = {
  slug: string;
  title: string;
  description?: string;
  body: string[];
  sortOrder: number;
};

export const STOREFRONT_PAGE_SEEDS: StorefrontPageSeed[] = [
  {
    slug: "danh-gia",
    title: "Đánh giá",
    description: "Nhận xét từ khách hàng VIZFAS.",
    body: [
      "Xem nhận xét thật từ khách đã mua và trải nghiệm sản phẩm VIZFAS.",
      "Bạn cũng có thể để lại đánh giá trên trang chi tiết sản phẩm sau khi đặt hàng thành công.",
    ],
    sortOrder: 4,
  },
  {
    slug: "tin-tuc",
    title: "Tin tức",
    description: "Cập nhật thương hiệu và bộ sưu tập VIZFAS.",
    body: [
      "Chào mừng bạn đến với khu vực tin tức VIZFAS.",
      "Chúng tôi sẽ cập nhật bài viết về bộ sưu tập, sự kiện và mẹo phối đồ tại đây.",
    ],
    sortOrder: 5,
  },
  {
    slug: "tuyen-dung",
    title: "Tuyển dụng",
    description: "Gia nhập đội ngũ VIZFAS.",
    body: [
      "VIZFAS đang tìm kiếm đồng đội yêu thích thời trang và trải nghiệm khách hàng.",
      "Gửi CV qua hello@vizfas.vn với tiêu đề \"Ứng tuyển VIZFAS\".",
    ],
    sortOrder: 6,
  },
  {
    slug: "ve-chung-toi",
    title: "Về VIZFAS",
    description: "Câu chuyện thương hiệu VIZFAS.",
    body: [
      "VIZFAS là thương hiệu thời trang tối giản với tinh thần đường phố: mặc đơn giản vẫn nổi bật. Chúng tôi tập trung vào form dễ mặc, chất liệu bền và bảng màu dễ phối cho Nam · Nữ mỗi ngày.",
      "Từ áo thun Essential đến hoodie form rộng, mỗi sản phẩm được thiết kế để bạn dựng outfit nhanh mà vẫn chỉn chu.",
    ],
    sortOrder: 0,
  },
  {
    slug: "ho-tro/van-chuyen",
    title: "Vận chuyển",
    body: [
      "Đơn COD hoặc chuyển khoản được đóng gói trong 24h làm việc.",
      "Bạn có thể theo dõi trạng thái tại Tài khoản → Đơn hàng.",
    ],
    sortOrder: 10,
  },
  {
    slug: "ho-tro/doi-tra",
    title: "Đổi trả",
    body: [
      "Đổi size/màu trong 30 ngày nếu còn tem và chưa qua sử dụng.",
      "Liên hệ hello@vizfas.vn kèm mã đơn để được hỗ trợ.",
    ],
    sortOrder: 11,
  },
  {
    slug: "ho-tro/bang-size",
    title: "Bảng size",
    body: [
      "S: ngực 96 · dài 68 · vai 44",
      "M: ngực 100 · dài 70 · vai 46",
      "L: ngực 104 · dài 72 · vai 48",
      "XL: ngực 108 · dài 74 · vai 50",
      "XXL: ngực 112 · dài 76 · vai 52",
    ],
    sortOrder: 12,
  },
  {
    slug: "ho-tro/bao-hanh",
    title: "Bảo hành",
    body: ["Lỗi sản xuất được hỗ trợ đổi mới trong 7 ngày kể từ khi nhận hàng."],
    sortOrder: 13,
  },
  {
    slug: "ho-tro/cau-hoi",
    title: "Câu hỏi thường gặp",
    body: [
      "Thanh toán hỗ trợ COD và chuyển khoản ngân hàng.",
      "Đơn chưa giao có thể yêu cầu hủy theo quy tắc trạng thái đơn.",
    ],
    sortOrder: 14,
  },
  {
    slug: "ho-tro/mua-hang",
    title: "Hướng dẫn mua hàng",
    body: [
      "Chọn sản phẩm, size và màu phù hợp rồi thêm vào giỏ.",
      "Điền thông tin giao hàng và chọn thanh toán COD hoặc chuyển khoản.",
      "Chúng tôi xác nhận đơn trong giờ làm việc và giao theo khu vực của bạn.",
    ],
    sortOrder: 15,
  },
  {
    slug: "ho-tro/thanh-toan",
    title: "Phương thức thanh toán",
    body: [
      "Thanh toán khi nhận hàng (COD) trên toàn quốc.",
      "Chuyển khoản ngân hàng theo hướng dẫn trong email xác nhận đơn.",
    ],
    sortOrder: 16,
  },
  {
    slug: "chinh-sach/dieu-khoan",
    title: "Điều khoản sử dụng",
    body: [
      "Khi sử dụng website VIZFAS, bạn đồng ý với các điều khoản mua bán và bảo mật thông tin.",
      "Giá và tồn kho có thể thay đổi; đơn hàng chỉ được xác nhận sau khi hệ thống ghi nhận thành công.",
    ],
    sortOrder: 20,
  },
  {
    slug: "chinh-sach/bao-mat",
    title: "Chính sách bảo mật",
    body: [
      "Chúng tôi chỉ dùng thông tin liên hệ để xử lý đơn hàng và hỗ trợ khách hàng.",
      "Không bán dữ liệu cá nhân cho bên thứ ba.",
    ],
    sortOrder: 21,
  },
  {
    slug: "chinh-sach/van-chuyen",
    title: "Chính sách vận chuyển",
    body: [
      "Giao hàng toàn quốc. Thời gian dự kiến 2–5 ngày tùy khu vực.",
      "Miễn phí vận chuyển áp dụng theo chương trình tại thời điểm đặt hàng.",
    ],
    sortOrder: 22,
  },
  {
    slug: "chinh-sach/cookie",
    title: "Chính sách cookie",
    body: [
      "Website dùng cookie cần thiết để duy trì phiên đăng nhập và giỏ hàng.",
      "Bạn có thể tắt cookie trên trình duyệt; một số tính năng có thể không hoạt động.",
    ],
    sortOrder: 23,
  },
  ...POLICY_PAGES.map((page, index) => ({
    slug: page.slug,
    title: page.title,
    description: page.description,
    body: [`Ngày hiệu lực: ${page.effectiveLabel}`, ...page.body],
    sortOrder: 40 + index,
  })),
];
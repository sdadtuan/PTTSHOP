import { company } from "@/content/company";

export type PolicyPage = {
  slug: string;
  title: string;
  description: string;
  effectiveLabel: string;
  body: string[];
};

const draft =
  "Bản nháp ngày 22/11/2026. Chưa có hiệu lực cho đến khi được duyệt và đăng. Luật sư rà là [cần chốt].";

export const POLICY_PAGES: PolicyPage[] = [
  {
    slug: "chinh-sach-bao-mat",
    title: "Chính sách bảo mật",
    description: "Cách cửa hàng xử lý dữ liệu cá nhân khi mua hàng.",
    effectiveLabel: "[cần chốt]",
    body: [
      draft,
      `${company.name}, MST ${company.taxId}, địa chỉ ${company.address}, người đại diện ${company.representative}, thu thập dữ liệu để giao hàng và xuất chứng từ.`,
      "Phạm vi: họ tên, số điện thoại, email nếu khách cung cấp, địa chỉ giao, nội dung đơn, và nhật ký đồng ý.",
      "Thời gian lưu đơn hàng và dữ liệu giao hàng: [cần chốt].",
      "Bên nhận: hãng vận chuyển [cần chốt], nhà cung cấp hàng [cần chốt], cổng thanh toán [cần chốt], đơn vị hóa đơn [cần chốt]. Chỉ chuyển phần dữ liệu cần cho việc đó.",
      "Khách được yêu cầu xem, sửa, xóa dữ liệu và rút đồng ý tiếp thị tại trang /yeu-cau-du-lieu.",
      `Liên hệ: hotline ${company.hotline}, email ${company.email}.`,
      "Chuyển dữ liệu ra nước ngoài: [cần chốt]. Nếu chưa dùng dịch vụ đặt máy chủ hoặc đo lường ngoài Việt Nam thì ghi là không chuyển.",
    ],
  },
  {
    slug: "dieu-khoan",
    title: "Điều khoản sử dụng",
    description: "Điều kiện giao dịch khi đặt hàng trên website.",
    effectiveLabel: "[cần chốt]",
    body: [
      draft,
      "Đặt hàng trên website là đề nghị giao kết. Hợp đồng xác lập khi cửa hàng xác nhận đơn.",
      "Giá niêm yết đã gồm VAT. Phí vận chuyển tính riêng và hiện trước khi đặt.",
      "Cửa hàng không chịu trách nhiệm về chậm trễ do khách đưa sai địa chỉ, thiếu người nhận, hoặc sự kiện bất khả kháng. Mức bồi thường tối đa, nếu có, là [cần chốt].",
    ],
  },
  {
    slug: "chinh-sach-thanh-toan",
    title: "Chính sách thanh toán",
    description: "Phương thức và thời điểm thanh toán.",
    effectiveLabel: "[cần chốt]",
    body: [
      draft,
      "Hiện có thanh toán khi nhận hàng (COD) và chuyển khoản. Cổng thanh toán trực tuyến: [cần chốt].",
      "Đơn chuyển khoản được xử lý sau khi cửa hàng đối soát được tiền. Thời hạn giữ đơn chưa thanh toán: [cần chốt].",
      "Hoàn tiền, nếu đơn bị hủy sau khi đã thu, được trả về đúng phương thức đã trả trong thời hạn [cần chốt].",
    ],
  },
  {
    slug: "chinh-sach-giao-hang",
    title: "Chính sách giao hàng",
    description: "Phạm vi, thời gian và phí giao.",
    effectiveLabel: "[cần chốt]",
    body: [
      draft,
      "Phạm vi giao: [cần chốt]. Thời gian dự kiến: [cần chốt].",
      "Phí giao được báo trước khi đặt. Ngưỡng miễn phí vận chuyển: [cần chốt].",
      "Khách được đồng kiểm với nhân viên giao hàng theo quy định của hãng vận chuyển.",
      "Giao thất bại: cửa hàng hoặc hãng vận chuyển liên hệ lại. Sau số lần thử [cần chốt], đơn có thể bị hoàn về.",
      "Đơn gồm nhiều kiện hoặc giao từ nhà cung cấp khác nhau có thể tới nhiều lần. Mỗi kiện vẫn thuộc cùng một đơn.",
    ],
  },
  {
    slug: "chinh-sach-doi-tra",
    title: "Chính sách đổi trả",
    description: "Điều kiện đổi, trả và hàng không áp dụng.",
    effectiveLabel: "[cần chốt]",
    body: [
      draft,
      "Khách được yêu cầu đổi hoặc trả trong [cần chốt] ngày kể từ khi nhận. Đề xuất đang xét: 7 ngày.",
      "Hàng cần còn tem, chưa qua sử dụng, còn hóa đơn hoặc mã đơn. Lỗi do nhà sản xuất được đổi hoặc trả.",
      "Không đổi trả với hàng đã qua sử dụng, mất tem, hoặc thuộc nhóm vệ sinh cá nhân đã mở niêm phong. Danh mục cụ thể: [cần chốt].",
      "Với hàng đúng mô tả và không lỗi, chi phí gửi trả do [cần chốt].",
    ],
  },
  {
    slug: "khieu-nai",
    title: "Khiếu nại",
    description: "Cách gửi khiếu nại và thời hạn phản hồi.",
    effectiveLabel: "[cần chốt]",
    body: [
      draft,
      `Gửi khiếu nại qua hotline ${company.hotline}, email ${company.email}, hoặc trang liên hệ. Cần mã đơn, nội dung và ảnh nếu có.`,
      "Cửa hàng xác nhận đã nhận trong [cần chốt] và trả lời hướng xử lý trong [cần chốt].",
      "Nếu chưa thống nhất, khách có thể đưa vụ việc tới cơ quan bảo vệ người tiêu dùng có thẩm quyền.",
    ],
  },
  {
    slug: "huong-dan-chon-size",
    title: "Hướng dẫn chọn size",
    description: "Cách đo và bảng size theo nhóm hàng.",
    effectiveLabel: "[cần chốt]",
    body: [
      draft,
      "Đo vòng ngực, vòng eo, vòng mông và chiều cao. So với bảng size của từng nhóm: áo, quần, phụ kiện.",
      "Số đo từng size: [cần chốt]. Bảng sẽ gắn theo sản phẩm khi có hàng thật.",
      "Nếu số đo nằm giữa hai size, liên hệ hotline trước khi đặt.",
    ],
  },
];

export function policyBySlug(slug: string) {
  return POLICY_PAGES.find((page) => page.slug === slug) ?? null;
}

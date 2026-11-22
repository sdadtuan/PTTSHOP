/** Default customer-facing copy for main storefront (Version A). */

export type ContactUiCopy = {
  title: string;
  intro: string;
  showroomLabel: string;
  showroomAddress: string;
  emailLabel: string;
  phoneLabel: string;
  hoursLabel: string;
  /** When true, email/phone/hours pulled from SiteSettings instead of overrides below. */
  useSiteContactFields: boolean;
  email: string;
  phone: string;
  hours: string;
  mapEmbedUrl: string;
  formHeading: string;
  formNamePlaceholder: string;
  formEmailPlaceholder: string;
  formMessagePlaceholder: string;
  submitLabel: string;
  demoSubmitAlert: string;
};

export type ProductsUiCopy = {
  title: string;
  countSuffix: string;
  sortLabel: string;
  emptyMessage: string;
  filterAll: string;
  filterMen: string;
  filterWomen: string;
  filterNew: string;
  pagePrev: string;
  pageNext: string;
  pageOf: string;
};

export type CollectionsUiCopy = {
  title: string;
  subtitle: string;
  cardEyebrow: string;
};

export type CartUiCopy = {
  title: string;
  loading: string;
  emptyTitle: string;
  emptyBody: string;
  emptyCta: string;
  summaryTitle: string;
  subtotalLabel: string;
  shippingLabel: string;
  shippingFree: string;
  totalLabel: string;
  shippingNote: string;
  checkoutCta: string;
};

export type CheckoutUiCopy = {
  title: string;
  emptyTitle: string;
  emptyCta: string;
  shippingSectionTitle: string;
  paymentSectionTitle: string;
  paymentCod: string;
  paymentBank: string;
  orderSummaryTitle: string;
  couponPlaceholder: string;
  couponApply: string;
  submitLabel: string;
  submitLoading: string;
  fieldName: string;
  fieldPhone: string;
  fieldEmail: string;
  fieldAddress: string;
  fieldNote: string;
};

export type OrderSuccessUiCopy = {
  eyebrow: string;
  title: string;
  orderLabel: string;
  body: string;
  ctaShop: string;
  ctaHome: string;
};

export type WishlistUiCopy = {
  title: string;
  loading: string;
  emptyBody: string;
  emptyCta: string;
  guestHint: string;
  guestLoginLink: string;
  removeLabel: string;
};

export type AccountUiCopy = {
  title: string;
  greeting: string;
  cardOrders: string;
  cardAddresses: string;
  cardWishlist: string;
  cardWishlistHint: string;
  recentOrdersTitle: string;
  recentOrdersLink: string;
  noOrders: string;
};

export type OrdersUiCopy = {
  breadcrumbAccount: string;
  breadcrumbCurrent: string;
  title: string;
  empty: string;
  emptyCta: string;
};

export type AuthUiCopy = {
  loginTitle: string;
  loginSubmit: string;
  loginSubmitLoading: string;
  loginHydrateWait: string;
  loginNoAccount: string;
  loginRegisterLink: string;
  loginForgotLink: string;
  loginHomeLink: string;
  registerTitle: string;
  registerSubtitle: string;
  registerSubmit: string;
  registerSubmitLoading: string;
  registerHasAccount: string;
  registerLoginLink: string;
  forgotTitle: string;
  forgotSubtitle: string;
  forgotSubmit: string;
  forgotSubmitLoading: string;
  forgotBackLogin: string;
};

export type PdpUiCopy = {
  colorLabel: string;
  sizeLabel: string;
  sizeChartLink: string;
  addToCart: string;
  addedToCart: string;
  stockAvailable: string;
  stockOut: string;
  stockNone: string;
};

export type StorefrontUiCopy = {
  contact: ContactUiCopy;
  products: ProductsUiCopy;
  collections: CollectionsUiCopy;
  cart: CartUiCopy;
  checkout: CheckoutUiCopy;
  orderSuccess: OrderSuccessUiCopy;
  wishlist: WishlistUiCopy;
  account: AccountUiCopy;
  orders: OrdersUiCopy;
  auth: AuthUiCopy;
  pdp: PdpUiCopy;
};

export const DEFAULT_STOREFRONT_UI: StorefrontUiCopy = {
  contact: {
    title: "Liên hệ",
    intro: "Chúng tôi sẵn sàng hỗ trợ bạn chọn size, theo dõi đơn và đổi trả.",
    showroomLabel: "Showroom:",
    showroomAddress: "123 Nguyễn Huệ, Quận 1, TP.HCM",
    emailLabel: "Email:",
    phoneLabel: "Điện thoại:",
    hoursLabel: "Giờ làm việc:",
    useSiteContactFields: false,
    email: "[cần chốt]",
    phone: "0901 234 567",
    hours: "9:00 – 21:00 (T2–CN)",
    mapEmbedUrl: "",
    formHeading: "Gửi tin nhắn (demo — không gửi email thật)",
    formNamePlaceholder: "Họ tên",
    formEmailPlaceholder: "Email",
    formMessagePlaceholder: "Nội dung",
    submitLabel: "Gửi",
    demoSubmitAlert: "Đã ghi nhận (demo). Không gửi email/SMS thật.",
  },
  products: {
    title: "Sản phẩm",
    countSuffix: "sản phẩm",
    sortLabel: "Sắp xếp:",
    emptyMessage: "Không tìm thấy sản phẩm phù hợp.",
    filterAll: "Tất cả",
    filterMen: "Nam",
    filterWomen: "Nữ",
    filterNew: "Hàng mới",
    pagePrev: "Trước",
    pageNext: "Sau",
    pageOf: "Trang",
  },
  collections: {
    title: "Bộ sưu tập",
    subtitle: "Khám phá chất liệu bền bỉ cho phong cách của bạn",
    cardEyebrow: "Collection",
  },
  cart: {
    title: "Giỏ hàng",
    loading: "Đang tải…",
    emptyTitle: "Giỏ hàng trống",
    emptyBody: "Hãy chọn vài item PTT Shop để bắt đầu phong cách mới.",
    emptyCta: "Tiếp tục mua sắm",
    summaryTitle: "Tóm tắt đơn hàng",
    subtotalLabel: "Tạm tính",
    shippingLabel: "Phí vận chuyển",
    shippingFree: "Miễn phí",
    totalLabel: "Tổng",
    shippingNote: "Miễn phí ship đơn từ 500.000đ",
    checkoutCta: "Thanh toán",
  },
  checkout: {
    title: "Thanh toán",
    emptyTitle: "Chưa có sản phẩm để thanh toán",
    emptyCta: "Quay lại mua sắm",
    shippingSectionTitle: "Thông tin giao hàng",
    paymentSectionTitle: "Phương thức thanh toán",
    paymentCod: "Thanh toán khi nhận hàng (COD)",
    paymentBank: "Chuyển khoản ngân hàng",
    orderSummaryTitle: "Đơn hàng",
    couponPlaceholder: "Mã giảm giá",
    couponApply: "Áp dụng",
    submitLabel: "Đặt hàng",
    submitLoading: "Đang xử lý...",
    fieldName: "Họ tên",
    fieldPhone: "Số điện thoại",
    fieldEmail: "Email",
    fieldAddress: "Địa chỉ",
    fieldNote: "Ghi chú",
  },
  orderSuccess: {
    eyebrow: "PTT Shop",
    title: "Đặt hàng thành công",
    orderLabel: "Mã đơn:",
    body: "Chúng tôi sẽ liên hệ xác nhận đơn trong thời gian sớm nhất.",
    ctaShop: "Tiếp tục mua",
    ctaHome: "Về trang chủ",
  },
  wishlist: {
    title: "Yêu thích",
    loading: "Đang tải...",
    emptyBody: "Chưa có sản phẩm nào trong danh sách yêu thích.",
    emptyCta: "Khám phá sản phẩm",
    guestHint: "Đang lưu tạm trên thiết bị.",
    guestLoginLink: "Đăng nhập",
    removeLabel: "Xóa",
  },
  account: {
    title: "Tài khoản",
    greeting: "Xin chào,",
    cardOrders: "Đơn hàng",
    cardAddresses: "Sổ địa chỉ",
    cardWishlist: "Yêu thích",
    cardWishlistHint: "Xem danh sách",
    recentOrdersTitle: "Đơn gần đây",
    recentOrdersLink: "Xem tất cả",
    noOrders: "Chưa có đơn hàng.",
  },
  orders: {
    breadcrumbAccount: "Tài khoản",
    breadcrumbCurrent: "Đơn hàng",
    title: "Lịch sử đơn hàng",
    empty: "Chưa có đơn.",
    emptyCta: "Mua sắm ngay",
  },
  auth: {
    loginTitle: "Đăng nhập",
    loginSubmit: "Đăng nhập",
    loginSubmitLoading: "Đang đăng nhập...",
    loginHydrateWait: "Đang sẵn sàng form đăng nhập…",
    loginNoAccount: "Chưa có tài khoản?",
    loginRegisterLink: "Đăng ký",
    loginForgotLink: "Quên mật khẩu?",
    loginHomeLink: "Về trang chủ",
    registerTitle: "Đăng ký",
    registerSubtitle: "Tạo tài khoản khách hàng PTT Shop",
    registerSubmit: "Đăng ký",
    registerSubmitLoading: "Đang tạo tài khoản...",
    registerHasAccount: "Đã có tài khoản?",
    registerLoginLink: "Đăng nhập",
    forgotTitle: "Quên mật khẩu",
    forgotSubtitle: "Nhập email để nhận liên kết đặt lại mật khẩu",
    forgotSubmit: "Gửi liên kết",
    forgotSubmitLoading: "Đang gửi...",
    forgotBackLogin: "Quay lại đăng nhập",
  },
  pdp: {
    colorLabel: "Màu sắc:",
    sizeLabel: "Kích thước:",
    sizeChartLink: "Bảng size",
    addToCart: "Thêm vào giỏ hàng",
    addedToCart: "Đã thêm!",
    stockAvailable: "Còn {stock} sản phẩm ({color} / {size})",
    stockOut: "Hết hàng ({color} / {size})",
    stockNone: "Chưa có biến thể",
  },
};

export type UiCopySectionKey = keyof StorefrontUiCopy;

export const UI_COPY_SECTION_LABELS: Record<UiCopySectionKey, string> = {
  contact: "Trang Liên hệ",
  products: "Danh sách sản phẩm",
  collections: "Bộ sưu tập",
  cart: "Giỏ hàng",
  checkout: "Thanh toán",
  orderSuccess: "Đặt hàng thành công",
  wishlist: "Yêu thích",
  account: "Tài khoản",
  orders: "Lịch sử đơn hàng",
  auth: "Đăng nhập / Đăng ký",
  pdp: "Trang sản phẩm (PDP)",
};

/** Admin field labels (Vietnamese). */
export const UI_COPY_FIELD_LABELS: Record<UiCopySectionKey, Record<string, string>> = {
  contact: {
    title: "Tiêu đề trang",
    intro: "Mô tả ngắn",
    showroomLabel: "Nhãn showroom",
    showroomAddress: "Địa chỉ showroom",
    emailLabel: "Nhãn email",
    phoneLabel: "Nhãn điện thoại",
    hoursLabel: "Nhãn giờ làm việc",
    useSiteContactFields: "Dùng email/phone/giờ từ Cài đặt giao diện",
    email: "Email (khi không dùng site)",
    phone: "Điện thoại (khi không dùng site)",
    hours: "Giờ làm việc (khi không dùng site)",
    mapEmbedUrl: "URL nhúng Google Maps (iframe src)",
    formHeading: "Tiêu đề form",
    formNamePlaceholder: "Placeholder họ tên",
    formEmailPlaceholder: "Placeholder email",
    formMessagePlaceholder: "Placeholder nội dung",
    submitLabel: "Chữ nút gửi",
    demoSubmitAlert: "Thông báo sau khi gửi (demo)",
  },
  products: {
    title: "Tiêu đề",
    countSuffix: "Hậu tố đếm sản phẩm",
    sortLabel: "Nhãn sắp xếp",
    emptyMessage: "Khi không có kết quả",
    filterAll: "Lọc: Tất cả",
    filterMen: "Lọc: Nam",
    filterWomen: "Lọc: Nữ",
    filterNew: "Lọc: Hàng mới",
    pagePrev: "Phân trang: Trước",
    pageNext: "Phân trang: Sau",
    pageOf: "Phân trang: Tiền tố",
  },
  collections: {
    title: "Tiêu đề",
    subtitle: "Mô tả",
    cardEyebrow: "Nhãn nhỏ trên thẻ BST",
  },
  cart: {
    title: "Tiêu đề",
    loading: "Đang tải",
    emptyTitle: "Giỏ trống — tiêu đề",
    emptyBody: "Giỏ trống — mô tả",
    emptyCta: "Nút tiếp tục mua",
    summaryTitle: "Tóm tắt đơn",
    subtotalLabel: "Tạm tính",
    shippingLabel: "Phí ship",
    shippingFree: "Miễn phí ship",
    totalLabel: "Tổng",
    shippingNote: "Ghi chú miễn phí ship",
    checkoutCta: "Nút thanh toán",
  },
  checkout: {
    title: "Tiêu đề",
    emptyTitle: "Giỏ trống",
    emptyCta: "Link quay lại",
    shippingSectionTitle: "Khối giao hàng",
    paymentSectionTitle: "Khối thanh toán",
    paymentCod: "COD",
    paymentBank: "Chuyển khoản",
    orderSummaryTitle: "Tóm tắt đơn (tiền tố)",
    couponPlaceholder: "Placeholder mã giảm",
    couponApply: "Nút áp mã",
    submitLabel: "Đặt hàng",
    submitLoading: "Đang xử lý",
    fieldName: "Label họ tên",
    fieldPhone: "Label SĐT",
    fieldEmail: "Label email",
    fieldAddress: "Label địa chỉ",
    fieldNote: "Label ghi chú",
  },
  orderSuccess: {
    eyebrow: "Dòng thương hiệu",
    title: "Tiêu đề",
    orderLabel: "Nhãn mã đơn",
    body: "Mô tả",
    ctaShop: "Nút mua tiếp",
    ctaHome: "Nút về trang chủ",
  },
  wishlist: {
    title: "Tiêu đề",
    loading: "Đang tải",
    emptyBody: "Danh sách trống",
    emptyCta: "Nút khám phá",
    guestHint: "Gợi ý khách (trước link)",
    guestLoginLink: "Chữ link đăng nhập",
    removeLabel: "Nút xóa",
  },
  account: {
    title: "Tiêu đề",
    greeting: "Lời chào (trước tên)",
    cardOrders: "Thẻ đơn hàng",
    cardAddresses: "Thẻ địa chỉ",
    cardWishlist: "Thẻ yêu thích",
    cardWishlistHint: "Gợi ý thẻ yêu thích",
    recentOrdersTitle: "Đơn gần đây",
    recentOrdersLink: "Link xem tất cả",
    noOrders: "Chưa có đơn",
  },
  orders: {
    breadcrumbAccount: "Breadcrumb tài khoản",
    breadcrumbCurrent: "Breadcrumb hiện tại",
    title: "Tiêu đề",
    empty: "Không có đơn",
    emptyCta: "Link mua sắm",
  },
  auth: {
    loginTitle: "Đăng nhập — tiêu đề",
    loginSubmit: "Nút đăng nhập",
    loginSubmitLoading: "Đang đăng nhập",
    loginHydrateWait: "Chờ hydrate",
    loginNoAccount: "Chưa có TK",
    loginRegisterLink: "Link đăng ký",
    loginForgotLink: "Link quên MK",
    loginHomeLink: "Link trang chủ",
    registerTitle: "Đăng ký — tiêu đề",
    registerSubtitle: "Mô tả",
    registerSubmit: "Nút đăng ký",
    registerSubmitLoading: "Đang tạo TK",
    registerHasAccount: "Đã có TK",
    registerLoginLink: "Link đăng nhập",
    forgotTitle: "Quên MK — tiêu đề",
    forgotSubtitle: "Mô tả",
    forgotSubmit: "Nút gửi",
    forgotSubmitLoading: "Đang gửi",
    forgotBackLogin: "Link quay lại",
  },
  pdp: {
    colorLabel: "Nhãn màu",
    sizeLabel: "Nhãn size",
    sizeChartLink: "Link bảng size",
    addToCart: "Thêm giỏ",
    addedToCart: "Đã thêm",
    stockAvailable: "Còn hàng ({stock}, {color}, {size})",
    stockOut: "Hết hàng",
    stockNone: "Chưa chọn biến thể",
  },
};

export function formatStockTemplate(
  template: string,
  vars: { stock: number; color: string; size: string },
) {
  return template
    .replace("{stock}", String(vars.stock))
    .replace("{color}", vars.color)
    .replace("{size}", vars.size);
}
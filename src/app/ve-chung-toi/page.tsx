export const metadata = {
  title: "Về chúng tôi",
  description: "Câu chuyện thương hiệu VIZFAS.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <h1 className="type-title text-3xl font-extrabold md:text-4xl">
        Về VIZFAS
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-neutral-600 md:text-base">
        VIZFAS là thương hiệu thời trang tối giản với tinh thần đường phố: mặc
        đơn giản vẫn nổi bật. Chúng tôi tập trung vào form dễ mặc, chất liệu bền
        và bảng màu dễ phối cho Nam · Nữ mỗi ngày.
      </p>
      <p className="mt-4 text-sm leading-relaxed text-neutral-600 md:text-base">
        Từ áo thun Essential đến hoodie form rộng, mỗi sản phẩm được thiết kế để
        bạn dựng outfit nhanh mà vẫn chỉn chu.
      </p>
    </div>
  );
}

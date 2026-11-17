import { notFound } from "next/navigation";

const POLICIES: Record<string, { title: string; body: string[] }> = {
  "dieu-khoan": {
    title: "Điều khoản sử dụng",
    body: [
      "Khi sử dụng website VIZFAS, bạn đồng ý với các điều khoản mua bán và bảo mật thông tin.",
      "Giá và tồn kho có thể thay đổi; đơn hàng chỉ được xác nhận sau khi hệ thống ghi nhận thành công.",
    ],
  },
  "bao-mat": {
    title: "Chính sách bảo mật",
    body: [
      "Chúng tôi chỉ dùng thông tin liên hệ để xử lý đơn hàng và hỗ trợ khách hàng.",
      "Không bán dữ liệu cá nhân cho bên thứ ba.",
    ],
  },
  "van-chuyen": {
    title: "Chính sách vận chuyển",
    body: [
      "Giao hàng toàn quốc. Thời gian dự kiến 2–5 ngày tùy khu vực.",
      "Miễn phí vận chuyển áp dụng theo chương trình tại thời điểm đặt hàng.",
    ],
  },
};

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const policy = POLICIES[slug];
  return { title: policy?.title || "Chính sách" };
}

export default async function PolicyPage({ params }: Props) {
  const { slug } = await params;
  const policy = POLICIES[slug];
  if (!policy) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold">
        {policy.title}
      </h1>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-neutral-600">
        {policy.body.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
    </div>
  );
}

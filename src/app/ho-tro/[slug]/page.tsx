import { notFound } from "next/navigation";

const PAGES: Record<string, { title: string; body: string[] }> = {
  "van-chuyen": {
    title: "Vận chuyển",
    body: [
      "Đơn COD hoặc chuyển khoản được đóng gói trong 24h làm việc.",
      "Bạn có thể theo dõi trạng thái tại Tài khoản → Đơn hàng.",
    ],
  },
  "doi-tra": {
    title: "Đổi trả",
    body: [
      "Đổi size/màu trong 30 ngày nếu còn tem và chưa qua sử dụng.",
      "Liên hệ hello@vizfas.vn kèm mã đơn để được hỗ trợ.",
    ],
  },
  "bang-size": {
    title: "Bảng size",
    body: [
      "S: ngực 96 · dài 68 · vai 44",
      "M: ngực 100 · dài 70 · vai 46",
      "L: ngực 104 · dài 72 · vai 48",
      "XL: ngực 108 · dài 74 · vai 50",
      "XXL: ngực 112 · dài 76 · vai 52",
    ],
  },
  "bao-hanh": {
    title: "Bảo hành",
    body: [
      "Lỗi sản xuất được hỗ trợ đổi mới trong 7 ngày kể từ khi nhận hàng.",
    ],
  },
  "cau-hoi": {
    title: "Câu hỏi thường gặp",
    body: [
      "Thanh toán hỗ trợ COD và chuyển khoản ngân hàng.",
      "Đơn chưa giao có thể yêu cầu hủy theo quy tắc trạng thái đơn.",
    ],
  },
};

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  return { title: PAGES[slug]?.title || "Hỗ trợ" };
}

export default async function SupportPage({ params }: Props) {
  const { slug } = await params;
  const page = PAGES[slug];
  if (!page) notFound();
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold">
        {page.title}
      </h1>
      <ul className="mt-6 list-disc space-y-3 pl-5 text-sm text-neutral-600">
        {page.body.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  );
}

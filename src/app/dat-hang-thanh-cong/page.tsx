import Link from "next/link";

type Props = {
  searchParams: Promise<{ order?: string }>;
};

export default async function OrderSuccessPage({ searchParams }: Props) {
  const { order } = await searchParams;

  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="text-sm tracking-[0.25em] text-[var(--accent)] uppercase">
        VIZFAS
      </p>
      <h1 className="mt-3 type-title text-3xl font-bold">
        Đặt hàng thành công
      </h1>
      {order ? (
        <p className="mt-3 text-neutral-600">
          Mã đơn: <span className="font-semibold text-neutral-900">{order}</span>
        </p>
      ) : null}
      <p className="mt-2 text-sm text-neutral-500">
        Chúng tôi sẽ liên hệ xác nhận đơn trong thời gian sớm nhất.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link
          href="/san-pham"
          className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white"
        >
          Tiếp tục mua
        </Link>
        <Link
          href="/"
          className="rounded-full border border-neutral-300 px-6 py-3 text-sm font-semibold"
        >
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}

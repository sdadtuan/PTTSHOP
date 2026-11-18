import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 py-20 text-center">
      <p className="text-sm font-semibold tracking-wide text-[var(--accent)]">404</p>
      <h1 className="mt-2 type-title text-3xl font-extrabold">
        Không tìm thấy trang
      </h1>
      <p className="mt-3 text-sm text-neutral-500">
        Đường dẫn không tồn tại hoặc sản phẩm đã được gỡ.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold text-white"
      >
        Về trang chủ
      </Link>
    </div>
  );
}

import Link from "next/link";

export default function WishlistPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
        Yêu thích
      </h1>
      <p className="mt-3 text-sm text-neutral-500">
        Tính năng wishlist sẽ đồng bộ với tài khoản ở phase tiếp theo. Hiện bạn có
        thể lưu sản phẩm yêu thích khi đăng nhập.
      </p>
      <Link
        href="/san-pham"
        className="mt-8 inline-flex rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white"
      >
        Khám phá sản phẩm
      </Link>
    </div>
  );
}

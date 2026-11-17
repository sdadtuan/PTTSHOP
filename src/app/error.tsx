"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 py-20 text-center">
      <p className="text-sm font-semibold tracking-wide text-red-600">500</p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-extrabold">
        Đã xảy ra lỗi
      </h1>
      <p className="mt-3 text-sm text-neutral-500">
        Vui lòng thử lại. Nếu lỗi kéo dài, liên hệ hello@vizfas.vn.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold text-white"
      >
        Thử lại
      </button>
    </div>
  );
}

"use client";

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold md:text-4xl">
        Liên hệ
      </h1>
      <p className="mt-3 text-sm text-neutral-600">
        Chúng tôi sẵn sàng hỗ trợ bạn chọn size, theo dõi đơn và đổi trả.
      </p>
      <div className="mt-8 space-y-4 border border-neutral-100 bg-white p-6 text-sm text-neutral-700">
        <p>
          <strong>Showroom:</strong> 123 Nguyễn Huệ, Quận 1, TP.HCM
        </p>
        <p>
          <strong>Email:</strong>{" "}
          <a href="mailto:hello@vizfas.vn" className="text-[var(--accent)]">
            hello@vizfas.vn
          </a>
        </p>
        <p>
          <strong>Điện thoại:</strong>{" "}
          <a href="tel:0901234567" className="text-[var(--accent)]">
            0901 234 567
          </a>
        </p>
        <p>
          <strong>Giờ làm việc:</strong> 9:00 – 21:00 (T2–CN)
        </p>
      </div>
      <form
        className="mt-8 grid gap-3 border border-neutral-100 bg-white p-6"
        onSubmit={(e) => {
          e.preventDefault();
          alert("Đã ghi nhận (demo). Không gửi email/SMS thật.");
        }}
      >
        <p className="text-sm font-semibold">
          Gửi tin nhắn (demo — không gửi email thật)
        </p>
        <input required placeholder="Họ tên" className="rounded border px-3 py-2 text-sm" />
        <input required type="email" placeholder="Email" className="rounded border px-3 py-2 text-sm" />
        <textarea required rows={4} placeholder="Nội dung" className="rounded border px-3 py-2 text-sm" />
        <button
          type="submit"
          className="rounded bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white"
        >
          Gửi
        </button>
      </form>
    </div>
  );
}

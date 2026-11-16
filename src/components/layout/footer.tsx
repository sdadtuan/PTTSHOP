import Link from "next/link";

const columns = [
  {
    title: "Mua sắm",
    links: [
      { href: "/san-pham?category=ao-thun", label: "Áo thun" },
      { href: "/san-pham?category=ao-khoac", label: "Áo khoác" },
      { href: "/san-pham?category=quan", label: "Quần" },
      { href: "/san-pham?category=phu-kien", label: "Phụ kiện" },
    ],
  },
  {
    title: "Hỗ trợ",
    links: [
      { href: "/ho-tro/van-chuyen", label: "Vận chuyển" },
      { href: "/ho-tro/doi-tra", label: "Đổi trả" },
      { href: "/ho-tro/bang-size", label: "Bảng size" },
      { href: "/ho-tro/bao-hanh", label: "Bảo hành" },
    ],
  },
  {
    title: "Về chúng tôi",
    links: [
      { href: "/ve-chung-toi", label: "Câu chuyện thương hiệu" },
      { href: "/bo-suu-tap", label: "Bộ sưu tập" },
      { href: "/lien-he", label: "Liên hệ" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-black/5 bg-neutral-950 text-neutral-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-[1.4fr_2fr] md:px-6">
        <div>
          <p className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-[0.2em] text-white">
            VIZFAS
          </p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-neutral-400">
            Thời trang cho tất cả — mỗi ngày đều chất. Chất liệu bền, form hiện đại,
            dễ phối cho Nam, Nữ và phụ kiện.
          </p>
          <form className="mt-6 flex max-w-md gap-2">
            <input
              type="email"
              placeholder="Email nhận tin mới"
              className="min-w-0 flex-1 rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white outline-none placeholder:text-neutral-500 focus:border-[var(--accent)]"
            />
            <button
              type="submit"
              className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Đăng ký
            </button>
          </form>
        </div>

        <div className="grid gap-8 sm:grid-cols-3">
          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-semibold tracking-wide text-white uppercase">
                {col.title}
              </p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-neutral-400 transition hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 px-4 py-5 text-xs text-neutral-500 md:flex-row md:items-center md:px-6">
          <p>© {new Date().getFullYear()} VIZFAS. All rights reserved.</p>
          <p>Liên hệ: hello@vizfas.vn · 0901 234 567</p>
        </div>
      </div>
    </footer>
  );
}

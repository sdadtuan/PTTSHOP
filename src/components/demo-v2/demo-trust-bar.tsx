import { Gem, Headphones, Leaf, PackageOpen, ShieldCheck, Shirt, Truck } from "lucide-react";

const DEFAULT = [
  { icon: Truck, title: "Giao Hàng Nhanh", subtitle: "Toàn Quốc" },
  { icon: PackageOpen, title: "Đổi Trả Dễ Dàng", subtitle: "Trong 7 Ngày" },
  { icon: ShieldCheck, title: "Thanh Toán An Toàn", subtitle: "Nhiều Phương Thức" },
  { icon: Headphones, title: "Hỗ Trợ 24/7", subtitle: "Luôn Sẵn Sàng" },
] as const;

const FALLBACK_ICONS = [Leaf, Shirt, Gem, Truck] as const;

export function DemoTrustBar({ items }: { items?: string[] }) {
  const rows =
    items && items.length > 0
      ? items.slice(0, 4).map((title, i) => ({
          icon: FALLBACK_ICONS[i % FALLBACK_ICONS.length]!,
          title,
          subtitle: DEFAULT[i]?.subtitle || "VIZFAS",
        }))
      : [...DEFAULT];

  return (
    <section className="dv2-trust" data-testid="demo-v2-trust" aria-label="Cam kết">
      <div className="dv2-wrap dv2-trust__grid">
        {rows.map(({ icon: Icon, title, subtitle }) => (
          <div key={title} className="dv2-trust__item">
            <Icon className="dv2-trust__icon" strokeWidth={1.5} aria-hidden />
            <div>
              <strong>{title}</strong>
              <span>{subtitle}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

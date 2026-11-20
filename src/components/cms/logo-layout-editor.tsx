"use client";

import { AdminInput } from "@/components/admin/ui";
import { BrandLogoImg } from "@/components/cms/brand-logo-img";
import {
  LOGO_HEIGHT_MAX,
  LOGO_HEIGHT_MIN,
  LOGO_MAX_WIDTH_MAX,
  type LogoLayoutSettings,
  type LogoSlotResponsive,
  type LogoSlotSize,
  clampLogoSlot,
} from "@/lib/cms/logo-layout";

function SizeControl({
  label,
  slot,
  onChange,
}: {
  label: string;
  slot: LogoSlotSize;
  onChange: (next: LogoSlotSize) => void;
}) {
  const setHeight = (heightPx: number) => onChange(clampLogoSlot({ ...slot, heightPx }));
  const setMaxWidth = (maxWidthPx: number) => onChange(clampLogoSlot({ ...slot, maxWidthPx }));

  return (
    <div className="rounded-[var(--admin-radius-md)] border border-[var(--admin-border)] p-3">
      <p className="mb-2 text-xs font-semibold text-[var(--admin-text-muted)]">{label}</p>
      <div className="space-y-1.5">
        <label className="flex items-center justify-between gap-2 text-sm">
          <span className="shrink-0">Chiều cao</span>
          <span className="tabular-nums text-[var(--admin-text-muted)]">{slot.heightPx}px</span>
        </label>
        <input
          type="range"
          min={LOGO_HEIGHT_MIN}
          max={LOGO_HEIGHT_MAX}
          value={slot.heightPx}
          className="w-full accent-[var(--admin-accent)]"
          onChange={(e) => setHeight(Number(e.target.value))}
        />
        <AdminInput
          type="number"
          aria-label={`${label} chiều cao px`}
          min={LOGO_HEIGHT_MIN}
          max={LOGO_HEIGHT_MAX}
          value={slot.heightPx}
          onChange={(e) => setHeight(Number(e.target.value) || LOGO_HEIGHT_MIN)}
        />
      </div>
      <div className="mt-2 space-y-1.5">
        <label className="flex items-center justify-between gap-2 text-sm">
          <span className="shrink-0">Max rộng (0 = không giới hạn)</span>
          <span className="tabular-nums text-[var(--admin-text-muted)]">
            {slot.maxWidthPx > 0 ? `${slot.maxWidthPx}px` : "—"}
          </span>
        </label>
        <input
          type="range"
          min={0}
          max={LOGO_MAX_WIDTH_MAX}
          value={slot.maxWidthPx}
          className="w-full accent-[var(--admin-accent)]"
          onChange={(e) => setMaxWidth(Number(e.target.value))}
        />
        <AdminInput
          type="number"
          aria-label={`${label} max rộng px`}
          min={0}
          max={LOGO_MAX_WIDTH_MAX}
          value={slot.maxWidthPx}
          onChange={(e) => setMaxWidth(Number(e.target.value) || 0)}
        />
      </div>
    </div>
  );
}

function patchResponsive(
  current: LogoSlotResponsive,
  bp: keyof LogoSlotResponsive,
  slot: LogoSlotSize,
): LogoSlotResponsive {
  return { ...current, [bp]: slot };
}

export function LogoLayoutEditor({
  logoUrl,
  brandName,
  layout,
  onChange,
}: {
  logoUrl: string | null;
  brandName: string;
  layout: LogoLayoutSettings;
  onChange: (next: LogoLayoutSettings) => void;
}) {
  if (!logoUrl) {
    return (
      <p className="text-sm text-[var(--admin-text-muted)]">
        Tải logo ở trên để chỉnh kích thước và xem trước.
      </p>
    );
  }

  const patchHeader = (bp: keyof LogoSlotResponsive, slot: LogoSlotSize) =>
    onChange({ ...layout, header: patchResponsive(layout.header, bp, slot) });
  const patchFooter = (bp: keyof LogoSlotResponsive, slot: LogoSlotSize) =>
    onChange({ ...layout, footer: patchResponsive(layout.footer, bp, slot) });

  return (
    <div className="space-y-4" data-testid="cms-logo-layout">
      <div className="rounded-[var(--admin-radius-md)] border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface-soft)] p-4">
        <p className="mb-3 text-xs font-medium text-[var(--admin-text-muted)]">Xem trước (header)</p>
        <div className="flex min-h-[3rem] items-center justify-center border-b border-[var(--admin-border)] pb-3">
          <BrandLogoImg src={logoUrl} alt={brandName} slot="header" layout={layout} />
        </div>
        <p className="mb-2 mt-4 text-xs font-medium text-[var(--admin-text-muted)]">Xem trước (footer)</p>
        <div
          className={
            layout.footerShowBrandName
              ? "flex flex-wrap items-center gap-3"
              : "flex flex-col items-start"
          }
        >
          <BrandLogoImg src={logoUrl} alt={brandName} slot="footer" layout={layout} />
          {layout.footerShowBrandName ? (
            <span className="text-sm font-semibold tracking-wide">{brandName}</span>
          ) : null}
        </div>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-[var(--admin-radius-md)] border border-[var(--admin-border)] p-3 text-sm">
        <input
          type="checkbox"
          className="mt-0.5 accent-[var(--admin-accent)]"
          checked={Boolean(layout.footerShowBrandName)}
          onChange={(e) => onChange({ ...layout, footerShowBrandName: e.target.checked })}
        />
        <span>
          <span className="font-medium">Hiện chữ thương hiệu cạnh logo</span>
          <span className="mt-0.5 block text-xs text-[var(--admin-text-muted)]">
            Chỉ áp dụng footer khi đã có logo ảnh. Mặc định tắt — chỉ hiển thị logo.
          </span>
        </span>
      </label>

      <div>
        <p className="mb-2 text-sm font-semibold">Header — logo trên menu</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <SizeControl label="Mobile" slot={layout.header.mobile} onChange={(s) => patchHeader("mobile", s)} />
          <SizeControl label="Desktop" slot={layout.header.desktop} onChange={(s) => patchHeader("desktop", s)} />
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold">Footer — logo chân trang</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <SizeControl label="Mobile" slot={layout.footer.mobile} onChange={(s) => patchFooter("mobile", s)} />
          <SizeControl label="Desktop" slot={layout.footer.desktop} onChange={(s) => patchFooter("desktop", s)} />
        </div>
      </div>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { BulletListEditor } from "@/components/admin/bullet-list-editor";
import { AdminButton, AdminCard, useAdminToast } from "@/components/admin/ui";
import { DEFAULT_SHIPPING_BULLETS } from "@/lib/pdp-tabs";

export function ShippingPolicyCard() {
  const { toast } = useAdminToast();
  const [bullets, setBullets] = useState<string[]>([...DEFAULT_SHIPPING_BULLETS]);
  const [custom, setCustom] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/shipping-policy", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Không tải được chính sách vận chuyển");
        if (cancelled) return;
        const effective = Array.isArray(data.effective) ? (data.effective as string[]) : [...DEFAULT_SHIPPING_BULLETS];
        setBullets(effective.length ? effective : [...DEFAULT_SHIPPING_BULLETS]);
        setCustom(Array.isArray(data.bullets));
      } catch (err) {
        if (!cancelled) toast(err instanceof Error ? err.message : "Lỗi tải chính sách", "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  async function save(nextCustom: boolean, nextBullets: string[]) {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/shipping-policy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bullets: nextCustom ? nextBullets : null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Lưu chính sách thất bại");
      const effective = Array.isArray(data.effective) ? (data.effective as string[]) : [...DEFAULT_SHIPPING_BULLETS];
      setBullets(effective.length ? effective : [...DEFAULT_SHIPPING_BULLETS]);
      setCustom(Array.isArray(data.bullets));
      toast(data.bullets ? "Đã lưu chính sách vận chuyển cho toàn site" : "Đã khôi phục nội dung vận chuyển gốc");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Lưu thất bại", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminCard>
      <div className="min-w-0 space-y-3" data-testid="cms-shipping-policy">
        <div>
          <h2 className="font-semibold">Vận chuyển & Đổi trả</h2>
          <p className="text-xs text-[var(--admin-text-muted)]">
            Nội dung mặc định của tab trên mọi sản phẩm. Sản phẩm có nội dung riêng không bị đổi. Lưu áp dụng ngay, không cần xuất bản trang chủ.
          </p>
        </div>
        {loading ? (
          <p className="text-sm text-[var(--admin-text-muted)]">Đang tải…</p>
        ) : (
          <>
            <p className="text-xs text-[var(--admin-text-muted)]">
              {custom ? "Đang dùng nội dung đã lưu cho toàn site." : "Đang dùng nội dung gốc của cửa hàng."}
            </p>
            <BulletListEditor
              bullets={bullets}
              testId="cms-shipping-bullets"
              onChange={(next) => {
                setBullets(next);
                setCustom(true);
              }}
            />
            <div className="flex flex-wrap gap-2">
              <AdminButton
                type="button"
                variant="accent"
                size="sm"
                disabled={saving}
                data-testid="cms-shipping-save"
                onClick={() => void save(custom, bullets)}
              >
                {saving ? "Đang lưu…" : "Lưu chính sách"}
              </AdminButton>
              {custom ? (
                <AdminButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={saving}
                  data-testid="cms-shipping-reset"
                  onClick={() => void save(false, [...DEFAULT_SHIPPING_BULLETS])}
                >
                  Khôi phục nội dung gốc
                </AdminButton>
              ) : null}
            </div>
          </>
        )}
      </div>
    </AdminCard>
  );
}

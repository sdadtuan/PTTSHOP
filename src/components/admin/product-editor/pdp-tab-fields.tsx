"use client";

import { useState } from "react";
import { BulletListEditor } from "@/components/admin/bullet-list-editor";
import { SizeChartEditor } from "@/components/admin/size-chart-editor";
import { AdminButton, AdminInput, AdminTabs } from "@/components/admin/ui";
import {
  DEFAULT_SHIPPING_BULLETS,
  defaultDetailBullets,
  defaultMaterialBullets,
  cloneSizeChart,
  type PdpTabDraft,
} from "@/lib/pdp-tabs";

const TABS = [
  { id: "details", label: "Chi tiết sản phẩm", testId: "pe-tab-details" },
  { id: "material", label: "Chất liệu", testId: "pe-tab-material" },
  { id: "size", label: "Bảng size", testId: "pe-tab-size" },
  { id: "shipping", label: "Vận chuyển & Đổi trả", testId: "pe-tab-shipping" },
];

function StatusLine({ custom, fallback }: { custom: boolean; fallback: string }) {
  return (
    <p className="text-xs text-[var(--admin-text-muted)]">{custom ? "Đang lưu riêng cho sản phẩm này." : fallback}</p>
  );
}

export function PdpTabFields({
  draft,
  fit,
  material,
  siteShipping,
  onChange,
}: {
  draft: PdpTabDraft;
  fit: string;
  material: string;
  siteShipping: string[];
  onChange: (next: PdpTabDraft) => void;
}) {
  const [tab, setTab] = useState("details");
  const site = siteShipping.length ? siteShipping : [...DEFAULT_SHIPPING_BULLETS];

  return (
    <div className="min-w-0 space-y-4" data-testid="pe-tab-fields">
      <AdminTabs items={TABS} value={tab} onChange={setTab} />

      {tab === "details" ? (
        <div className="min-w-0 space-y-3">
          <StatusLine
            custom={draft.detailTouched}
            fallback="Các dòng dưới đang khớp trang sản phẩm. Sửa một dòng để lưu danh sách riêng. Form ở phần thông tin cơ bản vẫn tạo dòng đầu khi chưa tuỳ chỉnh."
          />
          <BulletListEditor
            bullets={draft.detailBullets}
            testId="pe-detail-bullets"
            onChange={(detailBullets) => onChange({ ...draft, detailBullets, detailTouched: true })}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <AdminInput
              label="Xuất xứ"
              name="origin"
              data-testid="pe-origin"
              value={draft.origin}
              maxLength={80}
              onChange={(e) => onChange({ ...draft, origin: e.target.value })}
            />
            <AdminInput
              label="Độ dày"
              name="thickness"
              data-testid="pe-thickness"
              value={draft.thickness}
              maxLength={80}
              onChange={(e) => onChange({ ...draft, thickness: e.target.value })}
            />
          </div>
          <p className="text-xs text-[var(--admin-text-muted)]">Xuất xứ và Độ dày luôn hiện ở cuối tab Chi tiết sản phẩm.</p>
          {draft.detailTouched ? (
            <AdminButton
              type="button"
              size="sm"
              variant="ghost"
              data-testid="pe-detail-reset"
              onClick={() =>
                onChange({
                  ...draft,
                  detailTouched: false,
                  detailBullets: defaultDetailBullets(fit),
                })
              }
            >
              Khôi phục dòng mặc định
            </AdminButton>
          ) : null}
        </div>
      ) : null}

      {tab === "material" ? (
        <div className="min-w-0 space-y-3">
          <StatusLine
            custom={draft.materialTouched}
            fallback="Đang dùng nội dung mặc định. Dòng đầu lấy từ ô Chất liệu khi chưa tuỳ chỉnh."
          />
          <BulletListEditor
            bullets={draft.materialBullets}
            testId="pe-material-bullets"
            onChange={(materialBullets) => onChange({ ...draft, materialBullets, materialTouched: true })}
          />
          {draft.materialTouched ? (
            <AdminButton
              type="button"
              size="sm"
              variant="ghost"
              data-testid="pe-material-reset"
              onClick={() =>
                onChange({
                  ...draft,
                  materialTouched: false,
                  materialBullets: defaultMaterialBullets(material),
                })
              }
            >
              Khôi phục chất liệu mặc định
            </AdminButton>
          ) : null}
        </div>
      ) : null}

      {tab === "size" ? (
        <div className="min-w-0 space-y-3">
          <StatusLine custom={draft.sizeTouched} fallback="Đang dùng bảng size mặc định của cửa hàng." />
          <SizeChartEditor
            chart={draft.sizeChart}
            onChange={(sizeChart) => onChange({ ...draft, sizeChart, sizeTouched: true })}
          />
          {draft.sizeTouched ? (
            <AdminButton
              type="button"
              size="sm"
              variant="ghost"
              data-testid="pe-size-reset"
              onClick={() => onChange({ ...draft, sizeTouched: false, sizeChart: cloneSizeChart() })}
            >
              Khôi phục bảng size mặc định
            </AdminButton>
          ) : null}
        </div>
      ) : null}

      {tab === "shipping" ? (
        <div className="min-w-0 space-y-3">
          <StatusLine
            custom={draft.shippingTouched}
            fallback="Đang dùng chính sách chung của cửa hàng. Sửa một dòng để ghi đè riêng sản phẩm này."
          />
          <BulletListEditor
            bullets={draft.shippingBullets}
            testId="pe-shipping-bullets"
            onChange={(shippingBullets) => onChange({ ...draft, shippingBullets, shippingTouched: true })}
          />
          {draft.shippingTouched ? (
            <AdminButton
              type="button"
              size="sm"
              variant="ghost"
              data-testid="pe-shipping-reset"
              onClick={() => onChange({ ...draft, shippingTouched: false, shippingBullets: [...site] })}
            >
              Dùng chính sách cửa hàng
            </AdminButton>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

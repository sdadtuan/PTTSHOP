"use client";

import { AdminButton, AdminTextarea } from "@/components/admin/ui";
import {
  addSizeColumn,
  addSizeRow,
  moveListItem,
  moveSizeColumn,
  removeSizeColumn,
  removeSizeRow,
  type SizeChart,
} from "@/lib/pdp-tabs";

const inputClass =
  "mt-1 w-full min-w-0 rounded-[var(--admin-radius-md)] border border-[var(--admin-border)] bg-white px-2 py-1.5 text-sm text-[var(--admin-text)] focus-visible:border-[var(--admin-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-accent)]/25";

export function SizeChartEditor({
  chart,
  onChange,
}: {
  chart: SizeChart;
  onChange: (next: SizeChart) => void;
}) {
  return (
    <div className="min-w-0 space-y-4" data-testid="pe-size-chart">
      <div className="min-w-0 space-y-2">
        <p className="text-xs font-medium text-[var(--admin-text)]">Cột</p>
        {chart.columns.map((col, index) => (
          <div key={index} className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center">
            <input
              value={col}
              aria-label={`Tên cột ${index + 1}`}
              data-testid="pe-size-col"
              maxLength={40}
              className="min-w-0 w-full flex-1 rounded-[var(--admin-radius-md)] border border-[var(--admin-border)] bg-white px-3 py-2 text-sm"
              onChange={(e) => {
                const columns = chart.columns.slice();
                columns[index] = e.target.value;
                onChange({ ...chart, columns });
              }}
            />
            <div className="flex shrink-0 flex-wrap gap-1">
              <AdminButton type="button" size="sm" variant="ghost" aria-label={`Lên cột ${index + 1}`} disabled={index === 0} onClick={() => onChange(moveSizeColumn(chart, index, -1))}>
                ↑
              </AdminButton>
              <AdminButton
                type="button"
                size="sm"
                variant="ghost"
                aria-label={`Xuống cột ${index + 1}`}
                disabled={index === chart.columns.length - 1}
                onClick={() => onChange(moveSizeColumn(chart, index, 1))}
              >
                ↓
              </AdminButton>
              <AdminButton
                type="button"
                size="sm"
                variant="ghost"
                aria-label={`Xóa cột ${index + 1}`}
                disabled={chart.columns.length <= 1}
                onClick={() => onChange(removeSizeColumn(chart, index))}
              >
                Xóa
              </AdminButton>
            </div>
          </div>
        ))}
        <AdminButton type="button" size="sm" variant="secondary" data-testid="pe-size-add-col" onClick={() => onChange(addSizeColumn(chart))}>
          Thêm cột
        </AdminButton>
      </div>

      <div className="min-w-0 space-y-2">
        <p className="text-xs font-medium text-[var(--admin-text)]">Dòng</p>
        {chart.rows.map((row, rowIndex) => (
          <div key={rowIndex} className="min-w-0 rounded-[var(--admin-radius-md)] border border-[var(--admin-border)] p-2" data-testid="pe-size-chart-row">
            <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
              {chart.columns.map((col, colIndex) => (
                <label key={colIndex} className="block min-w-0 text-xs text-[var(--admin-text-muted)]">
                  {col || `Cột ${colIndex + 1}`}
                  <input
                    value={row[colIndex] ?? ""}
                    aria-label={`${col || `Cột ${colIndex + 1}`} dòng ${rowIndex + 1}`}
                    data-testid="pe-size-cell"
                    maxLength={60}
                    className={inputClass}
                    onChange={(e) => {
                      const rows = chart.rows.map((r, i) => {
                        if (i !== rowIndex) return r;
                        const next = chart.columns.map((_, k) => r[k] ?? "");
                        next[colIndex] = e.target.value;
                        return next;
                      });
                      onChange({ ...chart, rows });
                    }}
                  />
                </label>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              <AdminButton
                type="button"
                size="sm"
                variant="ghost"
                aria-label={`Lên dòng size ${rowIndex + 1}`}
                disabled={rowIndex === 0}
                onClick={() => onChange({ ...chart, rows: moveListItem(chart.rows, rowIndex, -1) })}
              >
                ↑
              </AdminButton>
              <AdminButton
                type="button"
                size="sm"
                variant="ghost"
                aria-label={`Xuống dòng size ${rowIndex + 1}`}
                disabled={rowIndex === chart.rows.length - 1}
                onClick={() => onChange({ ...chart, rows: moveListItem(chart.rows, rowIndex, 1) })}
              >
                ↓
              </AdminButton>
              <AdminButton
                type="button"
                size="sm"
                variant="ghost"
                aria-label={`Xóa dòng size ${rowIndex + 1}`}
                disabled={chart.rows.length <= 1}
                onClick={() => onChange(removeSizeRow(chart, rowIndex))}
              >
                Xóa dòng
              </AdminButton>
            </div>
          </div>
        ))}
        <AdminButton type="button" size="sm" variant="secondary" data-testid="pe-size-add-row" onClick={() => onChange(addSizeRow(chart))}>
          Thêm dòng
        </AdminButton>
      </div>

      <AdminTextarea
        label="Ghi chú dưới bảng"
        value={chart.note}
        data-testid="pe-size-note"
        maxLength={300}
        onChange={(e) => onChange({ ...chart, note: e.target.value })}
      />
    </div>
  );
}

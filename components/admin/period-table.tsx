import Link from "next/link";
import type { SalesSummary } from "@/lib/data";
import { formatNumber, formatPrice } from "@/lib/format";

export type PeriodRow = {
  key: string;
  label: string;
  summary: SalesSummary;
};

/**
 * Sales per period (days or months). Each row links to its detail view;
 * `activeKey` highlights the period currently expanded.
 */
export function PeriodTable({
  rows,
  periodHeading,
  currentLabel,
  hrefFor,
  activeKey,
}: {
  rows: PeriodRow[];
  periodHeading: string;
  /** Badge text for the first (open) row, e.g. "اليوم الحالي". */
  currentLabel: string;
  hrefFor: (key: string) => string;
  activeKey?: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="table-cards w-full text-sm">
        <thead>
          <tr className="border-b border-border text-xs text-muted">
            <th className="px-6 py-3 font-medium">{periodHeading}</th>
            <th className="px-6 py-3 font-medium">الطلبات</th>
            <th className="px-6 py-3 font-medium">القطع</th>
            <th className="px-6 py-3 font-medium">الإيرادات</th>
            <th className="px-6 py-3 font-medium">صافي الربح</th>
            <th className="px-6 py-3 font-medium">مرفوض</th>
            <th className="px-6 py-3 font-medium"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row, i) => {
            const empty = row.summary.orderCount === 0;
            const active = row.key === activeKey;
            return (
              <tr
                key={row.key}
                className={`transition-colors hover:bg-surface-2/60 ${
                  active ? "bg-brand-soft/60" : ""
                } ${empty ? "text-muted" : ""}`}
              >
                <td className="px-6 py-3 font-medium">
                  <Link href={hrefFor(row.key)} className="link-underline">
                    {row.label}
                  </Link>
                  {i === 0 && <span className="badge ms-2">{currentLabel}</span>}
                </td>
                <td className="px-6 py-3">{formatNumber(row.summary.orderCount)}</td>
                <td className="px-6 py-3">{formatNumber(row.summary.itemsSold)}</td>
                <td className={`whitespace-nowrap px-6 py-3 ${empty ? "" : "font-semibold"}`}>
                  {formatPrice(row.summary.revenue)}
                </td>
                <td className={`whitespace-nowrap px-6 py-3 ${empty ? "" : "font-semibold text-success"}`}>
                  {formatPrice(row.summary.netProfit)}
                </td>
                <td className="px-6 py-3">
                  {row.summary.cancelledCount > 0 ? (
                    <span className="text-danger">{formatNumber(row.summary.cancelledCount)}</span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-6 py-3 text-end">
                  <Link href={hrefFor(row.key)} className="btn btn-outline btn-sm">
                    {active ? "معروض" : "التفاصيل"}
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

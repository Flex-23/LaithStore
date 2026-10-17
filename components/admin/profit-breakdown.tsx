import type { SalesSummary } from "@/lib/data";
import { formatNumber, formatPrice } from "@/lib/format";

/**
 * Net-profit statement for a period, laid out the way it is calculated:
 * total of the orders − purchase cost − delivery fees − agents' fees = net.
 * Only orders that left the store (in delivery / delivered) count.
 */
export function ProfitBreakdown({
  summary,
  title,
  flat,
}: {
  summary: SalesSummary;
  title: string;
  flat?: boolean;
}) {
  const d = summary.dispatched;
  const lines: { label: string; value: number; sign: "+" | "−" }[] = [
    { label: "مجموع الطلبات (السعر الكلي)", value: d.total, sign: "+" },
    { label: "سعر الشراء", value: d.cost, sign: "−" },
    { label: "أجور التوصيل", value: d.deliveryFees, sign: "−" },
    { label: "نسبة المندوبين", value: d.commission, sign: "−" },
  ];
  const max = Math.max(1, d.total);
  const positive = summary.netProfit >= 0;

  return (
    <section className={flat ? "" : "card overflow-hidden"}>
      <div className={flat ? "mb-4" : "border-b border-border px-5 py-4 sm:px-6"}>
        <h2 className="font-serif text-xl">{title}</h2>
        <p className="text-sm text-muted">للطلبات المُخرَجة فقط (قيد التوصيل وتم التسليم)</p>
      </div>

      <div className={flat ? "" : "p-5 sm:p-6"}>
        {/* Headline numbers */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl surface-2 p-3 sm:p-4">
            <p className="text-xs text-muted">عدد الطلبات</p>
            <p className="mt-1 font-serif text-2xl sm:text-3xl">{formatNumber(d.count)}</p>
          </div>
          <div className="rounded-xl surface-2 p-3 sm:p-4">
            <p className="text-xs text-muted">مجموعها</p>
            <p className="mt-1 font-serif text-lg sm:text-2xl">{formatPrice(d.total)}</p>
          </div>
          <div
            className={`rounded-xl p-3 sm:p-4 ${
              positive ? "bg-success/15 text-success" : "bg-danger/15 text-danger"
            }`}
          >
            <p className="text-xs opacity-80">صافي الربح</p>
            <p className="mt-1 font-serif text-lg sm:text-2xl">{formatPrice(summary.netProfit)}</p>
          </div>
        </div>

        {/* How it adds up */}
        <ul className="mt-5 space-y-3">
          {lines.map((l) => (
            <li key={l.label}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2">
                  <span
                    className={`grid h-5 w-5 place-items-center rounded-full text-xs font-bold ${
                      l.sign === "+" ? "bg-success/15 text-success" : "bg-danger/15 text-danger"
                    }`}
                  >
                    {l.sign}
                  </span>
                  {l.label}
                </span>
                <span className="font-semibold">{formatPrice(l.value)}</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full surface-2">
                <div
                  className={`h-full rounded-full ${l.sign === "+" ? "bg-success" : "bg-danger/70"}`}
                  style={{ width: `${Math.min(100, (l.value / max) * 100)}%` }}
                />
              </div>
            </li>
          ))}
          <li className="flex items-center justify-between gap-3 border-t border-border pt-3">
            <span className="font-medium">= صافي الربح</span>
            <span className={`font-serif text-2xl ${positive ? "text-success" : "text-danger"}`}>
              {formatPrice(summary.netProfit)}
            </span>
          </li>
        </ul>
      </div>
    </section>
  );
}

import Link from "next/link";
import {
  getAllProducts,
  getOrdersBetween,
  summarizeOrders,
  type OrderWithDetails,
} from "@/lib/data";
import {
  BUSINESS_DAY_START_HOUR,
  businessDayKey,
  businessDayStart,
  businessMonthKey,
  businessMonthStart,
  currentBusinessDay,
  currentBusinessMonth,
  formatDayKey,
  formatMonthKey,
  recentBusinessDayKeys,
  recentBusinessMonthKeys,
} from "@/lib/business-day";
import { PageHeader, StatCard, BarRow } from "@/components/admin/ui";
import { ChartIcon, PackageIcon, TagIcon, TruckIcon } from "@/components/icons";
import { formatNumber, formatPrice } from "@/lib/format";
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/lib/constants";
import { requireAdminStaff } from "@/lib/permissions";

export const dynamic = "force-dynamic";
export const metadata = { title: "التقارير" };

type RangeKind = "daily" | "monthly";

const RANGES: { value: RangeKind; label: string }[] = [
  { value: "daily", label: "يومي" },
  { value: "monthly", label: "شهري" },
];

const DAILY_ROWS = 30;
const MONTHLY_ROWS = 12;

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  await requireAdminStaff();
  const { range: rangeParam } = await searchParams;
  const range: RangeKind = rangeParam === "monthly" ? "monthly" : "daily";

  // Period keys, newest first; the first key is the current (open) period.
  const keys =
    range === "daily"
      ? recentBusinessDayKeys(DAILY_ROWS)
      : recentBusinessMonthKeys(MONTHLY_ROWS);
  const current = range === "daily" ? currentBusinessDay() : currentBusinessMonth();
  const windowStart =
    range === "daily"
      ? businessDayStart(keys[keys.length - 1])
      : businessMonthStart(keys[keys.length - 1]);

  const [orders, products] = await Promise.all([
    getOrdersBetween(windowStart, current.end),
    getAllProducts(),
  ]);

  // Group orders into their business day / month.
  const keyOf = range === "daily" ? businessDayKey : businessMonthKey;
  const grouped = new Map<string, OrderWithDetails[]>();
  for (const o of orders) {
    const k = keyOf(o.createdAt);
    grouped.set(k, [...(grouped.get(k) ?? []), o]);
  }
  const rows = keys.map((key) => ({
    key,
    label: range === "daily" ? formatDayKey(key) : formatMonthKey(key),
    summary: summarizeOrders(grouped.get(key) ?? []),
  }));

  const period = rows[0].summary;
  const aov = period.orderCount - period.cancelledCount > 0
    ? period.revenue / (period.orderCount - period.cancelledCount)
    : 0;
  const topMax = Math.max(1, ...period.topProducts.map((p) => p.revenue));

  const revenueByStatus: Record<string, number> = {};
  for (const o of grouped.get(keys[0]) ?? []) {
    revenueByStatus[o.status] = (revenueByStatus[o.status] ?? 0) + o.totalAmount;
  }
  const revenueMax = Math.max(1, ...Object.values(revenueByStatus));

  const inventoryUnits = products.reduce((n, p) => n + p.stockQuantity, 0);
  const lowStock = [...products]
    .filter((p) => p.stockQuantity <= 10)
    .sort((a, b) => a.stockQuantity - b.stockQuantity)
    .slice(0, 8);

  const periodNoun = range === "daily" ? "اليوم" : "الشهر";

  return (
    <>
      <PageHeader
        title="التقارير"
        description={`تحليلات المبيعات حسب يوم العمل (يبدأ ${BUSINESS_DAY_START_HOUR}:00 فجراً بتوقيت بغداد).`}
      >
        {/* Range filter */}
        <div className="grid grid-cols-2 rounded-full surface-2 p-1 text-sm font-medium">
          {RANGES.map((r) => (
            <Link
              key={r.value}
              href={`/admin/reports?range=${r.value}`}
              className={`rounded-full px-5 py-1.5 text-center transition-colors ${
                range === r.value ? "bg-surface shadow-sm" : "text-muted"
              }`}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </PageHeader>

      {/* Current period summary */}
      <p className="mb-3 text-sm text-muted">
        {periodNoun} الحالي: <span className="font-medium text-foreground">{rows[0].label}</span>
      </p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={`إيرادات ${periodNoun}`}
          value={formatPrice(period.revenue)}
          sub={`${formatNumber(period.orderCount)} طلب · ${formatNumber(period.cancelledCount)} ملغي`}
          icon={<ChartIcon width={18} height={18} className="text-background" />}
          accent
        />
        <StatCard
          label="متوسط قيمة الطلب"
          value={formatPrice(aov)}
          sub="لكل طلب غير ملغي"
          icon={<TruckIcon width={18} height={18} />}
        />
        <StatCard
          label="القطع المباعة"
          value={formatNumber(period.itemsSold)}
          sub={`${formatNumber(inventoryUnits)} قطعة متبقية في المخزون`}
          icon={<PackageIcon width={18} height={18} />}
        />
        <StatCard
          label="الكتالوج"
          value={formatNumber(products.length)}
          sub={`${formatNumber(lowStock.length)} على وشك النفاد`}
          icon={<TagIcon width={18} height={18} />}
        />
      </div>

      {/* Period breakdown table */}
      <section className="mt-6 card overflow-hidden">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-serif text-xl">
            {range === "daily" ? "التقرير اليومي" : "التقرير الشهري"}
          </h2>
          <p className="text-sm text-muted">
            {range === "daily"
              ? `آخر ${DAILY_ROWS} يوم عمل`
              : `آخر ${MONTHLY_ROWS} شهراً`}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted">
                <th className="px-6 py-3 font-medium">
                  {range === "daily" ? "اليوم" : "الشهر"}
                </th>
                <th className="px-6 py-3 font-medium">الطلبات</th>
                <th className="px-6 py-3 font-medium">القطع</th>
                <th className="px-6 py-3 font-medium">الإيرادات</th>
                <th className="px-6 py-3 font-medium">ملغي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row, i) => {
                const empty = row.summary.orderCount === 0;
                return (
                  <tr
                    key={row.key}
                    className={`hover:bg-surface-2/60 ${empty ? "text-muted" : ""}`}
                  >
                    <td className="px-6 py-3 font-medium">
                      {row.label}
                      {i === 0 && (
                        <span className="badge ms-2">{periodNoun} الحالي</span>
                      )}
                    </td>
                    <td className="px-6 py-3">{formatNumber(row.summary.orderCount)}</td>
                    <td className="px-6 py-3">{formatNumber(row.summary.itemsSold)}</td>
                    <td className={`px-6 py-3 ${empty ? "" : "font-semibold"}`}>
                      {formatPrice(row.summary.revenue)}
                    </td>
                    <td className="px-6 py-3">
                      {row.summary.cancelledCount > 0 ? (
                        <span className="text-danger">
                          {formatNumber(row.summary.cancelledCount)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Top products by revenue */}
        <section className="card p-6">
          <h2 className="font-serif text-xl">الأكثر مبيعاً {periodNoun}</h2>
          <p className="text-sm text-muted">حسب الإيراد</p>
          <div className="mt-5 space-y-4">
            {period.topProducts.length === 0 ? (
              <p className="text-sm text-muted">لا توجد مبيعات في هذه الفترة.</p>
            ) : (
              period.topProducts.map((p) => (
                <BarRow
                  key={p.name}
                  label={p.name}
                  value={p.revenue}
                  max={topMax}
                  hint={`${formatNumber(p.sold)} قطعة · ${formatPrice(p.revenue)}`}
                />
              ))
            )}
          </div>
        </section>

        {/* Revenue by status */}
        <section className="card p-6">
          <h2 className="font-serif text-xl">الإيرادات حسب حالة الطلب</h2>
          <p className="text-sm text-muted">{periodNoun} الحالي</p>
          <div className="mt-5 space-y-4">
            {ORDER_STATUSES.map((st) => (
              <BarRow
                key={st}
                label={ORDER_STATUS_LABELS[st]}
                value={revenueByStatus[st] ?? 0}
                max={revenueMax}
                hint={formatPrice(revenueByStatus[st] ?? 0)}
              />
            ))}
          </div>
        </section>
      </div>

      {/* Low stock */}
      <section className="mt-6 card overflow-hidden">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-serif text-xl">تنبيهات المخزون المنخفض</h2>
          <p className="text-sm text-muted">المنتجات التي بقي منها 10 قطع أو أقل</p>
        </div>
        {lowStock.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-muted">
            كل المنتجات متوفرة بكميات جيدة.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted">
                  <th className="px-6 py-3 font-medium">المنتج</th>
                  <th className="px-6 py-3 font-medium">الفئة</th>
                  <th className="px-6 py-3 font-medium">السعر</th>
                  <th className="px-6 py-3 font-medium">المخزون</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {lowStock.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-2/60">
                    <td className="px-6 py-3 font-medium">{p.name}</td>
                    <td className="px-6 py-3 text-muted">{p.category.name}</td>
                    <td className="px-6 py-3">{formatPrice(p.price)}</td>
                    <td className="px-6 py-3">
                      <span
                        className={
                          p.stockQuantity <= 5
                            ? "font-semibold text-danger"
                            : "font-semibold text-brand-strong"
                        }
                      >
                        بقي {formatNumber(p.stockQuantity)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

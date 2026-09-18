import Link from "next/link";
import {
  getAllProducts,
  getOrdersBetween,
  summarizeOrders,
  type OrderWithDetails,
  type SalesSummary,
} from "@/lib/data";
import {
  BUSINESS_DAY_START_HOUR,
  businessDayKey,
  businessDayKeysOfMonth,
  businessDayStart,
  businessMonthKey,
  businessMonthStart,
  currentBusinessDay,
  currentBusinessMonth,
  formatDayKey,
  formatMonthKey,
  isDayKey,
  isMonthKey,
  recentBusinessDayKeys,
  recentBusinessMonthKeys,
} from "@/lib/business-day";
import { requireAdminStaff } from "@/lib/permissions";
import { PageHeader, StatCard, BarRow } from "@/components/admin/ui";
import { PeriodTable, type PeriodRow } from "@/components/admin/period-table";
import { OrdersTable } from "@/components/admin/orders-table";
import { ChartIcon, PackageIcon, TagIcon, TruckIcon } from "@/components/icons";
import { formatNumber, formatPrice } from "@/lib/format";
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const metadata = { title: "التقارير" };

type RangeKind = "daily" | "monthly";

const RANGES: { value: RangeKind; label: string }[] = [
  { value: "daily", label: "يومي" },
  { value: "monthly", label: "شهري" },
];

const DAILY_ROWS = 30;
const MONTHLY_ROWS = 12;

/** Builds the reports URL, dropping empty params. */
function reportsHref(q: { range: RangeKind; month?: string; day?: string }) {
  const params = new URLSearchParams({ range: q.range });
  if (q.month) params.set("month", q.month);
  if (q.day) params.set("day", q.day);
  return `/admin/reports?${params.toString()}`;
}

function groupByKey(orders: OrderWithDetails[], keyOf: (d: Date) => string) {
  const grouped = new Map<string, OrderWithDetails[]>();
  for (const o of orders) {
    const k = keyOf(o.createdAt);
    grouped.set(k, [...(grouped.get(k) ?? []), o]);
  }
  return grouped;
}

function toRows(
  keys: string[],
  grouped: Map<string, OrderWithDetails[]>,
  label: (key: string) => string,
): PeriodRow[] {
  return keys.map((key) => ({
    key,
    label: label(key),
    summary: summarizeOrders(grouped.get(key) ?? []),
  }));
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; month?: string; day?: string }>;
}) {
  await requireAdminStaff();
  const sp = await searchParams;
  const range: RangeKind = sp.range === "monthly" ? "monthly" : "daily";
  // Drill-down selections (validated; anything else is ignored).
  const selectedMonth = range === "monthly" && isMonthKey(sp.month) ? sp.month : undefined;
  const selectedDay = isDayKey(sp.day) ? sp.day : undefined;

  const keys =
    range === "daily"
      ? recentBusinessDayKeys(DAILY_ROWS)
      : recentBusinessMonthKeys(MONTHLY_ROWS);
  const current = range === "daily" ? currentBusinessDay() : currentBusinessMonth();

  // One query covers the table window plus any archived period being inspected.
  const starts = [
    range === "daily" ? businessDayStart(keys.at(-1)!) : businessMonthStart(keys.at(-1)!),
    ...(selectedMonth ? [businessMonthStart(selectedMonth)] : []),
    ...(selectedDay ? [businessDayStart(selectedDay)] : []),
  ];
  const windowStart = new Date(Math.min(...starts.map((d) => d.getTime())));

  const [orders, products] = await Promise.all([
    getOrdersBetween(windowStart, current.end),
    getAllProducts(),
  ]);

  const byDay = groupByKey(orders, businessDayKey);
  const byMonth = groupByKey(orders, businessMonthKey);
  const rows =
    range === "daily"
      ? toRows(keys, byDay, formatDayKey)
      : toRows(keys, byMonth, formatMonthKey);

  const period = rows[0].summary;
  const periodNoun = range === "daily" ? "اليوم" : "الشهر";
  const aov = period.orderCount - period.cancelledCount > 0
    ? period.revenue / (period.orderCount - period.cancelledCount)
    : 0;

  const inventoryUnits = products.reduce((n, p) => n + p.stockQuantity, 0);
  const lowStock = [...products]
    .filter((p) => p.stockQuantity <= 10)
    .sort((a, b) => a.stockQuantity - b.stockQuantity)
    .slice(0, 8);

  const dayOrders = selectedDay ? (byDay.get(selectedDay) ?? []) : [];
  const todayKey = currentBusinessDay().key;

  return (
    <>
      <PageHeader
        title="التقارير"
        description={`تحليلات المبيعات حسب يوم العمل (يبدأ ${BUSINESS_DAY_START_HOUR}:00 فجراً بتوقيت بغداد). انقر على أي فترة لعرض تفاصيلها.`}
      >
        <div className="grid grid-cols-2 rounded-full surface-2 p-1 text-sm font-medium">
          {RANGES.map((r) => (
            <Link
              key={r.value}
              href={reportsHref({ range: r.value })}
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

      {/* Month drill-down: its days */}
      {selectedMonth && (
        <section className="mt-6 card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
            <div>
              <h2 className="font-serif text-xl">أيام {formatMonthKey(selectedMonth)}</h2>
              <p className="text-sm text-muted">انقر على يوم لعرض طلباته.</p>
            </div>
            <Link href={reportsHref({ range })} className="btn btn-ghost btn-sm">
              إغلاق
            </Link>
          </div>
          <PeriodTable
            // Days of the month up to today (future days aren't listed).
            rows={toRows(
              businessDayKeysOfMonth(selectedMonth).filter((d) => d <= todayKey),
              byDay,
              formatDayKey,
            )}
            periodHeading="اليوم"
            currentLabel={selectedMonth === currentBusinessMonth().key ? "اليوم الحالي" : "آخر يوم"}
            activeKey={selectedDay}
            hrefFor={(day) => reportsHref({ range, month: selectedMonth, day })}
          />
        </section>
      )}

      {/* Day drill-down: summary + its orders */}
      {selectedDay && (
        <DayDetail
          dayKey={selectedDay}
          orders={dayOrders}
          closeHref={reportsHref({ range, month: selectedMonth })}
        />
      )}

      {/* Period breakdown */}
      <section className="mt-6 card overflow-hidden">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-serif text-xl">
            {range === "daily" ? "التقرير اليومي" : "التقرير الشهري"}
          </h2>
          <p className="text-sm text-muted">
            {range === "daily" ? `آخر ${DAILY_ROWS} يوم عمل` : `آخر ${MONTHLY_ROWS} شهراً`}
          </p>
        </div>
        <PeriodTable
          rows={rows}
          periodHeading={range === "daily" ? "اليوم" : "الشهر"}
          currentLabel={`${periodNoun} الحالي`}
          activeKey={range === "daily" ? selectedDay : selectedMonth}
          hrefFor={(key) =>
            range === "daily"
              ? reportsHref({ range, day: key })
              : reportsHref({ range, month: key })
          }
        />
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <TopProducts summary={period} title={`الأكثر مبيعاً ${periodNoun}`} />
        <RevenueByStatus orders={range === "daily" ? (byDay.get(keys[0]) ?? []) : (byMonth.get(keys[0]) ?? [])} subtitle={`${periodNoun} الحالي`} />
      </div>

      {/* Low stock */}
      <section className="mt-6 card overflow-hidden">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-serif text-xl">تنبيهات المخزون المنخفض</h2>
          <p className="text-sm text-muted">المنتجات التي بقي منها 10 قطع أو أقل</p>
        </div>
        {lowStock.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-muted">كل المنتجات متوفرة بكميات جيدة.</p>
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
                      <span className={`font-semibold ${p.stockQuantity <= 5 ? "text-danger" : "text-brand-strong"}`}>
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

// --- Sections ---------------------------------------------------------------

function DayDetail({
  dayKey,
  orders,
  closeHref,
}: {
  dayKey: string;
  orders: OrderWithDetails[];
  closeHref: string;
}) {
  const s = summarizeOrders(orders);
  return (
    <section className="mt-6 card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
        <div>
          <h2 className="font-serif text-xl">تفاصيل {formatDayKey(dayKey)}</h2>
          <p className="text-sm text-muted">
            {formatNumber(s.orderCount)} طلب · {formatNumber(s.itemsSold)} قطعة ·{" "}
            <span className="font-medium text-foreground">{formatPrice(s.revenue)}</span>
            {s.cancelledCount > 0 && (
              <> · <span className="text-danger">{formatNumber(s.cancelledCount)} ملغي</span></>
            )}
          </p>
        </div>
        <Link href={closeHref} className="btn btn-ghost btn-sm">
          إغلاق
        </Link>
      </div>
      <div className="grid gap-6 border-b border-border p-6 lg:grid-cols-2">
        <TopProducts summary={s} title="الأكثر مبيعاً في هذا اليوم" flat />
        <RevenueByStatus orders={orders} subtitle="هذا اليوم" flat />
      </div>
      <OrdersTable orders={orders} emptyText="لا توجد طلبات في هذا اليوم." />
    </section>
  );
}

function TopProducts({
  summary,
  title,
  flat,
}: {
  summary: SalesSummary;
  title: string;
  flat?: boolean;
}) {
  const max = Math.max(1, ...summary.topProducts.map((p) => p.revenue));
  return (
    <section className={flat ? "" : "card p-6"}>
      <h2 className={flat ? "font-serif text-lg" : "font-serif text-xl"}>{title}</h2>
      <p className="text-sm text-muted">حسب الإيراد</p>
      <div className="mt-5 space-y-4">
        {summary.topProducts.length === 0 ? (
          <p className="text-sm text-muted">لا توجد مبيعات في هذه الفترة.</p>
        ) : (
          summary.topProducts.map((p) => (
            <BarRow
              key={p.name}
              label={p.name}
              value={p.revenue}
              max={max}
              hint={`${formatNumber(p.sold)} قطعة · ${formatPrice(p.revenue)}`}
            />
          ))
        )}
      </div>
    </section>
  );
}

function RevenueByStatus({
  orders,
  subtitle,
  flat,
}: {
  orders: OrderWithDetails[];
  subtitle: string;
  flat?: boolean;
}) {
  const byStatus: Record<string, number> = {};
  for (const o of orders) byStatus[o.status] = (byStatus[o.status] ?? 0) + o.totalAmount;
  const max = Math.max(1, ...Object.values(byStatus));
  return (
    <section className={flat ? "" : "card p-6"}>
      <h2 className={flat ? "font-serif text-lg" : "font-serif text-xl"}>الإيرادات حسب حالة الطلب</h2>
      <p className="text-sm text-muted">{subtitle}</p>
      <div className="mt-5 space-y-4">
        {ORDER_STATUSES.map((st) => (
          <BarRow
            key={st}
            label={ORDER_STATUS_LABELS[st]}
            value={byStatus[st] ?? 0}
            max={max}
            hint={formatPrice(byStatus[st] ?? 0)}
          />
        ))}
      </div>
    </section>
  );
}

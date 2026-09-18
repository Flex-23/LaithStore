import Link from "next/link";
import { getAgentReports } from "@/lib/data";
import { requireAdminStaff } from "@/lib/permissions";
import { agentCode } from "@/lib/agent";
import {
  currentBusinessDay,
  currentBusinessMonth,
  formatDayKey,
  formatMonthKey,
} from "@/lib/business-day";
import { PageHeader, StatCard } from "@/components/admin/ui";
import { ChartIcon, TruckIcon, UsersIcon, WalletIcon } from "@/components/icons";
import { formatNumber, formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "تقارير المندوبين" };

type RangeKind = "all" | "month" | "today";

const RANGES: { value: RangeKind; label: string }[] = [
  { value: "all", label: "الكل" },
  { value: "month", label: "هذا الشهر" },
  { value: "today", label: "اليوم" },
];

export default async function AgentReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  await requireAdminStaff();
  const { range: rangeParam } = await searchParams;
  const range: RangeKind =
    rangeParam === "month" ? "month" : rangeParam === "today" ? "today" : "all";

  const period =
    range === "month"
      ? currentBusinessMonth()
      : range === "today"
        ? currentBusinessDay()
        : undefined;
  const periodLabel =
    range === "month"
      ? formatMonthKey(currentBusinessMonth().key)
      : range === "today"
        ? formatDayKey(currentBusinessDay().key)
        : "منذ البداية";

  const reports = await getAgentReports(period);
  const totals = reports.reduce(
    (t, r) => ({
      orders: t.orders + r.totalOrders,
      delivered: t.delivered + r.delivered,
      cancelled: t.cancelled + r.cancelled,
      commission: t.commission + r.commission,
      paidOut: t.paidOut + r.paidOut,
    }),
    { orders: 0, delivered: 0, cancelled: 0, commission: 0, paidOut: 0 },
  );

  return (
    <>
      <PageHeader
        title="تقارير المندوبين"
        description="عدد الطلبات لكل مندوب، ما وصل وما أُلغي، ومجموع النسبة المستحقة له."
      >
        <div className="grid grid-cols-3 rounded-full surface-2 p-1 text-sm font-medium">
          {RANGES.map((r) => (
            <Link
              key={r.value}
              href={`/admin/agents/reports?range=${r.value}`}
              className={`rounded-full px-4 py-1.5 text-center transition-colors ${
                range === r.value ? "bg-surface shadow-sm" : "text-muted"
              }`}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </PageHeader>

      <p className="mb-3 text-sm text-muted">
        الفترة: <span className="font-medium text-foreground">{periodLabel}</span>
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="مجموع النسب المستحقة"
          value={formatPrice(totals.commission)}
          sub="على الطلبات الواصلة"
          icon={<ChartIcon width={18} height={18} className="text-background" />}
          accent
        />
        <StatCard
          label="طلبات المندوبين"
          value={formatNumber(totals.orders)}
          sub={`${formatNumber(totals.delivered)} واصلة · ${formatNumber(totals.cancelled)} ملغاة`}
          icon={<TruckIcon width={18} height={18} />}
        />
        <StatCard
          label="المصروف للمندوبين"
          value={formatPrice(totals.paidOut)}
          sub="من صفحة الصرفيات"
          icon={<WalletIcon width={18} height={18} />}
        />
        <StatCard
          label="المندوبون"
          value={formatNumber(reports.length)}
          sub={`${formatNumber(reports.filter((r) => r.agent.isActive).length)} نشط`}
          icon={<UsersIcon width={18} height={18} />}
        />
      </div>

      <section className="mt-6 card overflow-hidden">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-serif text-xl">تفاصيل كل مندوب</h2>
          <p className="text-sm text-muted">
            النسبة تُحتسب على الطلبات الواصلة فقط، بالنسبة المثبّتة على كل طلب وقت إسناده.
          </p>
        </div>
        {reports.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-muted">
            لا يوجد مندوبون بعد.{" "}
            <Link href="/admin/agents" className="link-underline text-foreground">
              أضف مندوباً
            </Link>
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted">
                  <th className="px-5 py-3 font-medium">المندوب</th>
                  <th className="px-5 py-3 font-medium">النسبة</th>
                  <th className="px-5 py-3 font-medium">إجمالي الطلبات</th>
                  <th className="px-5 py-3 font-medium">قيد الانتظار</th>
                  <th className="px-5 py-3 font-medium">مُخرَجة (تم الشحن)</th>
                  <th className="px-5 py-3 font-medium">واصلة</th>
                  <th className="px-5 py-3 font-medium">ملغاة</th>
                  <th className="px-5 py-3 font-medium">مبيعات الواصلة</th>
                  <th className="px-5 py-3 font-medium">مجموع النسبة</th>
                  <th className="px-5 py-3 font-medium">المصروف له</th>
                  <th className="px-5 py-3 font-medium">المتبقي له</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reports.map((r) => {
                  const balance = r.commission - r.paidOut;
                  return (
                    <tr key={r.agent.id} className={`hover:bg-surface-2/60 ${r.agent.isActive ? "" : "opacity-60"}`}>
                      <td className="px-5 py-3">
                        <p className="font-medium">{r.agent.name}</p>
                        <p className="ltr text-start font-mono text-xs text-muted">
                          {agentCode(r.agent.agentNumber)}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3">{formatNumber(r.agent.commissionPercent)}%</td>
                      <td className="px-5 py-3 font-medium">{formatNumber(r.totalOrders)}</td>
                      <td className="px-5 py-3 text-muted">{formatNumber(r.pending)}</td>
                      <td className="px-5 py-3">{formatNumber(r.shipped)}</td>
                      <td className="px-5 py-3 font-medium text-success">{formatNumber(r.delivered)}</td>
                      <td className={`px-5 py-3 ${r.cancelled > 0 ? "text-danger" : "text-muted"}`}>
                        {formatNumber(r.cancelled)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3">{formatPrice(r.deliveredSales)}</td>
                      <td className="whitespace-nowrap px-5 py-3 font-semibold text-brand">
                        {formatPrice(r.commission)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3">{formatPrice(r.paidOut)}</td>
                      <td
                        className={`whitespace-nowrap px-5 py-3 font-semibold ${
                          balance > 0 ? "text-brand-strong" : balance < 0 ? "text-danger" : "text-muted"
                        }`}
                      >
                        {formatPrice(balance)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-border bg-surface-2/40 font-semibold">
                  <td className="px-5 py-3" colSpan={2}>الإجمالي</td>
                  <td className="px-5 py-3">{formatNumber(totals.orders)}</td>
                  <td className="px-5 py-3 text-muted">
                    {formatNumber(reports.reduce((n, r) => n + r.pending, 0))}
                  </td>
                  <td className="px-5 py-3">{formatNumber(reports.reduce((n, r) => n + r.shipped, 0))}</td>
                  <td className="px-5 py-3 text-success">{formatNumber(totals.delivered)}</td>
                  <td className="px-5 py-3 text-danger">{formatNumber(totals.cancelled)}</td>
                  <td className="whitespace-nowrap px-5 py-3">
                    {formatPrice(reports.reduce((n, r) => n + r.deliveredSales, 0))}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-brand">{formatPrice(totals.commission)}</td>
                  <td className="whitespace-nowrap px-5 py-3">{formatPrice(totals.paidOut)}</td>
                  <td className="whitespace-nowrap px-5 py-3">
                    {formatPrice(totals.commission - totals.paidOut)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

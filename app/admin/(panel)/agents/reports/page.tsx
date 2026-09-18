import Link from "next/link";
import { getAgentReports, getArchiveMonths, sumAgentReports } from "@/lib/data";
import { requireAdminStaff } from "@/lib/permissions";
import { resolveMonthParam } from "@/lib/business-day";
import { PageHeader } from "@/components/admin/ui";
import { AgentStats } from "@/components/admin/agent-stats";
import { MonthPicker } from "@/components/admin/month-picker";
import { formatNumber, formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "تقارير المندوبين" };

/**
 * Monthly agent report. Numbers "reset" each business month, but nothing is
 * deleted: every past month stays available in the archive picker.
 */
export default async function AgentReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  await requireAdminStaff();
  const { month } = await searchParams;
  const selection = resolveMonthParam(month);

  const [reports, months] = await Promise.all([
    getAgentReports(selection.range),
    getArchiveMonths(),
  ]);
  const totals = sumAgentReports(reports);
  const monthHref = (agentId: string) => `/admin/agents/${agentId}?month=${selection.key}`;

  return (
    <>
      <PageHeader
        title="تقارير المندوبين"
        description="لكل مندوب: الطلبات المُخرَجة والواصلة والملغاة، الأجر المستحق، والمصروف له. يبدأ التقرير من الصفر مع كل شهر جديد ويبقى السابق في الأرشيف."
      >
        <MonthPicker months={months} value={selection.key} basePath="/admin/agents/reports" />
      </PageHeader>

      <p className="mb-3 text-sm text-muted">
        الفترة: <span className="font-medium text-foreground">{selection.label}</span>
      </p>
      <AgentStats totals={totals} />

      <section className="mt-6 card overflow-hidden">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-serif text-xl">تفاصيل كل مندوب</h2>
          <p className="text-sm text-muted">
            الأجر يُحتسب على الطلبات المُخرَجة (تم الشحن أو التوصيل) بالمبلغ المثبّت على كل طلب وقت إسناده.
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
                  <th className="px-5 py-3 font-medium">الأجر/طلب</th>
                  <th className="px-5 py-3 font-medium">الطلبات</th>
                  <th className="px-5 py-3 font-medium">قيد الانتظار</th>
                  <th className="px-5 py-3 font-medium">مُخرَجة</th>
                  <th className="px-5 py-3 font-medium">واصلة</th>
                  <th className="px-5 py-3 font-medium">ملغاة</th>
                  <th className="px-5 py-3 font-medium">مبيعات المُخرَجة</th>
                  <th className="px-5 py-3 font-medium">الأجر المستحق</th>
                  <th className="px-5 py-3 font-medium">المصروف له</th>
                  <th className="px-5 py-3 font-medium">المتبقي له</th>
                  <th className="px-5 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reports.map((r) => (
                  <ReportRow key={r.agent.id} r={r} href={monthHref(r.agent.id)} />
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border bg-surface-2/40 font-semibold">
                  <td className="px-5 py-3" colSpan={2}>الإجمالي</td>
                  <td className="px-5 py-3">{formatNumber(totals.totalOrders)}</td>
                  <td className="px-5 py-3 text-muted">{formatNumber(totals.pending)}</td>
                  <td className="px-5 py-3">{formatNumber(totals.dispatched)}</td>
                  <td className="px-5 py-3 text-success">{formatNumber(totals.delivered)}</td>
                  <td className="px-5 py-3 text-danger">{formatNumber(totals.cancelled)}</td>
                  <td className="whitespace-nowrap px-5 py-3">{formatPrice(totals.dispatchedSales)}</td>
                  <td className="whitespace-nowrap px-5 py-3 text-brand">{formatPrice(totals.commission)}</td>
                  <td className="whitespace-nowrap px-5 py-3">{formatPrice(totals.paidOut)}</td>
                  <td className="whitespace-nowrap px-5 py-3">{formatPrice(totals.netDue)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

function ReportRow({
  r,
  href,
}: {
  r: Awaited<ReturnType<typeof getAgentReports>>[number];
  href: string;
}) {
  return (
    <tr className={`hover:bg-surface-2/60 ${r.agent.isActive ? "" : "opacity-60"}`}>
      <td className="whitespace-nowrap px-5 py-3 font-medium">{r.agent.name}</td>
      <td className="whitespace-nowrap px-5 py-3">{formatPrice(r.agent.commissionPerOrder)}</td>
      <td className="px-5 py-3 font-medium">{formatNumber(r.totalOrders)}</td>
      <td className="px-5 py-3 text-muted">{formatNumber(r.pending)}</td>
      <td className="px-5 py-3">{formatNumber(r.dispatched)}</td>
      <td className="px-5 py-3 font-medium text-success">{formatNumber(r.delivered)}</td>
      <td className={`px-5 py-3 ${r.cancelled > 0 ? "text-danger" : "text-muted"}`}>
        {formatNumber(r.cancelled)}
      </td>
      <td className="whitespace-nowrap px-5 py-3">{formatPrice(r.dispatchedSales)}</td>
      <td className="whitespace-nowrap px-5 py-3 font-semibold text-brand">{formatPrice(r.commission)}</td>
      <td className="whitespace-nowrap px-5 py-3">{formatPrice(r.paidOut)}</td>
      <td
        className={`whitespace-nowrap px-5 py-3 font-semibold ${
          r.netDue > 0 ? "text-brand-strong" : r.netDue < 0 ? "text-danger" : "text-muted"
        }`}
      >
        {formatPrice(r.netDue)}
      </td>
      <td className="px-5 py-3 text-end">
        <Link href={href} className="btn btn-outline btn-sm">تفاصيل</Link>
      </td>
    </tr>
  );
}

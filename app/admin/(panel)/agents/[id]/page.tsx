import Link from "next/link";
import { notFound } from "next/navigation";
import { getAgentDetail, getArchiveMonths } from "@/lib/data";
import { requireAccountsStaff } from "@/lib/permissions";
import { agentCode } from "@/lib/agent";
import { resolveMonthParam } from "@/lib/business-day";
import { PageHeader } from "@/components/admin/ui";
import { AgentStats } from "@/components/admin/agent-stats";
import { MonthPicker } from "@/components/admin/month-picker";
import { OrdersTable } from "@/components/admin/orders-table";
import { ArrowRightIcon } from "@/components/icons";
import { DetailItem } from "@/components/detail-item";
import { formatDate, formatNumber, formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "تفاصيل المندوب" };

export default async function AgentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  await requireAccountsStaff();
  const [{ id }, { month }] = await Promise.all([params, searchParams]);
  const selection = resolveMonthParam(month);

  const [detail, months] = await Promise.all([
    getAgentDetail(id, selection.range),
    getArchiveMonths(),
  ]);
  if (!detail) notFound();

  const { report, orders, expenses } = detail;
  const agent = report.agent;

  return (
    <>
      <PageHeader
        title={agent.name}
        description={`المندوب ${agentCode(agent.agentNumber)} · ${agent.isActive ? "نشط" : "موقوف"}`}
      >
        <MonthPicker months={months} value={selection.key} basePath={`/admin/agents/${agent.id}`} />
        <Link href="/admin/agents" className="btn btn-outline btn-sm">
          <ArrowRightIcon width={16} height={16} className="rotate-180" /> كل المندوبين
        </Link>
      </PageHeader>

      {/* Profile */}
      <section className="card mb-6 grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
        <DetailItem label="رقم الهاتف" value={agent.phone} ltr />
        <DetailItem label="المحافظة" value={agent.governorate} />
        <DetailItem label="الأجر لكل طلب مُخرَج" value={formatPrice(agent.commissionPerOrder)} />
        <DetailItem label="تاريخ الإضافة" value={formatDate(agent.createdAt)} />
      </section>

      <p className="mb-3 text-sm text-muted">
        الفترة: <span className="font-medium text-foreground">{selection.label}</span>
      </p>
      <AgentStats totals={report} />

      {/* Orders */}
      <section className="mt-6 card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="font-serif text-xl">طلبات المندوب</h2>
            <p className="text-sm text-muted">
              {formatNumber(report.totalOrders)} طلب · {formatNumber(report.pending)} قيد الانتظار
            </p>
          </div>
          <Link href="/admin/orders" className="link-underline text-sm font-medium">
            كل الطلبات
          </Link>
        </div>
        <OrdersTable orders={orders} showAgent={false} emptyText="لا توجد طلبات في هذه الفترة." />
      </section>

      {/* Expenses paid to this agent */}
      <section className="mt-6 card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="font-serif text-xl">المصروف له</h2>
            <p className="text-sm text-muted">{formatNumber(expenses.length)} عملية · {formatPrice(report.paidOut)}</p>
          </div>
          <Link href="/admin/expenses" className="link-underline text-sm font-medium">
            الصرفيات
          </Link>
        </div>
        {expenses.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-muted">لم يُصرف له شيء في هذه الفترة.</p>
        ) : (
          <ul className="divide-y divide-border text-sm">
            {expenses.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-4 px-6 py-3">
                <div>
                  <p className="font-medium">{formatPrice(e.amount)}</p>
                  <p className="text-xs text-muted">{e.note ?? "—"}</p>
                </div>
                <span className="whitespace-nowrap text-xs text-muted">{formatDate(e.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

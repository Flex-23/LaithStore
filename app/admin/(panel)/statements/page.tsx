import Link from "next/link";
import { getAgentDetail, getAgents } from "@/lib/data";
import { requireAccountsStaff } from "@/lib/permissions";
import { agentCode } from "@/lib/agent";
import {
  businessDayKey,
  businessDayRange,
  businessMonthRange,
  currentBusinessMonth,
  formatDayKey,
  isDayKey,
} from "@/lib/business-day";
import { orderCustomer } from "@/lib/order-customer";
import { isDispatched } from "@/lib/profit";
import { PageHeader, StatusBadge } from "@/components/admin/ui";
import { PrintButton } from "@/components/admin/print-button";
import { Watermark } from "@/components/admin/watermark";
import { Logo } from "@/components/logo";
import { formatDate, formatNumber, formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "كشف حساب مندوب" };

type Params = { agent?: string; from?: string; to?: string };

const HOUR_MS = 3_600_000;

/** Previous business month as [firstDayKey, lastDayKey]. */
function lastMonthKeys(): [string, string] {
  const [y, m] = currentBusinessMonth().key.split("-").map(Number);
  const prevKey = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
  const prev = businessMonthRange(prevKey);
  return [
    businessDayKey(new Date(prev.start.getTime() + HOUR_MS)),
    businessDayKey(new Date(prev.end.getTime() - HOUR_MS)),
  ];
}

export default async function StatementsPage({ searchParams }: { searchParams: Promise<Params> }) {
  await requireAccountsStaff();
  const params = await searchParams;
  const agents = await getAgents();

  const monthFirst = `${currentBusinessMonth().key}-01`;
  const todayKey = businessDayKey(new Date());
  const [lastFrom, lastTo] = lastMonthKeys();

  let from = isDayKey(params.from) ? params.from : monthFirst;
  let to = isDayKey(params.to) ? params.to : todayKey;
  if (from > to) [from, to] = [to, from];

  const agentId = agents.find((a) => a.id === params.agent)?.id;
  const range = { start: businessDayRange(from).start, end: businessDayRange(to).end };
  const detail = agentId ? await getAgentDetail(agentId, range) : null;

  const link = (f: string, t: string) =>
    `/admin/statements?${new URLSearchParams({ ...(agentId ? { agent: agentId } : {}), from: f, to: t })}`;

  return (
    <>
      <div className="no-print">
        <PageHeader
          title="كشف حساب مندوب"
          description="اختر المندوب والفترة ليظهر كشف حسابه بكل التفاصيل، ثم احفظه كملف PDF."
        />

        <form
          method="get"
          className="card mb-6 grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_auto] lg:items-end"
        >
          <div>
            <label className="field-label" htmlFor="agent">
              المندوب
            </label>
            <select id="agent" name="agent" defaultValue={agentId ?? ""} className="field-input" required>
              <option value="" disabled>
                اختر المندوب
              </option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} · {agentCode(a.agentNumber)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="from">
              من تاريخ
            </label>
            <input id="from" name="from" type="date" defaultValue={from} className="field-input" required />
          </div>
          <div>
            <label className="field-label" htmlFor="to">
              إلى تاريخ
            </label>
            <input id="to" name="to" type="date" defaultValue={to} className="field-input" required />
          </div>
          <button className="btn btn-primary">عرض الكشف</button>
          <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-4">
            <Link href={link(monthFirst, todayKey)} className="btn btn-outline btn-sm">
              هذا الشهر
            </Link>
            <Link href={link(lastFrom, lastTo)} className="btn btn-outline btn-sm">
              الشهر الماضي
            </Link>
          </div>
        </form>
      </div>

      {!detail ? (
        <div className="no-print card px-6 py-16 text-center text-sm text-muted">
          {agents.length === 0 ? "لا يوجد مندوبون بعد." : "اختر مندوباً واضغط «عرض الكشف»."}
        </div>
      ) : (
        <Statement detail={detail} from={from} to={to} />
      )}
    </>
  );
}

function Statement({
  detail,
  from,
  to,
}: {
  detail: NonNullable<Awaited<ReturnType<typeof getAgentDetail>>>;
  from: string;
  to: string;
}) {
  const { report: r, orders, expenses } = detail;
  const agent = r.agent;

  const dispatchedOrders = orders.filter((o) => isDispatched(o.status));
  // Salary = number of dispatched orders x the fee on each (50 x 2,000 = 100,000).
  const fee = dispatchedOrders[0]?.agentCommission ?? agent.commissionPerOrder;
  const sameFee = dispatchedOrders.every((o) => (o.agentCommission ?? agent.commissionPerOrder) === fee);

  const fileName = `كشف-حساب-${agent.name}-${from}_${to}`;

  const summary: [string, string][] = [
    ["مجموع الطلبات", formatNumber(r.totalOrders)],
    ["قيد الانتظار", formatNumber(r.pending)],
    ["قيد التوصيل", formatNumber(r.shipped)],
    ["تم التسليم", formatNumber(r.delivered)],
    ["مرفوض", formatNumber(r.cancelled)],
    ["أجر الطلب الواحد", formatPrice(fee)],
    ["الطلبات المُحتسَبة", formatNumber(r.dispatched)],
  ];

  return (
    <>
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          المعاينة أدناه هي ما سيُحفظ. في نافذة الطباعة اختر <b>حفظ كملف PDF</b>.
        </p>
        <PrintButton fileName={fileName} />
      </div>

      <article className="statement card relative overflow-hidden p-6 sm:p-8">
        <Watermark />
        <div className="relative z-10">
          {/* Header */}
          <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
            <div>
              <Logo size="md" />
              <h2 className="mt-3 text-2xl">كشف حساب مندوب</h2>
              <p className="text-sm text-muted">
                الفترة: {formatDayKey(from)} — {formatDayKey(to)}
              </p>
            </div>
            <div className="text-start text-sm">
              <p className="text-lg font-semibold">{agent.name}</p>
              <p className="ltr text-muted">{agentCode(agent.agentNumber)}</p>
              <p className="ltr text-muted">{agent.phone}</p>
              <p className="text-xs text-muted">صدر في {formatDate(new Date())}</p>
            </div>
          </header>

          {/* Summary */}
          <section className="stmt-summary avoid-break mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {summary.map(([label, value]) => (
              <div key={label} className="rounded-xl border border-border p-3">
                <p className="text-xs text-muted">{label}</p>
                <p className="mt-1 font-serif text-lg">{value}</p>
              </div>
            ))}
          </section>

          {/* Salary */}
          <section className="avoid-break mt-5 rounded-xl border border-border bg-surface-2/60 p-4">
            <h3 className="text-lg">مجموع راتب المندوب</h3>
            <p className="mt-1 text-sm text-muted">
              {sameFee
                ? `${formatNumber(r.dispatched)} طلب مُخرَج × ${formatPrice(fee)} = `
                : `${formatNumber(r.dispatched)} طلب مُخرَج (بأجور مختلفة) = `}
              <b className="text-foreground">{formatPrice(r.commission)}</b>
            </p>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
              <div className="flex justify-between gap-3 sm:block">
                <dt className="text-muted">الأجر المستحق</dt>
                <dd className="font-semibold">{formatPrice(r.commission)}</dd>
              </div>
              <div className="flex justify-between gap-3 sm:block">
                <dt className="text-muted">المصروف له</dt>
                <dd className="font-semibold">{formatPrice(r.paidOut)}</dd>
              </div>
              <div className="flex justify-between gap-3 sm:block">
                <dt className="text-muted">المتبقي له</dt>
                <dd className="font-serif text-xl text-brand">{formatPrice(r.netDue)}</dd>
              </div>
            </dl>
          </section>

          {/* Orders */}
          <section className="mt-6">
            <h3 className="mb-2 text-lg">الطلبات ({formatNumber(orders.length)})</h3>
            {orders.length === 0 ? (
              <p className="rounded-xl border border-border px-4 py-8 text-center text-sm text-muted">
                لا توجد طلبات في هذه الفترة.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="table-cards w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-2/60 text-xs text-muted">
                      <th className="px-3 py-2.5 font-medium">رقم الطلب</th>
                      <th className="px-3 py-2.5 font-medium">التاريخ</th>
                      <th className="px-3 py-2.5 font-medium">الزبون</th>
                      <th className="px-3 py-2.5 font-medium">الحالة</th>
                      <th className="px-3 py-2.5 font-medium">أجر المندوب</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {orders.map((o) => (
                      <tr key={o.id}>
                        <td className="px-3 py-2.5 font-mono text-xs">#{o.id.slice(-8).toUpperCase()}</td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-muted">{formatDate(o.createdAt)}</td>
                        <td className="px-3 py-2.5">{orderCustomer(o).name}</td>
                        <td className="px-3 py-2.5">
                          <StatusBadge status={o.status} />
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 font-semibold">
                          {isDispatched(o.status) ? formatPrice(o.agentCommission ?? agent.commissionPerOrder) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-border bg-surface-2/60 font-semibold">
                      <td className="px-3 py-2.5" colSpan={4}>
                        المجموع الكلي ({formatNumber(r.dispatched)} طلب)
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-brand">{formatPrice(r.commission)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </section>

          {/* Payouts */}
          {expenses.length > 0 && (
            <section className="avoid-break mt-6">
              <h3 className="mb-2 text-lg">المبالغ المصروفة للمندوب</h3>
              <ul className="divide-y divide-border rounded-xl border border-border text-sm">
                {expenses.map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-4 px-4 py-2.5">
                    <span>
                      <b>{formatPrice(e.amount)}</b>
                      {e.note ? <span className="text-muted"> · {e.note}</span> : null}
                    </span>
                    <span className="whitespace-nowrap text-xs text-muted">{formatDate(e.createdAt)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </article>
    </>
  );
}

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAgent } from "@/lib/permissions";
import { orderInclude, type OrderWithDetails } from "@/lib/data";
import { orderCustomer } from "@/lib/order-customer";
import { currentBusinessDay, formatDayKey } from "@/lib/business-day";
import { PageHeader, StatusBadge } from "@/components/admin/ui";
import { formatDate, formatNumber, formatPrice } from "@/lib/format";
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const metadata = { title: "الطلبات" };

/** Entry employee's orders: read-only — only the follow-up employee changes status. */
export default async function MyOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; range?: string; created?: string }>;
}) {
  const staff = await requireAgent();
  const { status, range, created } = await searchParams;
  const active = ORDER_STATUSES.find((s) => s === status);
  const showAll = range === "all";
  const today = currentBusinessDay();

  let orders: OrderWithDetails[] = [];
  try {
    orders = await prisma.order.findMany({
      where: {
        agentId: staff.id,
        ...(showAll ? {} : { createdAt: { gte: today.start, lt: today.end } }),
      },
      orderBy: { createdAt: "desc" },
      include: orderInclude,
    });
  } catch {
    /* DB offline */
  }
  const shown = active ? orders.filter((o) => o.status === active) : orders;

  const href = (s?: string, all = showAll) => {
    const q = new URLSearchParams();
    if (s) q.set("status", s);
    if (all) q.set("range", "all");
    const qs = q.toString();
    return `/admin/my-orders${qs ? `?${qs}` : ""}`;
  };

  return (
    <>
      <PageHeader
        title="الطلبات"
        description={
          showAll
            ? "كل طلباتك. تُغيَّر حالة الطلب من موظف المتابعة."
            : `طلبات اليوم · ${formatDayKey(today.key)}. تُغيَّر حالة الطلب من موظف المتابعة.`
        }
      >
        <div className="grid grid-cols-2 rounded-full surface-2 p-1 text-sm font-medium">
          <Link
            href={href(active?.toString(), false)}
            className={`rounded-full px-4 py-1.5 text-center transition-colors ${
              !showAll ? "bg-surface shadow-sm" : "text-muted"
            }`}
          >
            اليوم
          </Link>
          <Link
            href={href(active?.toString(), true)}
            className={`rounded-full px-4 py-1.5 text-center transition-colors ${
              showAll ? "bg-surface shadow-sm" : "text-muted"
            }`}
          >
            كل الطلبات
          </Link>
        </div>
        <Link href="/admin/new-order" className="btn btn-primary btn-sm">
          تسجيل طلب جديد
        </Link>
      </PageHeader>

      {created && (
        <p className="mb-6 rounded-xl surface-2 px-4 py-3 text-sm font-medium text-brand">
          تم تسجيل الطلب وأصبح ظاهراً للمدير وموظف المتابعة.
        </p>
      )}

      {/* Status filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Link href={href(undefined)} className={`btn btn-sm ${active ? "btn-outline" : "btn-primary"}`}>
          الكل ({formatNumber(orders.length)})
        </Link>
        {ORDER_STATUSES.map((s) => (
          <Link
            key={s}
            href={href(s)}
            className={`btn btn-sm ${active === s ? "btn-primary" : "btn-outline"}`}
          >
            {ORDER_STATUS_LABELS[s]} ({formatNumber(orders.filter((o) => o.status === s).length)})
          </Link>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="card px-6 py-16 text-center text-sm text-muted">
          {showAll ? "لا توجد طلبات." : "لا توجد طلبات اليوم."}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-cards w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted">
                  <th className="px-5 py-3 font-medium">رقم الطلب</th>
                  <th className="px-5 py-3 font-medium">اسم الزبون</th>
                  <th className="px-5 py-3 font-medium">المبلغ الكلي</th>
                  <th className="px-5 py-3 font-medium">الحالة</th>
                  <th className="px-5 py-3 font-medium">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {shown.map((o) => (
                  <tr key={o.id} className="hover:bg-surface-2/60">
                    <td className="px-5 py-3 font-mono text-xs">#{o.id.slice(-8).toUpperCase()}</td>
                    <td className="px-5 py-3 font-medium">{orderCustomer(o).name}</td>
                    <td className="whitespace-nowrap px-5 py-3 font-medium">{formatPrice(o.totalAmount)}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-muted">{formatDate(o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

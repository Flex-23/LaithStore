import Link from "next/link";
import { getAllOrders } from "@/lib/data";
import { requireFollowUp } from "@/lib/permissions";
import { agentCode } from "@/lib/agent";
import { orderCustomer } from "@/lib/order-customer";
import { PageHeader, StatusBadge } from "@/components/admin/ui";
import { OrderStatusSelect } from "@/components/admin/order-status-select";
import { formatDate, formatNumber } from "@/lib/format";
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const metadata = { title: "متابعة الطلبات" };

/**
 * Follow-up employee: every order from every employee, with its status
 * control — and no amounts anywhere (prices stay on the server).
 */
export default async function FollowUpPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireFollowUp();
  const { status } = await searchParams;
  const active = ORDER_STATUSES.find((s) => s === status);

  const all = await getAllOrders();
  const orders = active ? all.filter((o) => o.status === active) : all;
  const here = "/admin/follow-up";
  const href = (s?: string) => (s ? `${here}?status=${s}` : here);

  return (
    <>
      <PageHeader
        title="متابعة الطلبات"
        description={`${formatNumber(all.length)} طلب من جميع الموظفين — حدّث حالة كل طلب عند التسليم أو الرفض.`}
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <Link href={href()} className={`btn btn-sm ${active ? "btn-outline" : "btn-primary"}`}>
          الكل ({formatNumber(all.length)})
        </Link>
        {ORDER_STATUSES.map((s) => (
          <Link
            key={s}
            href={href(s)}
            className={`btn btn-sm ${active === s ? "btn-primary" : "btn-outline"}`}
          >
            {ORDER_STATUS_LABELS[s]} ({formatNumber(all.filter((o) => o.status === s).length)})
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="card px-6 py-16 text-center text-sm text-muted">
          {active ? `لا توجد طلبات بحالة "${ORDER_STATUS_LABELS[active]}".` : "لا توجد طلبات بعد."}
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const c = orderCustomer(order);
            return (
              <div key={order.id} className="card overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border p-5">
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                    <div>
                      <p className="text-xs text-muted">رقم الطلب</p>
                      <p className="font-mono text-sm font-medium">#{order.id.slice(-8).toUpperCase()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">الزبون</p>
                      <p className="text-sm font-medium">{c.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">الهاتف</p>
                      <p className="ltr text-start text-sm">{c.phone}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">المحافظة</p>
                      <p className="text-sm">{c.governorate}</p>
                    </div>
                    {c.address && (
                      <div>
                        <p className="text-xs text-muted">العنوان</p>
                        <p className="text-sm">{c.address}</p>
                      </div>
                    )}
                    {order.deliveryCompany && (
                      <div>
                        <p className="text-xs text-muted">شركة التوصيل</p>
                        <p className="text-sm">{order.deliveryCompany}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-muted">الموظف</p>
                      <p className="text-sm">
                        {order.agent ? (
                          <>
                            {order.agent.name}{" "}
                            <span className="ltr text-xs text-muted">{agentCode(order.agent.agentNumber)}</span>
                          </>
                        ) : (
                          "—"
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">التاريخ</p>
                      <p className="text-sm">{formatDate(order.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <StatusBadge status={order.status} />
                    <OrderStatusSelect orderId={order.id} status={order.status} redirectTo={href(active)} />
                  </div>
                </div>
                <ul className="space-y-1.5 p-5 text-sm">
                  {order.items.map((item) => (
                    <li key={item.id} className="flex items-center gap-2">
                      <span className="grid h-6 min-w-6 place-items-center rounded-full surface-2 px-1.5 text-xs font-medium">
                        {formatNumber(item.quantity)}
                      </span>
                      <span className="font-medium">{item.product.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

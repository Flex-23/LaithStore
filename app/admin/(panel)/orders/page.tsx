import Link from "next/link";
import { getActiveAgentsLite, getAllOrders } from "@/lib/data";
import { requireStaff } from "@/lib/permissions";
import { agentCode } from "@/lib/agent";
import { claimOrderAction } from "@/app/actions/admin";
import { PageHeader, StatusBadge } from "@/components/admin/ui";
import { OrderStatusSelect } from "@/components/admin/order-status-select";
import { OrderAgentSelect } from "@/components/admin/order-agent-select";
import { formatDate, formatNumber, formatPrice } from "@/lib/format";
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const metadata = { title: "الطلبات" };

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; mine?: string }>;
}) {
  const staff = await requireStaff("orders");
  const isAdmin = staff.role === "ADMIN";
  const { status, mine } = await searchParams;
  const active = ORDER_STATUSES.find((s) => s === status);
  const onlyMine = !isAdmin && mine === "1";

  const [allOrders, agents] = await Promise.all([
    getAllOrders(),
    isAdmin ? getActiveAgentsLite() : Promise.resolve([]),
  ]);
  const orders = allOrders.filter(
    (o) =>
      (!active || o.status === active) && (!onlyMine || o.agentId === staff.id),
  );

  const filterHref = (s?: string, m = onlyMine) => {
    const q = new URLSearchParams();
    if (s) q.set("status", s);
    if (m) q.set("mine", "1");
    const qs = q.toString();
    return `/admin/orders${qs ? `?${qs}` : ""}`;
  };

  return (
    <>
      <PageHeader
        title="الطلبات"
        description={
          isAdmin
            ? "طلبات العملاء، تفاصيلها، حالة التنفيذ والمندوب المسؤول."
            : "غيّر حالة الطلب أو استلمه ليُسجَّل باسمك ويُحتسب أجرك عند إخراجه."
        }
      >
        {!isAdmin && (
          <div className="grid grid-cols-2 rounded-full surface-2 p-1 text-sm font-medium">
            <Link
              href={filterHref(active, false)}
              className={`rounded-full px-4 py-1.5 text-center transition-colors ${
                !onlyMine ? "bg-surface shadow-sm" : "text-muted"
              }`}
            >
              كل الطلبات
            </Link>
            <Link
              href={filterHref(active, true)}
              className={`rounded-full px-4 py-1.5 text-center transition-colors ${
                onlyMine ? "bg-surface shadow-sm" : "text-muted"
              }`}
            >
              طلباتي
            </Link>
          </div>
        )}
      </PageHeader>

      {/* Status filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href={filterHref(undefined)}
          className={`btn btn-sm ${active ? "btn-outline" : "btn-primary"}`}
        >
          الكل ({formatNumber(allOrders.filter((o) => !onlyMine || o.agentId === staff.id).length)})
        </Link>
        {ORDER_STATUSES.map((s) => {
          const count = allOrders.filter(
            (o) => o.status === s && (!onlyMine || o.agentId === staff.id),
          ).length;
          return (
            <Link
              key={s}
              href={filterHref(s)}
              className={`btn btn-sm ${active === s ? "btn-primary" : "btn-outline"}`}
            >
              {ORDER_STATUS_LABELS[s]} ({formatNumber(count)})
            </Link>
          );
        })}
      </div>

      {orders.length === 0 ? (
        <div className="card px-6 py-16 text-center text-sm text-muted">
          {active
            ? `لا توجد طلبات بحالة "${ORDER_STATUS_LABELS[active]}".`
            : "لا توجد طلبات بعد."}
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const mineOrder = order.agentId === staff.id;
            return (
              <div key={order.id} className="card overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border p-5">
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                    <div>
                      <p className="text-xs text-muted">الطلب</p>
                      <p className="font-mono text-sm font-medium">
                        #{order.id.slice(-8).toUpperCase()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">العميل</p>
                      <p className="text-sm font-medium">{order.user.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">الهاتف</p>
                      <p className="ltr text-start text-sm">{order.user.phone}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">المحافظة</p>
                      <p className="text-sm">{order.user.governorate}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">تاريخ الطلب</p>
                      <p className="text-sm">{formatDate(order.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">المندوب</p>
                      {order.agent ? (
                        <p className={`text-sm ${mineOrder ? "font-semibold text-brand" : ""}`}>
                          {order.agent.name}{" "}
                          <span className="ltr text-xs text-muted">
                            {agentCode(order.agent.agentNumber)}
                          </span>
                        </p>
                      ) : (
                        <p className="text-sm text-muted">—</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <StatusBadge status={order.status} />
                    <OrderStatusSelect orderId={order.id} status={order.status} />
                    {isAdmin && (
                      <OrderAgentSelect
                        orderId={order.id}
                        agentId={order.agentId}
                        agents={agents}
                      />
                    )}
                    {!isAdmin && !order.agentId && (
                      <form action={claimOrderAction}>
                        <input type="hidden" name="orderId" value={order.id} />
                        <button className="btn btn-outline btn-sm">استلام الطلب</button>
                      </form>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between">
                  <ul className="space-y-1.5 text-sm">
                    {order.items.map((item) => (
                      <li key={item.id} className="flex items-center gap-2">
                        <span className="grid h-6 min-w-6 place-items-center rounded-full surface-2 px-1.5 text-xs font-medium">
                          {formatNumber(item.quantity)}
                        </span>
                        <span className="font-medium">{item.product.name}</span>
                        <span className="text-muted">
                          · {formatPrice(item.priceAtPurchase)} للقطعة
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="text-end">
                    <p className="text-xs text-muted">الإجمالي</p>
                    <p className="font-serif text-2xl">
                      {formatPrice(order.totalAmount)}
                    </p>
                    {order.agent && order.agentCommission != null && (
                      <p className="text-xs text-muted">
                        أجر المندوب {formatPrice(order.agentCommission)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

import Link from "next/link";
import { getAllOrders } from "@/lib/data";
import { PageHeader, StatusBadge } from "@/components/admin/ui";
import { OrderStatusSelect } from "@/components/admin/order-status-select";
import { formatDate, formatNumber, formatPrice } from "@/lib/format";
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const metadata = { title: "الطلبات" };

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const active = ORDER_STATUSES.find((s) => s === status);
  const allOrders = await getAllOrders();
  const orders = active
    ? allOrders.filter((o) => o.status === active)
    : allOrders;

  return (
    <>
      <PageHeader
        title="الطلبات"
        description="طلبات العملاء، تفاصيلها وحالة التنفيذ."
      />

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href="/admin/orders"
          className={`btn btn-sm ${active ? "btn-outline" : "btn-primary"}`}
        >
          الكل ({formatNumber(allOrders.length)})
        </Link>
        {ORDER_STATUSES.map((s) => {
          const count = allOrders.filter((o) => o.status === s).length;
          return (
            <Link
              key={s}
              href={`/admin/orders?status=${s}`}
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
          {orders.map((order) => (
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
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={order.status} />
                  <OrderStatusSelect orderId={order.id} status={order.status} />
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
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

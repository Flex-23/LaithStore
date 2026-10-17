import { orderCustomer } from "@/lib/order-customer";
import type { OrderWithDetails } from "@/lib/data";
import { StatusBadge } from "@/components/admin/ui";
import { agentCode } from "@/lib/agent";
import { formatDate, formatNumber, formatPrice } from "@/lib/format";

/** Compact, read-only list of orders (used by day details and agent details). */
export function OrdersTable({
  orders,
  showAgent = true,
  emptyText = "لا توجد طلبات.",
}: {
  orders: OrderWithDetails[];
  showAgent?: boolean;
  emptyText?: string;
}) {
  if (orders.length === 0) {
    return <p className="px-6 py-8 text-center text-sm text-muted">{emptyText}</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="table-cards w-full text-sm">
        <thead>
          <tr className="border-b border-border text-xs text-muted">
            <th className="px-5 py-3 font-medium">الطلب</th>
            <th className="px-5 py-3 font-medium">العميل</th>
            {showAgent && <th className="px-5 py-3 font-medium">المندوب</th>}
            <th className="px-5 py-3 font-medium">القطع</th>
            <th className="px-5 py-3 font-medium">الإجمالي</th>
            <th className="px-5 py-3 font-medium">أجر المندوب</th>
            <th className="px-5 py-3 font-medium">الحالة</th>
            <th className="px-5 py-3 font-medium">التاريخ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {orders.map((o) => (
            <tr key={o.id} className="hover:bg-surface-2/60">
              <td className="px-5 py-3 font-mono text-xs">#{o.id.slice(-8).toUpperCase()}</td>
              <td className="px-5 py-3">
                <p className="font-medium">{orderCustomer(o).name}</p>
                <p className="text-xs text-muted">
                  {orderCustomer(o).governorate}
                  {o.deliveryCompany ? ` · ${o.deliveryCompany}` : ""}
                </p>
              </td>
              {showAgent && (
                <td className="px-5 py-3">
                  {o.agent ? (
                    <>
                      {o.agent.name}{" "}
                      <span className="ltr text-xs text-muted">{agentCode(o.agent.agentNumber)}</span>
                    </>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
              )}
              <td className="px-5 py-3 text-muted">
                {formatNumber(o.items.reduce((n, i) => n + i.quantity, 0))}
              </td>
              <td className="whitespace-nowrap px-5 py-3 font-medium">{formatPrice(o.totalAmount)}</td>
              <td className="whitespace-nowrap px-5 py-3 text-muted">
                {o.agentCommission != null ? formatPrice(o.agentCommission) : "—"}
              </td>
              <td className="px-5 py-3">
                <StatusBadge status={o.status} />
              </td>
              <td className="whitespace-nowrap px-5 py-3 text-muted">{formatDate(o.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

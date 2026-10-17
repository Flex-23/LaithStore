// Per-order profit — one definition shared by the dashboard, reports and the
// agent statements so every screen agrees.
//
//   net profit = total price − purchase cost − delivery fee − agent's fee
//
// `totalAmount` already contains the delivery fee the customer pays, so the
// fee cancels out: net = goods profit − agent fee. Only orders that left the
// store (shipped / delivered) earn a net profit; the agent's fee is due on the
// same orders.

type OrderMoney = {
  status: string;
  totalAmount: number;
  deliveryFee: number;
  agentCommission: number | null;
  items: { quantity: number; costAtPurchase: number }[];
};

export function isDispatched(status: string): boolean {
  return status === "SHIPPED" || status === "DELIVERED";
}

/** Total purchase cost of an order's goods. */
export function orderCost(o: Pick<OrderMoney, "items">): number {
  return o.items.reduce((n, i) => n + i.quantity * i.costAtPurchase, 0);
}

/** Net profit of one order; 0 until it is dispatched (and for rejected ones). */
export function orderNetProfit(o: OrderMoney): number {
  if (!isDispatched(o.status)) return 0;
  return o.totalAmount - orderCost(o) - o.deliveryFee - (o.agentCommission ?? 0);
}

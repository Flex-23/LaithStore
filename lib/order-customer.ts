// Who an order is for: typed-in details (agent-registered orders) or the
// registered account (storefront orders).

type OrderLike = {
  customerName: string | null;
  customerPhone: string | null;
  customerGovernorate: string | null;
  customerAddress: string | null;
  user: { name: string; phone: string; governorate: string } | null;
};

export function orderCustomer(o: OrderLike) {
  return {
    name: o.customerName ?? o.user?.name ?? "—",
    phone: o.customerPhone ?? o.user?.phone ?? "—",
    governorate: o.customerGovernorate ?? o.user?.governorate ?? "—",
    address: o.customerAddress ?? null,
  };
}

import type { AgentTotals } from "@/lib/data";
import { StatCard } from "@/components/admin/ui";
import { ChartIcon, PackageIcon, TruckIcon, WalletIcon } from "@/components/icons";
import { formatNumber, formatPrice } from "@/lib/format";

/** The money/orders summary cards for one agent or for all agents combined. */
export function AgentStats({ totals }: { totals: AgentTotals }) {
  const storeNet = totals.dispatchedSales - totals.commission;
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="مستحقات المندوب (الأجر)"
        value={formatPrice(totals.commission)}
        sub={`${formatNumber(totals.dispatched)} طلب مُخرَج`}
        icon={<ChartIcon width={18} height={18} className="text-background" />}
        accent
      />
      <StatCard
        label="الطلبات"
        value={formatNumber(totals.totalOrders)}
        sub={`${formatNumber(totals.shipped)} مشحونة · ${formatNumber(totals.delivered)} واصلة · ${formatNumber(totals.cancelled)} ملغاة`}
        icon={<TruckIcon width={18} height={18} />}
      />
      <StatCard
        label="إجمالي مبيعات الطلبات المُخرَجة"
        value={formatPrice(totals.dispatchedSales)}
        sub={`صافي المتجر بعد الأجر ${formatPrice(storeNet)}`}
        icon={<PackageIcon width={18} height={18} />}
      />
      <StatCard
        label="صافي المستحق للمندوب"
        value={formatPrice(totals.netDue)}
        sub={`المصروف له ${formatPrice(totals.paidOut)}`}
        icon={<WalletIcon width={18} height={18} />}
      />
    </div>
  );
}

import Link from "next/link";
import {
  getCatalogCounts,
  getOrdersBetween,
  summarizeOrders,
} from "@/lib/data";
import {
  BUSINESS_DAY_START_HOUR,
  currentBusinessDay,
  formatDayKey,
} from "@/lib/business-day";
import { PageHeader, StatCard, StatusBadge, BarRow } from "@/components/admin/ui";
import {
  ChartIcon,
  PackageIcon,
  TruckIcon,
  UserIcon,
} from "@/components/icons";
import { formatDate, formatNumber, formatPrice } from "@/lib/format";
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/lib/constants";
import { requireStaff } from "@/lib/permissions";

export const dynamic = "force-dynamic";
export const metadata = { title: "لوحة التحكم" };

export default async function AdminDashboard() {
  await requireStaff("dashboard");
  const day = currentBusinessDay();
  const [orders, counts] = await Promise.all([
    getOrdersBetween(day.start, day.end),
    getCatalogCounts(),
  ]);
  const s = summarizeOrders(orders);
  const recentOrders = orders.slice(0, 5);
  const topMax = Math.max(1, ...s.topProducts.map((p) => p.sold));
  const statusMax = Math.max(1, ...Object.values(s.statusBreakdown));

  return (
    <>
      <PageHeader
        title="لوحة التحكم"
        description={`مبيعات يوم ${formatDayKey(day.key)} — يبدأ يوم العمل الساعة ${BUSINESS_DAY_START_HOUR}:00 فجراً بتوقيت بغداد.`}
      >
        <Link href="/admin/reports" className="btn btn-outline btn-sm">
          <ChartIcon width={16} height={16} /> التقارير الكاملة
        </Link>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="إيرادات اليوم"
          value={formatPrice(s.revenue)}
          sub="باستثناء الطلبات الملغاة"
          icon={<ChartIcon width={18} height={18} className="text-background" />}
          accent
        />
        <StatCard
          label="طلبات اليوم"
          value={formatNumber(s.orderCount)}
          sub={`${formatNumber(s.pendingOrders)} قيد الانتظار · ${formatNumber(s.itemsSold)} قطعة`}
          icon={<TruckIcon width={18} height={18} />}
        />
        <StatCard
          label="المنتجات"
          value={formatNumber(counts.productCount)}
          sub={`${formatNumber(counts.lowStock)} على وشك النفاد`}
          icon={<PackageIcon width={18} height={18} />}
        />
        <StatCard
          label="العملاء"
          value={formatNumber(counts.customerCount)}
          sub="الأعضاء المسجّلون"
          icon={<UserIcon width={18} height={18} />}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Top products today */}
        <section className="card p-6">
          <h2 className="font-serif text-xl">الأكثر مبيعاً اليوم</h2>
          <p className="text-sm text-muted">حسب عدد القطع المباعة</p>
          <div className="mt-5 space-y-4">
            {s.topProducts.length === 0 ? (
              <p className="text-sm text-muted">لا توجد مبيعات اليوم بعد.</p>
            ) : (
              s.topProducts.map((p) => (
                <BarRow
                  key={p.name}
                  label={p.name}
                  value={p.sold}
                  max={topMax}
                  hint={`${formatNumber(p.sold)} قطعة · ${formatPrice(p.revenue)}`}
                />
              ))
            )}
          </div>
        </section>

        {/* Order status today */}
        <section className="card p-6">
          <h2 className="font-serif text-xl">طلبات اليوم حسب الحالة</h2>
          <p className="text-sm text-muted">التوزيع الحالي</p>
          <div className="mt-5 space-y-4">
            {ORDER_STATUSES.map((st) => (
              <BarRow
                key={st}
                label={ORDER_STATUS_LABELS[st]}
                value={s.statusBreakdown[st] ?? 0}
                max={statusMax}
              />
            ))}
          </div>
        </section>
      </div>

      {/* Recent orders today */}
      <section className="mt-6 card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="font-serif text-xl">أحدث طلبات اليوم</h2>
          <Link href="/admin/orders" className="link-underline text-sm font-medium">
            كل الطلبات
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-muted">
            لا توجد طلبات اليوم بعد.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted">
                  <th className="px-6 py-3 font-medium">الطلب</th>
                  <th className="px-6 py-3 font-medium">العميل</th>
                  <th className="px-6 py-3 font-medium">القطع</th>
                  <th className="px-6 py-3 font-medium">الإجمالي</th>
                  <th className="px-6 py-3 font-medium">الحالة</th>
                  <th className="px-6 py-3 font-medium">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-surface-2/60">
                    <td className="px-6 py-3 font-mono text-xs">
                      #{order.id.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-6 py-3">{order.user.name}</td>
                    <td className="px-6 py-3 text-muted">
                      {formatNumber(order.items.reduce((n, i) => n + i.quantity, 0))}
                    </td>
                    <td className="px-6 py-3 font-medium">
                      {formatPrice(order.totalAmount)}
                    </td>
                    <td className="px-6 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-3 text-muted">
                      {formatDate(order.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

import { getAgentDetail, getArchiveMonths } from "@/lib/data";
import { requireAgent } from "@/lib/permissions";
import { resolveMonthParam } from "@/lib/business-day";
import { PageHeader, StatCard } from "@/components/admin/ui";
import { MonthPicker } from "@/components/admin/month-picker";
import { ChartIcon, PackageIcon, TruckIcon, WalletIcon } from "@/components/icons";
import { formatNumber, formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "الحسابات" };

export default async function MyAccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const staff = await requireAgent();
  const { month } = await searchParams;
  // Agents see one month at a time (current by default, older ones in the archive).
  const selection = resolveMonthParam(month === "all" ? undefined : month);

  const [detail, months] = await Promise.all([
    getAgentDetail(staff.id, selection.range),
    getArchiveMonths(),
  ]);
  const r = detail?.report;

  return (
    <>
      <PageHeader title="الحسابات" description={`حساب الشهر: ${selection.label}`}>
        <MonthPicker months={months} value={selection.key} basePath="/admin/my-accounts" allowAll={false} />
      </PageHeader>

      {!r ? (
        <div className="card px-6 py-16 text-center text-sm text-muted">تعذّر تحميل الحساب.</div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <StatCard
            label="مجموع الطلبات"
            value={formatNumber(r.totalOrders)}
            sub={`مبيعات ${formatPrice(r.dispatchedSales)} (قيد التوصيل والمسلّمة)`}
            icon={<PackageIcon width={18} height={18} />}
          />
          <StatCard
            label="تم التسليم"
            value={formatNumber(r.delivered)}
            sub={`${formatNumber(r.shipped)} قيد التوصيل`}
            icon={<TruckIcon width={18} height={18} />}
          />
          <StatCard
            label="قيد الانتظار"
            value={formatNumber(r.pending)}
            icon={<ChartIcon width={18} height={18} />}
          />
          <StatCard
            label="المرفوضة"
            value={formatNumber(r.cancelled)}
            icon={<ChartIcon width={18} height={18} />}
          />
          <div className="col-span-2 xl:col-span-4">
            <StatCard
              label="مبلغ نسبة الطلبات (مستحقاتك)"
              value={formatPrice(r.commission)}
              sub={`${formatNumber(r.dispatched)} طلب مُحتسَب · المستلم ${formatPrice(r.paidOut)} · المتبقي ${formatPrice(r.netDue)}`}
              icon={<WalletIcon width={18} height={18} className="text-background" />}
              accent
            />
          </div>
        </div>
      )}
    </>
  );
}

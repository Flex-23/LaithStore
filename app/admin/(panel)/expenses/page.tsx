import { getActiveAgentsLite, getArchiveMonths, getExpenses } from "@/lib/data";
import { requireAccountsStaff } from "@/lib/permissions";
import { resolveMonthParam } from "@/lib/business-day";
import { PageHeader } from "@/components/admin/ui";
import { MonthPicker } from "@/components/admin/month-picker";
import { ExpenseAdmin } from "@/components/admin/expense-admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "الصرفيات" };

/** Monthly expense log: current month by default, older months in the archive. */
export default async function AdminExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  await requireAccountsStaff();
  const { month } = await searchParams;
  const selection = resolveMonthParam(month);

  const [agents, expenses, months] = await Promise.all([
    getActiveAgentsLite(),
    getExpenses(selection.range),
    getArchiveMonths(),
  ]);

  return (
    <>
      <PageHeader
        title="الصرفيات"
        description="سجّل المبالغ المصروفة وحدّد لمن صُرفت. السجل يبدأ من الصفر كل شهر ويبقى السابق في الأرشيف."
      >
        <MonthPicker months={months} value={selection.key} basePath="/admin/expenses" />
      </PageHeader>
      <ExpenseAdmin agents={agents} expenses={expenses} periodLabel={selection.label} />
    </>
  );
}

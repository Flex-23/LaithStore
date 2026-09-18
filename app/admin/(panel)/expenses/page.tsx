import { getActiveAgentsLite, getExpenses } from "@/lib/data";
import { requireAdminStaff } from "@/lib/permissions";
import { PageHeader } from "@/components/admin/ui";
import { ExpenseAdmin } from "@/components/admin/expense-admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "الصرفيات" };

export default async function AdminExpensesPage() {
  await requireAdminStaff();
  const [agents, expenses] = await Promise.all([
    getActiveAgentsLite(),
    getExpenses(),
  ]);

  return (
    <>
      <PageHeader
        title="الصرفيات"
        description="سجّل المبالغ المصروفة وحدّد لمن صُرفت. ما يُصرف لمندوب يُخصم من نسبته في تقارير المندوبين."
      />
      <ExpenseAdmin
        agents={agents}
        expenses={expenses.map((e) => ({
          id: e.id,
          amount: e.amount,
          recipientName: e.recipientName,
          agent: e.agent,
          note: e.note,
          createdAt: e.createdAt.toISOString(),
        }))}
      />
    </>
  );
}

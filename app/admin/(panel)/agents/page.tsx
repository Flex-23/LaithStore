import { getAgents } from "@/lib/data";
import { requireAdminStaff } from "@/lib/permissions";
import { PageHeader } from "@/components/admin/ui";
import { AgentAdmin } from "@/components/admin/agent-admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "المندوبون" };

export default async function AdminAgentsPage() {
  await requireAdminStaff();
  const agents = await getAgents();

  return (
    <>
      <PageHeader
        title="المندوبون"
        description="أضف مندوبين، حدّد صلاحياتهم وأجرهم عن كل طلب. يدخل المندوب من صفحة دخول الإدارة برقم هاتفه وكلمة مروره."
      />
      <AgentAdmin agents={agents} />
    </>
  );
}

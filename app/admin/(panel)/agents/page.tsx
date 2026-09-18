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
        description="أضف مندوبين، حدّد صلاحياتهم ونسبتهم من كل طلب. يدخل المندوب من صفحة دخول الإدارة برقم هاتفه وكلمة مروره."
      />
      <AgentAdmin
        agents={agents.map((a) => ({
          id: a.id,
          name: a.name,
          phone: a.phone,
          governorate: a.governorate,
          agentNumber: a.agentNumber,
          commissionPercent: a.commissionPercent,
          canManageProducts: a.canManageProducts,
          canManageOrders: a.canManageOrders,
          canViewDashboard: a.canViewDashboard,
          canManageHome: a.canManageHome,
          isActive: a.isActive,
        }))}
      />
    </>
  );
}

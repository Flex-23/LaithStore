import { getStaffMembers } from "@/lib/data";
import { requireAdminStaff } from "@/lib/permissions";
import { PageHeader } from "@/components/admin/ui";
import { AgentAdmin } from "@/components/admin/agent-admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "الموظفون" };

export default async function AdminAgentsPage() {
  await requireAdminStaff();
  const agents = await getStaffMembers();

  return (
    <>
      <PageHeader
        title="الموظفون"
        description="أضف موظفي إدخال (مندوبين) وموظفي متابعة. يدخل الموظف من صفحة دخول الإدارة برقم هاتفه وكلمة مروره."
      />
      <AgentAdmin agents={agents} />
    </>
  );
}

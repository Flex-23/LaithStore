import { requireStaff } from "@/lib/permissions";
import { AdminSidebar } from "@/components/admin/sidebar";

export const dynamic = "force-dynamic";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const staff = await requireStaff();
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[264px_1fr]">
      <AdminSidebar
        name={staff.name}
        role={staff.role}
        agentNumber={staff.agentNumber}
        permissions={staff.permissions}
      />
      <div className="min-w-0">
        <main className="px-5 py-7 sm:px-8 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}

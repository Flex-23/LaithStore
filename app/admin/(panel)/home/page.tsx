import { getHomeContent } from "@/lib/data";
import { requireStaff } from "@/lib/permissions";
import { PageHeader } from "@/components/admin/ui";
import { HomeAdmin } from "@/components/admin/home-admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "الصفحة الرئيسية" };

export default async function AdminHomePage() {
  await requireStaff("home");
  const content = await getHomeContent();

  return (
    <>
      <PageHeader
        title="محتوى الصفحة الرئيسية"
        description="عدّل نصوص وصور الواجهة الرئيسية للمتجر."
      />
      <HomeAdmin content={content} />
    </>
  );
}

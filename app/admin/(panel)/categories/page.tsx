import { getAllCategories } from "@/lib/data";
import { PageHeader } from "@/components/admin/ui";
import { CategoryAdmin } from "@/components/admin/category-admin";
import { requireStaff } from "@/lib/permissions";

export const dynamic = "force-dynamic";
export const metadata = { title: "الفئات" };

export default async function AdminCategoriesPage() {
  await requireStaff("products");
  const categories = await getAllCategories();

  return (
    <>
      <PageHeader
        title="الفئات"
        description="نظّم كتالوجك في مجموعات قابلة للتسوق."
      />
      <CategoryAdmin
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          image: c.image,
          productCount: c._count.products,
        }))}
      />
    </>
  );
}

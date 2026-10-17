import { getAllProducts, getCategoriesLite } from "@/lib/data";
import { PageHeader } from "@/components/admin/ui";
import { ProductAdmin } from "@/components/admin/product-admin";
import { requireStaff } from "@/lib/permissions";

export const dynamic = "force-dynamic";
export const metadata = { title: "المنتجات" };

export default async function AdminProductsPage() {
  await requireStaff("products");
  const [products, categories] = await Promise.all([
    getAllProducts(),
    getCategoriesLite(),
  ]);

  return (
    <>
      <PageHeader
        title="المنتجات"
        description="أضف وعدّل المنتجات وأدر المخزون والخصومات."
      />
      <ProductAdmin
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          costPrice: p.costPrice,
          price: p.price,
          discountedPrice: p.discountedPrice,
          isDiscounted: p.isDiscounted,
          image: p.image,
          stockQuantity: p.stockQuantity,
          categoryId: p.categoryId,
          category: { name: p.category.name },
        }))}
        categories={categories}
      />
    </>
  );
}

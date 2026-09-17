import Link from "next/link";
import { getGroupedProducts } from "@/lib/data";
import { ProductGrid, SectionHeader, SetupNotice } from "@/components/store-ui";
import { PRODUCTS_PER_CATEGORY } from "@/lib/constants";
import { formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "المتجر",
  description: "تصفّح التشكيلة الكاملة مصنّفة حسب الفئة.",
};

export default async function ProductsPage() {
  const categories = await getGroupedProducts(PRODUCTS_PER_CATEGORY);
  const withProducts = categories.filter((c) => c._count.products > 0);

  if (withProducts.length === 0) return <SetupNotice />;

  const totalProducts = withProducts.reduce((n, c) => n + c._count.products, 0);

  return (
    <>
      {/* Page header */}
      <section className="border-b border-border bg-surface">
        <div className="container-page py-14 lg:py-16">
          <span className="eyebrow">التشكيلة</span>
          <h1 className="mt-3 text-4xl sm:text-5xl">كل المنتجات</h1>
          <p className="mt-3 max-w-lg text-muted">
            {formatNumber(totalProducts)} منتج في {formatNumber(withProducts.length)} فئات.
          </p>

          {/* Category quick-nav */}
          <div className="hide-scrollbar mt-7 flex gap-2 overflow-x-auto pb-1">
            {withProducts.map((c) => (
              <a
                key={c.id}
                href={`#cat-${c.id}`}
                className="btn btn-outline btn-sm shrink-0"
              >
                {c.name}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Grouped products */}
      <div className="container-page space-y-14 py-14 lg:space-y-20 lg:py-16">
        {withProducts.map((category) => {
          const hasMore = category._count.products > PRODUCTS_PER_CATEGORY;
          return (
            <section key={category.id} id={`cat-${category.id}`} className="scroll-mt-24">
              <SectionHeader
                eyebrow={`${formatNumber(category._count.products)} منتج`}
                title={category.name}
                description={category.description}
                actionHref={hasMore ? `/category/${category.id}` : undefined}
                actionLabel={hasMore ? "عرض الكل" : undefined}
              />
              <div className="mt-8">
                <ProductGrid products={category.products} />
              </div>
              {hasMore && (
                <div className="mt-8 flex justify-center">
                  <Link href={`/category/${category.id}`} className="btn btn-outline">
                    عرض كل منتجات {category.name}
                  </Link>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}

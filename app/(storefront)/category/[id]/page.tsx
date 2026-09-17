import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategoryWithProducts } from "@/lib/data";
import { ProductGrid, EmptyState } from "@/components/store-ui";
import { SmartImage } from "@/components/smart-image";
import { ArrowRightIcon } from "@/components/icons";
import { formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const category = await getCategoryWithProducts(id);
  return { title: category?.name ?? "الفئة" };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const category = await getCategoryWithProducts(id);
  if (!category) notFound();

  return (
    <>
      {/* Banner */}
      <section className="relative overflow-hidden border-b border-border">
        <SmartImage
          src={category.image}
          alt={category.name}
          sizes="100vw"
          className="h-64 w-full sm:h-80"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-black/20" />
        <div className="container-page absolute inset-x-0 bottom-0">
          <div className="pb-8 text-white">
            <nav className="mb-3 flex items-center gap-2 text-sm text-white/70">
              <Link href="/products" className="hover:text-white">
                المتجر
              </Link>
              <ArrowRightIcon width={14} height={14} />
              <span className="text-white">{category.name}</span>
            </nav>
            <h1 className="text-4xl text-white sm:text-5xl">{category.name}</h1>
            <p className="mt-2 max-w-lg text-white/80">{category.description}</p>
          </div>
        </div>
      </section>

      <div className="container-page py-12 lg:py-16">
        <div className="mb-8 flex items-center justify-between">
          <p className="text-sm text-muted">
            {formatNumber(category.products.length)} منتج
          </p>
          <Link href="/products" className="link-underline text-sm font-medium">
            كل الفئات
          </Link>
        </div>

        {category.products.length === 0 ? (
          <EmptyState
            title="لا توجد منتجات هنا بعد"
            message="هذه الفئة فارغة حالياً. عُد لاحقاً."
          >
            <Link href="/products" className="btn btn-outline btn-sm">
              تصفّح فئات أخرى
            </Link>
          </EmptyState>
        ) : (
          <ProductGrid products={category.products} />
        )}
      </div>
    </>
  );
}

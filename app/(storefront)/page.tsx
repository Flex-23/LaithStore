import Link from "next/link";
import { Hero } from "@/components/hero";
import {
  CategoryTile,
  ProductGrid,
  SectionHeader,
  SetupNotice,
  TrustMarquee,
} from "@/components/store-ui";
import { SmartImage } from "@/components/smart-image";
import { ArrowRightIcon } from "@/components/icons";
import { getHomeCategories, getHomeContent } from "@/lib/data";
import { PRODUCTS_PER_CATEGORY } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categories, content] = await Promise.all([
    getHomeCategories(),
    getHomeContent(),
  ]);

  if (categories.length === 0) {
    return (
      <>
        <Hero content={content} />
        <SetupNotice />
      </>
    );
  }

  return (
    <>
      <Hero content={content} />
      <TrustMarquee />

      {/* Category showcase */}
      <section className="container-page py-16 lg:py-20">
        <SectionHeader
          eyebrow="تصفّح"
          title="تسوّق حسب الفئة"
          description="عوالم من التصميم المدروس، كل فئة منها مختارة بعناية."
          actionHref="/products"
          actionLabel="كل المنتجات"
        />
        <div className="mt-9 grid grid-cols-2 gap-5 md:grid-cols-4">
          {categories.map((c) => (
            <CategoryTile
              key={c.id}
              category={{ id: c.id, name: c.name, image: c.image }}
            />
          ))}
        </div>
      </section>

      {/* Products grouped by category */}
      {categories
        .filter((c) => c.products.length > 0)
        .map((category) => (
          <section key={category.id} className="container-page py-10 lg:py-12">
            <SectionHeader
              title={category.name}
              description={category.description}
              actionHref={`/category/${category.id}`}
              actionLabel="عرض الكل"
            />
            <div className="mt-8">
              <ProductGrid
                products={category.products.slice(0, PRODUCTS_PER_CATEGORY)}
              />
            </div>
          </section>
        ))}

      {/* Editorial promo banner (editable from /admin/home) */}
      <section className="container-page py-16">
        <div className="relative overflow-hidden rounded-[2rem] border border-border">
          <SmartImage
            src={content.promoImage}
            alt={content.promoTitle}
            sizes="100vw"
            className="h-80 w-full sm:h-96"
          />
          <div className="absolute inset-0 bg-linear-to-l from-black/70 via-black/40 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-center gap-4 p-8 text-white sm:p-14">
            <span className="eyebrow !text-white/80">{content.promoEyebrow}</span>
            <h2 className="max-w-md text-3xl text-white sm:text-4xl">
              {content.promoTitle}
            </h2>
            <p className="max-w-sm text-white/80">{content.promoText}</p>
            <Link
              href="/products"
              className="btn btn-brand w-fit"
            >
              {content.promoCta} <ArrowRightIcon width={18} height={18} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

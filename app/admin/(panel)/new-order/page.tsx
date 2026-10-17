import { prisma } from "@/lib/prisma";
import { requireAgent } from "@/lib/permissions";
import { effectivePrice } from "@/lib/format";
import { PageHeader } from "@/components/admin/ui";
import { AgentOrderForm, type OrderProduct } from "@/components/admin/agent-order-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "تسجيل طلب" };

export default async function NewOrderPage() {
  await requireAgent();

  let products: OrderProduct[] = [];
  let companies: string[] = [];
  try {
    const [rows, used] = await Promise.all([
      prisma.product.findMany({
        where: { stockQuantity: { gt: 0 } },
        orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
        include: { category: true },
      }),
      prisma.order.findMany({
        where: { deliveryCompany: { not: null } },
        distinct: ["deliveryCompany"],
        select: { deliveryCompany: true },
      }),
    ]);
    products = rows.map((p) => ({
      id: p.id,
      name: p.name,
      price: effectivePrice(p),
      stock: p.stockQuantity,
      category: p.category.name,
    }));
    companies = used.map((o) => o.deliveryCompany!).sort();
  } catch {
    /* DB offline: the form renders empty */
  }

  return (
    <>
      <PageHeader
        title="تسجيل طلب"
        description="اختر المنتجات، ثم معلومات الزبون وشركة التوصيل، واضغط تم ليصل الطلب إلى المدير."
      />
      <AgentOrderForm products={products} companies={companies} />
    </>
  );
}

import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { PRODUCTS_PER_CATEGORY } from "./constants";

export type CategoryWithProducts = Prisma.CategoryGetPayload<{
  include: { products: true };
}>;

export type CategoryWithCount = Prisma.CategoryGetPayload<{
  include: { products: true; _count: { select: { products: true } } };
}>;

export type OrderWithDetails = Prisma.OrderGetPayload<{
  include: { user: true; items: { include: { product: true } } };
}>;

export type ProductWithCategory = Prisma.ProductGetPayload<{
  include: { category: true };
}>;

// --- Storefront reads (fail-soft: return empty data if the DB is offline) ---

export async function getHomeCategories(): Promise<CategoryWithProducts[]> {
  try {
    return await prisma.category.findMany({
      orderBy: { createdAt: "asc" },
      take: 4,
      include: {
        products: {
          orderBy: { createdAt: "desc" },
          take: 8,
        },
      },
    });
  } catch {
    return [];
  }
}

export async function getGroupedProducts(
  perCategory: number = PRODUCTS_PER_CATEGORY,
): Promise<CategoryWithCount[]> {
  try {
    return await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { products: true } },
        products: {
          orderBy: { createdAt: "desc" },
          take: perCategory,
        },
      },
    });
  } catch {
    return [];
  }
}

export async function getCategoryWithProducts(
  id: string,
): Promise<CategoryWithProducts | null> {
  try {
    return await prisma.category.findUnique({
      where: { id },
      include: { products: { orderBy: { createdAt: "desc" } } },
    });
  } catch {
    return null;
  }
}

export async function getCategoriesLite() {
  try {
    return await prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
  } catch {
    return [];
  }
}

// --- Admin reads ------------------------------------------------------------

export async function getAllProducts(): Promise<ProductWithCategory[]> {
  try {
    return await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: { category: true },
    });
  } catch {
    return [];
  }
}

export async function getAllCategories(): Promise<CategoryWithCount[]> {
  try {
    return await prisma.category.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        products: true,
        _count: { select: { products: true } },
      },
    });
  } catch {
    return [];
  }
}

export async function getAllOrders(): Promise<OrderWithDetails[]> {
  try {
    return await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: true, items: { include: { product: true } } },
    });
  } catch {
    return [];
  }
}

// --- Sales analytics --------------------------------------------------------
//
// Sales figures are always derived from stored orders for a time window, so
// "resetting" the dashboard at the business-day boundary is just a change of
// window — nothing is lost, and every past day is available in the reports.

/** Orders created in [start, end), newest first. */
export async function getOrdersBetween(
  start: Date,
  end: Date,
): Promise<OrderWithDetails[]> {
  try {
    return await prisma.order.findMany({
      where: { createdAt: { gte: start, lt: end } },
      orderBy: { createdAt: "desc" },
      include: { user: true, items: { include: { product: true } } },
    });
  } catch {
    return [];
  }
}

export type SalesSummary = {
  /** Sum of non-cancelled order totals. */
  revenue: number;
  orderCount: number;
  cancelledCount: number;
  pendingOrders: number;
  /** Units sold across non-cancelled orders. */
  itemsSold: number;
  statusBreakdown: Record<string, number>;
  topProducts: { name: string; sold: number; revenue: number }[];
};

/** Pure aggregation of a set of orders (cancelled orders excluded from sales). */
export function summarizeOrders(orders: OrderWithDetails[]): SalesSummary {
  const statusBreakdown: Record<string, number> = {};
  const byProduct = new Map<string, { sold: number; revenue: number }>();
  let revenue = 0;
  let itemsSold = 0;

  for (const order of orders) {
    statusBreakdown[order.status] = (statusBreakdown[order.status] ?? 0) + 1;
    if (order.status === "CANCELLED") continue;
    revenue += order.totalAmount;
    for (const item of order.items) {
      itemsSold += item.quantity;
      const entry = byProduct.get(item.product.name) ?? { sold: 0, revenue: 0 };
      entry.sold += item.quantity;
      entry.revenue += item.quantity * item.priceAtPurchase;
      byProduct.set(item.product.name, entry);
    }
  }

  const topProducts = [...byProduct.entries()]
    .map(([name, v]) => ({ name, sold: v.sold, revenue: v.revenue }))
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 5);

  return {
    revenue,
    orderCount: orders.length,
    cancelledCount: statusBreakdown.CANCELLED ?? 0,
    pendingOrders: statusBreakdown.PENDING ?? 0,
    itemsSold,
    statusBreakdown,
    topProducts,
  };
}

export type CatalogCounts = {
  productCount: number;
  customerCount: number;
  lowStock: number;
};

/** Inventory/customer counts — not time-scoped. */
export async function getCatalogCounts(): Promise<CatalogCounts> {
  try {
    const [productCount, customerCount, lowStock] = await Promise.all([
      prisma.product.count(),
      prisma.user.count({ where: { role: "USER" } }),
      prisma.product.count({ where: { stockQuantity: { lte: 10 } } }),
    ]);
    return { productCount, customerCount, lowStock };
  } catch {
    return { productCount: 0, customerCount: 0, lowStock: 0 };
  }
}

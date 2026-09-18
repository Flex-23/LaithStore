import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { PRODUCTS_PER_CATEGORY } from "./constants";
import {
  DEFAULT_HOME_CONTENT,
  HOME_CONTENT_ID,
  type HomeContentData,
} from "./home-content";

export type CategoryWithProducts = Prisma.CategoryGetPayload<{
  include: { products: true };
}>;

export type CategoryWithCount = Prisma.CategoryGetPayload<{
  include: { products: true; _count: { select: { products: true } } };
}>;

/** Minimal agent shape attached to orders and expenses. */
export const agentSelect = {
  id: true,
  name: true,
  agentNumber: true,
} satisfies Prisma.UserSelect;

export type OrderWithDetails = Prisma.OrderGetPayload<{
  include: {
    user: true;
    items: { include: { product: true } };
    agent: { select: typeof agentSelect };
  };
}>;

/** Editable home-page copy; falls back to the defaults if unset/offline. */
export async function getHomeContent(): Promise<HomeContentData> {
  try {
    const row = await prisma.homeContent.findUnique({
      where: { id: HOME_CONTENT_ID },
    });
    if (!row) return DEFAULT_HOME_CONTENT;
    // Strip Prisma bookkeeping fields.
    const { id: _id, updatedAt: _u, ...content } = row;
    void _id;
    void _u;
    return content;
  } catch {
    return DEFAULT_HOME_CONTENT;
  }
}

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
      include: {
        user: true,
        items: { include: { product: true } },
        agent: { select: agentSelect },
      },
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
      include: {
        user: true,
        items: { include: { product: true } },
        agent: { select: agentSelect },
      },
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

// --- Agents (المندوبون) -----------------------------------------------------

export type AgentRecord = Prisma.UserGetPayload<{
  select: {
    id: true;
    name: true;
    phone: true;
    governorate: true;
    agentNumber: true;
    commissionPercent: true;
    canManageProducts: true;
    canManageOrders: true;
    canViewDashboard: true;
    canManageHome: true;
    isActive: true;
    createdAt: true;
  };
}>;

export async function getAgents(): Promise<AgentRecord[]> {
  try {
    return await prisma.user.findMany({
      where: { role: "AGENT" },
      orderBy: { agentNumber: "asc" },
      select: {
        id: true,
        name: true,
        phone: true,
        governorate: true,
        agentNumber: true,
        commissionPercent: true,
        canManageProducts: true,
        canManageOrders: true,
        canViewDashboard: true,
        canManageHome: true,
        isActive: true,
        createdAt: true,
      },
    });
  } catch {
    return [];
  }
}

/** Active agents for assignment dropdowns. */
export async function getActiveAgentsLite() {
  try {
    return await prisma.user.findMany({
      where: { role: "AGENT", isActive: true },
      orderBy: { agentNumber: "asc" },
      select: agentSelect,
    });
  } catch {
    return [];
  }
}

export type AgentReport = {
  agent: AgentRecord;
  totalOrders: number;
  pending: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  /** Sum of delivered order totals. */
  deliveredSales: number;
  /** Commission earned on delivered orders (snapshotted % per order). */
  commission: number;
  /** Money paid out to this agent (expenses). */
  paidOut: number;
};

/**
 * Per-agent performance for orders created in [start, end) (omit for all-time).
 * Commission counts delivered orders only, using the % stored on each order.
 */
export async function getAgentReports(range?: {
  start: Date;
  end: Date;
}): Promise<AgentReport[]> {
  const agents = await getAgents();
  if (agents.length === 0) return [];
  const createdAt = range ? { gte: range.start, lt: range.end } : undefined;

  try {
    const [orders, expenses] = await Promise.all([
      prisma.order.findMany({
        where: { agentId: { not: null }, createdAt },
        select: {
          agentId: true,
          status: true,
          totalAmount: true,
          agentCommissionPercent: true,
        },
      }),
      prisma.expense.groupBy({
        by: ["agentId"],
        where: { agentId: { not: null }, createdAt },
        _sum: { amount: true },
      }),
    ]);

    const paid = new Map(expenses.map((e) => [e.agentId, e._sum.amount ?? 0]));
    const reports = new Map<string, AgentReport>(
      agents.map((agent) => [
        agent.id,
        {
          agent,
          totalOrders: 0,
          pending: 0,
          shipped: 0,
          delivered: 0,
          cancelled: 0,
          deliveredSales: 0,
          commission: 0,
          paidOut: paid.get(agent.id) ?? 0,
        },
      ]),
    );

    for (const o of orders) {
      const r = reports.get(o.agentId!);
      if (!r) continue; // agent deleted
      r.totalOrders += 1;
      if (o.status === "PENDING") r.pending += 1;
      else if (o.status === "SHIPPED") r.shipped += 1;
      else if (o.status === "CANCELLED") r.cancelled += 1;
      else if (o.status === "DELIVERED") {
        r.delivered += 1;
        r.deliveredSales += o.totalAmount;
        const pct = o.agentCommissionPercent ?? r.agent.commissionPercent;
        r.commission += (o.totalAmount * pct) / 100;
      }
    }
    return [...reports.values()];
  } catch {
    return agents.map((agent) => ({
      agent,
      totalOrders: 0,
      pending: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      deliveredSales: 0,
      commission: 0,
      paidOut: 0,
    }));
  }
}

// --- Expenses (الصرفيات) ----------------------------------------------------

export type ExpenseRecord = Prisma.ExpenseGetPayload<{
  include: { agent: { select: typeof agentSelect } };
}>;

export async function getExpenses(): Promise<ExpenseRecord[]> {
  try {
    return await prisma.expense.findMany({
      orderBy: { createdAt: "desc" },
      include: { agent: { select: agentSelect } },
    });
  } catch {
    return [];
  }
}

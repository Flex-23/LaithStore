import { Prisma, type OrderStatus } from "@prisma/client";
import { prisma } from "./prisma";
import { PRODUCTS_PER_CATEGORY } from "./constants";
import {
  DEFAULT_HOME_CONTENT,
  HOME_CONTENT_ID,
  type HomeContentData,
} from "./home-content";
import {
  businessMonthKey,
  businessMonthKeysSince,
  currentBusinessMonth,
} from "./business-day";

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

/** Everything the admin order views need. */
export const orderInclude = {
  user: true,
  items: { include: { product: true } },
  agent: { select: agentSelect },
} satisfies Prisma.OrderInclude;

export type OrderWithDetails = Prisma.OrderGetPayload<{
  include: typeof orderInclude;
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
      include: orderInclude,
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
      include: orderInclude,
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

const agentRecordSelect = {
  id: true,
  name: true,
  phone: true,
  governorate: true,
  agentNumber: true,
  commissionPerOrder: true,
  canManageProducts: true,
  canManageOrders: true,
  canViewDashboard: true,
  canManageHome: true,
  isActive: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

export type AgentRecord = Prisma.UserGetPayload<{ select: typeof agentRecordSelect }>;

export async function getAgents(): Promise<AgentRecord[]> {
  try {
    return await prisma.user.findMany({
      where: { role: "AGENT" },
      orderBy: { agentNumber: "asc" },
      select: agentRecordSelect,
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

export type DateRange = { start: Date; end: Date };

/** Prisma `createdAt` filter for an optional range. */
function within(range?: DateRange) {
  return range ? { gte: range.start, lt: range.end } : undefined;
}

export type AgentReport = {
  agent: AgentRecord;
  totalOrders: number;
  pending: number;
  /** Orders that left the store: shipped + delivered. */
  dispatched: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  /** Sum of dispatched order totals. */
  dispatchedSales: number;
  /** Fee earned: the per-order amount snapshotted on each dispatched order. */
  commission: number;
  /** Money paid out to this agent (expenses). */
  paidOut: number;
  /** commission − paidOut */
  netDue: number;
};

type OrderForReport = {
  status: OrderStatus;
  totalAmount: number;
  agentCommission: number | null;
};

/**
 * Single source of truth for an agent's numbers. The fee counts dispatched
 * orders (shipped or delivered) using the amount stored on each order.
 */
export function buildAgentReport(
  agent: AgentRecord,
  orders: OrderForReport[],
  paidOut: number,
): AgentReport {
  const r: AgentReport = {
    agent,
    totalOrders: orders.length,
    pending: 0,
    dispatched: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    dispatchedSales: 0,
    commission: 0,
    paidOut,
    netDue: 0,
  };
  for (const o of orders) {
    if (o.status === "PENDING") r.pending += 1;
    else if (o.status === "CANCELLED") r.cancelled += 1;
    else {
      if (o.status === "SHIPPED") r.shipped += 1;
      else r.delivered += 1;
      r.dispatched += 1;
      r.dispatchedSales += o.totalAmount;
      r.commission += o.agentCommission ?? agent.commissionPerOrder;
    }
  }
  r.netDue = r.commission - r.paidOut;
  return r;
}

export type AgentTotals = Omit<AgentReport, "agent">;

/** Column-wise sum of several agent reports (for the overview cards/footer). */
export function sumAgentReports(reports: AgentReport[]): AgentTotals {
  const t: AgentTotals = {
    totalOrders: 0, pending: 0, dispatched: 0, shipped: 0, delivered: 0,
    cancelled: 0, dispatchedSales: 0, commission: 0, paidOut: 0, netDue: 0,
  };
  for (const r of reports) {
    for (const k of Object.keys(t) as (keyof AgentTotals)[]) t[k] += r[k];
  }
  return t;
}

/** Per-agent performance for orders/expenses created in `range` (omit for all-time). */
export async function getAgentReports(range?: DateRange): Promise<AgentReport[]> {
  const agents = await getAgents();
  if (agents.length === 0) return [];
  const createdAt = within(range);

  try {
    const [orders, expenses] = await Promise.all([
      prisma.order.findMany({
        where: { agentId: { not: null }, createdAt },
        select: { agentId: true, status: true, totalAmount: true, agentCommission: true },
      }),
      prisma.expense.groupBy({
        by: ["agentId"],
        where: { agentId: { not: null }, createdAt },
        _sum: { amount: true },
      }),
    ]);
    const paid = new Map(expenses.map((e) => [e.agentId, e._sum.amount ?? 0]));
    const byAgent = new Map<string, OrderForReport[]>();
    for (const o of orders) {
      byAgent.set(o.agentId!, [...(byAgent.get(o.agentId!) ?? []), o]);
    }
    return agents.map((agent) =>
      buildAgentReport(agent, byAgent.get(agent.id) ?? [], paid.get(agent.id) ?? 0),
    );
  } catch {
    return agents.map((agent) => buildAgentReport(agent, [], 0));
  }
}

export type AgentDetail = {
  report: AgentReport;
  orders: OrderWithDetails[];
  expenses: ExpenseRecord[];
};

/** Everything the agent detail page shows for one agent in `range`. */
export async function getAgentDetail(
  id: string,
  range?: DateRange,
): Promise<AgentDetail | null> {
  try {
    const agent = await prisma.user.findFirst({
      where: { id, role: "AGENT" },
      select: agentRecordSelect,
    });
    if (!agent) return null;
    const createdAt = within(range);
    const [orders, expenses] = await Promise.all([
      prisma.order.findMany({
        where: { agentId: id, createdAt },
        orderBy: { createdAt: "desc" },
        include: orderInclude,
      }),
      prisma.expense.findMany({
        where: { agentId: id, createdAt },
        orderBy: { createdAt: "desc" },
        include: { agent: { select: agentSelect } },
      }),
    ]);
    const paidOut = expenses.reduce((n, e) => n + e.amount, 0);
    return { report: buildAgentReport(agent, orders, paidOut), orders, expenses };
  } catch {
    return null;
  }
}

// --- Expenses (الصرفيات) ----------------------------------------------------

export type ExpenseRecord = Prisma.ExpenseGetPayload<{
  include: { agent: { select: typeof agentSelect } };
}>;

/** Expenses created in `range` (omit for all-time), newest first. */
export async function getExpenses(range?: DateRange): Promise<ExpenseRecord[]> {
  try {
    return await prisma.expense.findMany({
      where: { createdAt: within(range) },
      orderBy: { createdAt: "desc" },
      include: { agent: { select: agentSelect } },
    });
  } catch {
    return [];
  }
}

// --- Archive ----------------------------------------------------------------

/**
 * Business-month keys from the earliest order/expense to now, newest first.
 * Drives the "archive" month pickers; always includes the current month.
 */
export async function getArchiveMonths(): Promise<string[]> {
  try {
    const [order, expense] = await Promise.all([
      prisma.order.findFirst({ orderBy: { createdAt: "asc" }, select: { createdAt: true } }),
      prisma.expense.findFirst({ orderBy: { createdAt: "asc" }, select: { createdAt: true } }),
    ]);
    const earliest = [order?.createdAt, expense?.createdAt]
      .filter((d): d is Date => !!d)
      .sort((a, b) => a.getTime() - b.getTime())[0];
    return earliest
      ? businessMonthKeysSince(businessMonthKey(earliest))
      : [currentBusinessMonth().key];
  } catch {
    return [currentBusinessMonth().key];
  }
}

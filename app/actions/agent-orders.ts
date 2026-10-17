"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getStaff } from "@/lib/permissions";
import { agentOrderSchema, fieldErrors } from "@/lib/zod-schemas";
import { effectivePrice } from "@/lib/format";
import type { AdminState } from "./admin";

/**
 * An agent registers an order by hand: products, customer details and the
 * delivery company. The order is theirs from the start (fee snapshotted) and
 * shows up for the admin right away. Prices come from the database and stock
 * is taken atomically.
 */
export async function registerAgentOrderAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const staff = await getStaff();
  if (!staff || staff.role !== "AGENT") {
    return { error: "تسجيل الطلبات متاح للمندوبين فقط" };
  }

  let rawItems: unknown = [];
  try {
    rawItems = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    /* falls through to validation error */
  }

  const parsed = agentOrderSchema.safeParse({
    customerName: formData.get("customerName"),
    customerPhone: formData.get("customerPhone"),
    customerGovernorate: formData.get("customerGovernorate"),
    customerAddress: formData.get("customerAddress") ?? "",
    deliveryCompany: formData.get("deliveryCompany"),
    deliveryFee: formData.get("deliveryFee") || "0",
    items: rawItems,
  });
  if (!parsed.success) {
    const errors = fieldErrors(parsed.error);
    return { fieldErrors: errors, error: errors.items };
  }
  const d = parsed.data;

  const quantities = new Map<string, number>();
  for (const line of d.items) {
    quantities.set(line.productId, (quantities.get(line.productId) ?? 0) + line.quantity);
  }
  const productIds = [...quantities.keys()];

  try {
    await prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({ where: { id: { in: productIds } } });
      if (products.length !== productIds.length) {
        throw new Error("بعض المنتجات لم تعد متوفرة.");
      }

      let total = 0;
      const items = products.map((p) => {
        const qty = quantities.get(p.id)!;
        const unit = effectivePrice(p);
        total += unit * qty;
        return {
          productId: p.id,
          quantity: qty,
          priceAtPurchase: unit,
          costAtPurchase: p.costPrice,
        };
      });

      // Guarded decrement: fails (count 0) if stock ran out in the meantime.
      for (const item of items) {
        const res = await tx.product.updateMany({
          where: { id: item.productId, stockQuantity: { gte: item.quantity } },
          data: { stockQuantity: { decrement: item.quantity } },
        });
        if (res.count === 0) {
          const name = products.find((p) => p.id === item.productId)!.name;
          throw new Error(`الكمية المطلوبة من "${name}" غير متوفرة.`);
        }
      }

      await tx.order.create({
        data: {
          status: "PENDING",
          // Total the customer pays: goods + delivery fee.
          totalAmount: total + d.deliveryFee,
          deliveryFee: d.deliveryFee,
          customerName: d.customerName,
          customerPhone: d.customerPhone,
          customerGovernorate: d.customerGovernorate,
          customerAddress: d.customerAddress || null,
          deliveryCompany: d.deliveryCompany,
          agentId: staff.id,
          agentCommission: staff.commissionPerOrder,
          items: { create: items },
        },
      });
    });
  } catch (err) {
    return {
      error: err instanceof Error && err.message ? err.message : "تعذّر تسجيل الطلب. حاول مرة أخرى.",
    };
  }

  for (const path of [
    "/",
    "/products",
    "/admin/orders",
    "/admin/my-orders",
    "/admin/dashboard",
    "/admin/reports",
    "/admin/agents",
    "/admin/agents/reports",
  ]) {
    revalidatePath(path);
  }
  redirect("/admin/my-orders?created=1");
}

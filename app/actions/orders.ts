"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { checkoutSchema } from "@/lib/zod-schemas";
import { effectivePrice } from "@/lib/format";

export type CartLine = { productId: string; quantity: number };

export type PlaceOrderResult =
  | { ok: true; orderId: string; total: number }
  | { ok: false; error: string };

/**
 * Creates an order from the customer's cart. Prices are re-derived from the
 * database (never trusted from the client) and stock is decremented atomically
 * inside a single transaction.
 */
export async function placeOrder(items: CartLine[]): Promise<PlaceOrderResult> {
  const session = await getSession();
  if (!session || session.role !== "USER") {
    return { ok: false, error: "يرجى تسجيل الدخول بحساب زبون لإتمام الطلب." };
  }

  const parsed = checkoutSchema.safeParse({ items });
  if (!parsed.success) {
    return { ok: false, error: "سلتك فارغة أو غير صالحة." };
  }

  // Merge duplicate product lines.
  const quantities = new Map<string, number>();
  for (const line of parsed.data.items) {
    quantities.set(line.productId, (quantities.get(line.productId) ?? 0) + line.quantity);
  }
  const productIds = [...quantities.keys()];

  try {
    const result = await prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
      });

      if (products.length !== productIds.length) {
        throw new Error("بعض المنتجات لم تعد متوفرة.");
      }

      let total = 0;
      const orderItems = products.map((product) => {
        const qty = quantities.get(product.id)!;
        if (product.stockQuantity < qty) {
          throw new Error(`الكمية المطلوبة من "${product.name}" غير متوفرة.`);
        }
        const unit = effectivePrice(product);
        total += unit * qty;
        return {
          productId: product.id,
          quantity: qty,
          priceAtPurchase: unit,
          costAtPurchase: product.costPrice,
        };
      });

      const order = await tx.order.create({
        data: {
          userId: session.id,
          status: "PENDING",
          totalAmount: total,
          items: { create: orderItems },
        },
      });

      // Decrement stock for each purchased product.
      for (const item of orderItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { decrement: item.quantity } },
        });
      }

      return { orderId: order.id, total };
    });

    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath("/admin/orders");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/reports");

    return { ok: true, orderId: result.orderId, total: result.total };
  } catch (err) {
    const message =
      err instanceof Error && err.message
        ? err.message
        : "تعذّر إتمام الطلب. حاول مرة أخرى.";
    return { ok: false, error: message };
  }
}

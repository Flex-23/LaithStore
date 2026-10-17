"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { adminOnly, getStaff, staffWith } from "@/lib/permissions";
import { saveImageUpload, UploadError } from "@/lib/upload";
import {
  assignAgentSchema,
  categorySchema,
  fieldErrors,
  orderStatusSchema,
  productSchema,
} from "@/lib/zod-schemas";

export type AdminState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string>;
};

const DB_ERROR = "خطأ في قاعدة البيانات. تأكد من تشغيل MySQL وتطبيق المخطط.";
const UNAUTHORIZED = "غير مصرّح لك بهذا الإجراء";

/** Catalog mutations need the "products" permission (admins always have it). */
async function assertAdmin(): Promise<boolean> {
  return (await staffWith("products")) !== null;
}

function refreshCatalog() {
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/admin/products");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/dashboard");
}

/**
 * Resolves the image for a catalog form: an uploaded file (`imageFile`) wins
 * over the `image` text field, which carries either a URL or the existing path.
 */
async function resolveImage(
  formData: FormData,
): Promise<{ image: string } | { error: string }> {
  const file = formData.get("imageFile");
  if (file instanceof File && file.size > 0) {
    try {
      return { image: await saveImageUpload(file) };
    } catch (err) {
      return {
        error: err instanceof UploadError ? err.message : "تعذّر حفظ الصورة",
      };
    }
  }
  return { image: String(formData.get("image") ?? "") };
}

// --- Categories -------------------------------------------------------------

async function readCategory(formData: FormData) {
  const img = await resolveImage(formData);
  if ("error" in img) return { success: false as const, fieldErrors: { image: img.error } };

  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    image: img.image,
  });
  if (!parsed.success) {
    return { success: false as const, fieldErrors: fieldErrors(parsed.error) };
  }
  return { success: true as const, data: parsed.data };
}

export async function createCategoryAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  if (!(await assertAdmin())) return { error: UNAUTHORIZED };

  const parsed = await readCategory(formData);
  if (!parsed.success) return { fieldErrors: parsed.fieldErrors };

  try {
    await prisma.category.create({ data: parsed.data });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { fieldErrors: { name: "توجد فئة بهذا الاسم مسبقاً" } };
    }
    return { error: DB_ERROR };
  }
  refreshCatalog();
  return { success: `تم إنشاء الفئة "${parsed.data.name}"` };
}

export async function updateCategoryAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  if (!(await assertAdmin())) return { error: UNAUTHORIZED };
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "معرّف الفئة مفقود" };

  const parsed = await readCategory(formData);
  if (!parsed.success) return { fieldErrors: parsed.fieldErrors };

  try {
    await prisma.category.update({ where: { id }, data: parsed.data });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { fieldErrors: { name: "توجد فئة بهذا الاسم مسبقاً" } };
    }
    return { error: DB_ERROR };
  }
  refreshCatalog();
  return { success: "تم تحديث الفئة" };
}

export async function deleteCategoryAction(formData: FormData) {
  if (!(await assertAdmin())) redirect("/admin/login");
  const id = String(formData.get("id") ?? "");
  if (id) {
    try {
      await prisma.category.delete({ where: { id } });
    } catch {
      /* ignore — category may already be gone */
    }
    refreshCatalog();
  }
  redirect("/admin/categories");
}

// --- Products ---------------------------------------------------------------

async function readProduct(formData: FormData) {
  const img = await resolveImage(formData);
  if ("error" in img) return { success: false as const, fieldErrors: { image: img.error } };

  const isDiscounted = formData.get("isDiscounted") === "on";
  const discountedRaw = formData.get("discountedPrice");
  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    costPrice: formData.get("costPrice") || "0",
    price: formData.get("price"),
    image: img.image,
    stockQuantity: formData.get("stockQuantity"),
    categoryId: formData.get("categoryId"),
    isDiscounted,
    discountedPrice: isDiscounted && discountedRaw ? discountedRaw : undefined,
  });
  if (!parsed.success) {
    return { success: false as const, fieldErrors: fieldErrors(parsed.error) };
  }
  return { success: true as const, data: parsed.data };
}

export async function createProductAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  if (!(await assertAdmin())) return { error: UNAUTHORIZED };

  const parsed = await readProduct(formData);
  if (!parsed.success) return { fieldErrors: parsed.fieldErrors };
  const d = parsed.data;

  try {
    await prisma.product.create({
      data: {
        name: d.name,
        description: d.description,
        costPrice: d.costPrice,
        price: d.price,
        discountedPrice: d.isDiscounted ? (d.discountedPrice ?? null) : null,
        isDiscounted: Boolean(d.isDiscounted),
        image: d.image,
        stockQuantity: d.stockQuantity,
        categoryId: d.categoryId,
      },
    });
  } catch {
    return { error: DB_ERROR };
  }
  refreshCatalog();
  return { success: `تمت إضافة المنتج "${d.name}"` };
}

export async function updateProductAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  if (!(await assertAdmin())) return { error: UNAUTHORIZED };
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "معرّف المنتج مفقود" };

  const parsed = await readProduct(formData);
  if (!parsed.success) return { fieldErrors: parsed.fieldErrors };
  const d = parsed.data;

  try {
    await prisma.product.update({
      where: { id },
      data: {
        name: d.name,
        description: d.description,
        costPrice: d.costPrice,
        price: d.price,
        discountedPrice: d.isDiscounted ? (d.discountedPrice ?? null) : null,
        isDiscounted: Boolean(d.isDiscounted),
        image: d.image,
        stockQuantity: d.stockQuantity,
        categoryId: d.categoryId,
      },
    });
  } catch {
    return { error: DB_ERROR };
  }
  refreshCatalog();
  return { success: "تم تحديث المنتج" };
}

export async function deleteProductAction(formData: FormData) {
  if (!(await assertAdmin())) redirect("/admin/login");
  const id = String(formData.get("id") ?? "");
  if (id) {
    try {
      await prisma.product.delete({ where: { id } });
    } catch {
      /* ignore */
    }
    refreshCatalog();
  }
  redirect("/admin/products");
}

/** Create when there's no `id`, otherwise update. Used by the admin forms. */
export async function saveProductAction(
  prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  return String(formData.get("id") ?? "")
    ? updateProductAction(prev, formData)
    : createProductAction(prev, formData);
}

export async function saveCategoryAction(
  prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  return String(formData.get("id") ?? "")
    ? updateCategoryAction(prev, formData)
    : createCategoryAction(prev, formData);
}

// --- Orders -----------------------------------------------------------------

function refreshOrders() {
  revalidatePath("/admin/orders");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/reports");
  revalidatePath("/admin/agents/reports");
}

/**
 * Order fields that tie it to an agent. The fee is snapshotted at assignment
 * time so later changes to the agent's rate don't rewrite history.
 */
function agentAssignment(agent: { id: string; commissionPerOrder: number } | null) {
  return agent
    ? { agentId: agent.id, agentCommission: agent.commissionPerOrder }
    : { agentId: null, agentCommission: null };
}

/** Only same-site admin paths are valid post-action destinations. */
function safeBack(value: FormDataEntryValue | null, fallback: string): string {
  const v = String(value ?? "");
  return v.startsWith("/admin/") && !v.startsWith("//") ? v : fallback;
}

/**
 * Changes an order's status: admin and follow-up employees only (entry staff
 * register orders but never change their status).
 */
export async function updateOrderStatusAction(formData: FormData) {
  const staff = await getStaff();
  if (!staff) redirect("/admin/login");
  const back = safeBack(formData.get("redirectTo"), "/admin/orders");
  const parsed = orderStatusSchema.safeParse({
    orderId: formData.get("orderId"),
    status: formData.get("status"),
  });
  if (parsed.success) {
    // Only the admin and the follow-up employee change statuses; entry staff can't.
    const canChange =
      staff.role === "ADMIN" || staff.role === "FOLLOWUP" || staff.permissions.orders;
    if (canChange) {
      try {
        await prisma.$transaction(async (tx) => {
          const order = await tx.order.findUnique({
            where: { id: parsed.data.orderId },
            select: {
              agentId: true,
              status: true,
              items: { select: { productId: true, quantity: true } },
            },
          });
          if (!order) return;
          const next = parsed.data.status;
          if (next === order.status) return;
          // "Rejected order received back" only follows a rejected order.
          if (next === "RETURNED" && order.status !== "CANCELLED") return;

          if (next === "RETURNED") {
            // The goods are back in the store: return them to stock.
            for (const item of order.items) {
              await tx.product.update({
                where: { id: item.productId },
                data: { stockQuantity: { increment: item.quantity } },
              });
            }
          } else if (order.status === "RETURNED") {
            // Reopening a returned order takes the goods out of stock again.
            for (const item of order.items) {
              const res = await tx.product.updateMany({
                where: { id: item.productId, stockQuantity: { gte: item.quantity } },
                data: { stockQuantity: { decrement: item.quantity } },
              });
              if (res.count === 0) throw new Error("stock");
            }
          }

          const claim = staff.role === "AGENT" && !order.agentId;
          await tx.order.update({
            where: { id: parsed.data.orderId },
            data: { status: next, ...(claim ? agentAssignment(staff) : {}) },
          });
        });
      } catch {
        /* ignore — e.g. not enough stock to reopen a returned order */
      }
      revalidatePath("/");
      revalidatePath("/products");
      revalidatePath("/admin/products");
    }
    refreshOrders();
    revalidatePath("/admin/my-orders");
    revalidatePath("/admin/follow-up");
  }
  redirect(back);
}

/** Agent takes an unassigned order without changing its status. */
export async function claimOrderAction(formData: FormData) {
  const staff = await staffWith("orders");
  if (!staff) redirect("/admin/login");
  const orderId = String(formData.get("orderId") ?? "");
  if (orderId && staff.role === "AGENT") {
    try {
      await prisma.order.updateMany({
        where: { id: orderId, agentId: null },
        data: agentAssignment(staff),
      });
    } catch {
      /* ignore */
    }
    refreshOrders();
  }
  redirect("/admin/orders");
}

/** Admin assigns (or clears) the agent on an order. */
export async function assignOrderAgentAction(formData: FormData) {
  if (!(await adminOnly())) redirect("/admin/login");
  const parsed = assignAgentSchema.safeParse({
    orderId: formData.get("orderId"),
    agentId: formData.get("agentId"),
  });
  if (parsed.success) {
    try {
      const agent = parsed.data.agentId
        ? await prisma.user.findFirst({
            where: { id: parsed.data.agentId, role: "AGENT" },
            select: { id: true, commissionPerOrder: true },
          })
        : null;
      // An unknown agent id is ignored rather than silently unassigning.
      if (!parsed.data.agentId || agent) {
        await prisma.order.update({
          where: { id: parsed.data.orderId },
          data: agentAssignment(agent),
        });
      }
    } catch {
      /* ignore */
    }
    refreshOrders();
  }
  redirect("/admin/orders");
}

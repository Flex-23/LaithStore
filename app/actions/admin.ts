"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { saveImageUpload, UploadError } from "@/lib/upload";
import {
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

async function assertAdmin(): Promise<boolean> {
  const session = await getSession();
  return session?.role === "ADMIN";
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
  if (!(await assertAdmin())) return { error: "غير مصرّح" };

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
  if (!(await assertAdmin())) return { error: "غير مصرّح" };
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
  if (!(await assertAdmin())) return { error: "غير مصرّح" };

  const parsed = await readProduct(formData);
  if (!parsed.success) return { fieldErrors: parsed.fieldErrors };
  const d = parsed.data;

  try {
    await prisma.product.create({
      data: {
        name: d.name,
        description: d.description,
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
  if (!(await assertAdmin())) return { error: "غير مصرّح" };
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

export async function updateOrderStatusAction(formData: FormData) {
  if (!(await assertAdmin())) redirect("/admin/login");
  const parsed = orderStatusSchema.safeParse({
    orderId: formData.get("orderId"),
    status: formData.get("status"),
  });
  if (parsed.success) {
    try {
      await prisma.order.update({
        where: { id: parsed.data.orderId },
        data: { status: parsed.data.status },
      });
    } catch {
      /* ignore */
    }
    revalidatePath("/admin/orders");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/reports");
  }
  redirect("/admin/orders");
}

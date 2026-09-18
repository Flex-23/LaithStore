"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { staffWith } from "@/lib/permissions";
import { HOME_CONTENT_ID } from "@/lib/home-content";
import { saveImageUpload, UploadError } from "@/lib/upload";
import { fieldErrors, homeContentSchema } from "@/lib/zod-schemas";
import type { AdminState } from "./admin";

const DB_ERROR = "خطأ في قاعدة البيانات. تأكد من تشغيل MySQL وتطبيق المخطط.";

const IMAGE_FIELDS = ["heroImage1", "heroImage2", "promoImage"] as const;

/**
 * Saves the home-page copy. Each image field may arrive as an uploaded file
 * (`<field>File`) which takes precedence over the text value.
 */
export async function saveHomeContentAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  if (!(await staffWith("home"))) return { error: "غير مصرّح لك بهذا الإجراء" };

  const raw: Record<string, string> = {};
  for (const key of [
    "heroEyebrow",
    "heroTitle",
    "heroHighlight",
    "heroSubtitle",
    "heroCta",
    "promoEyebrow",
    "promoTitle",
    "promoText",
    "promoCta",
    ...IMAGE_FIELDS,
  ]) {
    raw[key] = String(formData.get(key) ?? "");
  }

  for (const field of IMAGE_FIELDS) {
    const file = formData.get(`${field}File`);
    if (file instanceof File && file.size > 0) {
      try {
        raw[field] = await saveImageUpload(file);
      } catch (err) {
        return {
          fieldErrors: {
            [field]: err instanceof UploadError ? err.message : "تعذّر حفظ الصورة",
          },
        };
      }
    }
  }

  const parsed = homeContentSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  try {
    await prisma.homeContent.upsert({
      where: { id: HOME_CONTENT_ID },
      update: parsed.data,
      create: { id: HOME_CONTENT_ID, ...parsed.data },
    });
  } catch {
    return { error: DB_ERROR };
  }
  revalidatePath("/");
  revalidatePath("/admin/home");
  return { success: "تم حفظ محتوى الصفحة الرئيسية" };
}

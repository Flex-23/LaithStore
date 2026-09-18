import { z } from "zod";
import { GOVERNORATES } from "./constants";

/** True for image references we accept: absolute http(s) URLs or local uploads. */
export function isValidImageRef(value: string): boolean {
  if (value.startsWith("/uploads/")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

// Iraqi mobile format: 11 digits starting with 07 (e.g. 07701234567).
const phone = z
  .string()
  .trim()
  .regex(/^07\d{9}$/, "أدخل رقم هاتف صحيحاً (07XXXXXXXXX)");

const governorate = z.enum(GOVERNORATES, {
  message: "اختر المحافظة",
});

// Accepts an absolute http(s) URL or a locally uploaded image (/uploads/…).
const image = z
  .string()
  .trim()
  .refine(isValidImageRef, "أدخل رابط صورة صحيحاً أو ارفع صورة من الجهاز");

// --- Auth -------------------------------------------------------------------

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "الاسم قصير جداً").max(60, "الاسم طويل جداً"),
    phone,
    governorate,
    password: z.string().min(6, "6 أحرف على الأقل"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "كلمتا المرور غير متطابقتين",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  phone,
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

// --- Catalog ----------------------------------------------------------------

export const categorySchema = z.object({
  name: z.string().trim().min(2, "الاسم قصير جداً").max(60, "الاسم طويل جداً"),
  description: z
    .string()
    .trim()
    .min(2, "الوصف قصير جداً")
    .max(240, "الوصف طويل جداً"),
  image,
});

export const productSchema = z
  .object({
    name: z.string().trim().min(2, "الاسم قصير جداً").max(80, "الاسم طويل جداً"),
    description: z
      .string()
      .trim()
      .min(2, "الوصف قصير جداً")
      .max(300, "الوصف طويل جداً"),
    price: z.coerce.number().positive("السعر يجب أن يكون أكبر من صفر"),
    discountedPrice: z.coerce
      .number()
      .positive("سعر الخصم يجب أن يكون أكبر من صفر")
      .optional(),
    isDiscounted: z.coerce.boolean().optional(),
    image,
    stockQuantity: z.coerce
      .number()
      .int("الكمية يجب أن تكون عدداً صحيحاً")
      .min(0, "الكمية لا يمكن أن تكون سالبة"),
    categoryId: z.string().min(1, "اختر الفئة"),
  })
  .refine(
    (data) =>
      !data.isDiscounted ||
      (data.discountedPrice != null && data.discountedPrice < data.price),
    {
      message: "سعر الخصم يجب أن يكون أقل من السعر الأصلي",
      path: ["discountedPrice"],
    },
  );

export const orderStatusSchema = z.object({
  orderId: z.string().min(1),
  status: z.enum(["PENDING", "SHIPPED", "DELIVERED", "CANCELLED"]),
});

export const assignAgentSchema = z.object({
  orderId: z.string().min(1),
  // Empty string = unassign.
  agentId: z.string().trim(),
});

// --- Agents -----------------------------------------------------------------

const commissionPercent = z.coerce
  .number()
  .min(0, "النسبة لا يمكن أن تكون سالبة")
  .max(100, "النسبة لا يمكن أن تتجاوز 100%");

const agentPermissions = {
  canManageProducts: z.coerce.boolean(),
  canManageOrders: z.coerce.boolean(),
  canViewDashboard: z.coerce.boolean(),
  canManageHome: z.coerce.boolean(),
};

export const createAgentSchema = z.object({
  name: z.string().trim().min(2, "الاسم قصير جداً").max(60, "الاسم طويل جداً"),
  phone,
  governorate,
  password: z.string().min(6, "6 أحرف على الأقل"),
  commissionPercent,
  ...agentPermissions,
});

export const updateAgentSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(2, "الاسم قصير جداً").max(60, "الاسم طويل جداً"),
  phone,
  governorate,
  // Blank keeps the current password.
  password: z
    .string()
    .refine((v) => v === "" || v.length >= 6, "6 أحرف على الأقل"),
  commissionPercent,
  ...agentPermissions,
});

// --- Expenses ---------------------------------------------------------------

export const expenseSchema = z.object({
  amount: z.coerce.number().positive("أدخل مبلغاً أكبر من صفر"),
  // Either an agent id or "" (free-text recipient).
  agentId: z.string().trim(),
  recipientName: z.string().trim().max(80, "الاسم طويل جداً"),
  note: z.string().trim().max(240, "الملاحظة طويلة جداً"),
});

// --- Home page content ------------------------------------------------------

const shortText = (max: number) =>
  z.string().trim().min(1, "هذا الحقل مطلوب").max(max, "النص طويل جداً");

export const homeContentSchema = z.object({
  heroEyebrow: shortText(60),
  heroTitle: shortText(120),
  heroHighlight: z.string().trim().max(40, "النص طويل جداً"),
  heroSubtitle: shortText(240),
  heroCta: shortText(40),
  heroImage1: image,
  heroImage2: image,
  promoEyebrow: shortText(60),
  promoTitle: shortText(80),
  promoText: shortText(240),
  promoCta: shortText(40),
  promoImage: image,
});

export const checkoutItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().positive(),
});

export const checkoutSchema = z.object({
  items: z.array(checkoutItemSchema).min(1, "سلتك فارغة"),
});

/** Collapses a ZodError into a { field: firstMessage } map for form UIs. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !out[key]) out[key] = issue.message;
  }
  return out;
}

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;

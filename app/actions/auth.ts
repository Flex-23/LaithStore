"use server";

import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  createSession,
  destroySession,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { fieldErrors, loginSchema, registerSchema } from "@/lib/zod-schemas";

export type AuthState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

const DB_ERROR =
  "تعذّر الوصول إلى قاعدة البيانات. تأكد من تشغيل MySQL (XAMPP) وتطبيق المخطط.";

/**
 * Where to send a customer after signing in. Only same-site paths are honoured
 * so the `next` query param can't be abused for open redirects.
 */
function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

// --- Customers --------------------------------------------------------------

export async function registerAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    governorate: formData.get("governorate"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const { name, phone, governorate, password } = parsed.data;
  try {
    const user = await prisma.user.create({
      data: {
        name,
        phone,
        governorate,
        password: await hashPassword(password),
        role: "USER",
      },
    });
    await createSession({ id: user.id, name: user.name, role: user.role });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { fieldErrors: { phone: "هذا الرقم مسجّل مسبقاً" } };
    }
    return { error: DB_ERROR };
  }
  redirect(safeNext(formData.get("next")));
}

/** Customer sign-in. Admin accounts must use the separate admin page. */
export async function loginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    phone: formData.get("phone"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  let user;
  try {
    user = await prisma.user.findUnique({ where: { phone: parsed.data.phone } });
  } catch {
    return { error: DB_ERROR };
  }

  if (!user || !(await verifyPassword(parsed.data.password, user.password))) {
    return { error: "رقم الهاتف أو كلمة المرور غير صحيحة" };
  }
  if (user.role !== "USER") {
    return { error: "هذا الحساب خاص بالإدارة. استخدم صفحة دخول المدير." };
  }

  await createSession({ id: user.id, name: user.name, role: user.role });
  redirect(safeNext(formData.get("next")));
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

// --- Admin ------------------------------------------------------------------

/** Management sign-in for the admin and agents. Customer accounts are rejected. */
export async function adminLoginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    phone: formData.get("phone"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  let user;
  try {
    user = await prisma.user.findUnique({ where: { phone: parsed.data.phone } });
  } catch {
    return { error: DB_ERROR };
  }

  if (!user || !(await verifyPassword(parsed.data.password, user.password))) {
    return { error: "رقم الهاتف أو كلمة المرور غير صحيحة" };
  }
  if (user.role === "USER") {
    return { error: "هذا الحساب ليس حساب إدارة." };
  }
  if (!user.isActive) {
    return { error: "هذا الحساب موقوف. تواصل مع المدير." };
  }

  await createSession({ id: user.id, name: user.name, role: user.role });
  // /admin picks the first page this account is allowed to open.
  redirect("/admin");
}

export async function adminLogoutAction() {
  await destroySession();
  redirect("/admin/login");
}

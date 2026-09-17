import { getCurrentUser, requireUser } from "@/lib/auth";
import { CheckoutForm } from "@/components/checkout-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "إتمام الطلب" };

export default async function CheckoutPage() {
  // Customers only; visitors come back here after signing in.
  await requireUser("/checkout");

  const user = await getCurrentUser();
  const profile = user
    ? { name: user.name, phone: user.phone, governorate: user.governorate }
    : null;

  return <CheckoutForm profile={profile} />;
}

// Shared, framework-agnostic constants.

export const APP_NAME = "تقنيتي";
export const APP_TAGLINE = "التقنية الحديثة بين يديك";

// Currency label (Iraqi dinar). Digits are always rendered in Latin numerals.
export const CURRENCY = "د.ع";

// Shipping (in IQD).
export const FREE_SHIPPING_THRESHOLD = 100_000;
export const SHIPPING_FLAT = 5_000;

// Governorates offered at checkout / registration.
export const GOVERNORATES = [
  "بغداد",
  "البصرة",
  "نينوى",
  "أربيل",
  "السليمانية",
  "كركوك",
  "النجف",
  "كربلاء",
  "الأنبار",
  "ديالى",
  "واسط",
  "ميسان",
  "بابل",
  "ذي قار",
  "صلاح الدين",
  "دهوك",
  "المثنى",
  "القادسية",
] as const;

export type Governorate = (typeof GOVERNORATES)[number];

export const ORDER_STATUSES = [
  "PENDING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
] as const;

export type OrderStatusValue = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatusValue, string> = {
  PENDING: "قيد الانتظار",
  SHIPPED: "قيد التوصيل",
  DELIVERED: "تم التسليم",
  CANCELLED: "مرفوض",
  RETURNED: "تم استلام المرفوض",
};

export function statusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status as OrderStatusValue] ?? status;
}

// How many products to show per category on the grouped products page.
export const PRODUCTS_PER_CATEGORY = 5;

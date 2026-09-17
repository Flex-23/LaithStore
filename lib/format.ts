import { CURRENCY } from "./constants";

// Latin digits with English-style thousands separators (e.g. 1,250,000).
const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export function formatNumber(value: number): string {
  return number.format(value);
}

/** e.g. "125,000 د.ع" */
export function formatPrice(value: number): string {
  return `${number.format(value)} ${CURRENCY}`;
}

/**
 * Arabic date/time with Latin numerals, e.g. "13 سبتمبر 2026، 9:27 م".
 * A spelled-out month keeps the bidi order stable inside RTL text
 * (numeric "13/09/2026" gets visually scrambled).
 */
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("ar-IQ", {
    numberingSystem: "latn",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

/** Percentage saved when a discount is active (rounded). */
export function discountPercent(price: number, discounted: number): number {
  if (price <= 0 || discounted >= price) return 0;
  return Math.round(((price - discounted) / price) * 100);
}

/** The price a customer actually pays. */
export function effectivePrice(product: {
  price: number;
  discountedPrice: number | null;
  isDiscounted: boolean;
}): number {
  return product.isDiscounted && product.discountedPrice != null
    ? product.discountedPrice
    : product.price;
}

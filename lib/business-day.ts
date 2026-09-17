// A "business day" runs from 02:00 to 02:00 (next calendar day) Baghdad time.
// Sales placed at 01:30 on the 14th therefore still count toward the 13th.
// Iraq has no daylight-saving time, so a fixed UTC+3 offset is exact.

const TZ_OFFSET_MS = 3 * 60 * 60 * 1000; // Asia/Baghdad
const DAY_START_HOUR = 2;
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export const BUSINESS_DAY_START_HOUR = DAY_START_HOUR;

/** `YYYY-MM-DD` (Baghdad calendar date) of the business day containing `at`. */
export function businessDayKey(at: Date): string {
  // Shift to Baghdad wall-clock, then back by the 02:00 boundary so the UTC
  // getters yield the labelled calendar date.
  const shifted = new Date(
    at.getTime() + TZ_OFFSET_MS - DAY_START_HOUR * HOUR_MS,
  );
  return shifted.toISOString().slice(0, 10);
}

/** `YYYY-MM` of the business month containing `at`. */
export function businessMonthKey(at: Date): string {
  return businessDayKey(at).slice(0, 7);
}

/** UTC instant at which the business day labelled `key` (YYYY-MM-DD) starts. */
export function businessDayStart(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, DAY_START_HOUR) - TZ_OFFSET_MS);
}

/** UTC instant at which the business month labelled `key` (YYYY-MM) starts. */
export function businessMonthStart(key: string): Date {
  return businessDayStart(`${key}-01`);
}

export type Range = { start: Date; end: Date };

/** [start, end) of the business day containing `at`. */
export function currentBusinessDay(at = new Date()): Range & { key: string } {
  const key = businessDayKey(at);
  const start = businessDayStart(key);
  return { key, start, end: new Date(start.getTime() + DAY_MS) };
}

/** [start, end) of the business month containing `at`. */
export function currentBusinessMonth(at = new Date()): Range & { key: string } {
  const key = businessMonthKey(at);
  const [y, m] = key.split("-").map(Number);
  const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
  return { key, start: businessMonthStart(key), end: businessMonthStart(next) };
}

/** Keys of the last `count` business days, newest first, ending with today. */
export function recentBusinessDayKeys(count: number, at = new Date()): string[] {
  const { start } = currentBusinessDay(at);
  const keys: string[] = [];
  for (let i = 0; i < count; i++) {
    keys.push(businessDayKey(new Date(start.getTime() - i * DAY_MS + HOUR_MS)));
  }
  return keys;
}

/** Keys of the last `count` business months, newest first, ending with this month. */
export function recentBusinessMonthKeys(count: number, at = new Date()): string[] {
  const [y0, m0] = businessMonthKey(at).split("-").map(Number);
  const keys: string[] = [];
  for (let i = 0; i < count; i++) {
    const idx = y0 * 12 + (m0 - 1) - i;
    const y = Math.floor(idx / 12);
    const m = (idx % 12) + 1;
    keys.push(`${y}-${String(m).padStart(2, "0")}`);
  }
  return keys;
}

// --- Labels -----------------------------------------------------------------

const dayLabel = new Intl.DateTimeFormat("ar-IQ", {
  numberingSystem: "latn",
  timeZone: "UTC",
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const monthLabel = new Intl.DateTimeFormat("ar-IQ", {
  numberingSystem: "latn",
  timeZone: "UTC",
  month: "long",
  year: "numeric",
});

/** e.g. "السبت، 13 أيلول 2026" */
export function formatDayKey(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  return dayLabel.format(new Date(Date.UTC(y, m - 1, d)));
}

/** e.g. "أيلول 2026" */
export function formatMonthKey(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return monthLabel.format(new Date(Date.UTC(y, m - 1, 1)));
}

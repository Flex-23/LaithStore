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
  return businessDayRange(businessDayKey(at));
}

/** [start, end) of the business day labelled `key` (YYYY-MM-DD). */
export function businessDayRange(key: string): Range & { key: string } {
  const start = businessDayStart(key);
  return { key, start, end: new Date(start.getTime() + DAY_MS) };
}

/** [start, end) of the business month labelled `key` (YYYY-MM). */
export function businessMonthRange(key: string): Range & { key: string } {
  const [y, m] = key.split("-").map(Number);
  const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
  return { key, start: businessMonthStart(key), end: businessMonthStart(next) };
}

/** [start, end) of the business month containing `at`. */
export function currentBusinessMonth(at = new Date()): Range & { key: string } {
  return businessMonthRange(businessMonthKey(at));
}

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_KEY = /^\d{4}-\d{2}$/;

export function isDayKey(value: string | undefined): value is string {
  return !!value && DAY_KEY.test(value) && !Number.isNaN(businessDayStart(value).getTime());
}

export function isMonthKey(value: string | undefined): value is string {
  return !!value && MONTH_KEY.test(value) && !Number.isNaN(businessMonthStart(value).getTime());
}

/** All business-day keys inside a business month, newest first. */
export function businessDayKeysOfMonth(monthKey: string): string[] {
  const { start, end } = businessMonthRange(monthKey);
  const keys: string[] = [];
  for (let t = start.getTime(); t < end.getTime(); t += DAY_MS) {
    keys.push(businessDayKey(new Date(t + HOUR_MS)));
  }
  return keys.reverse();
}

/**
 * Month keys from `fromKey` up to the current business month, newest first.
 * Used to offer an archive of past months.
 */
export function businessMonthKeysSince(fromKey: string, at = new Date()): string[] {
  const [fy, fm] = fromKey.split("-").map(Number);
  const [ty, tm] = businessMonthKey(at).split("-").map(Number);
  const count = Math.max(1, (ty * 12 + tm) - (fy * 12 + fm) + 1);
  return recentBusinessMonthKeys(count, at);
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

// --- URL params -------------------------------------------------------------

/** `?month=all` — no date filter. */
export const ALL_PERIODS = "all";

export type MonthSelection = {
  /** Month key or ALL_PERIODS. */
  key: string;
  /** Undefined when every period is selected. */
  range?: Range;
  label: string;
};

/** Resolves a `?month=` param: a valid key, "all", or (default) the current month. */
export function resolveMonthParam(value: string | undefined): MonthSelection {
  if (value === ALL_PERIODS) return { key: ALL_PERIODS, label: "كل الفترات" };
  const key = isMonthKey(value) ? value : businessMonthKey(new Date());
  return { key, range: businessMonthRange(key), label: formatMonthKey(key) };
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

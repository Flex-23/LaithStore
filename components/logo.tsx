import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

/**
 * The globe mark from the brand: a teal globe wrapped by a pink orbit with
 * two pink satellites. Inherits the teal from `currentColor`.
 */
export function GlobeMark({
  size = 28,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      {/* globe */}
      <circle cx="20" cy="20" r="10.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <path
        d="M9.5 20h21M20 9.5c-3.8 3.4-3.8 17.6 0 21M20 9.5c3.8 3.4 3.8 17.6 0 21M11.5 14.5h17M11.5 25.5h17"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* orbit + satellites in the accent pink */}
      <ellipse
        cx="20"
        cy="20"
        rx="17.5"
        ry="6.5"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2.2"
        transform="rotate(-22 20 20)"
      />
      <circle cx="35.5" cy="12.5" r="2.7" fill="var(--accent)" />
      <circle cx="4.5" cy="27.5" r="2.7" fill="var(--accent)" />
    </svg>
  );
}

const SIZES = {
  sm: { mark: 26, text: "text-xl" },
  md: { mark: 32, text: "text-2xl" },
  lg: { mark: 56, text: "text-5xl" },
} as const;

/**
 * Brand lockup: globe mark + the "تقنيتي" wordmark, with the pink dot trio
 * that finishes the logotype. Wraps in a link when `href` is given.
 */
export function Logo({
  size = "md",
  href,
  className = "",
}: {
  size?: keyof typeof SIZES;
  href?: string;
  className?: string;
}) {
  const s = SIZES[size];
  const lockup = (
    <span className={`inline-flex items-center gap-2 text-brand ${className}`}>
      <GlobeMark size={s.mark} className="shrink-0" />
      <span className={`wordmark ${s.text}`}>{APP_NAME}</span>
      <span className="flex gap-1 self-end pb-1" aria-hidden="true">
        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
      </span>
    </span>
  );
  return href ? (
    <Link href={href} aria-label={APP_NAME} className="inline-flex">
      {lockup}
    </Link>
  ) : (
    lockup
  );
}

"use client";

import Image from "next/image";
import { useState } from "react";
import { PackageIcon } from "./icons";

type Props = {
  src: string;
  alt: string;
  /** Sizing/aspect classes for the wrapper box (must define a height). */
  className?: string;
  sizes?: string;
  priority?: boolean;
};

/**
 * Remote-image wrapper with a loading shimmer and a graceful fallback when a
 * URL fails to load (product/category images are arbitrary admin URLs).
 */
export function SmartImage({ src, alt, className = "", sizes, priority }: Props) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(
    "loading",
  );

  return (
    <div className={`relative overflow-hidden bg-surface-2 ${className}`}>
      {status !== "error" ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes ?? "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"}
          priority={priority}
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus("error")}
          className={`object-cover transition-[transform,filter,opacity] duration-700 ${
            status === "loaded"
              ? "scale-100 opacity-100 blur-0"
              : "scale-105 opacity-0 blur-md"
          }`}
        />
      ) : (
        <div className="grid h-full w-full place-items-center text-muted">
          <PackageIcon width={28} height={28} />
        </div>
      )}
      {status === "loading" && <div className="shimmer absolute inset-0" />}
    </div>
  );
}

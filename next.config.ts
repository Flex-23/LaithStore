import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Product/category images are supplied as arbitrary URLs by admins,
    // so allow optimization of any remote host. Local uploads (/uploads/…)
    // need no configuration.
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  experimental: {
    serverActions: {
      // Admin forms may include an uploaded image (max 4 MB, see lib/upload.ts).
      bodySizeLimit: "5mb",
    },
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /** Browsers and proxies often request `/favicon.ico`; static hosts may only expose `public/`. */
  async rewrites() {
    return [
      { source: "/favicon.ico", destination: "/favicon.svg" },
      { source: "/icon.svg", destination: "/favicon.svg" },
    ];
  },
};

export default nextConfig;

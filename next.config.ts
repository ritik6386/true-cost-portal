import type { NextConfig } from "next";

const rawBackendUrl = process.env.BACKEND_URL || "http://127.0.0.1:8000";
const BACKEND_URL = rawBackendUrl.replace(/\/+$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;

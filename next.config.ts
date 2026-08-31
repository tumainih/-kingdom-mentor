import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  outputFileTracingIncludes: {
    "/api/chat": ["./data/**/*"],
    "/api/status": ["./data/**/*"],
    "/api/hourly-verse": ["./data/**/*"],
  },
};

export default nextConfig;

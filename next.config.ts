import type { NextConfig } from "next";

const isVercel = process.env.VERCEL === "1";

const nextConfig: NextConfig = {
  ...(isVercel ? {} : { output: "standalone" }),

  allowedDevOrigins: [
    "192.168.1.107",
    "192.168.1.106",
  ],
};

export default nextConfig;
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  allowedDevOrigins: [
    "192.168.1.107",
    "192.168.1.106",
  ],
};

export default nextConfig;
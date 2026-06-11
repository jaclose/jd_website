import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "jafardabbagh.wordpress.com" },
      { protocol: "https", hostname: "*.wp.com" },
    ],
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "jafardabbagh.wordpress.com" },
      { protocol: "https", hostname: "*.wp.com" },
    ],
  },
  async redirects() {
    // 301s from old WordPress URLs to their new homes. The known mapping is
    // the earthquake post → the Fault Lines and Failures survey (a PDF).
    // WordPress.com permalinks were likely date-prefixed (/YYYY/MM/DD/slug/);
    // both the bare slug and a couple of common date forms are covered. Paste
    // any remaining old→new pairs into the array below — they take effect on
    // the next deploy.
    return [
      {
        source: "/evaluating-earthquake-preparedness-in-turkey-and-syria",
        destination: "/works/fault-lines-and-failures.pdf",
        permanent: true,
      },
      {
        source: "/:year(\\d{4})/:month(\\d{2})/:day(\\d{2})/evaluating-earthquake-preparedness-in-turkey-and-syria",
        destination: "/works/fault-lines-and-failures.pdf",
        permanent: true,
      },
      // ── paste remaining old WordPress slug → new path pairs here ──
      // { source: "/old-wordpress-slug", destination: "/essays/new-slug", permanent: true },
      // { source: "/2025/02/11/hello-world", destination: "/essays/hello-world", permanent: true },
    ];
  },
};

export default nextConfig;

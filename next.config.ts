import type { NextConfig } from "next";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

/** short commit SHA — Vercel provides it as an env var; locally read git. */
function commitSha(): string {
  if (process.env.VERCEL_GIT_COMMIT_SHA) return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7);
  try {
    return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return "local";
  }
}

/**
 * Old WordPress permalinks → their new homes. When jafardabbagh.com moved to
 * Vercel (and the WordPress blog went private), every link shared before the
 * migration — /YYYY/MM/DD/slug/, bare /slug/, the feed, archives — started
 * 404ing. Generated from the content JSON, so new imports are covered too.
 */
function legacyWordPressRedirects() {
  const read = (file: string) =>
    JSON.parse(readFileSync(path.join(__dirname, "content", file), "utf8")) as { slug: string }[];
  const dated = "/:year(\\d{4})/:month(\\d{2})/:day(\\d{2})";
  const to = (source: string, destination: string) => ({ source, destination, permanent: true });

  return [
    ...read("essays.json").flatMap(({ slug }) => [to(`${dated}/${slug}`, `/essays/${slug}`), to(`/${slug}`, `/essays/${slug}`)]),
    ...read("field-notes.json").flatMap(({ slug }) => [
      to(`${dated}/${slug}`, `/field-notes#${slug}`),
      to(`/${slug}`, `/field-notes#${slug}`),
    ]),
    // WordPress chrome: feed, archives, taxonomy, author pages
    to("/feed", "/feed.xml"),
    to("/comments/feed", "/feed.xml"),
    to("/blog", "/essays"),
    to("/category/:path*", "/essays"),
    to("/tag/:path*", "/essays"),
    to("/:year(\\d{4})/:month(\\d{2})", "/essays"),
    to("/:year(\\d{4})", "/essays"),
    to("/author/:path*", "/about"),
    to("/about-me", "/about"),
  ];
}

const nextConfig: NextConfig = {
  // a stray lockfile in the home directory makes Next guess the wrong
  // workspace root — pin it so builds stop warning and trace correctly
  outputFileTracingRoot: __dirname,
  // build identity, surfaced on /garden (always in dev, ?debug=1 in production)
  env: {
    NEXT_PUBLIC_COMMIT_SHA: commitSha(),
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
    NEXT_PUBLIC_DEPLOY_ENV: process.env.VERCEL_ENV || "development",
  },
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
      ...legacyWordPressRedirects(),
    ];
  },
};

export default nextConfig;

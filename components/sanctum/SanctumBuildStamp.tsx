"use client";
import { useEffect, useState } from "react";

/**
 * Production-truth stamp. Shows the exact build that is live so deployment state
 * is never a matter of faith: commit SHA, build time, and mode. Always visible in
 * development; in production it appears only with `/garden?debug=1`. Values are
 * inlined at build time from next.config.ts (Vercel commit SHA + env, or local
 * git).
 */
const SHA = process.env.NEXT_PUBLIC_COMMIT_SHA ?? "unknown";
const BUILT = process.env.NEXT_PUBLIC_BUILD_TIME ?? "";
const ENV = process.env.NEXT_PUBLIC_DEPLOY_ENV ?? "development";

export default function SanctumBuildStamp() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const debug = new URLSearchParams(window.location.search).has("debug");
    setShow(process.env.NODE_ENV !== "production" || debug);
  }, []);

  if (!show) return null;

  const built = BUILT ? BUILT.replace("T", " ").slice(0, 16) + "Z" : "—";
  return (
    <div className="pointer-events-none absolute bottom-3 left-3 z-30 select-none font-mono text-[10px] leading-[1.5] text-leaf/70 [text-shadow:0_1px_6px_rgba(3,8,5,0.9)]">
      <div>SANCTUM_BUILD: {built}</div>
      <div>COMMIT: {SHA}</div>
      <div>MODE: {ENV}</div>
    </div>
  );
}

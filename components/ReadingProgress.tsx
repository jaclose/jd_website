"use client";
import { useEffect, useRef } from "react";
import { unlockVisitor } from "@/lib/visitor";

/**
 * Hairline of starlight under the header that fills as you read.
 * Reaching the very end of a piece quietly earns the Deep Reader
 * visitor achievement.
 */
export default function ReadingProgress() {
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let earned = false;
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const k = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      if (bar.current) bar.current.style.transform = `scaleX(${k})`;
      if (!earned && k > 0.96) {
        earned = true;
        unlockVisitor("deep-reader");
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed inset-x-0 top-15 z-30 h-px bg-transparent">
      <div
        ref={bar}
        className="h-px origin-left bg-linear-to-r from-starlight/40 to-starlight"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}

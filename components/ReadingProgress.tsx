"use client";
import { useEffect, useRef } from "react";

/** Hairline of starlight under the header that fills as you read. */
export default function ReadingProgress() {
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const k = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      if (bar.current) bar.current.style.transform = `scaleX(${k})`;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed inset-x-0 top-[60px] z-30 h-px bg-transparent">
      <div
        ref={bar}
        className="h-px origin-left bg-gradient-to-r from-starlight/40 to-starlight"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}

"use client";
import { useEffect, useRef, useState } from "react";

/**
 * 2.5D fallback for weak devices, no-WebGL, and prefers-reduced-motion. A
 * layered parallax still of the Threshold — the emotional core of the journey:
 * a dark interior framing a bright doorway that opens onto the dawn forest. No
 * canvas, no animation under reduced-motion; only a faint pointer parallax
 * otherwise. Communicates the whole arc (disorder → restoration) in one frame.
 */
export default function SanctumFallback({
  reducedMotion = false,
  reason,
}: {
  reducedMotion?: boolean;
  reason?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [p, setP] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (reducedMotion) return;
    const el = ref.current;
    if (!el) return;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      setP({
        x: ((e.clientX - r.left) / r.width - 0.5) * 2,
        y: ((e.clientY - r.top) / r.height - 0.5) * 2,
      });
    };
    el.addEventListener("pointermove", onMove);
    return () => el.removeEventListener("pointermove", onMove);
  }, [reducedMotion]);

  const shift = (depth: number) => ({
    transform: reducedMotion
      ? undefined
      : `translate3d(${p.x * depth}px, ${p.y * depth * 0.6}px, 0)`,
    transition: "transform 0.4s cubic-bezier(0.22,1,0.36,1)",
  });

  return (
    <div ref={ref} className="relative h-svh w-full overflow-hidden bg-space-deep">
      {/* dawn forest glimpsed through the doorway */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 38%, #5a4a2e 0%, #2f3a26 32%, #121a14 60%, #06070b 100%)",
          ...shift(-14),
        }}
      />
      {/* far tree silhouettes */}
      <svg aria-hidden viewBox="0 0 1200 800" className="absolute inset-0 h-full w-full" style={shift(-8)}>
        <g fill="#0b110d">
          {Array.from({ length: 14 }).map((_, i) => {
            const x = 80 + i * 80 + (i % 3) * 14;
            const h = 230 + ((i * 53) % 160);
            return <path key={i} d={`M${x} 800 L${x} ${800 - h} L${x + 5} ${800 - h - 28} L${x + 10} ${800 - h} L${x + 10} 800 Z`} />;
          })}
        </g>
      </svg>
      {/* warm light spilling from the doorway */}
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 h-[58%] w-[34%] -translate-x-1/2 -translate-y-1/2"
        style={{
          background: "radial-gradient(60% 80% at 50% 45%, rgba(212,184,134,0.5), rgba(212,184,134,0.06) 60%, transparent 75%)",
          ...shift(-4),
        }}
      />
      {/* the dark interior frame (the room) cut by a doorway */}
      <div aria-hidden className="absolute inset-0" style={shift(6)}>
        <div className="absolute inset-y-0 left-0 w-[33%] bg-space-deep [box-shadow:40px_0_80px_-20px_rgba(0,0,0,0.9)_inset]" />
        <div className="absolute inset-y-0 right-0 w-[33%] bg-space-deep [box-shadow:-40px_0_80px_-20px_rgba(0,0,0,0.9)_inset]" />
        <div className="absolute inset-x-0 top-0 h-[16%] bg-space-deep" />
        <div className="absolute inset-x-0 bottom-0 h-[10%] bg-space-deep" />
      </div>
      {/* faint cable-vine tendrils crossing the doorway */}
      <svg aria-hidden viewBox="0 0 1200 800" className="absolute inset-0 h-full w-full opacity-40" style={shift(10)}>
        <g fill="none" stroke="#1a2a3a" strokeWidth="2.5" strokeLinecap="round">
          <path d="M400 0 C 430 180, 380 320, 440 520" />
          <path d="M800 0 C 770 160, 820 300, 760 540" />
          <path d="M410 800 C 460 640, 520 600, 560 520" />
        </g>
      </svg>
      {/* static fireflies */}
      {!reducedMotion &&
        Array.from({ length: 9 }).map((_, i) => (
          <span
            key={i}
            aria-hidden
            className="absolute h-1 w-1 rounded-full bg-starlight"
            style={{
              left: `${42 + ((i * 37) % 18)}%`,
              top: `${36 + ((i * 53) % 30)}%`,
              opacity: 0.5,
              boxShadow: "0 0 8px 2px rgba(212,184,134,0.6)",
              ...shift(-2),
            }}
          />
        ))}

      {/* copy */}
      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center px-6 pb-16 text-center">
        <p className="label mb-3 text-leaf/80">A place between disorder and restoration</p>
        <h1 className="font-display text-[clamp(2.4rem,6vw,4.5rem)] font-light leading-none text-ink [text-shadow:0_2px_30px_rgba(3,8,5,0.9)]">
          The Sanctum
        </h1>
        <p className="mt-4 max-w-md font-serif text-lg leading-relaxed text-[rgba(232,230,225,0.82)]">
          The room of entanglement gives way to a threshold, and the threshold to
          a cultivated world. This is the decision to keep tending.
        </p>
        {reason ? (
          <p className="label mt-6 text-[7px]! text-dim">{reason}</p>
        ) : null}
      </div>
    </div>
  );
}

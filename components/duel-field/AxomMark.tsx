"use client";

/**
 * AXOM brand marks, reproduced as vectors from axom.info.
 *
 * Both are stroke/fill geometry rather than raster assets, so they stay crisp
 * at card size and inherit `currentColor` from whatever zone they sit in.
 */

export function AxomWordmark({ className = "", title = "AXOM" }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 410 92"
      role="img"
      aria-label={title}
      focusable="false"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={9}
      strokeLinecap="round"
      strokeLinejoin="round"
      vectorEffect="non-scaling-stroke"
    >
      {/* A — apex at 52,20 */}
      <path d="M22 82 52 20 82 82" />
      {/* X — two crossing strokes */}
      <path d="M122 20l56 62" />
      <path d="M178 20l-56 62" />
      {/* O — open ring */}
      <circle cx="251" cy="51" r="31" />
      {/* M — squared vee */}
      <path d="M332 82V20l25 39 25-39v62" />
    </svg>
  );
}

export function AxomGlyph({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="currentColor" aria-hidden="true" focusable="false" className={className}>
      {/* chevron crown */}
      <polygon points="50,4 71,46 63,49 50,22 37,49 29,46" />
      {/* axis diamond */}
      <polygon points="50,50 59,60 50,70 41,60" />
      {/* diverging legs */}
      <polygon points="33,58 39,62 29,94 22,91" />
      <polygon points="67,58 61,62 71,94 78,91" />
    </svg>
  );
}

/** Card art fallback: the glyph on a field of concentric rings. */
export function AxomCardArt({ className = "" }: { className?: string }) {
  return (
    <div className={`relative grid h-full w-full place-items-center overflow-hidden ${className}`}>
      <svg viewBox="0 0 200 200" aria-hidden="true" className="absolute inset-0 h-full w-full opacity-40">
        <defs>
          <radialGradient id="axom-halo" cx="50%" cy="42%" r="62%">
            <stop offset="0%" stopColor="rgba(200,169,106,0.34)" />
            <stop offset="100%" stopColor="rgba(200,169,106,0)" />
          </radialGradient>
        </defs>
        <rect width="200" height="200" fill="url(#axom-halo)" />
        {[28, 46, 64, 82].map((r) => (
          <circle
            key={r}
            cx="100"
            cy="92"
            r={r}
            fill="none"
            stroke="rgba(200,169,106,0.22)"
            strokeWidth="0.6"
            strokeDasharray={r % 36 === 10 ? "2 5" : undefined}
          />
        ))}
        <line x1="0" y1="92" x2="200" y2="92" stroke="rgba(200,169,106,0.14)" strokeWidth="0.6" />
        <line x1="100" y1="0" x2="100" y2="200" stroke="rgba(200,169,106,0.14)" strokeWidth="0.6" />
      </svg>
      <AxomGlyph className="relative h-[46%] w-[46%] text-[#c8a96a] drop-shadow-[0_0_18px_rgba(200,169,106,0.45)]" />
    </div>
  );
}

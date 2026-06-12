/**
 * Typographic cover for writing that has no featured image on the source
 * site — we never borrow another piece's artwork. A dark plate with the
 * piece's initial as a celestial body and its designation in the corner.
 */
export default function FallbackCover({
  title,
  index,
  className = "",
}: {
  title: string;
  index?: string;
  className?: string;
}) {
  const initial = title.replace(/^The /i, "").charAt(0).toUpperCase();
  return (
    <div
      aria-hidden
      className={`relative flex h-full w-full items-center justify-center overflow-hidden bg-[#0a0c14] ${className}`}
    >
      {/* orbit ring */}
      <span className="absolute h-[72%] w-[72%] rounded-full border border-[rgba(212,184,134,0.18)]" />
      <span className="absolute h-[46%] w-[46%] rounded-full border border-[rgba(232,230,225,0.07)]" />
      {/* the body */}
      <span className="font-display text-[clamp(3rem,9vw,6rem)] font-light text-starlight/85">
        {initial}
      </span>
      {/* a small moon on the ring */}
      <span className="absolute left-[18%] top-[26%] h-1.5 w-1.5 rounded-full bg-starlight/70 shadow-[0_0_10px_2px_rgba(212,184,134,0.4)]" />
      {index && (
        <span className="label absolute bottom-3 left-4 text-[8px]! tracking-[0.3em]! text-dim">
          {index}
        </span>
      )}
      <span className="absolute inset-0 bg-linear-to-t from-space/60 to-transparent" />
    </div>
  );
}

import { achievements } from "@/data/achievements";

/**
 * The GLD-7 cluster, charted. Each achievement is a star; the unlocked
 * ones burn bright and are joined by the survey line, in the order they
 * were earned. Locked stars wait at the chart's edge of knowledge.
 */
const POS: Record<string, [number, number]> = {
  "first-light": [52, 196],
  pentaglyph: [128, 158],
  dispatcher: [104, 96],
  "first-canopy": [186, 116],
  terraformer: [242, 64],
  hydrosphere: [310, 104],
  "decade-ring": [300, 30],
  correspondent: [372, 62],
};

export default function ConstellationMap() {
  const unlocked = achievements.filter((a) => a.unlocked);
  const path = unlocked
    .map((a) => POS[a.id])
    .filter(Boolean)
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`)
    .join(" ");
  // dashed continuation from the last lit star toward the next locked one
  const lastLit = POS[unlocked[unlocked.length - 1]?.id];
  const nextDark = achievements.find((a) => !a.unlocked);

  return (
    <figure className="mx-auto max-w-2xl">
      <svg viewBox="0 0 420 240" className="w-full" role="img" aria-label="Achievement constellation chart">
        {/* survey grid */}
        {[60, 120, 180].map((y) => (
          <line key={y} x1="0" y1={y} x2="420" y2={y} stroke="rgba(232,230,225,0.04)" />
        ))}
        {[105, 210, 315].map((x) => (
          <line key={x} x1={x} y1="0" x2={x} y2="240" stroke="rgba(232,230,225,0.04)" />
        ))}

        {/* the line already travelled */}
        <path d={path} fill="none" stroke="rgba(212,184,134,0.4)" strokeWidth="1" />
        {/* the line still to draw */}
        {lastLit && nextDark && POS[nextDark.id] && (
          <line
            x1={lastLit[0]}
            y1={lastLit[1]}
            x2={POS[nextDark.id][0]}
            y2={POS[nextDark.id][1]}
            stroke="rgba(232,230,225,0.14)"
            strokeWidth="1"
            strokeDasharray="3 5"
          />
        )}

        {achievements.map((a) => {
          const p = POS[a.id];
          if (!p) return null;
          const [x, y] = p;
          return (
            <g key={a.id}>
              {a.unlocked ? (
                <>
                  <circle cx={x} cy={y} r="7" fill="rgba(212,184,134,0.16)" />
                  <circle cx={x} cy={y} r="2.6" fill="#d4b886" />
                </>
              ) : (
                <circle
                  cx={x}
                  cy={y}
                  r="2.6"
                  fill="none"
                  stroke="rgba(232,230,225,0.3)"
                  strokeDasharray="1.5 1.5"
                />
              )}
              <text
                x={x}
                y={y + 17}
                textAnchor="middle"
                className="font-mono"
                fontSize="6.5"
                letterSpacing="0.12em"
                fill={a.unlocked ? "rgba(212,184,134,0.75)" : "rgba(91,96,106,0.8)"}
              >
                {a.title.toUpperCase()}
              </text>
              <title>{a.unlocked ? a.description : a.condition}</title>
            </g>
          );
        })}
      </svg>
      <figcaption className="label mt-4 text-center text-[8px]! text-dim">
        GLD-7 CLUSTER · SURVEY CHART · THE LINE GROWS WITH THE WORK
      </figcaption>
    </figure>
  );
}

import type { Skill } from "@/data/garden";

/**
 * Procedural tree, drawn deterministically from the skill's id.
 * Growth stage controls recursion depth and foliage:
 * 0 seed · 1 sprout · 2 sapling · 3 young · 4 grown · 5 flourishing
 *
 * Branches are curved and tapered; the canopy is layered in three
 * tones over a soft mass, lit from the upper left. `ghost` renders
 * the same tree as a faint survey drawing — used for stage previews.
 */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashId(id: string) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

interface Limb {
  d: string;
  w: number;
}
interface Tip {
  x: number;
  y: number;
}

function grow(
  rnd: () => number,
  x: number,
  y: number,
  angle: number,
  len: number,
  width: number,
  depth: number,
  limbs: Limb[],
  tips: Tip[]
) {
  // curved limb: quadratic bezier with a sideways bow
  const bend = (rnd() - 0.5) * 0.5;
  const mx = x + Math.cos(angle + bend) * len * 0.55;
  const my = y - Math.sin(angle + bend) * len * 0.55;
  const x2 = x + Math.cos(angle) * len;
  const y2 = y - Math.sin(angle) * len;
  limbs.push({
    d: `M${x.toFixed(1)},${y.toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`,
    w: width,
  });
  if (depth <= 0) {
    tips.push({ x: x2, y: y2 });
    return;
  }
  const splits = rnd() > 0.6 ? 3 : 2;
  for (let i = 0; i < splits; i++) {
    const spread = (i - (splits - 1) / 2) * (0.5 + rnd() * 0.3);
    grow(
      rnd,
      x2,
      y2,
      angle + spread + (rnd() - 0.5) * 0.24,
      len * (0.64 + rnd() * 0.16),
      width * 0.58,
      depth - 1,
      limbs,
      tips
    );
  }
}

export default function TreeGlyph({
  skill,
  height = 180,
  className = "",
  ghost = false,
}: {
  skill: Pick<Skill, "id" | "stage">;
  height?: number;
  className?: string;
  ghost?: boolean;
}) {
  const W = 160;
  const H = 190;
  const groundY = 176;
  const rnd = mulberry32(hashId(skill.id));
  const limbs: Limb[] = [];
  const tips: Tip[] = [];
  const stage = skill.stage;

  if (stage >= 2) {
    const depth = stage; // 2..5
    const trunkLen = 26 + stage * 13;
    grow(
      rnd,
      W / 2,
      groundY,
      Math.PI / 2 + (rnd() - 0.5) * 0.12,
      trunkLen,
      2.5 + stage * 1.3,
      depth,
      limbs,
      tips
    );
  }

  // canopy centroid + radius for the soft mass behind the leaf clusters
  const cx = tips.length ? tips.reduce((s, t) => s + t.x, 0) / tips.length : W / 2;
  const cy = tips.length ? tips.reduce((s, t) => s + t.y, 0) / tips.length : 0;
  const cr = tips.length
    ? Math.max(...tips.map((t) => Math.hypot(t.x - cx, t.y - cy))) + 8
    : 0;

  const ink = "rgba(232,230,225,0.34)";
  const bark = ghost ? ink : "#9b8164";
  const barkShade = ghost ? ink : "#6e5a44";
  const showLeaves = stage >= 3;
  const blossom = stage >= 5;
  const leafTones = ghost
    ? [ink, ink, ink]
    : stage >= 4
      ? ["#3d5c38", "#5d8b54", "#9fce8f"]
      : ["#39523a", "#52744c", "#7aa56e"];

  // deterministic per-tip leaf clusters
  const leafRnd = mulberry32(hashId(skill.id) ^ 0x9e3779b9);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      height={height}
      width={(height * W) / H}
      className={className}
      aria-hidden
    >
      {/* ground */}
      <line
        x1={14}
        y1={groundY}
        x2={W - 14}
        y2={groundY}
        stroke="rgba(232,230,225,0.18)"
        strokeWidth="1"
        strokeDasharray={ghost ? "2 5" : undefined}
      />

      {stage === 0 && (
        // a seed, resting in a shallow furrow
        <g>
          <path
            d={`M${W / 2 - 11},${groundY} Q${W / 2},${groundY + 8} ${W / 2 + 11},${groundY}`}
            stroke="rgba(232,230,225,0.25)"
            fill="none"
          />
          <ellipse
            cx={W / 2}
            cy={groundY - 3}
            rx={4.5}
            ry={6.5}
            fill={ghost ? ink : "#b88d5c"}
            transform={`rotate(18 ${W / 2} ${groundY - 3})`}
          />
          {!ghost && (
            <ellipse
              cx={W / 2 - 1.4}
              cy={groundY - 4.6}
              rx={1.6}
              ry={2.6}
              fill="#d8b288"
              opacity={0.8}
              transform={`rotate(18 ${W / 2} ${groundY - 3})`}
            />
          )}
        </g>
      )}

      {stage === 1 && (
        // a sprout: curved stem, two filled cotyledon leaves
        <g>
          <path
            d={`M${W / 2},${groundY} C${W / 2 - 2},${groundY - 14} ${W / 2 + 2},${groundY - 20} ${W / 2},${groundY - 30}`}
            stroke={ghost ? ink : "#6f9c66"}
            fill="none"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d={`M${W / 2},${groundY - 25} Q${W / 2 - 17},${groundY - 28} ${W / 2 - 15},${groundY - 41} Q${W / 2 - 4},${groundY - 34} ${W / 2},${groundY - 25}`}
            fill={ghost ? ink : "#7aa56e"}
          />
          <path
            d={`M${W / 2},${groundY - 30} Q${W / 2 + 16},${groundY - 35} ${W / 2 + 12},${groundY - 48} Q${W / 2 + 2},${groundY - 40} ${W / 2},${groundY - 30}`}
            fill={ghost ? ink : "#8fbc80"}
          />
        </g>
      )}

      {/* root flare */}
      {stage >= 2 && (
        <path
          d={`M${W / 2 - 7 - stage},${groundY} Q${W / 2 - 3},${groundY - 4} ${W / 2},${groundY - 5} Q${W / 2 + 3},${groundY - 4} ${W / 2 + 7 + stage},${groundY}`}
          fill={barkShade}
          opacity={ghost ? 0.5 : 0.9}
        />
      )}

      {/* soft canopy mass behind the clusters */}
      {showLeaves && cr > 0 && (
        <ellipse
          cx={cx}
          cy={cy}
          rx={cr * 1.04}
          ry={cr * 0.86}
          fill={leafTones[0]}
          opacity={ghost ? 0.18 : 0.55}
        />
      )}

      {/* branches — two passes for taper: shadow under, lit over */}
      {limbs.map((l, i) => (
        <path
          key={`s-${i}`}
          d={l.d}
          stroke={barkShade}
          strokeWidth={l.w + 0.8}
          strokeLinecap="round"
          fill="none"
          opacity={ghost ? 0.45 : 1}
        />
      ))}
      {limbs.map((l, i) => (
        <path
          key={i}
          d={l.d}
          stroke={bark}
          strokeWidth={Math.max(l.w * 0.62, 0.7)}
          strokeLinecap="round"
          fill="none"
          opacity={ghost ? 0.5 : 1}
        />
      ))}

      {/* foliage — clustered ellipses per tip, lit from upper-left */}
      {showLeaves &&
        tips.map((t, i) => {
          const n = 3 + Math.floor(leafRnd() * 3);
          return (
            <g key={i}>
              {Array.from({ length: n }, (_, j) => {
                const tone = j === n - 1 ? 2 : j > 0 ? 1 : 0;
                const r = (4 + leafRnd() * 7) * (stage >= 4 ? 1.3 : 0.95);
                const ox = (leafRnd() - 0.5) * 14 - tone * 1.5;
                const oy = (leafRnd() - 0.5) * 10 - tone * 2;
                return (
                  <ellipse
                    key={j}
                    cx={t.x + ox}
                    cy={t.y + oy}
                    rx={r * 1.15}
                    ry={r * 0.85}
                    fill={leafTones[tone]}
                    opacity={ghost ? 0.16 + tone * 0.05 : 0.5 + tone * 0.16}
                    transform={`rotate(${(leafRnd() - 0.5) * 40} ${t.x + ox} ${t.y + oy})`}
                  />
                );
              })}
            </g>
          );
        })}

      {/* flourishing trees blossom */}
      {blossom &&
        !ghost &&
        tips
          .filter((_, i) => i % 3 === 0)
          .map((t, i) => (
            <circle
              key={`b-${i}`}
              cx={t.x + (leafRnd() - 0.5) * 10}
              cy={t.y - 3 - leafRnd() * 6}
              r={1.7}
              fill="#e9cf9b"
              opacity={0.95}
            />
          ))}
    </svg>
  );
}

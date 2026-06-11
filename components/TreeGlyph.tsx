import type { Skill } from "@/data/garden";

/**
 * Procedural tree, drawn deterministically from the skill's id.
 * Growth stage controls recursion depth and foliage:
 * 0 seed · 1 sprout · 2 sapling · 3 young · 4 grown · 5 flourishing
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
interface Leaf {
  x: number;
  y: number;
  r: number;
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
  leaves: Leaf[]
) {
  const x2 = x + Math.cos(angle) * len;
  const y2 = y - Math.sin(angle) * len;
  limbs.push({ d: `M${x.toFixed(1)},${y.toFixed(1)} L${x2.toFixed(1)},${y2.toFixed(1)}`, w: width });
  if (depth <= 0) {
    leaves.push({ x: x2, y: y2, r: 2.5 + rnd() * 4 });
    return;
  }
  const splits = rnd() > 0.65 ? 3 : 2;
  for (let i = 0; i < splits; i++) {
    const spread = (i - (splits - 1) / 2) * (0.55 + rnd() * 0.25);
    grow(
      rnd,
      x2,
      y2,
      angle + spread + (rnd() - 0.5) * 0.22,
      len * (0.66 + rnd() * 0.14),
      width * 0.62,
      depth - 1,
      limbs,
      leaves
    );
  }
}

export default function TreeGlyph({
  skill,
  height = 180,
  className = "",
}: {
  skill: Pick<Skill, "id" | "stage">;
  height?: number;
  className?: string;
}) {
  const W = 160;
  const H = 190;
  const groundY = 176;
  const rnd = mulberry32(hashId(skill.id));
  const limbs: Limb[] = [];
  const leaves: Leaf[] = [];
  const stage = skill.stage;

  if (stage >= 2) {
    const depth = stage; // 2..5
    const trunkLen = 26 + stage * 13;
    grow(rnd, W / 2, groundY, Math.PI / 2 + (rnd() - 0.5) * 0.12, trunkLen, 2 + stage, depth, limbs, leaves);
  }

  const leafColor = stage >= 4 ? "#9fce8f" : "#6f9c66";
  const showLeaves = stage >= 3;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      height={height}
      width={(height * W) / H}
      className={className}
      aria-hidden
    >
      {/* ground */}
      <line x1={14} y1={groundY} x2={W - 14} y2={groundY} stroke="rgba(232,230,225,0.18)" strokeWidth="1" />

      {stage === 0 && (
        // a seed, resting in a shallow furrow
        <g>
          <path d={`M${W / 2 - 9},${groundY} Q${W / 2},${groundY + 7} ${W / 2 + 9},${groundY}`} stroke="rgba(232,230,225,0.25)" fill="none" />
          <ellipse cx={W / 2} cy={groundY - 2.5} rx={4.5} ry={6} fill="#b88d5c" transform={`rotate(18 ${W / 2} ${groundY - 3})`} />
        </g>
      )}

      {stage === 1 && (
        // a sprout: stem and two first leaves
        <g stroke="#6f9c66" fill="none" strokeWidth="2" strokeLinecap="round">
          <path d={`M${W / 2},${groundY} C${W / 2 - 2},${groundY - 14} ${W / 2 + 2},${groundY - 20} ${W / 2},${groundY - 28}`} />
          <path d={`M${W / 2},${groundY - 24} Q${W / 2 - 16},${groundY - 30} ${W / 2 - 14},${groundY - 40}`} />
          <path d={`M${W / 2},${groundY - 28} Q${W / 2 + 15},${groundY - 36} ${W / 2 + 11},${groundY - 46}`} />
        </g>
      )}

      {/* branches */}
      {limbs.map((l, i) => (
        <path
          key={i}
          d={l.d}
          stroke="rgba(216,205,189,0.82)"
          strokeWidth={l.w}
          strokeLinecap="round"
          fill="none"
        />
      ))}

      {/* foliage */}
      {showLeaves &&
        leaves.map((l, i) => (
          <circle
            key={i}
            cx={l.x}
            cy={l.y}
            r={l.r * (stage >= 4 ? 1.25 : 0.8)}
            fill={leafColor}
            opacity={0.32 + (i % 5) * 0.06}
          />
        ))}

      {/* flourishing trees blossom */}
      {stage >= 5 &&
        leaves
          .filter((_, i) => i % 4 === 0)
          .map((l, i) => (
            <circle key={`b-${i}`} cx={l.x + 2} cy={l.y - 2} r={1.6} fill="#d4b886" opacity={0.9} />
          ))}
    </svg>
  );
}

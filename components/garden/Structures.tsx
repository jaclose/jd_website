"use client";
import { type ReactElement } from "react";
import type { FeatureType } from "@/data/garden";

/**
 * Bespoke architecture for the garden. A planted repo or pursuit doesn't
 * become a card — it becomes a *place*: a signal tower broadcasting the work,
 * a greenhouse with something still under glass, an observatory on the ridge,
 * a shrine in the sacred grove. Each is low-poly and toon-lit to match the
 * forest, and grows with its stage.
 *
 * All geometry is authored around the origin, sitting on y = 0, inside roughly
 * a 2-unit footprint; the caller positions and the `stage` scales it.
 */

const WOOD = "#6f553a";
const WOOD_DARK = "#4e3c28";
const STONE = "#8d8b80";
const STONE_DARK = "#5f5d54";
const METAL = "#566069";
const GLASS = "#bfe6c8";

function Glow({
  color,
  size = 0.12,
  position,
}: {
  color: string;
  size?: number;
  position?: [number, number, number];
}) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[size, 12, 12]} />
      <meshBasicMaterial color={color} toneMapped={false} />
    </mesh>
  );
}

function SignalTower({ accent }: { accent: string }) {
  return (
    <group>
      {/* tapering 4-sided lattice mast */}
      <mesh position={[0, 2.6, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.7, 5.2, 4]} />
        <meshStandardMaterial color={METAL} roughness={0.6} metalness={0.3} flatShading />
      </mesh>
      {/* platforms / crossbraces */}
      {[1.4, 2.9, 4.1].map((y, i) => (
        <mesh key={y} position={[0, y, 0]} rotation={[0, Math.PI / 4, 0]}>
          <boxGeometry args={[0.62 - i * 0.13, 0.08, 0.62 - i * 0.13]} />
          <meshStandardMaterial color={METAL} roughness={0.7} />
        </mesh>
      ))}
      {/* mast tip + beacon */}
      <mesh position={[0, 5.5, 0]}>
        <cylinderGeometry args={[0.03, 0.05, 0.8, 6]} />
        <meshStandardMaterial color={METAL} />
      </mesh>
      <Glow color={accent} size={0.16} position={[0, 5.95, 0]} />
      <Glow color={accent} size={0.07} position={[0.34, 4.1, 0]} />
    </group>
  );
}

function Greenhouse({ accent }: { accent: string }) {
  return (
    <group>
      {/* glass body */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[1.5, 1, 1.1]} />
        <meshStandardMaterial color={GLASS} roughness={0.1} metalness={0.1} transparent opacity={0.4} />
      </mesh>
      {/* gabled glass roof (triangular prism) */}
      <mesh position={[0, 1.25, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.62, 0.62, 1.5, 3]} />
        <meshStandardMaterial color={GLASS} roughness={0.1} transparent opacity={0.38} />
      </mesh>
      {/* frame ridges */}
      <mesh position={[0, 1.05, 0]}>
        <boxGeometry args={[1.54, 0.05, 0.05]} />
        <meshStandardMaterial color={WOOD_DARK} />
      </mesh>
      {/* what's growing inside, lit */}
      <Glow color={accent} size={0.22} position={[0, 0.55, 0]} />
      <mesh position={[0.35, 0.4, 0.2]}>
        <coneGeometry args={[0.16, 0.5, 6]} />
        <meshStandardMaterial color="#6fae5a" emissive="#2c4a22" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

function Observatory({ accent }: { accent: string }) {
  return (
    <group>
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.85, 1, 1.1, 16]} />
        <meshStandardMaterial color={STONE} roughness={0.9} />
      </mesh>
      {/* dome */}
      <mesh position={[0, 1.1, 0]} castShadow>
        <sphereGeometry args={[0.86, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#c9cdd2" roughness={0.6} metalness={0.2} />
      </mesh>
      {/* observation slit */}
      <mesh position={[0, 1.35, 0.55]} rotation={[-0.5, 0, 0]}>
        <boxGeometry args={[0.22, 0.7, 0.06]} />
        <meshStandardMaterial color="#10141a" />
      </mesh>
      <Glow color={accent} size={0.08} position={[0, 1.95, 0]} />
    </group>
  );
}

function FieldStation({ accent }: { accent: string }) {
  return (
    <group>
      {/* stilts */}
      {[
        [-0.5, -0.4],
        [0.5, -0.4],
        [-0.5, 0.4],
        [0.5, 0.4],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.45, z]}>
          <cylinderGeometry args={[0.06, 0.07, 0.9, 6]} />
          <meshStandardMaterial color={WOOD_DARK} roughness={1} />
        </mesh>
      ))}
      {/* deck + cabin */}
      <mesh position={[0, 0.95, 0]} castShadow>
        <boxGeometry args={[1.3, 0.12, 1.1]} />
        <meshStandardMaterial color={WOOD} roughness={1} />
      </mesh>
      <mesh position={[0, 1.4, -0.1]} castShadow>
        <boxGeometry args={[1, 0.8, 0.8]} />
        <meshStandardMaterial color={WOOD} roughness={1} />
      </mesh>
      {/* pitched roof */}
      <mesh position={[0, 1.95, -0.1]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.5, 0.5, 1.1, 3]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={1} flatShading />
      </mesh>
      {/* antenna */}
      <mesh position={[0.45, 2, 0.3]}>
        <cylinderGeometry args={[0.015, 0.015, 1, 4]} />
        <meshStandardMaterial color={METAL} />
      </mesh>
      <Glow color={accent} size={0.07} position={[0.45, 2.5, 0.3]} />
    </group>
  );
}

function MemoryGrove({ accent }: { accent: string }) {
  // a ring of saplings whose markers return on schedule — spaced repetition
  const n = 6;
  return (
    <group>
      <mesh position={[0, 0.6, 0]} castShadow>
        <coneGeometry args={[0.5, 1.4, 8]} />
        <meshStandardMaterial color="#3f6a33" roughness={1} flatShading />
      </mesh>
      <mesh position={[0, 1.35, 0]} castShadow>
        <coneGeometry args={[0.35, 1, 8]} />
        <meshStandardMaterial color="#4d7d3c" roughness={1} flatShading />
      </mesh>
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2;
        return (
          <group key={i}>
            <mesh position={[Math.cos(a) * 0.95, 0.28, Math.sin(a) * 0.95]}>
              <coneGeometry args={[0.12, 0.55, 6]} />
              <meshStandardMaterial color="#5a8e45" roughness={1} flatShading />
            </mesh>
            <Glow color={accent} size={0.05} position={[Math.cos(a) * 0.95, 0.62, Math.sin(a) * 0.95]} />
          </group>
        );
      })}
    </group>
  );
}

function Workshop({ accent }: { accent: string }) {
  return (
    <group>
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[1.3, 1, 1.1]} />
        <meshStandardMaterial color={WOOD} roughness={1} />
      </mesh>
      {/* pitched roof */}
      <mesh position={[0, 1.2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.62, 0.62, 1.34, 3]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={1} flatShading />
      </mesh>
      {/* door */}
      <mesh position={[0, 0.42, 0.56]}>
        <boxGeometry args={[0.4, 0.7, 0.04]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={1} />
      </mesh>
      {/* hanging lantern */}
      <mesh position={[0.5, 0.85, 0.58]}>
        <boxGeometry args={[0.1, 0.14, 0.1]} />
        <meshStandardMaterial color={METAL} />
      </mesh>
      <Glow color={accent} size={0.07} position={[0.5, 0.82, 0.62]} />
      {/* a workbench out front */}
      <mesh position={[0.05, 0.28, 0.95]}>
        <boxGeometry args={[0.7, 0.08, 0.3]} />
        <meshStandardMaterial color={WOOD} roughness={1} />
      </mesh>
    </group>
  );
}

function Toolshed({ accent }: { accent: string }) {
  return (
    <group>
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[1, 0.8, 0.85]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={1} />
      </mesh>
      {/* slanted lean-to roof */}
      <mesh position={[0, 0.86, 0]} rotation={[0.32, 0, 0]}>
        <boxGeometry args={[1.1, 0.06, 1.1]} />
        <meshStandardMaterial color={WOOD} roughness={1} />
      </mesh>
      {/* crossed tools */}
      <mesh position={[0.58, 0.5, 0.2]} rotation={[0, 0, 0.5]}>
        <boxGeometry args={[0.04, 1.1, 0.04]} />
        <meshStandardMaterial color={METAL} />
      </mesh>
      <mesh position={[0.58, 0.5, 0.2]} rotation={[0, 0, -0.5]}>
        <boxGeometry args={[0.04, 1.1, 0.04]} />
        <meshStandardMaterial color={WOOD} />
      </mesh>
      <Glow color={accent} size={0.05} position={[0, 0.55, 0.46]} />
    </group>
  );
}

function TrainingPost({ accent }: { accent: string }) {
  return (
    <group>
      {[-0.45, 0.45].map((x) => (
        <mesh key={x} position={[x, 0.9, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.1, 1.8, 7]} />
          <meshStandardMaterial color={WOOD} roughness={1} />
        </mesh>
      ))}
      {/* horizontal top bar spanning the two posts */}
      <mesh position={[0, 1.75, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.06, 0.06, 1.1, 6]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={1} />
      </mesh>
      {/* hanging weight */}
      <mesh position={[0, 1.1, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.3, 10]} />
        <meshStandardMaterial color={STONE_DARK} roughness={1} />
      </mesh>
      <Glow color={accent} size={0.06} position={[0.45, 1.78, 0]} />
    </group>
  );
}

function TidePool({ accent }: { accent: string }) {
  return (
    <group>
      {/* stone rim */}
      <mesh position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.85, 0.16, 8, 20]} />
        <meshStandardMaterial color={STONE_DARK} roughness={1} flatShading />
      </mesh>
      {/* water */}
      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.84, 24]} />
        <meshStandardMaterial color="#3f8f8a" roughness={0.15} metalness={0.2} transparent opacity={0.85} emissive="#1c4a48" emissiveIntensity={0.4} />
      </mesh>
      {/* a few rocks */}
      {[
        [0.5, 0.4],
        [-0.55, -0.2],
        [0.1, -0.6],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.14, z]} scale={0.18 + i * 0.04}>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={STONE} roughness={1} flatShading />
        </mesh>
      ))}
      <Glow color={accent} size={0.06} position={[0, 0.18, 0]} />
    </group>
  );
}

function Shrine({ accent }: { accent: string }) {
  return (
    <group>
      {/* two pillars + lintel = archway */}
      {[-0.55, 0.55].map((x) => (
        <mesh key={x} position={[x, 0.85, 0]} castShadow>
          <boxGeometry args={[0.26, 1.7, 0.26]} />
          <meshStandardMaterial color={STONE} roughness={1} flatShading />
        </mesh>
      ))}
      <mesh position={[0, 1.78, 0]} castShadow>
        <boxGeometry args={[1.5, 0.26, 0.32]} />
        <meshStandardMaterial color={STONE} roughness={1} flatShading />
      </mesh>
      {/* basin */}
      <mesh position={[0, 0.32, 0.05]}>
        <cylinderGeometry args={[0.34, 0.28, 0.3, 12]} />
        <meshStandardMaterial color={STONE_DARK} roughness={1} />
      </mesh>
      <mesh position={[0, 0.46, 0.05]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.3, 16]} />
        <meshStandardMaterial color="#2c5a55" transparent opacity={0.8} emissive="#16403c" emissiveIntensity={0.4} />
      </mesh>
      {/* a quiet light beneath the arch */}
      <Glow color={accent} size={0.13} position={[0, 1.2, 0]} />
    </group>
  );
}

function Library({ accent }: { accent: string }) {
  return (
    <group>
      {/* shelf body */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[1.3, 1.1, 0.5]} />
        <meshStandardMaterial color={WOOD} roughness={1} />
      </mesh>
      {/* shelves */}
      {[0.35, 0.7, 1.05].map((y) => (
        <mesh key={y} position={[0, y, 0.26]}>
          <boxGeometry args={[1.2, 0.04, 0.04]} />
          <meshStandardMaterial color={WOOD_DARK} />
        </mesh>
      ))}
      {/* books */}
      {Array.from({ length: 9 }, (_, i) => {
        const shelf = [0.5, 0.85][i % 2];
        const cols = ["#9a5b46", "#4a6a8a", "#7a8a4a", "#8a6a8a"];
        return (
          <mesh key={i} position={[-0.5 + (i % 5) * 0.24, shelf, 0.28]}>
            <boxGeometry args={[0.12, 0.28, 0.18]} />
            <meshStandardMaterial color={cols[i % cols.length]} roughness={1} />
          </mesh>
        );
      })}
      {/* peaked roof */}
      <mesh position={[0, 1.25, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.42, 0.42, 1.34, 3]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={1} flatShading />
      </mesh>
      <Glow color={accent} size={0.06} position={[0.5, 1.05, 0.3]} />
    </group>
  );
}

function Cairn() {
  // stacked stones — a marker for ground grown past
  const sizes = [0.34, 0.27, 0.2, 0.14];
  let y = 0;
  return (
    <group>
      {sizes.map((r, i) => {
        const cy = y + r;
        y += r * 1.5;
        return (
          <mesh key={i} position={[(i % 2 ? 0.05 : -0.05), cy, 0]} castShadow>
            <dodecahedronGeometry args={[r, 0]} />
            <meshStandardMaterial color={i % 2 ? STONE : STONE_DARK} roughness={1} flatShading />
          </mesh>
        );
      })}
    </group>
  );
}

const BUILDERS: Partial<Record<FeatureType, (p: { accent: string }) => ReactElement>> = {
  "signal-tower": SignalTower,
  greenhouse: Greenhouse,
  observatory: Observatory,
  "field-station": FieldStation,
  "memory-grove": MemoryGrove,
  workshop: Workshop,
  toolshed: Toolshed,
  "training-post": TrainingPost,
  "tide-pool": TidePool,
  shrine: Shrine,
  library: Library,
  cairn: Cairn,
};

/** does this feature-type get a built structure (vs. just its species tree)? */
export function hasStructure(type: FeatureType): boolean {
  return type !== "tree" && type in BUILDERS;
}

export default function Structure({
  type,
  stage,
  accent,
}: {
  type: FeatureType;
  stage: number;
  accent: string;
}) {
  const Build = BUILDERS[type];
  if (!Build) return null;
  const s = 0.78 + stage * 0.12; // a place grows as the work deepens
  return (
    <group scale={s}>
      <Build accent={accent} />
    </group>
  );
}

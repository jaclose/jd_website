"use client";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import type { GardenFeature } from "@/data/gardenFeatures";
import { useMemo } from "react";
import InstancedModel from "./SanctumFoliage";
import SanctumInteractionMarker from "./SanctumInteractionMarker";
import { groundHeight } from "./lib/terrain";
import { makeWaterMaterial } from "./shaders/water";

/**
 * A life-chapter rendered as a *place*, not a card. Each gardenFeature maps to a
 * built archetype (a signal tower for this site, a glass greenhouse for the med
 * app, a field station / study cairn up the study trail, a bench, a tide pool, an
 * unsown ring) anchored at the feature's world position, with a diegetic ground
 * marker that opens its plaque. The narrative lives in the objects.
 */

const ACCENT: Record<string, string> = {
  main: "#9fce8f", // leaf
  medicine: "#9fd8e8", // comet (cool study)
  projects: "#d4b886", // starlight (gold)
};

const ARCHETYPE: Record<string, string> = {
  "website-tree": "tower",
  noctyrium: "greenhouse",
  "term-3": "station",
  "term-2": "study",
  "term-1": "study",
  utk: "study",
  mcat: "study",
  "training-journey": "apple",
  soccer: "bench",
  "wave-depth": "water",
  "future-plot": "unsown",
};

const WOOD = "#5e4530";
const STONE = "#6f6c62";

export default function SanctumLandmark({
  feature,
  onSelect,
  lowFx = false,
}: {
  feature: GardenFeature;
  onSelect: (id: string) => void;
  lowFx?: boolean;
}) {
  const accent = ACCENT[feature.branch] ?? ACCENT.main;
  const archetype = ARCHETYPE[feature.id] ?? "cairn";
  const [x, , z] = feature.position;
  const rot = feature.rotation?.[1] ?? 0;

  return (
    <group position={[x, groundHeight(x, z), z]} rotation={[0, rot, 0]}>
      <Archetype kind={archetype} accent={accent} lowFx={lowFx} />
      <SanctumInteractionMarker position={[0, 0, 1.3]} color={accent} onSelect={() => onSelect(feature.id)} />
    </group>
  );
}

function Archetype({ kind, accent, lowFx }: { kind: string; accent: string; lowFx: boolean }) {
  switch (kind) {
    case "tower":
      return <SignalTower accent={accent} />;
    case "greenhouse":
      return <Greenhouse accent={accent} lowFx={lowFx} />;
    case "station":
      return <FieldStation accent={accent} />;
    case "study":
      return <StudyCairn accent={accent} />;
    case "apple":
      return <AppleStand />;
    case "bench":
      return <Bench accent={accent} />;
    case "water":
      return <TidePool lowFx={lowFx} />;
    case "unsown":
      return <UnsownRing />;
    default:
      return <StudyCairn accent={accent} />;
  }
}

/* ————— a warm point-lantern, reused by several archetypes ————— */
function Lantern({ position, color = "#ffcf87", intensity = 2 }: { position: [number, number, number]; color?: string; intensity?: number }) {
  const light = useRef<THREE.PointLight>(null!);
  useFrame((s) => {
    if (light.current) light.current.intensity = intensity * (0.85 + Math.sin(s.clock.elapsedTime * 6 + position[0]) * 0.08);
  });
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.16, 0.22, 0.16]} />
        <meshStandardMaterial color="#2a2620" emissive={color} emissiveIntensity={1.4} roughness={0.6} />
      </mesh>
      <pointLight ref={light} color={color} intensity={intensity} distance={7} decay={2} />
    </group>
  );
}

function SignalTower({ accent }: { accent: string }) {
  return (
    <group>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 0.6 + i * 1.5, 0]} castShadow>
          <cylinderGeometry args={[0.26 - i * 0.05, 0.34 - i * 0.05, 1.5, 6]} />
          <meshStandardMaterial color={WOOD} roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[0, 5.4, 0]} castShadow>
        <coneGeometry args={[0.3, 0.7, 6]} />
        <meshStandardMaterial color="#3c4a52" metalness={0.4} roughness={0.5} />
      </mesh>
      {/* broadcast beacon */}
      <mesh position={[0, 5.9, 0]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshBasicMaterial color={accent} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 5.9, 0]} color={accent} intensity={3} distance={9} decay={2} />
    </group>
  );
}

function Greenhouse({ accent, lowFx }: { accent: string; lowFx: boolean }) {
  return (
    <group>
      {/* glass shell */}
      <mesh position={[0, 1.3, 0]} castShadow>
        <boxGeometry args={[2.4, 2.6, 2.0]} />
        <GlassMaterial lowFx={lowFx} opacity={0.55} />
      </mesh>
      <mesh position={[0, 2.9, 0]} castShadow>
        <coneGeometry args={[1.7, 1.0, 4]} />
        <GlassMaterial lowFx={lowFx} opacity={0.5} />
      </mesh>
      {/* frame edges */}
      {[-1.2, 1.2].map((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}-${sz}`} position={[sx, 1.3, sz]}>
            <boxGeometry args={[0.06, 2.6, 0.06]} />
            <meshStandardMaterial color="#3a4348" metalness={0.5} roughness={0.5} />
          </mesh>
        )),
      )}
      {/* a crystal-rooted sapling glowing within */}
      <mesh position={[0, 0.6, 0]}>
        <icosahedronGeometry args={[0.4, 0]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.8} roughness={0.3} />
      </mesh>
      <pointLight position={[0, 1, 0]} color={accent} intensity={2.4} distance={6} decay={2} />
    </group>
  );
}

function FieldStation({ accent }: { accent: string }) {
  return (
    <group>
      {[-0.9, 0.9].map((sx) => (
        <mesh key={sx} position={[sx, 1.0, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.1, 2.0, 6]} />
          <meshStandardMaterial color={WOOD} roughness={0.95} />
        </mesh>
      ))}
      {/* crossbeam + canopy */}
      <mesh position={[0, 2.05, 0]} castShadow>
        <boxGeometry args={[2.2, 0.1, 0.1]} />
        <meshStandardMaterial color={WOOD} roughness={0.95} />
      </mesh>
      <mesh position={[0, 1.7, -0.5]} rotation={[0.5, 0, 0]}>
        <planeGeometry args={[2.1, 1.2]} />
        <meshStandardMaterial color="#4a4036" roughness={1} side={THREE.DoubleSide} />
      </mesh>
      {/* a study slab */}
      <mesh position={[0, 0.45, 0.3]} rotation={[-0.25, 0, 0]} castShadow>
        <boxGeometry args={[0.9, 0.06, 0.6]} />
        <meshStandardMaterial color="#6b5a44" roughness={0.8} />
      </mesh>
      <Lantern position={[0.9, 2.0, 0]} color={accent === "#9fd8e8" ? "#bfe6f0" : "#ffcf87"} intensity={2.2} />
    </group>
  );
}

function StudyCairn({ accent }: { accent: string }) {
  return (
    <group>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[(i % 2) * 0.08 - 0.04, 0.18 + i * 0.26, 0]} rotation={[0, i * 0.6, 0]} castShadow>
          <dodecahedronGeometry args={[0.34 - i * 0.06, 0]} />
          <meshStandardMaterial color={STONE} roughness={1} />
        </mesh>
      ))}
      {/* engraved plaque slab */}
      <mesh position={[0.5, 0.5, 0.4]} rotation={[0, -0.4, 0.04]} castShadow>
        <boxGeometry args={[0.5, 0.7, 0.05]} />
        <meshStandardMaterial color="#54504a" roughness={0.9} />
      </mesh>
      <Lantern position={[-0.6, 0.5, 0.3]} color={accent === "#9fd8e8" ? "#bfe6f0" : "#ffcf87"} intensity={1.6} />
    </group>
  );
}

function AppleStand() {
  const apples = Array.from({ length: 7 }, (_, i) => ({
    position: [Math.cos(i * 1.7) * (0.6 + (i % 3) * 0.3), 0.12, Math.sin(i * 1.7) * (0.6 + (i % 3) * 0.3)] as [number, number, number],
    scale: 1.0,
    rotationY: i,
  }));
  return (
    <group>
      <InstancedModel model="apple" placements={apples} foliageWind={false} castShadow />
      {/* a low climbing step / stump to sit on */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <cylinderGeometry args={[0.5, 0.6, 0.5, 12]} />
        <meshStandardMaterial color={WOOD} roughness={1} />
      </mesh>
    </group>
  );
}

function Bench({ accent }: { accent: string }) {
  return (
    <group>
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[1.6, 0.1, 0.5]} />
        <meshStandardMaterial color={WOOD} roughness={0.95} />
      </mesh>
      {[-0.65, 0.65].map((sx) => (
        <mesh key={sx} position={[sx, 0.22, 0]} castShadow>
          <boxGeometry args={[0.12, 0.45, 0.45]} />
          <meshStandardMaterial color={WOOD} roughness={0.95} />
        </mesh>
      ))}
      <Lantern position={[1.0, 0.6, 0]} color={accent === "#d4b886" ? "#ffe0a0" : "#ffcf87"} intensity={1.8} />
    </group>
  );
}

function TidePool({ lowFx }: { lowFx: boolean }) {
  return (
    <group>
      {/* stone rim */}
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 1.5, 0.12, Math.sin(a) * 1.5]} rotation={[0, a, 0]} castShadow>
            <dodecahedronGeometry args={[0.28 + (i % 3) * 0.06, 0]} />
            <meshStandardMaterial color={STONE} roughness={1} />
          </mesh>
        );
      })}
      {/* water — procedural ripple/fresnel surface (cheap standard fallback on low) */}
      <Water lowFx={lowFx} />
      <pointLight position={[0, 0.6, 0]} color="#9fd8e8" intensity={1.2} distance={5} decay={2} />
    </group>
  );
}

/** procedural water surface on capable tiers; a cheap reflective disc on low. */
function Water({ lowFx }: { lowFx: boolean }) {
  const mat = useMemo(() => (lowFx ? null : makeWaterMaterial()), [lowFx]);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
      <circleGeometry args={[1.45, 48]} />
      {mat ? (
        <primitive object={mat} attach="material" />
      ) : (
        <meshStandardMaterial color="#21404a" roughness={0.1} metalness={0.5} transparent opacity={0.9} />
      )}
    </mesh>
  );
}

/** transmission glass on capable tiers; a cheap translucent fallback on low. */
function GlassMaterial({ lowFx, opacity }: { lowFx: boolean; opacity: number }) {
  if (lowFx) {
    return <meshStandardMaterial color="#cfe6e6" roughness={0.15} metalness={0.1} transparent opacity={opacity * 0.6} />;
  }
  return (
    <meshPhysicalMaterial transmission={0.92} thickness={0.4} roughness={0.12} ior={1.3} color="#cfe6e6" transparent opacity={opacity} metalness={0} />
  );
}

function UnsownRing() {
  return (
    <group>
      {Array.from({ length: 16 }).map((_, i) => {
        const a = (i / 16) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 1.2, 0.05, Math.sin(a) * 1.2]} castShadow>
            <dodecahedronGeometry args={[0.1 + (i % 2) * 0.04, 0]} />
            <meshStandardMaterial color={STONE} roughness={1} />
          </mesh>
        );
      })}
      {/* turned soil at centre — a promise of future planting */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[1.0, 32]} />
        <meshStandardMaterial color="#3a2c1e" roughness={1} />
      </mesh>
    </group>
  );
}

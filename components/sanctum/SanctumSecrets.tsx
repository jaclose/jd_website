"use client";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { sanctumSecrets } from "./lib/quests";
import { useProgress } from "./lib/progress";
import { groundHeight } from "./lib/terrain";

/**
 * The four quiet things. Each secret from lib/quests gets a small hand-built
 * scene piece placed off the trail — no markers, no beacons, just something a
 * little too deliberate to be nature, glowing faintly enough to catch a
 * wandering eye at dusk. Walking into one fires its discovery through the
 * quest sensor; after discovery the glow settles from a searching pulse to a
 * steady, satisfied warmth.
 */

const STONE = "#6f6c62";
const MOSS = "#3f5a35";

function secretPos(id: string): [number, number, number] {
  const s = sanctumSecrets.find((x) => x.id === id)!;
  return [s.position[0], groundHeight(s.position[0], s.position[2]), s.position[2]];
}

export default function SanctumSecrets() {
  return (
    <group>
      <ListeningStone />
      <FoxStatue />
      <MushroomRing />
      <FirstSeed />
    </group>
  );
}

/** shared pulsing glow that calms once the secret is found. */
function SecretGlow({
  secretId,
  color,
  intensity = 1.1,
  height = 0.8,
  distance = 6,
}: {
  secretId: string;
  color: string;
  intensity?: number;
  height?: number;
  distance?: number;
}) {
  const light = useRef<THREE.PointLight>(null!);
  const found = useProgress((s) => !!s.secrets[secretId]);
  useFrame((s) => {
    if (!light.current) return;
    const t = s.clock.elapsedTime;
    light.current.intensity = found
      ? intensity * 1.15
      : intensity * (0.55 + 0.45 * Math.sin(t * 1.4 + distance));
  });
  return <pointLight ref={light} position={[0, height, 0]} color={color} intensity={intensity} distance={distance} decay={2} />;
}

/* ————— west meadow: a humming mossy monolith ————— */
function ListeningStone() {
  const [x, y, z] = secretPos("listening-stone");
  return (
    <group position={[x, y, z]} rotation={[0.04, 0.7, -0.03]}>
      <mesh position={[0, 1.25, 0]} castShadow>
        <boxGeometry args={[0.85, 2.6, 0.55]} />
        <meshStandardMaterial color={STONE} roughness={1} />
      </mesh>
      {/* moss shoulders */}
      {[[-0.25, 2.35, 0.1, 0.34], [0.3, 1.7, -0.2, 0.26], [0.05, 0.6, 0.28, 0.3]].map(([mx, my, mz, s], i) => (
        <mesh key={i} position={[mx, my, mz]} scale={[s, s * 0.45, s]}>
          <sphereGeometry args={[1, 10, 8]} />
          <meshStandardMaterial color={MOSS} roughness={1} />
        </mesh>
      ))}
      {/* the humming glyph ring */}
      <mesh position={[0, 1.5, 0.29]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.22, 0.025, 10, 32]} />
        <meshStandardMaterial color="#9fd8e8" emissive="#9fd8e8" emissiveIntensity={1.6} roughness={0.4} toneMapped={false} />
      </mesh>
      <SecretGlow secretId="listening-stone" color="#9fd8e8" height={1.5} intensity={1.0} />
    </group>
  );
}

/* ————— eastern treeline: a small stone fox on a plinth ————— */
function FoxStatue() {
  const [x, y, z] = secretPos("fox-of-the-sanctum");
  return (
    <group position={[x, y, z]} rotation={[0, -2.2, 0]}>
      <mesh position={[0, 0.25, 0]} castShadow>
        <cylinderGeometry args={[0.5, 0.62, 0.5, 8]} />
        <meshStandardMaterial color="#57544c" roughness={1} />
      </mesh>
      {/* seated body */}
      <mesh position={[0, 0.82, -0.05]} scale={[0.3, 0.42, 0.42]} castShadow>
        <sphereGeometry args={[1, 12, 10]} />
        <meshStandardMaterial color={STONE} roughness={0.95} />
      </mesh>
      {/* chest + head */}
      <mesh position={[0, 1.14, 0.14]} scale={[0.2, 0.28, 0.22]}>
        <sphereGeometry args={[1, 12, 10]} />
        <meshStandardMaterial color={STONE} roughness={0.95} />
      </mesh>
      <mesh position={[0, 1.4, 0.22]} rotation={[0.5, 0, 0]} castShadow>
        <coneGeometry args={[0.14, 0.34, 8]} />
        <meshStandardMaterial color={STONE} roughness={0.95} />
      </mesh>
      {/* ears */}
      {[-0.08, 0.08].map((ex) => (
        <mesh key={ex} position={[ex, 1.52, 0.12]} rotation={[-0.15, 0, ex * 3]}>
          <coneGeometry args={[0.045, 0.14, 6]} />
          <meshStandardMaterial color={STONE} roughness={0.95} />
        </mesh>
      ))}
      {/* wrapped tail */}
      <mesh position={[0.22, 0.62, -0.12]} rotation={[0, 0.6, 1.25]} scale={[0.12, 0.3, 0.12]}>
        <sphereGeometry args={[1, 10, 8]} />
        <meshStandardMaterial color={STONE} roughness={0.95} />
      </mesh>
      {/* eyes — the one thing that isn't stone */}
      {[-0.05, 0.05].map((ex) => (
        <mesh key={ex} position={[ex, 1.43, 0.32]}>
          <sphereGeometry args={[0.016, 8, 8]} />
          <meshStandardMaterial color="#f0c77c" emissive="#f0c77c" emissiveIntensity={2} toneMapped={false} />
        </mesh>
      ))}
      <SecretGlow secretId="fox-of-the-sanctum" color="#f0c77c" height={1.3} intensity={0.8} distance={5} />
    </group>
  );
}

/* ————— far south-west: a fairy ring ————— */
function MushroomRing() {
  const [x, y, z] = secretPos("mushroom-ring");
  const shrooms = Array.from({ length: 9 }, (_, i) => {
    const a = (i / 9) * Math.PI * 2;
    const r = 1.25 + (i % 3) * 0.12;
    return { a, px: Math.cos(a) * r, pz: Math.sin(a) * r, s: 0.7 + ((i * 37) % 10) / 18 };
  });
  return (
    <group position={[x, y, z]}>
      {shrooms.map(({ px, pz, s }, i) => (
        <group key={i} position={[px, 0, pz]} scale={s}>
          <mesh position={[0, 0.09, 0]} castShadow>
            <cylinderGeometry args={[0.035, 0.05, 0.18, 8]} />
            <meshStandardMaterial color="#d8cfc0" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.2, 0]} scale={[1, 0.55, 1]} castShadow>
            <sphereGeometry args={[0.11, 12, 8]} />
            <meshStandardMaterial color={i % 3 === 0 ? "#a8663c" : "#c4844e"} roughness={0.85} />
          </mesh>
          {/* gill glow */}
          <mesh position={[0, 0.155, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.085, 10]} />
            <meshBasicMaterial color="#b8e6a0" transparent opacity={0.35} toneMapped={false} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
      <SecretGlow secretId="mushroom-ring" color="#b8e6a0" height={0.5} intensity={0.9} />
    </group>
  );
}

/* ————— behind the greenhouse: a jar with one glowing seed ————— */
function FirstSeed() {
  const [x, y, z] = secretPos("first-seed");
  const seed = useRef<THREE.Mesh>(null!);
  useFrame((s) => {
    if (seed.current) seed.current.position.y = 0.32 + Math.sin(s.clock.elapsedTime * 1.1) * 0.03;
  });
  return (
    <group position={[x, y, z]}>
      {/* a flat stone to sit on */}
      <mesh position={[0, 0.05, 0]} scale={[1, 0.25, 1]}>
        <dodecahedronGeometry args={[0.45, 0]} />
        <meshStandardMaterial color={STONE} roughness={1} />
      </mesh>
      {/* the jar */}
      <mesh position={[0, 0.38, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.42, 16]} />
        <meshStandardMaterial color="#cfe6e0" roughness={0.1} metalness={0.1} transparent opacity={0.28} />
      </mesh>
      <mesh position={[0, 0.62, 0]}>
        <cylinderGeometry args={[0.1, 0.12, 0.08, 12]} />
        <meshStandardMaterial color="#5e4530" roughness={1} />
      </mesh>
      {/* the seed */}
      <mesh ref={seed} position={[0, 0.32, 0]}>
        <icosahedronGeometry args={[0.05, 0]} />
        <meshStandardMaterial color="#f0c77c" emissive="#ffd98f" emissiveIntensity={2.4} toneMapped={false} />
      </mesh>
      <SecretGlow secretId="first-seed" color="#ffd98f" height={0.45} intensity={1.0} distance={4.5} />
    </group>
  );
}

"use client";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import InstancedModel from "../SanctumFoliage";
import LivingMonitor from "../LivingMonitor";
import { mulberry32 } from "../lib/rng";
import { makeCableMaterial } from "../shaders/cableVine";
import type { QualityConfig } from "../SanctumQualityManager";

/**
 * Zone 1 — the Room of Entanglement. An enclosed space behind the trailhead:
 * dead screens leaking cold blue, a crimson warning ember, an unmade bed, a desk
 * buried under clutter and half-covered medical books, a dying plant, and cables
 * that crawl across the surfaces like dead vines (cable-vine shader). A doorway
 * in the front wall frames the warm world beyond and pulls the eye out. Furniture
 * is honestly boxy — it's a room, not the natural world.
 */
export const DOORWAY = { z: 14, width: 2.8, height: 3.3, halfX: 5.2, backZ: 30, ceil: 4.0 };

export default function EntanglementRoom({ config }: { config: QualityConfig }) {
  return (
    <group>
      <Shell />
      <DeadScreens />
      <Desk />
      <Bed />
      <BookPile />
      <DeadPlant />
      <Cables />
      <DustMotes count={config.tier === "low" ? 60 : 160} />
      {/* warm light leaking back through the doorway — the pull toward the exit */}
      <pointLight position={[0, 1.6, DOORWAY.z + 0.5]} color="#f0c486" intensity={3.4} distance={15} decay={1.5} />
      {/* a dim cool bounce filling the interior so the space reads as a room */}
      <pointLight position={[0, DOORWAY.ceil - 0.3, 22]} color="#33445f" intensity={2.4} distance={24} decay={1.3} />
    </group>
  );
}

const wallMat = (
  <meshStandardMaterial color="#222a3a" roughness={0.92} metalness={0} side={THREE.DoubleSide} />
);

function Shell() {
  const { halfX, backZ, ceil, z, width, height } = DOORWAY;
  const depth = backZ - z;
  const midZ = (z + backZ) / 2;
  const sideW = (halfX * 2 - width) / 2;
  return (
    <group>
      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, midZ]} receiveShadow>
        <planeGeometry args={[halfX * 2, depth]} />
        <meshStandardMaterial color="#191e2a" roughness={1} />
      </mesh>
      {/* ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ceil, midZ]}>
        <planeGeometry args={[halfX * 2, depth]} />
        {wallMat}
      </mesh>
      {/* back + sides */}
      <mesh position={[0, ceil / 2, backZ]}>
        <planeGeometry args={[halfX * 2, ceil]} />
        {wallMat}
      </mesh>
      <mesh rotation={[0, Math.PI / 2, 0]} position={[-halfX, ceil / 2, midZ]}>
        <planeGeometry args={[depth, ceil]} />
        {wallMat}
      </mesh>
      <mesh rotation={[0, Math.PI / 2, 0]} position={[halfX, ceil / 2, midZ]}>
        <planeGeometry args={[depth, ceil]} />
        {wallMat}
      </mesh>
      {/* front wall with the doorway gap */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (width / 2 + sideW / 2), ceil / 2, z]}>
          <planeGeometry args={[sideW, ceil]} />
          {wallMat}
        </mesh>
      ))}
      {/* lintel above the door */}
      <mesh position={[0, height + (ceil - height) / 2, z]}>
        <planeGeometry args={[width, ceil - height]} />
        {wallMat}
      </mesh>
    </group>
  );
}

function DeadScreens() {
  const red = useRef<THREE.MeshStandardMaterial>(null!);
  useFrame((s) => {
    if (red.current) {
      const t = s.clock.elapsedTime;
      red.current.emissiveIntensity = Math.sin(t * 3.0) > 0.7 ? 1.6 : 0.15; // blinking warning
    }
  });
  return (
    <group position={[-3.2, 1.4, 22]} rotation={[0, 0.5, 0]}>
      {/* monitor bezel + screen */}
      <mesh castShadow>
        <boxGeometry args={[1.5, 0.9, 0.1]} />
        <meshStandardMaterial color="#0a0b10" roughness={0.6} metalness={0.2} />
      </mesh>
      {/* the one screen still alive — the site itself, a window back to the world */}
      <LivingMonitor position={[0, 0, 0.056]} width={1.32} height={0.74} />
      <mesh position={[0, -0.7, 0]}>
        <boxGeometry args={[0.2, 0.5, 0.2]} />
        <meshStandardMaterial color="#0a0c10" roughness={0.8} />
      </mesh>
      {/* the live screen casts a warm gold glow into the cold room — the pull toward it */}
      <pointLight position={[0, 0.1, 0.5]} color="#caa86a" intensity={4.2} distance={13} decay={1.4} />
      {/* a second toppled screen */}
      <mesh position={[1.8, -0.9, 0.6]} rotation={[0.4, -0.7, 0.2]} castShadow>
        <boxGeometry args={[1.0, 0.64, 0.08]} />
        <meshStandardMaterial color="#0a0b10" roughness={0.6} metalness={0.2} />
      </mesh>
      <mesh position={[1.8, -0.9, 0.64]} rotation={[0.4, -0.7, 0.2]}>
        <planeGeometry args={[0.84, 0.5]} />
        <meshStandardMaterial color="#0b1420" emissive="#3a5a86" emissiveIntensity={0.8} roughness={0.4} />
      </mesh>
      <pointLight position={[1.8, -0.6, 1.1]} color="#3a5a86" intensity={2.2} distance={9} decay={1.4} />
      {/* crimson warning LED */}
      <mesh position={[0.66, 0.32, 0.06]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial ref={red} color="#b0364a" emissive="#b0364a" emissiveIntensity={1.2} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Desk() {
  return (
    <group position={[3.0, 0, 23]} rotation={[0, -0.4, 0]}>
      <mesh position={[0, 0.95, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.08, 1.0]} />
        <meshStandardMaterial color="#1a140e" roughness={0.85} />
      </mesh>
      {[[-1, -0.4], [1, -0.4], [-1, 0.4], [1, 0.4]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.47, z]}>
          <boxGeometry args={[0.08, 0.95, 0.08]} />
          <meshStandardMaterial color="#0f0b07" roughness={0.9} />
        </mesh>
      ))}
      {/* clutter: discarded phones + cups */}
      {[[-0.6, 0.2, "#06070a"], [0.3, -0.1, "#080a0e"], [0.8, 0.3, "#06070a"]].map(([x, z, c], i) => (
        <mesh key={i} position={[x as number, 1.02, z as number]} rotation={[0, i, 0]}>
          <boxGeometry args={[0.18, 0.03, 0.36]} />
          <meshStandardMaterial color={c as string} emissive="#27384f" emissiveIntensity={0.4} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function Bed() {
  return (
    <group position={[-3.4, 0, 27]}>
      <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.5, 3.2]} />
        <meshStandardMaterial color="#15171c" roughness={1} />
      </mesh>
      {/* tangled blanket (offset block) */}
      <mesh position={[0.3, 0.72, 0.4]} rotation={[0, 0.2, 0.05]}>
        <boxGeometry args={[1.9, 0.25, 2.0]} />
        <meshStandardMaterial color="#1f2229" roughness={1} />
      </mesh>
      <mesh position={[-0.5, 0.78, -1.2]}>
        <boxGeometry args={[1.0, 0.2, 0.6]} />
        <meshStandardMaterial color="#262a31" roughness={1} />
      </mesh>
    </group>
  );
}

function BookPile() {
  const colors = ["#2a1d14", "#1c2a2e", "#2a232f", "#1a2418"];
  return (
    <group position={[1.4, 0, 25.5]}>
      {colors.map((c, i) => (
        <mesh key={i} position={[(i % 2) * 0.08, 0.06 + i * 0.1, i * 0.05]} rotation={[0, i * 0.5, 0]} castShadow>
          <boxGeometry args={[0.7, 0.1, 0.5]} />
          <meshStandardMaterial color={c} roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

function DeadPlant() {
  return (
    <group position={[4.2, 0, 26]}>
      <mesh position={[0, 0.25, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.22, 0.5, 10]} />
        <meshStandardMaterial color="#2a211a" roughness={1} />
      </mesh>
      <InstancedModel
        model="deadwood"
        placements={[{ position: [0, 0.5, 0], scale: 0.22, rotationY: 0.6 }]}
        foliageWind={false}
        castShadow
        tint="#5a4a38"
      />
    </group>
  );
}

function Cables() {
  const tubes = useMemo(() => {
    const mk = (pts: [number, number, number][]) =>
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), 40, 0.05, 6, false);
    return [
      mk([[3.0, 0.95, 23], [2.0, 0.5, 22], [0.5, 0.06, 20], [-1.5, 0.06, 18], [-2.0, 0.4, 15.5]]),
      mk([[-3.2, 1.0, 22], [-2.5, 0.4, 21], [-1.0, 0.06, 19.5], [0.6, 0.06, 17], [0.4, 0.3, 14.6]]),
      mk([[3.0, 0.95, 23.4], [2.6, 0.5, 24], [2.2, 0.06, 26], [3.5, 0.06, 27.5]]),
    ];
  }, []);
  const mat = useMemo(() => makeCableMaterial("#0a0c10", 0.15), []);
  return (
    <group>
      {tubes.map((g, i) => (
        <mesh key={i} geometry={g} material={mat} castShadow />
      ))}
    </group>
  );
}

function DustMotes({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null!);
  const { geom, base } = useMemo(() => {
    const rnd = mulberry32(222);
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos.set([(rnd() - 0.5) * 9, rnd() * 3.6, 14 + rnd() * 15], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos.slice(), 3));
    return { geom: g, base: pos };
  }, [count]);
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    const arr = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] = base[i * 3 + 1] + Math.sin(t * 0.2 + i) * 0.3;
      arr[i * 3] = base[i * 3] + Math.sin(t * 0.12 + i * 1.3) * 0.2;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });
  return (
    <points ref={ref} geometry={geom}>
      <pointsMaterial size={0.025} color="#8fa6c4" transparent opacity={0.4} depthWrite={false} sizeAttenuation />
    </points>
  );
}

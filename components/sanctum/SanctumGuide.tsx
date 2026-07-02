"use client";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { nextObjective, questById } from "./lib/quests";
import { useProgress } from "./lib/progress";
import { playerState } from "./lib/store";
import { groundHeight } from "./lib/terrain";
import { sampleGround, collidersReady } from "./lib/colliders";

/**
 * The diegetic wayfinder for the tracked quest: a soft column of light rising
 * from the next objective (visible over the canopy from anywhere), a pulsing
 * ground ring, and a small chevron that swims ~3m ahead of the visitor, always
 * leaning toward the target — follow the bird, find the place. Everything fades
 * out inside ~7m so arrival is the world's moment, not the UI's. Secret quests
 * ("The Quiet Ones") deliberately get no guide.
 */
const CHEVRON_LEAD = 3.2;
const FADE_NEAR = 7;

function makeBeamTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 32;
  c.height = 128;
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 128, 0, 0);
  g.addColorStop(0, "rgba(159,206,143,0.85)");
  g.addColorStop(0.5, "rgba(159,206,143,0.28)");
  g.addColorStop(1, "rgba(159,206,143,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 32, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export default function SanctumGuide() {
  const trackedQuestId = useProgress((s) => s.trackedQuestId);
  const visited = useProgress((s) => s.visited);
  const secrets = useProgress((s) => s.secrets);

  const target = useMemo(() => {
    const quest = trackedQuestId ? questById.get(trackedQuestId) : null;
    if (!quest || quest.secret) return null;
    return nextObjective(quest, visited, secrets, playerState.x, playerState.z);
  }, [trackedQuestId, visited, secrets]);

  const beam = useRef<THREE.Mesh>(null!);
  const ring = useRef<THREE.Mesh>(null!);
  const chevron = useRef<THREE.Group>(null!);
  const beamTex = useMemo(() => makeBeamTexture(), []);
  const chevDir = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    if (!target) return;
    const t = state.clock.elapsedTime;
    const [tx, , tz] = target.target;
    const dist = Math.hypot(tx - playerState.x, tz - playerState.z);
    // everything eases away as you arrive
    const fade = THREE.MathUtils.clamp((dist - target.radius) / FADE_NEAR, 0, 1);
    const pulse = 0.5 + 0.5 * Math.sin(t * 1.8);

    if (ring.current) {
      const m = ring.current.material as THREE.MeshBasicMaterial;
      m.opacity = fade * (0.24 + pulse * 0.22);
      ring.current.scale.setScalar(1 + pulse * 0.18);
    }
    if (beam.current) {
      const m = beam.current.material as THREE.MeshBasicMaterial;
      m.opacity = fade * (0.16 + pulse * 0.08);
    }
    if (chevron.current) {
      // swim ahead of the feet, lean toward the target, bob gently
      chevDir.set(tx - playerState.x, 0, tz - playerState.z);
      if (chevDir.lengthSq() > 1e-4) chevDir.normalize();
      const cx = playerState.x + chevDir.x * CHEVRON_LEAD;
      const cz = playerState.z + chevDir.z * CHEVRON_LEAD;
      const gy = (collidersReady() ? sampleGround(cx, cz) : null) ?? groundHeight(cx, cz);
      chevron.current.position.set(cx, gy + 2.15 + Math.sin(t * 2.2) * 0.08, cz);
      chevron.current.rotation.y = Math.atan2(chevDir.x, chevDir.z);
      const vis = fade * (playerState.moving ? 1 : 0.75);
      chevron.current.visible = vis > 0.05;
      chevron.current.traverse((o) => {
        const mm = (o as THREE.Mesh).material as THREE.MeshBasicMaterial | undefined;
        if (mm && "opacity" in mm) mm.opacity = 0.75 * vis;
      });
    }
  });

  if (!target) return null;
  const [tx, , tz] = target.target;
  const ty = groundHeight(tx, tz);

  return (
    <group>
      {/* target column of light + ground ring */}
      <group position={[tx, ty, tz]}>
        <mesh ref={beam} position={[0, 8, 0]}>
          <cylinderGeometry args={[0.5, 0.8, 16, 12, 1, true]} />
          <meshBasicMaterial
            map={beamTex}
            color="#c8f0b4"
            transparent
            opacity={0.2}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>
        <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
          <ringGeometry args={[0.9, 1.25, 48]} />
          <meshBasicMaterial
            color="#9fce8f"
            transparent
            opacity={0.3}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* the leading chevron — a small folded arrow that points the way */}
      <group ref={chevron}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.14, 0.42, 4]} />
          <meshBasicMaterial color="#d9f2c8" transparent opacity={0.75} depthWrite={false} toneMapped={false} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.3]} scale={0.6}>
          <coneGeometry args={[0.14, 0.42, 4]} />
          <meshBasicMaterial color="#9fce8f" transparent opacity={0.5} depthWrite={false} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

"use client";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { sanctumQuests, sanctumSecrets } from "./lib/quests";
import { useProgress } from "./lib/progress";
import { playerState } from "./lib/store";

/**
 * The world's tripwires. Every ~¼s it measures the visitor's feet (published by
 * the camera rig into `playerState`) against every quest objective and secret,
 * and marks progress in the store — so quests complete by *going there*, never
 * by clicking. Store writes are idempotent and only fire on first arrival, so
 * this never touches React state at frame rate.
 */
const INTERVAL = 0.25;

/** flat objective list: [id, x, z, r] — precomputed once at module load. */
const TRIPWIRES: [string, number, number, number][] = (() => {
  const out: [string, number, number, number][] = [];
  const seen = new Set<string>();
  for (const q of sanctumQuests) {
    if (q.secret) continue; // secret objectives go through discover(), not visit()
    for (const o of q.objectives) {
      if (seen.has(o.id)) continue;
      seen.add(o.id);
      out.push([o.id, o.target[0], o.target[2], o.radius]);
    }
  }
  return out;
})();

const SECRET_WIRES: [string, number, number, number][] = sanctumSecrets.map((s) => [
  s.id,
  s.position[0],
  s.position[2],
  s.radius,
]);

export default function SanctumQuestSensor() {
  const acc = useRef(0);
  useFrame((_, dt) => {
    acc.current += dt;
    if (acc.current < INTERVAL) return;
    acc.current = 0;
    const { visited, secrets, visit, discover } = useProgress.getState();
    const { x, z } = playerState;
    for (const [id, tx, tz, r] of TRIPWIRES) {
      if (visited[id] || secrets[id]) continue;
      const dx = x - tx;
      const dz = z - tz;
      if (dx * dx + dz * dz < r * r) visit(id);
    }
    for (const [id, tx, tz, r] of SECRET_WIRES) {
      if (secrets[id]) continue;
      const dx = x - tx;
      const dz = z - tz;
      if (dx * dx + dz * dz < r * r) discover(id);
    }
  });
  return null;
}

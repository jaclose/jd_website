"use client";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { EYE_HEIGHT, journeyNodeById } from "./lib/journey";
import { pointerLook, cameraState } from "./lib/store";
import { blocked, collidersReady, sampleGround } from "./lib/colliders";
import { groundHeight } from "./lib/terrain";

/**
 * The guided dolly, now grounded. Eases the camera toward the active node's
 * position + look with exp smoothing, pans within a clamped cone from the cursor,
 * and — in the Living Sanctum — rides the real terrain surface via a BVH downward
 * raycast and lets the visitor free-walk a few metres around a stop with WASD /
 * arrows, clamped out of trunks and landmarks by the collision world. Never
 * free-fly; movement is always bounded so composition holds.
 */
const UP = new THREE.Vector3(0, 1, 0);
const MAX_YAW = 0.42;
const MAX_PITCH = 0.2;
const MAX_WALK = 7; // metres a visitor may wander from a stop
const WALK_SPEED = 3.4;

export default function SanctumCameraRig({
  targetNodeId,
  onArrive,
  paused = false,
}: {
  targetNodeId: string;
  onArrive: (id: string) => void;
  paused?: boolean;
}) {
  const look = useRef<THREE.Vector3 | null>(null);
  if (!look.current) {
    const n = journeyNodeById(targetNodeId);
    look.current = new THREE.Vector3(n.lookAt[0], n.lookAt[1], n.lookAt[2]);
  }
  const arrived = useRef(false);
  const offset = useRef(new THREE.Vector3()); // free-walk displacement from the node
  const keys = useRef<Set<string>>(new Set());
  const desiredPos = useMemo(() => new THREE.Vector3(), []);
  const desiredLook = useMemo(() => new THREE.Vector3(), []);
  const fwd = useMemo(() => new THREE.Vector3(), []);
  const right = useMemo(() => new THREE.Vector3(), []);
  const moveDir = useMemo(() => new THREE.Vector3(), []);
  const cand = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    arrived.current = false;
    cameraState.arrived = false;
    offset.current.set(0, 0, 0); // a new stop recentres the wander
  }, [targetNodeId]);

  // WASD / arrow keys for the free-walk pocket (desktop only)
  useEffect(() => {
    const map: Record<string, string> = {
      w: "f", arrowup: "f", s: "b", arrowdown: "b",
      a: "l", arrowleft: "l", d: "r", arrowright: "r",
    };
    const down = (e: KeyboardEvent) => {
      const m = map[e.key.toLowerCase()];
      if (m) keys.current.add(m);
    };
    const up = (e: KeyboardEvent) => {
      const m = map[e.key.toLowerCase()];
      if (m) keys.current.delete(m);
    };
    const blur = () => keys.current.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, []);

  useFrame((state, dt) => {
    if (paused) return;
    const node = journeyNodeById(targetNodeId);
    const d = Math.min(dt, 0.05);
    const t = state.clock.elapsedTime;
    const k = 1.7 * node.cameraSpeed;
    const lk = look.current!;
    const sanctum = node.zone === "sanctum";

    // ── free-walk (only in the open world, only after arriving, desktop only) ──
    if (sanctum && arrived.current && pointerLook.enabled && keys.current.size) {
      fwd.copy(lk).sub(state.camera.position);
      fwd.y = 0;
      if (fwd.lengthSq() > 1e-5) fwd.normalize();
      right.crossVectors(fwd, UP).normalize();
      moveDir.set(0, 0, 0);
      if (keys.current.has("f")) moveDir.add(fwd);
      if (keys.current.has("b")) moveDir.sub(fwd);
      if (keys.current.has("r")) moveDir.add(right);
      if (keys.current.has("l")) moveDir.sub(right);
      if (moveDir.lengthSq() > 1e-5) {
        moveDir.normalize().multiplyScalar(WALK_SPEED * d);
        cand.copy(offset.current).add(moveDir);
        if (cand.length() > MAX_WALK) cand.setLength(MAX_WALK);
        if (!blocked(node.position[0] + cand.x, node.position[2] + cand.z, 0.5)) {
          offset.current.copy(cand);
        }
      }
    } else if (!sanctum) {
      offset.current.set(0, 0, 0);
    }

    const bx = node.position[0] + offset.current.x + Math.sin(t * 0.7) * 0.03;
    const bz = node.position[2] + offset.current.z;
    // ride the terrain in the sanctum; flat interior elsewhere
    let gy = node.position[1];
    if (sanctum) {
      const s = collidersReady() ? sampleGround(bx, bz) : null;
      gy = s ?? groundHeight(bx, bz);
    }
    desiredPos.set(bx, gy + EYE_HEIGHT + Math.sin(t * 1.4) * 0.02, bz);
    state.camera.position.lerp(desiredPos, 1 - Math.exp(-k * d));

    desiredLook.set(node.lookAt[0], node.lookAt[1], node.lookAt[2]);
    // when wandering, carry the look target along so the view stays composed
    desiredLook.x += offset.current.x;
    desiredLook.z += offset.current.z;
    if (node.allowLookAround && pointerLook.enabled) {
      const yaw = THREE.MathUtils.clamp(pointerLook.x, -1, 1) * MAX_YAW;
      const pitch = THREE.MathUtils.clamp(-pointerLook.y, -1, 1) * MAX_PITCH;
      fwd.copy(desiredLook).sub(state.camera.position);
      const dist = Math.max(fwd.length(), 0.001);
      fwd.normalize();
      right.crossVectors(fwd, UP).normalize();
      desiredLook.addScaledVector(right, Math.tan(yaw) * dist);
      desiredLook.addScaledVector(UP, Math.tan(pitch) * dist);
    }
    lk.lerp(desiredLook, 1 - Math.exp(-5 * d));
    state.camera.lookAt(lk);

    if (!arrived.current) {
      if (state.camera.position.distanceTo(desiredPos) < 0.3) {
        arrived.current = true;
        cameraState.arrived = true;
        onArrive(targetNodeId);
      }
    }
  });

  return null;
}

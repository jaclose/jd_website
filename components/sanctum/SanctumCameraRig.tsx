"use client";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { EYE_HEIGHT, journeyNodeById } from "./lib/journey";
import { pointerLook, cameraState, sanctumControl, sanctumAudio } from "./lib/store";
import { blocked, collidersReady, sampleGround } from "./lib/colliders";
import { groundHeight, SANCTUM_BOUNDS } from "./lib/terrain";

/**
 * The guided dolly, now grounded and walkable. Eases the camera toward the active
 * node's position + look with exp smoothing, pans within a clamped cone from the
 * cursor, and — in the Living Sanctum — rides the real terrain via a BVH downward
 * raycast. Two movement modes share the rig: the default **guided** mode lets you
 * wander a few metres around a stop (composition always holds); **free-roam**
 * (`sanctumControl.freeRoam`, toggled by the overlay's "Walk here") lifts that
 * clamp so you walk the whole footprint, bounded by `SANCTUM_BOUNDS` and the
 * collision world — never free-fly. Locomotion drives a footstep-paced head-bob
 * + lateral sway and fires `sanctumAudio.footstep` on each footfall, so it reads
 * as walking, not gliding.
 */
const UP = new THREE.Vector3(0, 1, 0);
const MAX_YAW = 0.72; // wider cursor look so the world feels explorable from a stop
const MAX_PITCH = 0.34;
const FREE_YAW = 1.25; // free-roam lets you look much further around
const FREE_PITCH = 0.55;
const MAX_WALK = 7; // metres a visitor may wander from a stop in guided mode
const WALK_SPEED = 3.4;
const STRIDE = 0.85; // metres between footfalls
const MAX_CAMERA_DT = 0.75;
const MAX_WALK_DT = 0.05;

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
  // walk-cycle bookkeeping
  const prevX = useRef<number | null>(null);
  const prevZ = useRef<number | null>(null);
  const strideAccum = useRef(0);
  const bobPhase = useRef(0);
  const speedSmooth = useRef(0);
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

  // WASD / arrow keys for the walk (desktop only)
  useEffect(() => {
    const map: Record<string, string> = {
      w: "f", arrowup: "f", s: "b", arrowdown: "b",
      a: "l", arrowleft: "l", d: "r", arrowright: "r",
    };
    const down = (e: KeyboardEvent) => {
      const m = map[e.key.toLowerCase()];
      if (m) {
        keys.current.add(m);
        // while free-roaming, claim the arrow keys so the page doesn't scroll
        if (sanctumControl.freeRoam && e.key.toLowerCase().startsWith("arrow")) e.preventDefault();
      }
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
    const d = Math.min(dt, MAX_CAMERA_DT);
    const walkDt = Math.min(dt, MAX_WALK_DT);
    const t = state.clock.elapsedTime;
    const k = 1.7 * node.cameraSpeed;
    const lk = look.current!;
    const sanctum = node.zone === "sanctum";
    const freeRoam = sanctumControl.freeRoam && sanctum;

    // ── walking (only in the open world, only after arriving, desktop only) ──
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
        moveDir.normalize().multiplyScalar(WALK_SPEED * walkDt);
        cand.copy(offset.current).add(moveDir);
        let ax = node.position[0] + cand.x;
        let az = node.position[2] + cand.z;
        if (freeRoam) {
          // open walk: clamp to the playable footprint instead of a stop pocket
          ax = THREE.MathUtils.clamp(ax, SANCTUM_BOUNDS.minX + 1, SANCTUM_BOUNDS.maxX - 1);
          az = THREE.MathUtils.clamp(az, SANCTUM_BOUNDS.minZ + 1, SANCTUM_BOUNDS.maxZ - 1);
        } else if (cand.length() > MAX_WALK) {
          cand.setLength(MAX_WALK);
          ax = node.position[0] + cand.x;
          az = node.position[2] + cand.z;
        }
        if (!blocked(ax, az, 0.5)) {
          offset.current.set(ax - node.position[0], 0, az - node.position[2]);
        }
      }
    } else if (!sanctum) {
      offset.current.set(0, 0, 0);
    }

    const bx = node.position[0] + offset.current.x;
    const bz = node.position[2] + offset.current.z;
    // ride the terrain in the sanctum; flat interior elsewhere
    let gy = node.position[1];
    if (sanctum) {
      const s = collidersReady() ? sampleGround(bx, bz) : null;
      gy = s ?? groundHeight(bx, bz);
    }

    // ── walk cycle: pace by ground distance travelled (excludes the bob itself) ──
    const px = prevX.current ?? bx;
    const pz = prevZ.current ?? bz;
    const stepDelta = Math.hypot(bx - px, bz - pz);
    prevX.current = bx;
    prevZ.current = bz;
    const instSpeed = stepDelta / Math.max(dt, 1e-3);
    speedSmooth.current = THREE.MathUtils.lerp(
      speedSmooth.current,
      THREE.MathUtils.clamp(instSpeed / WALK_SPEED, 0, 1),
      1 - Math.exp(-6 * d),
    );
    strideAccum.current += stepDelta;
    if (strideAccum.current >= STRIDE) {
      strideAccum.current -= STRIDE;
      sanctumAudio.footstep();
    }
    bobPhase.current += stepDelta * (Math.PI / STRIDE); // one bob per footfall
    const moveAmt = speedSmooth.current;
    // breathing when idle, a pronounced footstep bob + sway when walking, so the
    // guided traversal reads as a walk from the POV rather than a smooth dolly
    const bobY = Math.sin(bobPhase.current) * 0.075 * moveAmt + Math.sin(t * 1.3) * 0.012 * (1 - moveAmt);
    const swayAmt = Math.cos(bobPhase.current * 0.5) * 0.06 * moveAmt;

    // heading right vector for the lateral sway
    fwd.copy(lk).sub(state.camera.position);
    fwd.y = 0;
    if (fwd.lengthSq() > 1e-5) fwd.normalize();
    right.crossVectors(fwd, UP).normalize();

    desiredPos.set(bx, gy + EYE_HEIGHT + bobY, bz);
    desiredPos.addScaledVector(right, swayAmt);
    state.camera.position.lerp(desiredPos, 1 - Math.exp(-k * d));

    desiredLook.set(node.lookAt[0], node.lookAt[1], node.lookAt[2]);
    // when wandering, carry the look target along so the view stays composed
    desiredLook.x += offset.current.x;
    desiredLook.z += offset.current.z;
    if (node.allowLookAround && pointerLook.enabled) {
      const maxYaw = freeRoam ? FREE_YAW : MAX_YAW;
      const maxPitch = freeRoam ? FREE_PITCH : MAX_PITCH;
      const yaw = THREE.MathUtils.clamp(pointerLook.x, -1, 1) * maxYaw;
      const pitch = THREE.MathUtils.clamp(-pointerLook.y, -1, 1) * maxPitch;
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

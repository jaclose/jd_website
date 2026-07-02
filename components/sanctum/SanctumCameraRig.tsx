"use client";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { EYE_HEIGHT, journeyNodeById } from "./lib/journey";
import { pointerLook, cameraState, sanctumControl, sanctumAudio, playerState } from "./lib/store";
import { blocked, collidersReady, sampleGround } from "./lib/colliders";
import { groundHeight, SANCTUM_BOUNDS } from "./lib/terrain";
import { useProgress } from "./lib/progress";

/**
 * The guided dolly + first-person walker, unified around one "feet" position.
 *
 * GUIDED (default): feet ease toward the active node, the cursor pans a clamped
 * look cone from the node's composed lookAt. FREE-ROAM: the rig owns a real
 * heading/pitch — WASD moves relative to facing (A/D strafe), arrows/Q/E turn,
 * dragging turns a full 360°, Shift sprints with a slight FOV kick, and velocity
 * eases in/out so steps have weight. Pressing a move key in the Living Sanctum
 * *enters* free-roam automatically (no toggle hunting); Esc hands back to the
 * guided tour and the camera settles home to the node.
 *
 * Both modes ride the BVH terrain, clamp to SANCTUM_BOUNDS + the collision
 * world (axis-separated so you slide along trunks rather than stick), and drive
 * a footstep-paced head-bob + lateral sway with footfall audio events — so it
 * reads as walking, never gliding or free-flying. The rig also publishes
 * `playerState` (feet + facing) every frame for the quest sensor / DOM tracker,
 * and accumulates walked metres into the progress store.
 */
const UP = new THREE.Vector3(0, 1, 0);
const MAX_YAW = 0.72; // guided: cursor look cone
const MAX_PITCH = 0.34;
const FREE_HOVER_YAW = 0.42; // free-roam: hover micro-look on top of heading
const FREE_HOVER_PITCH = 0.42;
const EDGE_TURN = 1.15; // rad/s when the mouse rests at the screen edge
const DRAG_TURN = 2.2; // rad per full-stage drag
const KEY_TURN = 1.6; // rad/s on arrow/Q/E turn
const WALK_SPEED = 3.2;
const SPRINT_SPEED = 5.4;
const ACCEL = 9; // 1/s — velocity ease-in/out
const STRIDE = 0.85; // metres between footfalls
const MAX_CAMERA_DT = 0.75;
const MAX_WALK_DT = 0.05;
const BASE_FOV = 58;
const SPRINT_FOV = 63;
const MIN_PITCH = -0.9;
const MAX_FREE_PITCH = 0.7;

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
  const feet = useRef<THREE.Vector3 | null>(null);
  if (!look.current) {
    const n = journeyNodeById(targetNodeId);
    look.current = new THREE.Vector3(n.lookAt[0], n.lookAt[1], n.lookAt[2]);
    feet.current = new THREE.Vector3(n.position[0], n.position[1], n.position[2]);
  }
  const arrived = useRef(false);
  const keys = useRef<Set<string>>(new Set());
  const wasFree = useRef(false);
  const heading = useRef(Math.PI); // faces -z at start (into the room's light)
  const pitch = useRef(0);
  const vel = useRef(new THREE.Vector3());
  // walk-cycle bookkeeping
  const prevX = useRef<number | null>(null);
  const prevZ = useRef<number | null>(null);
  const strideAccum = useRef(0);
  const metresAccum = useRef(0);
  const bobPhase = useRef(0);
  const speedSmooth = useRef(0);
  const desiredPos = useMemo(() => new THREE.Vector3(), []);
  const desiredLook = useMemo(() => new THREE.Vector3(), []);
  const fwd = useMemo(() => new THREE.Vector3(), []);
  const right = useMemo(() => new THREE.Vector3(), []);
  const moveDir = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    arrived.current = false;
    cameraState.arrived = false;
  }, [targetNodeId]);

  // key capture: movement + turning + sprint. Arrow keys are claimed while
  // free-roaming so the page never scrolls under the walk.
  useEffect(() => {
    const map: Record<string, string> = {
      w: "f", arrowup: "f", s: "b", arrowdown: "b",
      a: "l", d: "r",
      arrowleft: "tl", arrowright: "tr", q: "tl", e: "tr",
      shift: "sprint",
    };
    const down = (e: KeyboardEvent) => {
      const m = map[e.key.toLowerCase()];
      if (m) {
        keys.current.add(m);
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
    const lk = look.current!;
    const ft = feet.current!;
    const sanctum = node.zone === "sanctum";
    const cam = state.camera as THREE.PerspectiveCamera;

    const moveKey =
      keys.current.has("f") || keys.current.has("b") || keys.current.has("l") || keys.current.has("r");

    // walking in the Living Sanctum just *is* free-roam — no toggle hunting.
    if (sanctum && arrived.current && moveKey && !sanctumControl.freeRoam && pointerLook.enabled) {
      sanctumControl.setFreeRoam(true);
    }
    const freeRoam = sanctumControl.freeRoam && sanctum;

    // on entering free-roam, adopt the camera's current facing so nothing snaps
    // (convention: forward(heading) = (-sin h, 0, -cos h), so h=0 faces -z)
    if (freeRoam && !wasFree.current) {
      fwd.copy(lk).sub(cam.position);
      heading.current = Math.atan2(-fwd.x, -fwd.z);
      pitch.current = 0;
      vel.current.set(0, 0, 0);
      pointerLook.dragDX = 0;
      pointerLook.dragDY = 0;
    }
    wasFree.current = freeRoam;

    if (freeRoam) {
      // ── turning: drag (360°), screen-edge hover, arrow/Q/E keys ──
      heading.current -= pointerLook.dragDX * DRAG_TURN;
      pitch.current = THREE.MathUtils.clamp(
        pitch.current - pointerLook.dragDY * DRAG_TURN * 0.6,
        MIN_PITCH,
        MAX_FREE_PITCH,
      );
      pointerLook.dragDX = 0;
      pointerLook.dragDY = 0;
      const edge = Math.abs(pointerLook.x) > 0.62 ? Math.sign(pointerLook.x) * ((Math.abs(pointerLook.x) - 0.62) / 0.38) : 0;
      heading.current -= edge * EDGE_TURN * d;
      if (keys.current.has("tl")) heading.current += KEY_TURN * d;
      if (keys.current.has("tr")) heading.current -= KEY_TURN * d;

      // ── locomotion: velocity eased toward intent, axis-separated collision ──
      const sinH = Math.sin(heading.current);
      const cosH = Math.cos(heading.current);
      fwd.set(-sinH, 0, -cosH);
      right.crossVectors(fwd, UP).normalize();
      moveDir.set(0, 0, 0);
      if (keys.current.has("f")) moveDir.add(fwd);
      if (keys.current.has("b")) moveDir.sub(fwd);
      if (keys.current.has("r")) moveDir.add(right);
      if (keys.current.has("l")) moveDir.sub(right);
      const sprinting = keys.current.has("sprint") && moveDir.lengthSq() > 0;
      const speed = sprinting ? SPRINT_SPEED : WALK_SPEED;
      if (moveDir.lengthSq() > 1e-5) moveDir.normalize().multiplyScalar(speed);
      vel.current.lerp(moveDir, 1 - Math.exp(-ACCEL * d));
      if (vel.current.lengthSq() > 1e-6) {
        let nx = ft.x + vel.current.x * walkDt;
        let nz = ft.z + vel.current.z * walkDt;
        nx = THREE.MathUtils.clamp(nx, SANCTUM_BOUNDS.minX + 1, SANCTUM_BOUNDS.maxX - 1);
        nz = THREE.MathUtils.clamp(nz, SANCTUM_BOUNDS.minZ + 1, SANCTUM_BOUNDS.maxZ - 1);
        // slide along obstacles instead of sticking to them
        if (!blocked(nx, nz, 0.5)) {
          ft.x = nx;
          ft.z = nz;
        } else if (!blocked(nx, ft.z, 0.5)) {
          ft.x = nx;
        } else if (!blocked(ft.x, nz, 0.5)) {
          ft.z = nz;
        }
      }
      // sprint FOV kick
      const targetFov = sprinting && speedSmooth.current > 0.4 ? SPRINT_FOV : BASE_FOV;
      if (Math.abs(cam.fov - targetFov) > 0.05) {
        cam.fov = THREE.MathUtils.lerp(cam.fov, targetFov, 1 - Math.exp(-3 * d));
        cam.updateProjectionMatrix();
      }
    } else {
      // guided: feet ease home to the node
      const k = 1.7 * node.cameraSpeed;
      ft.x = THREE.MathUtils.lerp(ft.x, node.position[0], 1 - Math.exp(-k * d));
      ft.z = THREE.MathUtils.lerp(ft.z, node.position[2], 1 - Math.exp(-k * d));
      vel.current.set(0, 0, 0);
      pointerLook.dragDX = 0;
      pointerLook.dragDY = 0;
      if (Math.abs(cam.fov - BASE_FOV) > 0.05) {
        cam.fov = THREE.MathUtils.lerp(cam.fov, BASE_FOV, 1 - Math.exp(-3 * d));
        cam.updateProjectionMatrix();
      }
    }

    // ride the terrain in the sanctum; flat interior elsewhere
    let gy = node.position[1];
    if (sanctum) {
      const s = collidersReady() ? sampleGround(ft.x, ft.z) : null;
      gy = s ?? groundHeight(ft.x, ft.z);
    }
    ft.y = gy;

    // ── walk cycle: pace by ground distance travelled (excludes the bob itself) ──
    const px = prevX.current ?? ft.x;
    const pz = prevZ.current ?? ft.z;
    const stepDelta = Math.hypot(ft.x - px, ft.z - pz);
    prevX.current = ft.x;
    prevZ.current = ft.z;
    const instSpeed = stepDelta / Math.max(dt, 1e-3);
    speedSmooth.current = THREE.MathUtils.lerp(
      speedSmooth.current,
      THREE.MathUtils.clamp(instSpeed / WALK_SPEED, 0, 1.4),
      1 - Math.exp(-6 * d),
    );
    strideAccum.current += stepDelta;
    if (strideAccum.current >= STRIDE) {
      strideAccum.current -= STRIDE;
      sanctumAudio.footstep();
    }
    // walked metres → Wanderer achievement (flushed in ~2m increments)
    if (sanctum) {
      metresAccum.current += stepDelta;
      if (metresAccum.current > 2) {
        useProgress.getState().addMetres(metresAccum.current);
        metresAccum.current = 0;
      }
    }
    bobPhase.current += stepDelta * (Math.PI / STRIDE); // one bob per footfall
    const moveAmt = Math.min(speedSmooth.current, 1);
    // breathing when idle, a pronounced footstep bob + sway when walking
    const bobY = Math.sin(bobPhase.current) * 0.075 * moveAmt + Math.sin(t * 1.3) * 0.012 * (1 - moveAmt);
    const swayAmt = Math.cos(bobPhase.current * 0.5) * 0.06 * moveAmt;

    // heading right vector for the lateral sway
    fwd.copy(lk).sub(cam.position);
    fwd.y = 0;
    if (fwd.lengthSq() > 1e-5) fwd.normalize();
    right.crossVectors(fwd, UP).normalize();

    desiredPos.set(ft.x, ft.y + EYE_HEIGHT + bobY, ft.z);
    desiredPos.addScaledVector(right, swayAmt);
    const km = freeRoam ? 14 : 1.7 * node.cameraSpeed; // free-roam tracks feet tightly
    cam.position.lerp(desiredPos, 1 - Math.exp(-km * d));

    // ── look target ──
    if (freeRoam) {
      // facing is the heading; the hovering cursor adds a small free-look on top
      const hoverYaw = pointerLook.enabled ? THREE.MathUtils.clamp(pointerLook.x, -1, 1) * FREE_HOVER_YAW * 0.5 : 0;
      const hoverPitch = pointerLook.enabled ? THREE.MathUtils.clamp(-pointerLook.y, -1, 1) * FREE_HOVER_PITCH : 0;
      const yaw = heading.current - hoverYaw;
      const p = THREE.MathUtils.clamp(pitch.current + hoverPitch, MIN_PITCH, MAX_FREE_PITCH);
      const cp = Math.cos(p);
      desiredLook.set(
        cam.position.x - Math.sin(yaw) * cp * 10,
        cam.position.y + Math.sin(p) * 10,
        cam.position.z - Math.cos(yaw) * cp * 10,
      );
      lk.lerp(desiredLook, 1 - Math.exp(-9 * d));
    } else {
      desiredLook.set(node.lookAt[0], node.lookAt[1], node.lookAt[2]);
      if (node.allowLookAround && pointerLook.enabled) {
        const yaw = THREE.MathUtils.clamp(pointerLook.x, -1, 1) * MAX_YAW;
        const pit = THREE.MathUtils.clamp(-pointerLook.y, -1, 1) * MAX_PITCH;
        fwd.copy(desiredLook).sub(cam.position);
        const dist = Math.max(fwd.length(), 0.001);
        fwd.normalize();
        right.crossVectors(fwd, UP).normalize();
        desiredLook.addScaledVector(right, Math.tan(yaw) * dist);
        desiredLook.addScaledVector(UP, Math.tan(pit) * dist);
      }
      lk.lerp(desiredLook, 1 - Math.exp(-5 * d));
    }
    cam.lookAt(lk);

    // publish feet + facing for the quest sensor / DOM tracker
    playerState.x = ft.x;
    playerState.y = ft.y;
    playerState.z = ft.z;
    fwd.copy(lk).sub(cam.position);
    playerState.yaw = Math.atan2(-fwd.x, -fwd.z);
    playerState.moving = moveAmt > 0.12;

    if (!arrived.current && !freeRoam) {
      if (cam.position.distanceTo(desiredPos) < 0.3) {
        arrived.current = true;
        cameraState.arrived = true;
        onArrive(targetNodeId);
      }
    }
  });

  return null;
}

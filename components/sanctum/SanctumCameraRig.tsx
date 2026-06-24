"use client";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { EYE_HEIGHT, journeyNodeById } from "./lib/journey";
import { pointerLook, cameraState } from "./lib/store";

/**
 * The guided dolly. Eases the camera toward the active node's position + look
 * with exp smoothing (the same `1−e^(−k·dt)` feel the old walk used), adds a
 * faint handheld bob, and lets the cursor/touch pan the view within a clamped
 * cone — never free-fly, so composition can't break. Reports arrival once so the
 * controller can commit the node (and reveal forks / the inspect affordance).
 */
const UP = new THREE.Vector3(0, 1, 0);
const MAX_YAW = 0.42;   // rad of horizontal look-around
const MAX_PITCH = 0.2;  // rad of vertical look-around

export default function SanctumCameraRig({
  targetNodeId,
  onArrive,
  paused = false,
}: {
  targetNodeId: string;
  onArrive: (id: string) => void;
  paused?: boolean;
}) {
  // initialise the look target to the starting node's lookAt so the camera faces
  // the right way from the first frame (deep-links land already composed, and the
  // normal room start looks straight at the doorway).
  const look = useRef<THREE.Vector3 | null>(null);
  if (!look.current) {
    const n = journeyNodeById(targetNodeId);
    look.current = new THREE.Vector3(n.lookAt[0], n.lookAt[1], n.lookAt[2]);
  }
  const arrived = useRef(false);
  const desiredPos = useMemo(() => new THREE.Vector3(), []);
  const desiredLook = useMemo(() => new THREE.Vector3(), []);
  const fwd = useMemo(() => new THREE.Vector3(), []);
  const right = useMemo(() => new THREE.Vector3(), []);

  // reset the arrival latch whenever the destination changes
  useEffect(() => {
    arrived.current = false;
    cameraState.arrived = false;
  }, [targetNodeId]);

  useFrame((state, dt) => {
    if (paused) return;
    const node = journeyNodeById(targetNodeId);
    const d = Math.min(dt, 0.05);
    const t = state.clock.elapsedTime;
    const k = 1.7 * node.cameraSpeed;

    desiredPos.set(node.position[0], node.position[1] + EYE_HEIGHT, node.position[2]);
    // faint handheld drift so the frame is never dead-still
    desiredPos.x += Math.sin(t * 0.7) * 0.03;
    desiredPos.y += Math.sin(t * 1.4) * 0.02;
    state.camera.position.lerp(desiredPos, 1 - Math.exp(-k * d));

    desiredLook.set(node.lookAt[0], node.lookAt[1], node.lookAt[2]);
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
    const lk = look.current!;
    lk.lerp(desiredLook, 1 - Math.exp(-5 * d));
    state.camera.lookAt(lk);

    // arrival latch
    if (!arrived.current) {
      const reached = state.camera.position.distanceTo(desiredPos);
      if (reached < 0.3) {
        arrived.current = true;
        cameraState.arrived = true;
        onArrive(targetNodeId);
      }
    }
  });

  return null;
}

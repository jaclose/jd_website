"use client";
import { useFrame } from "@react-three/fiber";
import { useEffect } from "react";
import { windUniforms } from "./shaders/wind";

/**
 * The single heartbeat for every swaying material in Sanctum. Advances the
 * shared wind clock and a slow gust envelope once per frame and writes them into
 * the module-level `windUniforms` that grass/leaf/vine/mist/firefly materials all
 * reference — so there is exactly one place wind is computed, and no per-material
 * React state in the frame loop.
 *
 * Wind slowly rotates direction and breathes gusts in and out so the world never
 * feels metronomic.
 */
export function SanctumWindSystem({
  strength = 1,
  direction = [0.82, 0.34],
  paused = false,
}: {
  strength?: number;
  direction?: [number, number];
  paused?: boolean;
}) {
  useEffect(() => {
    windUniforms.uWindStrength.value = strength;
    windUniforms.uWindDir.value.set(direction[0], direction[1]).normalize();
  }, [strength, direction]);

  useFrame((_, dt) => {
    if (paused) return;
    const d = Math.min(dt, 0.05);
    windUniforms.uTime.value += d;
    const t = windUniforms.uTime.value;
    // gusts: a slow sin layered with a slower one → an irregular swell 0..1
    const g = 0.5 + 0.5 * Math.sin(t * 0.21) * Math.sin(t * 0.07 + 1.3);
    windUniforms.uGust.value += (g - windUniforms.uGust.value) * (1 - Math.exp(-1.5 * d));
    // wind direction drifts a few degrees so foliage isn't dead-uniform
    const ang = Math.atan2(direction[1], direction[0]) + Math.sin(t * 0.05) * 0.18;
    windUniforms.uWindDir.value.set(Math.cos(ang), Math.sin(ang));
  });

  return null;
}

/** reset the clock when (re)mounting so revisits start calm, not mid-gust. */
export function useResetWind() {
  useEffect(() => {
    windUniforms.uTime.value = 0;
    windUniforms.uGust.value = 0;
    windUniforms.uWindDir.value.set(0.82, 0.34).normalize();
  }, []);
}

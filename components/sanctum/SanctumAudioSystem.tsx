"use client";
import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import * as THREE from "three";
import { gardenFeatureById } from "@/data/gardenFeatures";
import { sanctumAudio } from "./lib/store";

/**
 * Directional, fully procedural ambience — no audio files, no licensing, no
 * download weight. A global wind bed (looping noise → lowpass with a slow gust
 * LFO) plus a *positional* water source at the tide-pool landmark, spatialised
 * through a THREE.AudioListener riding the camera, so the water swells as you
 * approach it and falls behind you as you leave. Gated behind a real user
 * gesture (autoplay policy) via the sanctumAudio bridge; silent until enabled.
 */
function makeNoise(ctx: AudioContext, seconds: number) {
  const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < d.length; i++) {
    // brown-ish noise — softer, more natural than white
    const w = Math.random() * 2 - 1;
    last = (last + 0.02 * w) / 1.02;
    d[i] = last * 3.5;
  }
  return buf;
}

export default function SanctumAudioSystem() {
  const camera = useThree((s) => s.camera);
  const scene = useThree((s) => s.scene);

  useEffect(() => {
    let cleanup = () => {};
    try {
      const listener = new THREE.AudioListener();
      camera.add(listener);
      const ctx = listener.context;
      const noise = makeNoise(ctx, 3);

      // ── global wind bed ──
      const windSrc = ctx.createBufferSource();
      windSrc.buffer = noise;
      windSrc.loop = true;
      const windLP = ctx.createBiquadFilter();
      windLP.type = "lowpass";
      windLP.frequency.value = 380;
      windSrc.connect(windLP);
      const wind = new THREE.Audio(listener);
      windLP.connect(wind.gain); // route into THREE.Audio's gain → listener
      wind.setVolume(0);
      // slow gust LFO modulating the cutoff
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.06;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 220;
      lfo.connect(lfoGain);
      lfoGain.connect(windLP.frequency);

      // ── positional water at the tide pool (wave-depth landmark) ──
      const pool = gardenFeatureById("wave-depth");
      const waterSrc = ctx.createBufferSource();
      waterSrc.buffer = noise;
      waterSrc.loop = true;
      const waterBP = ctx.createBiquadFilter();
      waterBP.type = "bandpass";
      waterBP.frequency.value = 780;
      waterBP.Q.value = 0.6;
      waterSrc.connect(waterBP);
      const water = new THREE.PositionalAudio(listener);
      waterBP.connect(water.panner); // route through the panner → spatialised
      water.setRefDistance(5);
      water.setMaxDistance(40);
      water.setRolloffFactor(1.4);
      water.setVolume(0);
      if (pool) water.position.set(pool.position[0], 0.5, pool.position[2]);
      scene.add(water); // in the graph so its world position spatialises the panner

      windSrc.start();
      waterSrc.start();
      lfo.start();

      const apply = (on: boolean) => {
        wind.gain.gain.setTargetAtTime(on ? 0.16 : 0, ctx.currentTime, 0.6);
        water.gain.gain.setTargetAtTime(on ? 0.55 : 0, ctx.currentTime, 0.6);
      };
      sanctumAudio.resume = () => {
        if (ctx.state === "suspended") void ctx.resume();
      };
      sanctumAudio.apply = apply;
      if (sanctumAudio.on) {
        sanctumAudio.resume();
        apply(true);
      }

      cleanup = () => {
        try {
          apply(false);
          windSrc.stop();
          waterSrc.stop();
          lfo.stop();
          scene.remove(water);
          camera.remove(listener);
          sanctumAudio.apply = () => {};
          sanctumAudio.resume = () => {};
        } catch {
          /* already torn down */
        }
      };
    } catch {
      /* WebAudio unavailable — fail silent, never break the scene */
    }
    return () => cleanup();
  }, [camera, scene]);

  // the positional source is attached to the listener graph; nothing to render.
  return null;
}

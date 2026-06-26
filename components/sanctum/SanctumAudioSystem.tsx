"use client";
import { useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { gardenFeatureById } from "@/data/gardenFeatures";
import { AUDIO_MOODS, type AudioMood } from "./lib/audioMoods";
import type { Zone } from "./lib/journey";
import { sanctumAudio } from "./lib/store";

/**
 * Directional, fully procedural ambience — no audio files, no licensing, no
 * download weight. Layered beds (wind, leaf-rustle, cold room hum, insect
 * shimmer, scheduled birdsong, plus a *positional* stream at the tide pool) are
 * built once and spatialised through a THREE.AudioListener riding the camera.
 * Each layer eases toward the active zone's target in `audioMoods.ts`, so walking
 * room → threshold → sanctum crossfades the whole mix exactly like the light and
 * fog do. Footfalls are fired from the camera rig via `sanctumAudio.footstep`.
 * Gated behind a real user gesture (autoplay policy); silent until enabled.
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

export default function SanctumAudioSystem({ zone }: { zone: Zone }) {
  const camera = useThree((s) => s.camera);
  const scene = useThree((s) => s.scene);
  const zoneRef = useRef<Zone>(zone);
  zoneRef.current = zone;

  useEffect(() => {
    let cleanup = () => {};
    try {
      const listener = new THREE.AudioListener();
      camera.add(listener);
      const ctx = listener.context;
      const bus = listener.gain; // master GainNode → destination; mix non-spatial beds here
      const noise = makeNoise(ctx, 3);
      const loop = () => {
        const s = ctx.createBufferSource();
        s.buffer = noise;
        s.loop = true;
        return s;
      };

      let masterOn = sanctumAudio.on;

      // ── wind bed (lowpass noise + slow gust LFO on the cutoff) ──
      const windSrc = loop();
      const windLP = ctx.createBiquadFilter();
      windLP.type = "lowpass";
      windLP.frequency.value = 380;
      const windGain = ctx.createGain();
      windGain.gain.value = 0;
      windSrc.connect(windLP).connect(windGain).connect(bus);
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.06;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 160;
      lfo.connect(lfoGain).connect(windLP.frequency);

      // ── leaf-rustle bed (papery highpassed noise) ──
      const leafSrc = loop();
      const leafHP = ctx.createBiquadFilter();
      leafHP.type = "highpass";
      leafHP.frequency.value = 2200;
      const leafGain = ctx.createGain();
      leafGain.gain.value = 0;
      leafSrc.connect(leafHP).connect(leafGain).connect(bus);

      // ── cold room hum (low sine + low filtered noise) ──
      const humOsc = ctx.createOscillator();
      humOsc.type = "sine";
      humOsc.frequency.value = 58;
      const humNoise = loop();
      const humLP = ctx.createBiquadFilter();
      humLP.type = "lowpass";
      humLP.frequency.value = 160;
      const humGain = ctx.createGain();
      humGain.gain.value = 0;
      humOsc.connect(humGain);
      humNoise.connect(humLP).connect(humGain);
      humGain.connect(bus);

      // ── insect shimmer (narrow high bandpass noise) ──
      const insectSrc = loop();
      const insectBP = ctx.createBiquadFilter();
      insectBP.type = "bandpass";
      insectBP.frequency.value = 5200;
      insectBP.Q.value = 4;
      const insectGain = ctx.createGain();
      insectGain.gain.value = 0;
      insectSrc.connect(insectBP).connect(insectGain).connect(bus);

      // ── birdsong (scheduled chirps through a level bus) ──
      const birdBus = ctx.createGain();
      birdBus.gain.value = 0;
      birdBus.connect(bus);
      const chirp = (gain: number) => {
        const t0 = ctx.currentTime;
        const osc = ctx.createOscillator();
        osc.type = "sine";
        const f0 = 1900 + Math.random() * 2400;
        osc.frequency.setValueAtTime(f0, t0);
        osc.frequency.exponentialRampToValueAtTime(f0 * (0.55 + Math.random() * 0.5), t0 + 0.07);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.1 + Math.random() * 0.12);
        const pan = ctx.createStereoPanner();
        pan.pan.value = Math.random() * 1.6 - 0.8;
        osc.connect(g).connect(pan).connect(birdBus);
        osc.start(t0);
        osc.stop(t0 + 0.35);
      };
      let birdTimer = 0;
      const scheduleBird = () => {
        const target = AUDIO_MOODS[zoneRef.current].birds;
        const delay = 500 + Math.random() * (target > 0 ? 2400 : 5000);
        birdTimer = window.setTimeout(() => {
          if (masterOn && target > 0 && ctx.state === "running") {
            chirp(0.05 + Math.random() * 0.06);
            if (Math.random() < 0.35) window.setTimeout(() => chirp(0.04 + Math.random() * 0.05), 130);
          }
          scheduleBird();
        }, delay);
      };

      // ── positional stream at the tide pool (wave-depth landmark) ──
      const pool = gardenFeatureById("wave-depth");
      const waterSrc = loop();
      const waterBP = ctx.createBiquadFilter();
      waterBP.type = "bandpass";
      waterBP.frequency.value = 780;
      waterBP.Q.value = 0.6;
      waterSrc.connect(waterBP);
      const water = new THREE.PositionalAudio(listener);
      waterBP.connect(water.panner);
      water.setRefDistance(5);
      water.setMaxDistance(40);
      water.setRolloffFactor(1.4);
      water.setVolume(0);
      if (pool) water.position.set(pool.position[0], 0.5, pool.position[2]);
      scene.add(water);

      // ── footstep one-shot (soft filtered noise thud) ──
      const stepLP = ctx.createBiquadFilter();
      stepLP.type = "lowpass";
      stepLP.frequency.value = 520;
      stepLP.connect(bus);
      const footstep = () => {
        if (!masterOn || ctx.state !== "running") return;
        const t0 = ctx.currentTime;
        const s = ctx.createBufferSource();
        s.buffer = noise;
        s.playbackRate.value = 0.7 + Math.random() * 0.3;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(0.06 + Math.random() * 0.03, t0 + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16);
        s.connect(g).connect(stepLP);
        s.start(t0);
        s.stop(t0 + 0.25);
      };

      windSrc.start();
      leafSrc.start();
      humNoise.start();
      humOsc.start();
      insectSrc.start();
      waterSrc.start();
      lfo.start();
      scheduleBird();

      // ── crossfade the whole mix toward a zone's mood ──
      const TC = 0.7; // time-constant: smooth, unhurried transitions
      const applyZone = (m: AudioMood) => {
        const now = ctx.currentTime;
        const k = masterOn ? 1 : 0;
        windGain.gain.setTargetAtTime(m.wind * k, now, TC);
        windLP.frequency.setTargetAtTime(m.windCutoff, now, TC);
        leafGain.gain.setTargetAtTime(m.leaves * k, now, TC);
        humGain.gain.setTargetAtTime(m.roomHum * k, now, TC);
        insectGain.gain.setTargetAtTime(m.insects * k, now, TC);
        birdBus.gain.setTargetAtTime((m.birds > 0 ? 1 : 0) * k, now, TC);
        water.gain.gain.setTargetAtTime(m.water * k, now, TC);
      };

      sanctumAudio.resume = () => {
        if (ctx.state === "suspended") void ctx.resume();
      };
      sanctumAudio.apply = (on: boolean) => {
        masterOn = on;
        applyZone(AUDIO_MOODS[zoneRef.current]);
      };
      sanctumAudio.setZone = (z) => applyZone(AUDIO_MOODS[z]);
      sanctumAudio.footstep = footstep;
      applyZone(AUDIO_MOODS[zoneRef.current]);
      if (sanctumAudio.on) sanctumAudio.resume();

      cleanup = () => {
        try {
          window.clearTimeout(birdTimer);
          masterOn = false;
          windSrc.stop();
          leafSrc.stop();
          humNoise.stop();
          humOsc.stop();
          insectSrc.stop();
          waterSrc.stop();
          lfo.stop();
          scene.remove(water);
          camera.remove(listener);
          sanctumAudio.apply = () => {};
          sanctumAudio.resume = () => {};
          sanctumAudio.setZone = () => {};
          sanctumAudio.footstep = () => {};
        } catch {
          /* already torn down */
        }
      };
    } catch {
      /* WebAudio unavailable — fail silent, never break the scene */
    }
    return () => cleanup();
  }, [camera, scene]);

  // crossfade whenever the active zone changes (graph is built once, above).
  useEffect(() => {
    sanctumAudio.setZone(zone);
  }, [zone]);

  // the positional source is attached to the listener graph; nothing to render.
  return null;
}

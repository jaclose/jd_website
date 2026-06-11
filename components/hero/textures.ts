"use client";
import * as THREE from "three";

/** deterministic RNG so the planets look the same on every visit */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

function toTexture(c: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** soft radial glow sprite (tint via material color) */
export function glowTexture(): THREE.Texture {
  const c = canvas(128, 128);
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.25, "rgba(255,255,255,0.5)");
  g.addColorStop(0.6, "rgba(255,255,255,0.12)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return toTexture(c);
}

/** banded gas giant */
export function gasGiantTexture(base: string, accent: string): THREE.Texture {
  const w = 512,
    h = 256;
  const c = canvas(w, h);
  const ctx = c.getContext("2d")!;
  const rnd = mulberry32(1184);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);
  let y = 0;
  while (y < h) {
    const bandH = 8 + rnd() * 26;
    const a = 0.08 + rnd() * 0.3;
    ctx.fillStyle = rnd() > 0.5 ? accent : "#3d2c1d";
    ctx.globalAlpha = a;
    // wobbly band
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= w; x += 16) {
      ctx.lineTo(x, y + Math.sin(x * 0.04 + y) * 3);
    }
    ctx.lineTo(w, y + bandH);
    ctx.lineTo(0, y + bandH);
    ctx.closePath();
    ctx.fill();
    y += bandH;
  }
  // the great storm
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.ellipse(w * 0.68, h * 0.62, 26, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  return toTexture(c);
}

/**
 * The garden planet. Vegetation and water come from the biosphere score —
 * barren regolith first, green creep as skills grow, seas after 50 points.
 */
export function gardenTexture(vegetation: number, water: number): THREE.Texture {
  const w = 512,
    h = 256;
  const c = canvas(w, h);
  const ctx = c.getContext("2d")!;
  const rnd = mulberry32(4242);

  // barren base
  ctx.fillStyle = "#7d6c50";
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = rnd() > 0.5 ? "#8a7a5c" : "#6e5d44";
    ctx.globalAlpha = 0.25;
    const r = 2 + rnd() * 14;
    ctx.beginPath();
    ctx.arc(rnd() * w, rnd() * h, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // seas condense first in lowlands
  const seaBlobs = Math.floor(water * 26);
  ctx.globalAlpha = 0.85;
  for (let i = 0; i < seaBlobs; i++) {
    ctx.fillStyle = i % 3 === 0 ? "#2e5f73" : "#27506a";
    const r = 10 + rnd() * 34;
    ctx.beginPath();
    ctx.ellipse(rnd() * w, h * (0.25 + rnd() * 0.5), r * 1.6, r, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // vegetation creeps outward from the equatorial gardens
  const vegBlobs = Math.floor(vegetation * 140);
  for (let i = 0; i < vegBlobs; i++) {
    const t = rnd();
    ctx.fillStyle = t > 0.66 ? "#9fce8f" : t > 0.33 ? "#5d8b54" : "#42693c";
    ctx.globalAlpha = 0.32;
    const r = 3 + rnd() * 16;
    // denser near equator, like a habitable belt
    const band = h * (0.5 + (rnd() - 0.5) * (0.35 + vegetation * 0.6));
    ctx.beginPath();
    ctx.arc(rnd() * w, band, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // polar caps once there is enough water in the cycle
  if (water > 0.25) {
    ctx.globalAlpha = Math.min(0.9, water);
    ctx.fillStyle = "#e8eef2";
    ctx.fillRect(0, 0, w, h * 0.06);
    ctx.fillRect(0, h * 0.94, w, h * 0.06);
  }
  ctx.globalAlpha = 1;
  return toTexture(c);
}

/** speckled rocky world */
export function rockyTexture(base: string, fleck: string, seed = 7): THREE.Texture {
  const w = 256,
    h = 128;
  const c = canvas(w, h);
  const ctx = c.getContext("2d")!;
  const rnd = mulberry32(seed);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 700; i++) {
    ctx.fillStyle = rnd() > 0.5 ? fleck : "#00000022";
    ctx.globalAlpha = 0.18 + rnd() * 0.2;
    const r = 1 + rnd() * 7;
    ctx.beginPath();
    ctx.arc(rnd() * w, rnd() * h, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  return toTexture(c);
}

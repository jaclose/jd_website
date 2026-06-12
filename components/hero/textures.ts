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
  t.anisotropy = 8;
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

/** sharp-cored star dot — keeps the points round instead of square */
export function starTexture(): THREE.Texture {
  const c = canvas(64, 64);
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.18, "rgba(255,255,255,0.9)");
  g.addColorStop(0.4, "rgba(255,255,255,0.25)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return toTexture(c);
}

/** anamorphic lens streak for the sun */
export function streakTexture(): THREE.Texture {
  const c = canvas(256, 32);
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 256, 0);
  g.addColorStop(0, "rgba(255,255,255,0)");
  g.addColorStop(0.5, "rgba(255,255,255,0.9)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 32);
  const v = ctx.createLinearGradient(0, 0, 0, 32);
  v.addColorStop(0, "rgba(0,0,0,1)");
  v.addColorStop(0.5, "rgba(0,0,0,0)");
  v.addColorStop(1, "rgba(0,0,0,1)");
  ctx.globalCompositeOperation = "destination-out";
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, 256, 32);
  return toTexture(c);
}

/** the distant galactic band — drawn as soft knots along a diagonal */
export function milkyWayTexture(): THREE.Texture {
  const w = 1024,
    h = 512;
  const c = canvas(w, h);
  const ctx = c.getContext("2d")!;
  const rnd = mulberry32(777);
  for (let i = 0; i < 420; i++) {
    const t = rnd();
    const x = t * w;
    const y = h / 2 + (rnd() - 0.5) * h * (0.16 + 0.1 * Math.sin(t * Math.PI));
    const r = 8 + rnd() * 46;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const warm = rnd() > 0.7;
    const a = 0.015 + rnd() * 0.035;
    g.addColorStop(0, warm ? `rgba(238,224,200,${a})` : `rgba(200,212,238,${a})`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // bright knots
  for (let i = 0; i < 140; i++) {
    const x = rnd() * w;
    const y = h / 2 + (rnd() - 0.5) * h * 0.2;
    ctx.fillStyle = `rgba(235,238,245,${0.12 + rnd() * 0.3})`;
    ctx.beginPath();
    ctx.arc(x, y, 0.5 + rnd() * 1.1, 0, Math.PI * 2);
    ctx.fill();
  }
  return toTexture(c);
}

/** wispy nebula blot (tint via material color) */
export function nebulaTexture(seed = 99): THREE.Texture {
  const c = canvas(256, 256);
  const ctx = c.getContext("2d")!;
  const rnd = mulberry32(seed);
  for (let i = 0; i < 26; i++) {
    const x = 70 + rnd() * 116;
    const y = 70 + rnd() * 116;
    const r = 24 + rnd() * 70;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(255,255,255,${0.05 + rnd() * 0.09})`);
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
  }
  return toTexture(c);
}

/** the sun's granulated surface */
export function sunTexture(): THREE.Texture {
  const w = 512,
    h = 256;
  const c = canvas(w, h);
  const ctx = c.getContext("2d")!;
  const rnd = mulberry32(1111);
  ctx.fillStyle = "#ffe3ad";
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 1400; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    const r = 2 + rnd() * 9;
    const hot = rnd() > 0.5;
    ctx.fillStyle = hot ? "rgba(255,246,220,0.16)" : "rgba(216,150,74,0.13)";
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  // a few darker faculae near the "equator"
  for (let i = 0; i < 7; i++) {
    ctx.fillStyle = "rgba(190,120,52,0.22)";
    ctx.beginPath();
    ctx.ellipse(rnd() * w, h * (0.35 + rnd() * 0.3), 5 + rnd() * 9, 3 + rnd() * 4, rnd() * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  return toTexture(c);
}

/** banded gas giant — layered flows, storm oval, polar darkening */
export function gasGiantTexture(base: string, accent: string): THREE.Texture {
  const w = 2048,
    h = 1024;
  const c = canvas(w, h);
  const ctx = c.getContext("2d")!;
  const rnd = mulberry32(1184);

  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);

  // wide soft latitude bands
  const palette = [accent, "#8a5f37", "#e6d2b0", "#7a4f30", base, "#caa06e"];
  let y = 0;
  while (y < h) {
    const bandH = 14 + rnd() * 52;
    const col = palette[Math.floor(rnd() * palette.length)];
    const grad = ctx.createLinearGradient(0, y, 0, y + bandH);
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(0.5, col);
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.globalAlpha = 0.32 + rnd() * 0.3;
    ctx.fillRect(0, y, w, bandH);
    y += bandH * (0.6 + rnd() * 0.5);
  }

  // turbulent flow streaks inside the bands
  ctx.globalAlpha = 0.1;
  for (let i = 0; i < 560; i++) {
    const sy = rnd() * h;
    const sx = rnd() * w;
    const len = 40 + rnd() * 220;
    const amp = 1.5 + rnd() * 5;
    const light = rnd() > 0.5;
    ctx.strokeStyle = light ? "#f2e4c8" : "#5e3c22";
    ctx.lineWidth = 1 + rnd() * 3;
    ctx.beginPath();
    for (let x = 0; x <= len; x += 8) {
      const px = sx + x;
      const py = sy + Math.sin(x * 0.05 + sy) * amp;
      if (x === 0) ctx.moveTo(px % w, py);
      else ctx.lineTo(px % w, py);
    }
    ctx.stroke();
  }

  // the great storm — a pale oval with a swirl
  ctx.globalAlpha = 0.85;
  const stx = w * 0.68,
    sty = h * 0.6;
  const storm = ctx.createRadialGradient(stx, sty, 2, stx, sty, 46);
  storm.addColorStop(0, "#f4e6cb");
  storm.addColorStop(0.55, accent);
  storm.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = storm;
  ctx.save();
  ctx.translate(stx, sty);
  ctx.scale(1.9, 1);
  ctx.translate(-stx, -sty);
  ctx.beginPath();
  ctx.arc(stx, sty, 46, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = "#8a5f37";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(stx, sty, 56, 24, 0, 0.4, Math.PI * 1.7);
  ctx.stroke();

  // polar darkening
  for (const [py, dir] of [
    [0, 1],
    [h, -1],
  ] as const) {
    const pole = ctx.createLinearGradient(0, py, 0, py + dir * h * 0.18);
    pole.addColorStop(0, "rgba(40,24,12,0.55)");
    pole.addColorStop(1, "rgba(40,24,12,0)");
    ctx.globalAlpha = 1;
    ctx.fillStyle = pole;
    ctx.fillRect(0, Math.min(py, py + dir * h * 0.18), w, h * 0.18);
  }
  ctx.globalAlpha = 1;
  return toTexture(c);
}

/** ring system — concentric translucent bands with a Cassini-like gap */
export function ringTexture(accent: string): THREE.Texture {
  const s = 512;
  const c = canvas(s, s);
  const ctx = c.getContext("2d")!;
  const rnd = mulberry32(31);
  const cx = s / 2;
  ctx.translate(cx, cx);
  for (let r = s * 0.18; r < s * 0.5; r += 1.2) {
    const t = (r - s * 0.18) / (s * 0.32);
    // density profile: bright inner band, gap at ~0.62, fainter outer
    let a = 0.5 * Math.sin(t * Math.PI) + 0.18;
    if (t > 0.58 && t < 0.68) a *= 0.12; // the gap
    if (t > 0.9) a *= 0.5;
    a *= 0.55 + rnd() * 0.45;
    ctx.strokeStyle = rnd() > 0.75 ? "rgba(240,228,205,1)" : accent;
    ctx.globalAlpha = Math.max(0, a) * 0.5;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  return toTexture(c);
}

/**
 * The garden planet. Vegetation and water come from the biosphere score —
 * barren regolith first, green creep as skills grow, seas after 50 points.
 */
export function gardenTexture(vegetation: number, water: number): THREE.Texture {
  const w = 1024,
    h = 512;
  const c = canvas(w, h);
  const ctx = c.getContext("2d")!;
  const rnd = mulberry32(4242);

  // barren base — Mars-rust regolith with tonal drift
  const base = ctx.createLinearGradient(0, 0, 0, h);
  base.addColorStop(0, "#7c4a33");
  base.addColorStop(0.5, "#8d5a3e");
  base.addColorStop(1, "#6e4230");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);

  // broad geological provinces
  for (let i = 0; i < 26; i++) {
    ctx.fillStyle = rnd() > 0.5 ? "#9d6748" : "#5e3826";
    ctx.globalAlpha = 0.12 + rnd() * 0.1;
    const r = 40 + rnd() * 150;
    ctx.beginPath();
    ctx.ellipse(rnd() * w, rnd() * h, r * (1.2 + rnd()), r * 0.6, rnd() * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  // fine speckle
  for (let i = 0; i < 1600; i++) {
    ctx.fillStyle = rnd() > 0.5 ? "#a8714f" : "#54301f";
    ctx.globalAlpha = 0.1 + rnd() * 0.16;
    const r = 1 + rnd() * 6;
    ctx.beginPath();
    ctx.arc(rnd() * w, rnd() * h, r, 0, Math.PI * 2);
    ctx.fill();
  }
  // craters — rim light over shadowed floor
  for (let i = 0; i < 46; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    const r = 3 + rnd() * 16;
    ctx.globalAlpha = 0.32;
    ctx.fillStyle = "rgba(40,32,22,0.8)";
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.4;
    ctx.strokeStyle = "rgba(220,205,175,0.65)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(x, y - r * 0.18, r, Math.PI * 1.05, Math.PI * 1.95);
    ctx.stroke();
  }
  // dune streaks
  ctx.globalAlpha = 0.08;
  ctx.strokeStyle = "#b07a58";
  for (let i = 0; i < 90; i++) {
    const sy = rnd() * h;
    ctx.lineWidth = 0.8 + rnd();
    ctx.beginPath();
    const sx = rnd() * w;
    const len = 30 + rnd() * 120;
    for (let x = 0; x <= len; x += 10) {
      const px = sx + x;
      const py = sy + Math.sin(x * 0.06 + sy) * 2;
      if (x === 0) ctx.moveTo(px % w, py);
      else ctx.lineTo(px % w, py);
    }
    ctx.stroke();
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

/** cratered rocky world — slate plains, frost at the poles */
export function rockyTexture(base: string, fleck: string, seed = 7): THREE.Texture {
  const w = 1024,
    h = 512;
  const c = canvas(w, h);
  const ctx = c.getContext("2d")!;
  const rnd = mulberry32(seed);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);
  // maria — large dark blue-grey plains
  for (let i = 0; i < 14; i++) {
    ctx.fillStyle = "rgba(22,30,42,0.6)";
    ctx.globalAlpha = 0.16 + rnd() * 0.14;
    const r = 44 + rnd() * 140;
    ctx.beginPath();
    ctx.ellipse(rnd() * w, rnd() * h, r * 1.4, r * 0.8, rnd() * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 1800; i++) {
    ctx.fillStyle = rnd() > 0.5 ? fleck : "#00000022";
    ctx.globalAlpha = 0.14 + rnd() * 0.18;
    const r = 1 + rnd() * 8;
    ctx.beginPath();
    ctx.arc(rnd() * w, rnd() * h, r, 0, Math.PI * 2);
    ctx.fill();
  }
  // craters
  for (let i = 0; i < 64; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    const r = 3 + rnd() * 18;
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = "rgba(14,18,26,0.85)";
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.42;
    ctx.strokeStyle = "rgba(225,232,242,0.6)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(x, y - r * 0.15, r, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
  }
  // polar frost
  for (const [py, dir] of [
    [0, 1],
    [h, -1],
  ] as const) {
    const cap = ctx.createLinearGradient(0, py, 0, py + dir * h * 0.1);
    cap.addColorStop(0, "rgba(230,240,248,0.55)");
    cap.addColorStop(1, "rgba(230,240,248,0)");
    ctx.globalAlpha = 1;
    ctx.fillStyle = cap;
    ctx.fillRect(0, Math.min(py, py + dir * h * 0.1), w, h * 0.1);
  }
  ctx.globalAlpha = 1;
  return toTexture(c);
}

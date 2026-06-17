"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text, useTexture } from "@react-three/drei";
import {
  Bloom,
  BrightnessContrast,
  EffectComposer,
  HueSaturation,
  SMAA,
  Vignette,
} from "@react-three/postprocessing";
import {
  gardenFeatures,
  type GardenFeature,
  type GardenBranch,
} from "@/data/gardenFeatures";
import {
  gardenPathNodeById,
  gardenPathNodes,
  type GardenPathNode,
} from "@/data/gardenPaths";

export type GardenQuality = "low" | "medium" | "high" | "ultra";

export interface GardenCanvasProps {
  active: boolean;
  currentNodeId: string;
  targetNodeId: string;
  quality?: GardenQuality;
  onArrive?: (nodeId: string) => void;
  onSelectNode?: (nodeId: string) => void;
  onInspectFeature?: (featureId: string) => void;
}

const EYE_HEIGHT = 1.62;
const GROUND_SPAN = 148;
const MAIN_PATH = ["start", "website-tree", "noctyrium", "main-fork"] as const;
const MEDICINE_PATH = ["main-fork", "term-3", "term-2", "term-1", "utk", "mcat"] as const;
const PROJECTS_PATH = ["main-fork", "training-journey", "soccer", "wave-depth", "future-plot"] as const;

const nodeIds = gardenPathNodes.map((node) => node.id);
const nodeIndex = new Map(gardenPathNodes.map((node) => [node.id, node]));

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeCanvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

function nodeGround(id: string) {
  const node = gardenPathNodeById(id);
  return new THREE.Vector3(node.position[0], node.position[1], node.position[2]);
}

function nodeCamera(id: string) {
  const p = nodeGround(id);
  p.y += EYE_HEIGHT;
  return p;
}

function vectorFromTuple(v: [number, number, number]) {
  return new THREE.Vector3(v[0], v[1], v[2]);
}

function branchCurve(ids: readonly string[]) {
  return new THREE.CatmullRomCurve3(ids.map(nodeGround), false, "catmullrom", 0.4);
}

const TRAIL_CURVES = [branchCurve(MAIN_PATH), branchCurve(MEDICINE_PATH), branchCurve(PROJECTS_PATH)];

function graphNeighbors(id: string) {
  const node = nodeIndex.get(id);
  if (!node) return [];
  const out = new Set<string>(node.nextNodes);
  if (node.previousNode) out.add(node.previousNode);
  gardenPathNodes.forEach((candidate) => {
    if (candidate.nextNodes.includes(id)) out.add(candidate.id);
  });
  return [...out].filter((candidate) => nodeIndex.has(candidate));
}

function routeBetween(fromId: string, toId: string) {
  if (fromId === toId) return [fromId];
  const queue: string[][] = [[fromId]];
  const seen = new Set([fromId]);
  while (queue.length) {
    const route = queue.shift()!;
    const last = route[route.length - 1];
    for (const next of graphNeighbors(last)) {
      if (seen.has(next)) continue;
      const nextRoute = [...route, next];
      if (next === toId) return nextRoute;
      seen.add(next);
      queue.push(nextRoute);
    }
  }
  return [fromId, toId];
}

function qualityCount(quality: GardenQuality, low: number, medium: number, high: number, ultra = high) {
  if (quality === "low") return low;
  if (quality === "medium") return medium;
  if (quality === "ultra") return ultra;
  return high;
}

function configureTexture(tex: THREE.Texture, repeat: [number, number], color = false) {
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat[0], repeat[1]);
  tex.anisotropy = 8;
  if (color) tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function makeForestFloorTexture(): THREE.Texture {
  const s = 1024;
  const c = makeCanvas(s, s);
  const ctx = c.getContext("2d")!;
  const rnd = mulberry32(107);
  ctx.fillStyle = "#0b130d";
  ctx.fillRect(0, 0, s, s);
  for (let i = 0; i < 4200; i++) {
    const tone = rnd();
    ctx.fillStyle =
      tone > 0.72
        ? `rgba(70,102,55,${0.08 + rnd() * 0.16})`
        : tone > 0.42
          ? `rgba(29,43,26,${0.18 + rnd() * 0.24})`
          : `rgba(63,46,31,${0.1 + rnd() * 0.18})`;
    const r = 1 + rnd() * 12;
    ctx.beginPath();
    ctx.ellipse(rnd() * s, rnd() * s, r * (0.7 + rnd()), r * (0.4 + rnd() * 0.7), rnd() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 120; i++) {
    ctx.strokeStyle = `rgba(106,91,72,${0.06 + rnd() * 0.1})`;
    ctx.lineWidth = 1 + rnd() * 3;
    ctx.beginPath();
    const x = rnd() * s;
    const y = rnd() * s;
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x + (rnd() - 0.5) * 70, y + rnd() * 80, x + (rnd() - 0.5) * 120, y + rnd() * 140, x + (rnd() - 0.5) * 150, y + rnd() * 190);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return configureTexture(tex, [18, 18], true);
}

function makeLeafClusterTexture(): THREE.Texture {
  const s = 256;
  const c = makeCanvas(s, s);
  const ctx = c.getContext("2d")!;
  const rnd = mulberry32(401);
  ctx.clearRect(0, 0, s, s);
  for (let i = 0; i < 170; i++) {
    const x = 38 + rnd() * 180;
    const y = 34 + rnd() * 178;
    const dx = x - s / 2;
    const dy = y - s / 2;
    if (Math.hypot(dx / 1.08, dy) > 106) continue;
    const hue = 104 + rnd() * 42;
    const light = 20 + rnd() * 18;
    ctx.fillStyle = `hsla(${hue}, ${38 + rnd() * 22}%, ${light}%, ${0.48 + rnd() * 0.38})`;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rnd() * Math.PI);
    ctx.beginPath();
    ctx.ellipse(0, 0, 4 + rnd() * 10, 1.8 + rnd() * 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  const vignette = ctx.createRadialGradient(s / 2, s / 2, 28, s / 2, s / 2, s / 2);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(0.82, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.95)");
  ctx.globalCompositeOperation = "destination-out";
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, s, s);
  ctx.globalCompositeOperation = "source-over";
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function makeFernTexture(): THREE.Texture {
  const c = makeCanvas(256, 256);
  const ctx = c.getContext("2d")!;
  const rnd = mulberry32(33);
  ctx.clearRect(0, 0, 256, 256);
  ctx.translate(128, 240);
  for (let f = 0; f < 7; f++) {
    const a = -Math.PI / 2 + (f - 3) * 0.34;
    ctx.strokeStyle = `rgba(${54 + rnd() * 30},${96 + rnd() * 48},${54 + rnd() * 20},0.86)`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    const ex = Math.cos(a) * 114;
    const ey = Math.sin(a) * 114;
    ctx.quadraticCurveTo(ex * 0.5, ey * 0.72, ex, ey);
    ctx.stroke();
    ctx.lineWidth = 1.5;
    for (let l = 1; l < 10; l++) {
      const t = l / 10;
      const px = ex * t * 0.92;
      const py = ey * t * 0.92;
      const len = 17 * (1 - t * 0.72);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + Math.cos(a + 1.16) * len, py + Math.sin(a + 1.16) * len);
      ctx.moveTo(px, py);
      ctx.lineTo(px + Math.cos(a - 1.16) * len, py + Math.sin(a - 1.16) * len);
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeSoftMistTexture(seed = 5): THREE.Texture {
  const s = 256;
  const c = makeCanvas(s, s);
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, "rgba(226,234,226,0.5)");
  g.addColorStop(0.52, "rgba(206,222,215,0.15)");
  g.addColorStop(1, "rgba(206,222,215,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  const rnd = mulberry32(seed);
  ctx.globalAlpha = 0.05;
  for (let i = 0; i < 48; i++) {
    ctx.beginPath();
    ctx.arc(rnd() * s, rnd() * s, 18 + rnd() * 62, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(232,238,232,1)";
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "destination-in";
  const edgeFade = ctx.createRadialGradient(s / 2, s / 2, 18, s / 2, s / 2, s / 2);
  edgeFade.addColorStop(0, "rgba(0,0,0,0.95)");
  edgeFade.addColorStop(0.58, "rgba(0,0,0,0.58)");
  edgeFade.addColorStop(0.88, "rgba(0,0,0,0.16)");
  edgeFade.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = edgeFade;
  ctx.fillRect(0, 0, s, s);
  ctx.globalCompositeOperation = "source-over";
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeShaftTexture(): THREE.Texture {
  const c = makeCanvas(128, 512);
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, "rgba(223,236,255,0.42)");
  g.addColorStop(0.52, "rgba(182,207,238,0.11)");
  g.addColorStop(1, "rgba(182,207,238,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 512);
  const side = ctx.createLinearGradient(0, 0, 128, 0);
  side.addColorStop(0, "rgba(0,0,0,1)");
  side.addColorStop(0.5, "rgba(0,0,0,0)");
  side.addColorStop(1, "rgba(0,0,0,1)");
  ctx.globalCompositeOperation = "destination-out";
  ctx.fillStyle = side;
  ctx.fillRect(0, 0, 128, 512);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeMountainTexture(): THREE.Texture {
  const w = 1400;
  const h = 520;
  const c = makeCanvas(w, h);
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, w, h);
  const layers = [
    { y: 270, color: "rgba(85,109,122,0.38)", amp: 70, seed: 1 },
    { y: 332, color: "rgba(47,75,81,0.54)", amp: 94, seed: 2 },
    { y: 405, color: "rgba(16,37,36,0.78)", amp: 86, seed: 3 },
  ];
  layers.forEach((layer) => {
    const rnd = mulberry32(900 + layer.seed);
    ctx.fillStyle = layer.color;
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 48) {
      const y = layer.y - Math.sin(x * 0.008 + layer.seed) * layer.amp * 0.38 - rnd() * layer.amp;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
  });
  const fog = ctx.createLinearGradient(0, 250, 0, h);
  fog.addColorStop(0, "rgba(168,188,194,0)");
  fog.addColorStop(0.55, "rgba(168,188,194,0.14)");
  fog.addColorStop(1, "rgba(168,188,194,0)");
  ctx.fillStyle = fog;
  ctx.fillRect(0, 250, w, h - 250);
  ctx.globalCompositeOperation = "destination-in";
  const verticalFade = ctx.createLinearGradient(0, 0, 0, h);
  verticalFade.addColorStop(0, "rgba(0,0,0,0)");
  verticalFade.addColorStop(0.22, "rgba(0,0,0,0.72)");
  verticalFade.addColorStop(0.76, "rgba(0,0,0,0.92)");
  verticalFade.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = verticalFade;
  ctx.fillRect(0, 0, w, h);
  const sideFade = ctx.createLinearGradient(0, 0, w, 0);
  sideFade.addColorStop(0, "rgba(0,0,0,0)");
  sideFade.addColorStop(0.08, "rgba(0,0,0,0.82)");
  sideFade.addColorStop(0.5, "rgba(0,0,0,1)");
  sideFade.addColorStop(0.92, "rgba(0,0,0,0.82)");
  sideFade.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = sideFade;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = "source-over";
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function flutedTrunk(rTop: number, rBot: number, height: number, flutes = 17): THREE.BufferGeometry {
  const geo = new THREE.CylinderGeometry(rTop, rBot, height, flutes * 2, 8, true);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const r = Math.hypot(v.x, v.z);
    if (r <= 1e-4) continue;
    const angle = Math.atan2(v.z, v.x);
    const yk = (v.y + height / 2) / height;
    const groove = 1 + Math.sin(angle * flutes) * 0.08 + Math.sin(angle * flutes * 2.2 + 0.8) * 0.035;
    const taperNoise = 1 + Math.sin(yk * 8 + angle * 2) * 0.018;
    const nr = r * groove * taperNoise;
    pos.setXYZ(i, Math.cos(angle) * nr, v.y, Math.sin(angle) * nr);
  }
  geo.computeVertexNormals();
  geo.translate(0, height / 2, 0);
  const uv = geo.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setY(i, uv.getY(i) * 7);
  return geo;
}

function ribbonGeometry(points: THREE.Vector3[], width: number) {
  const verts: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const prev = points[Math.max(0, i - 1)];
    const next = points[Math.min(points.length - 1, i + 1)];
    const dir = next.clone().sub(prev).setY(0).normalize();
    const side = new THREE.Vector3(dir.z, 0, -dir.x);
    const w = width * (0.9 + Math.sin((i / Math.max(1, points.length - 1)) * Math.PI) * 0.12);
    const left = p.clone().addScaledVector(side, w * 0.5);
    const right = p.clone().addScaledVector(side, -w * 0.5);
    verts.push(left.x, 0.026, left.z, right.x, 0.026, right.z);
    uvs.push(0, i / 5, 1, i / 5);
    if (i < points.length - 1) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

const windUniforms = { uTime: { value: 0 } };

function applyGrassWind(mat: THREE.Material, height: number, strength = 1) {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = windUniforms.uTime;
    shader.uniforms.uHeight = { value: height };
    shader.uniforms.uStrength = { value: strength };
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
         uniform float uTime;
         uniform float uHeight;
         uniform float uStrength;`
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
         {
           float bladeH = clamp(transformed.y / uHeight, 0.0, 1.0);
           vec3 instPos = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
           float phase = instPos.x * 0.55 + instPos.z * 0.73;
           float gust = sin(uTime * 0.32 + phase * 0.23) * 0.5 + 0.5;
           float sway = (sin(uTime * 1.35 + phase) * 0.14 + sin(uTime * 2.7 + phase * 1.8) * 0.045) * uStrength;
           transformed.x += sway * pow(bladeH, 1.55) * (0.75 + gust * 0.38);
           transformed.z += sway * 0.45 * pow(bladeH, 1.3);
         }`
      );
  };
}

function applyLeafWind(mat: THREE.Material, strength = 1) {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = windUniforms.uTime;
    shader.uniforms.uStrength = { value: strength };
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
         uniform float uTime;
         uniform float uStrength;`
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
         {
           float leafH = clamp(uv.y, 0.0, 1.0);
           float phase = modelMatrix[3][0] * 0.64 + modelMatrix[3][2] * 0.77 + position.x * 3.4;
           float slow = sin(uTime * 0.55 + phase * 0.25) * 0.055;
           float flutter = sin(uTime * 1.9 + phase) * 0.038 + sin(uTime * 3.7 + phase * 1.6) * 0.018;
           transformed.x += (slow + flutter) * leafH * uStrength;
           transformed.z += (slow * 0.32 + flutter * 0.45) * leafH * uStrength;
         }`
      );
  };
}

function useGardenTextures() {
  const loaded = useTexture([
    "/garden/assets/textures/bark/Bark012_1K-JPG_Color.jpg",
    "/garden/assets/textures/bark/Bark012_1K-JPG_NormalGL.jpg",
    "/garden/assets/textures/bark/Bark012_1K-JPG_Roughness.jpg",
    "/garden/assets/textures/dirt/Ground020_1K-JPG_Color.jpg",
    "/garden/assets/textures/dirt/Ground020_1K-JPG_NormalGL.jpg",
    "/garden/assets/textures/dirt/Ground020_1K-JPG_Roughness.jpg",
  ]) as THREE.Texture[];

  return useMemo(() => {
    const [barkColor, barkNormal, barkRoughness, dirtColor, dirtNormal, dirtRoughness] = loaded;
    configureTexture(barkColor, [1.4, 6], true);
    configureTexture(barkNormal, [1.4, 6]);
    configureTexture(barkRoughness, [1.4, 6]);
    configureTexture(dirtColor, [3.2, 14], true);
    configureTexture(dirtNormal, [3.2, 14]);
    configureTexture(dirtRoughness, [3.2, 14]);
    return { barkColor, barkNormal, barkRoughness, dirtColor, dirtNormal, dirtRoughness };
  }, [loaded]);
}

function distanceToTrail(p: THREE.Vector3) {
  let best = Infinity;
  TRAIL_CURVES.forEach((curve) => {
    for (let i = 0; i <= 70; i++) {
      const c = curve.getPoint(i / 70);
      best = Math.min(best, Math.hypot(p.x - c.x, p.z - c.z));
    }
  });
  return best;
}

function terrainHeightAt(x: number, z: number) {
  const dist = distanceToTrail(new THREE.Vector3(x, 0, z));
  const trailFlatten = THREE.MathUtils.smoothstep(dist, 2.25, 8.8);
  const ridge =
    Math.sin(x * 0.11 + z * 0.047) * 0.62 +
    Math.sin(x * 0.31 - z * 0.075) * 0.25 +
    Math.cos(Math.hypot(x + 14, z + 36) * 0.11) * 0.34;
  const slope = THREE.MathUtils.clamp((-z - 14) / 86, 0, 1) * 0.72;
  return -0.035 + (ridge * 0.48 + slope) * trailFlatten;
}

function scatterNearTrail(rnd: () => number, spread: number) {
  const curve = TRAIL_CURVES[Math.floor(rnd() * TRAIL_CURVES.length)];
  const t = 0.04 + rnd() * 0.93;
  const p = curve.getPoint(t);
  const ahead = curve.getPoint(Math.min(1, t + 0.015));
  const dir = ahead.clone().sub(p).setY(0).normalize();
  const right = new THREE.Vector3(dir.z, 0, -dir.x);
  const side = rnd() > 0.5 ? 1 : -1;
  return p.addScaledVector(right, side * (1.2 + rnd() * spread)).add(new THREE.Vector3((rnd() - 0.5) * 0.9, 0, (rnd() - 0.5) * 0.9));
}

function Branch({
  from,
  to,
  radius,
  bark,
  color = "#7b5138",
}: {
  from: [number, number, number];
  to: [number, number, number];
  radius: number;
  bark: THREE.Texture;
  color?: string;
}) {
  const { mid, length, quat } = useMemo(() => {
    const a = vectorFromTuple(from);
    const b = vectorFromTuple(to);
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const dir = b.clone().sub(a);
    const length = dir.length();
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    return { mid, length, quat };
  }, [from, to]);
  return (
    <mesh position={mid} quaternion={quat} castShadow>
      <cylinderGeometry args={[radius * 0.58, radius, length, 9]} />
      <meshStandardMaterial map={bark} color={color} roughness={0.96} />
    </mesh>
  );
}

function LeafCluster({
  map,
  position,
  scale = 1,
  color = "#315f36",
  opacity = 0.92,
}: {
  map: THREE.Texture;
  position: [number, number, number];
  scale?: number;
  color?: string;
  opacity?: number;
}) {
  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      map,
      color,
      transparent: true,
      opacity,
      alphaTest: 0.18,
      side: THREE.DoubleSide,
      depthWrite: false,
      roughness: 1,
    });
    applyLeafWind(mat, 1.15);
    return mat;
  }, [map, color, opacity]);
  return (
    <group position={position} scale={scale}>
      {[0, Math.PI / 2, Math.PI / 4].map((rot, i) => (
        <mesh key={i} rotation={[0, rot, 0]} castShadow>
          <planeGeometry args={[2.05, 1.42, 5, 4]} />
          <primitive object={material} attach="material" />
        </mesh>
      ))}
    </group>
  );
}

function PhysicalPlaque({
  feature,
  onInspect,
}: {
  feature: GardenFeature;
  onInspect?: (featureId: string) => void;
}) {
  const xSign = feature.position[0] >= 0 ? -1 : 1;
  const pos: [number, number, number] = [
    feature.position[0] + xSign * (1.35 + (feature.scale ?? 1) * 0.14),
    0.64,
    feature.position[2] + 0.95,
  ];
  const yaw = Math.atan2(feature.position[0] - pos[0], feature.position[2] - pos[2]);
  const stage = feature.stage === "unsown" ? "prepared" : feature.stage;
  const handleClick = (ev: { stopPropagation: () => void }) => {
    ev.stopPropagation();
    onInspect?.(feature.id);
  };
  return (
    <group
      position={pos}
      rotation={[0, yaw, 0]}
      onClick={handleClick}
      onPointerOver={(ev) => {
        ev.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "";
      }}
    >
      <mesh castShadow>
        <boxGeometry args={[1.72, 0.64, 0.08]} />
        <meshStandardMaterial color="#8a6642" roughness={0.96} />
      </mesh>
      <InspectableOrb position={[0.73, 0.25, 0.12]} color={feature.id === "noctyrium" ? "#9697ff" : "#f0c77c"} />
      <mesh position={[0, -0.52, -0.01]} castShadow>
        <cylinderGeometry args={[0.045, 0.06, 0.8, 7]} />
        <meshStandardMaterial color="#4f3826" roughness={1} />
      </mesh>
      <Text
        position={[0, 0.13, 0.052]}
        fontSize={0.12}
        maxWidth={1.46}
        lineHeight={1}
        textAlign="center"
        anchorX="center"
        anchorY="middle"
        color="#20170f"
      >
        {feature.title}
      </Text>
      <Text
        position={[0, -0.13, 0.052]}
        fontSize={0.062}
        maxWidth={1.44}
        lineHeight={1.06}
        textAlign="center"
        anchorX="center"
        anchorY="middle"
        color="#2a1d13"
      >
        {stage.toUpperCase()}
      </Text>
    </group>
  );
}

function InspectableOrb({
  position,
  color,
}: {
  position: [number, number, number];
  color: string;
}) {
  const ref = useRef<THREE.Group>(null!);
  useFrame((state) => {
    if (!ref.current) return;
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 2.3) * 0.12;
    ref.current.scale.setScalar(pulse);
    ref.current.rotation.z = state.clock.elapsedTime * 0.55;
  });
  return (
    <group ref={ref} position={position}>
      <mesh>
        <sphereGeometry args={[0.055, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.9} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
      <mesh>
        <torusGeometry args={[0.115, 0.006, 8, 36]} />
        <meshBasicMaterial color={color} transparent opacity={0.62} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
      <GlowSphere color={color} position={[0, 0, 0]} size={0.22} opacity={0.16} />
    </group>
  );
}

function GlowSphere({
  color,
  position,
  size,
  opacity = 0.55,
}: {
  color: string;
  position: [number, number, number];
  size: number;
  opacity?: number;
}) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[size, 18, 18]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
    </mesh>
  );
}

function StandardTree({
  feature,
  bark,
  leaf,
  variant = "rooted",
}: {
  feature: GardenFeature;
  bark: THREE.Texture;
  leaf: THREE.Texture;
  variant?: "rooted" | "scarred" | "apple";
}) {
  const scale = feature.scale ?? 1;
  const h = scale * (variant === "scarred" ? 5.0 : 5.8);
  const charred = variant === "scarred";
  const pos = feature.position;
  const apples = variant === "apple";
  const rnd = useMemo(() => mulberry32(feature.id.length * 271), [feature.id]);
  const clusters = useMemo(
    () =>
      Array.from({ length: apples ? 9 : charred ? 6 : 11 }, (_, i) => ({
        p: [
          (rnd() - 0.5) * 2.6 * scale,
          h * (0.72 + rnd() * 0.27),
          (rnd() - 0.5) * 2.3 * scale,
        ] as [number, number, number],
        s: (0.62 + rnd() * 0.38) * scale,
        c: charred && i < 3 ? "#244126" : apples ? "#3e6f38" : "#315f36",
      })),
    [apples, charred, h, rnd, scale]
  );
  return (
    <group position={pos}>
      <mesh castShadow>
        <primitive object={flutedTrunk(0.22 * scale, 0.48 * scale, h, 13)} attach="geometry" />
        <meshStandardMaterial map={bark} color={charred ? "#5a473c" : "#8d6b4d"} roughness={0.98} />
      </mesh>
      <Branch from={[0, h * 0.55, 0]} to={[-1.4 * scale, h * 0.82, -0.45 * scale]} radius={0.12 * scale} bark={bark} color={charred ? "#3b302b" : "#806145"} />
      <Branch from={[0, h * 0.62, 0]} to={[1.35 * scale, h * 0.84, 0.35 * scale]} radius={0.1 * scale} bark={bark} color={charred ? "#352a25" : "#806145"} />
      <Branch from={[0, h * 0.72, 0]} to={[0.2 * scale, h * 0.95, -1.25 * scale]} radius={0.09 * scale} bark={bark} color={charred ? "#302621" : "#806145"} />
      {charred && (
        <>
          <mesh position={[0.02, h * 0.45, 0.24 * scale]} rotation={[0.2, 0, 0.1]}>
            <boxGeometry args={[0.18 * scale, h * 0.42, 0.035 * scale]} />
            <meshBasicMaterial color="#090706" />
          </mesh>
          <GlowSphere color="#74b86e" position={[0.75 * scale, h * 0.82, 0.22 * scale]} size={0.12 * scale} opacity={0.28} />
        </>
      )}
      {clusters.map((cluster, i) => (
        <LeafCluster key={i} map={leaf} position={cluster.p} scale={cluster.s} color={cluster.c} opacity={charred ? 0.78 : 0.9} />
      ))}
      {apples &&
        Array.from({ length: 16 }, (_, i) => {
          const a = rnd() * Math.PI * 2;
          const r = 0.3 + rnd() * 1.25;
          return (
            <mesh key={i} position={[Math.cos(a) * r * scale, h * (0.72 + rnd() * 0.2), Math.sin(a) * r * scale]} castShadow>
              <sphereGeometry args={[0.085 * scale * (0.7 + rnd() * 0.5), 10, 10]} />
              <meshStandardMaterial color={i % 3 === 0 ? "#a64a32" : "#7f8c3a"} roughness={0.78} />
            </mesh>
          );
        })}
      <mesh position={[0, 0.08, 0]} scale={[1.9 * scale, 0.22, 1.6 * scale]}>
        <sphereGeometry args={[1, 14, 8]} />
        <meshStandardMaterial color="#243b22" roughness={1} />
      </mesh>
    </group>
  );
}

function WebsiteTree({ feature, bark, leaf }: { feature: GardenFeature; bark: THREE.Texture; leaf: THREE.Texture }) {
  const scale = feature.scale ?? 1;
  const h = 10.8 * scale;
  const branchLabels = ["Essays", "Field Notes", "Garden", "Deployments", "About", "Vault", "Achievements"];
  return (
    <group position={feature.position}>
      <mesh castShadow receiveShadow>
        <primitive object={flutedTrunk(0.62 * scale, 1.28 * scale, h, 21)} attach="geometry" />
        <meshStandardMaterial map={bark} color="#946044" roughness={0.96} />
      </mesh>
      {[
        [[0, h * 0.52, 0], [-2.4 * scale, h * 0.73, -0.9 * scale], 0.22],
        [[0, h * 0.58, 0], [2.1 * scale, h * 0.77, -0.6 * scale], 0.2],
        [[0, h * 0.66, 0], [-1.15 * scale, h * 0.92, 1.35 * scale], 0.16],
        [[0, h * 0.69, 0], [1.35 * scale, h * 0.96, 1.08 * scale], 0.16],
        [[0, h * 0.75, 0], [0.25 * scale, h * 1.02, -1.95 * scale], 0.14],
      ].map(([from, to, r], i) => (
        <Branch key={i} from={from as [number, number, number]} to={to as [number, number, number]} radius={(r as number) * scale} bark={bark} color="#8d5f44" />
      ))}
      {Array.from({ length: 24 }, (_, i) => {
        const a = (i / 24) * Math.PI * 2;
        const r = 1.1 + (i % 5) * 0.36;
        return (
          <LeafCluster
            key={i}
            map={leaf}
            position={[Math.cos(a) * r * scale, h * (0.75 + (i % 4) * 0.055), Math.sin(a) * r * scale]}
            scale={(0.68 + (i % 4) * 0.12) * scale}
            color={i % 3 === 0 ? "#28492e" : "#37643b"}
          />
        );
      })}
      {branchLabels.map((label, i) => {
        const a = -1.1 + i * 0.36;
        return (
          <group key={label} position={[Math.cos(a) * 2.1 * scale, h * (0.64 + (i % 3) * 0.08), Math.sin(a) * 1.45 * scale]} rotation={[0, a + Math.PI, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.82, 0.18, 0.045]} />
              <meshStandardMaterial color="#5f4129" roughness={1} />
            </mesh>
            <Text position={[0, 0, 0.03]} fontSize={0.055} maxWidth={0.72} textAlign="center" anchorX="center" anchorY="middle" color="#21170f">
              {label}
            </Text>
            <GlowSphere color="#f1c879" position={[0.46, 0.02, 0.03]} size={0.035} opacity={0.5} />
          </group>
        );
      })}
      <GlowSphere color="#eec878" position={[0.4 * scale, h * 0.94, -1.2 * scale]} size={0.18 * scale} opacity={0.26} />
      <GlowSphere color="#eec878" position={[-0.9 * scale, h * 0.84, 1.1 * scale]} size={0.13 * scale} opacity={0.25} />
    </group>
  );
}

function NoctyriumSapling({ feature, bark, leaf }: { feature: GardenFeature; bark: THREE.Texture; leaf: THREE.Texture }) {
  const scale = feature.scale ?? 1;
  const h = 2.8 * scale;
  return (
    <group position={feature.position}>
      <mesh position={[0, h / 2, 0]} castShadow>
        <cylinderGeometry args={[0.08 * scale, 0.16 * scale, h, 9]} />
        <meshStandardMaterial map={bark} color="#7c5b44" roughness={0.9} />
      </mesh>
      {[-0.55, 0.55].map((x) => (
        <mesh key={x} position={[x * scale, 1.25 * scale, 0]} rotation={[0, 0, x * 0.18]} castShadow>
          <cylinderGeometry args={[0.035 * scale, 0.045 * scale, 2.5 * scale, 7]} />
          <meshStandardMaterial color="#6b4a31" roughness={1} />
        </mesh>
      ))}
      <mesh position={[0, 1.48 * scale, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.015 * scale, 0.015 * scale, 1.15 * scale, 6]} />
        <meshStandardMaterial color="#8f7c6a" roughness={1} />
      </mesh>
      {[0.5, 0.72, 0.94].map((k, i) => (
        <LeafCluster
          key={k}
          map={leaf}
          position={[(i - 1) * 0.32 * scale, h * k, (i % 2 ? -0.18 : 0.18) * scale]}
          scale={(0.34 + i * 0.08) * scale}
          color="#41517f"
          opacity={0.82}
        />
      ))}
      {Array.from({ length: 9 }, (_, i) => {
        const a = (i / 9) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.55 * scale, 0.2 * scale, Math.sin(a) * 0.55 * scale]} rotation={[0.3, a, 0.2]} castShadow>
            <octahedronGeometry args={[0.13 * scale * (0.75 + (i % 3) * 0.22), 0]} />
            <meshStandardMaterial color="#6f74ff" emissive="#4248ff" emissiveIntensity={0.6} roughness={0.28} metalness={0.1} transparent opacity={0.82} />
          </mesh>
        );
      })}
      <GlowSphere color="#7677ff" position={[0, 0.26 * scale, 0]} size={0.72 * scale} opacity={0.18} />
      <GlowSphere color="#b0a8ff" position={[0.15 * scale, h * 0.95, 0.1 * scale]} size={0.16 * scale} opacity={0.55} />
      <pointLight position={[0.1 * scale, 1.1 * scale, 0.1 * scale]} color="#8f91ff" intensity={1.15} distance={5.8} decay={2} />
    </group>
  );
}

function SeedPlot({ feature }: { feature: GardenFeature }) {
  const scale = feature.scale ?? 1;
  return (
    <group position={feature.position} scale={scale}>
      <mesh position={[0, 0.035, 0]} scale={[1.15, 0.08, 0.86]}>
        <sphereGeometry args={[1, 20, 8]} />
        <meshStandardMaterial color="#513822" roughness={1} />
      </mesh>
      {Array.from({ length: 13 }, (_, i) => {
        const a = (i / 13) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 1.05, 0.11, Math.sin(a) * 0.78]} rotation={[0, a, 0]}>
            <dodecahedronGeometry args={[0.12 + (i % 3) * 0.015, 0]} />
            <meshStandardMaterial color="#747165" roughness={1} />
          </mesh>
        );
      })}
      <mesh position={[0, 0.28, 0]}>
        <sphereGeometry args={[0.16, 12, 8]} />
        <meshStandardMaterial color="#9b6d3f" roughness={0.9} />
      </mesh>
      <mesh position={[0.07, 0.54, 0]} rotation={[0, 0, -0.3]}>
        <cylinderGeometry args={[0.025, 0.035, 0.5, 7]} />
        <meshStandardMaterial color="#4b7b3b" roughness={1} />
      </mesh>
      <mesh position={[0.2, 0.72, 0]} rotation={[0, 0, -0.9]}>
        <planeGeometry args={[0.22, 0.12]} />
        <meshStandardMaterial color="#69a858" side={THREE.DoubleSide} roughness={1} />
      </mesh>
      {[-0.42, 0.42].map((x) => (
        <mesh key={x} position={[x, 0.55, 0]} rotation={[0, 0, x * 0.25]}>
          <cylinderGeometry args={[0.025, 0.035, 1.1, 6]} />
          <meshStandardMaterial color="#6b4a31" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

function AcademicGrove({ feature, bark, leaf }: { feature: GardenFeature; bark: THREE.Texture; leaf: THREE.Texture }) {
  const groveFeatures = [
    { id: `${feature.id}-a`, title: feature.title, position: feature.position, scale: 0.78 },
    { id: `${feature.id}-b`, title: feature.title, position: [feature.position[0] - 1.2, 0, feature.position[2] - 0.8] as [number, number, number], scale: 0.62 },
    { id: `${feature.id}-c`, title: feature.title, position: [feature.position[0] + 1.1, 0, feature.position[2] - 0.5] as [number, number, number], scale: 0.66 },
  ];
  return (
    <group>
      {groveFeatures.map((item) => (
        <StandardTree
          key={item.id}
          feature={{ ...feature, id: item.id, position: item.position, scale: item.scale, title: feature.title }}
          bark={bark}
          leaf={leaf}
        />
      ))}
      <group position={[feature.position[0] + 0.55, 1.0, feature.position[2] + 1.05]} rotation={[0, -0.36, 0]}>
        <mesh>
          <boxGeometry args={[1.24, 0.42, 0.07]} />
          <meshStandardMaterial color="#7c4b24" roughness={1} />
        </mesh>
        <Text position={[0, 0, 0.045]} fontSize={0.09} maxWidth={1.1} textAlign="center" anchorX="center" anchorY="middle" color="#24160d">
          UT Knoxville
        </Text>
      </group>
      <GlowSphere color="#ff8a32" position={[feature.position[0] - 0.25, 1.55, feature.position[2] + 0.35]} size={0.12} opacity={0.32} />
    </group>
  );
}

function McatGrove({ feature, bark, leaf }: { feature: GardenFeature; bark: THREE.Texture; leaf: THREE.Texture }) {
  return (
    <group>
      <StandardTree feature={{ ...feature, id: `${feature.id}-standing`, position: [feature.position[0] + 1.1, 0, feature.position[2] - 0.5], scale: 0.72 }} bark={bark} leaf={leaf} variant="scarred" />
      <mesh position={[feature.position[0] - 0.8, 0.36, feature.position[2] + 0.2]} rotation={[Math.PI / 2, 0.18, 1.18]} castShadow>
        <cylinderGeometry args={[0.26, 0.38, 2.6, 12]} />
        <meshStandardMaterial map={bark} color="#6a4f39" roughness={1} />
      </mesh>
      <mesh position={[feature.position[0] - 1.55, 0.34, feature.position[2] - 0.88]} castShadow>
        <cylinderGeometry args={[0.32, 0.42, 0.68, 13]} />
        <meshStandardMaterial map={bark} color="#5a4534" roughness={1} />
      </mesh>
      <mesh position={[feature.position[0] - 1.55, 0.72, feature.position[2] - 0.88]}>
        <circleGeometry args={[0.33, 18]} />
        <meshStandardMaterial color="#8c6b4c" roughness={1} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function SoccerMeadow({ feature }: { feature: GardenFeature }) {
  return (
    <group position={feature.position}>
      <mesh position={[0, 0.03, 0]} scale={[2.1, 0.08, 1.3]}>
        <sphereGeometry args={[1, 24, 8]} />
        <meshStandardMaterial color="#243f23" roughness={1} />
      </mesh>
      <mesh position={[0.18, 0.26, 0.08]} castShadow>
        <sphereGeometry args={[0.22, 18, 18]} />
        <meshStandardMaterial color="#3e3329" roughness={0.8} />
      </mesh>
      {[0, Math.PI / 2, Math.PI / 4].map((rot) => (
        <mesh key={rot} position={[0.18, 0.262, 0.08]} rotation={[0, rot, 0]}>
          <torusGeometry args={[0.222, 0.006, 6, 32]} />
          <meshBasicMaterial color="#a98f6f" />
        </mesh>
      ))}
      <group position={[1.18, 0.65, -0.35]} rotation={[0, -0.2, 0]}>
        {[-0.45, 0.45].map((x) => (
          <mesh key={x} position={[x, 0, 0]}>
            <cylinderGeometry args={[0.025, 0.03, 1.3, 6]} />
            <meshStandardMaterial color="#c5b69b" roughness={0.9} />
          </mesh>
        ))}
        <mesh position={[0, 0.62, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.022, 0.026, 0.92, 6]} />
          <meshStandardMaterial color="#c5b69b" roughness={0.9} />
        </mesh>
      </group>
      {[-0.65, -0.25, 0.55].map((x, i) => (
        <mesh key={i} position={[x, 0.05, 0.7 - i * 0.22]} rotation={[-Math.PI / 2, 0, 0.25]}>
          <planeGeometry args={[0.18, 0.36]} />
          <meshBasicMaterial color="#192718" transparent opacity={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function WaveDepthStream({ feature }: { feature: GardenFeature }) {
  return (
    <group position={feature.position}>
      <mesh position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, -0.2]}>
        <planeGeometry args={[3.8, 1.05, 18, 4]} />
        <meshStandardMaterial color="#1d4b54" emissive="#102a31" emissiveIntensity={0.3} transparent opacity={0.72} roughness={0.22} metalness={0.05} side={THREE.DoubleSide} />
      </mesh>
      {[0.55, 0.95, 1.34].map((r, i) => (
        <mesh key={r} position={[-0.2 + i * 0.12, 0.07, 0.02]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[r, 0.012, 8, 64]} />
          <meshBasicMaterial color="#84d6e6" transparent opacity={0.18} blending={THREE.AdditiveBlending} toneMapped={false} />
        </mesh>
      ))}
      <group position={[0.02, 0.3, -0.04]} rotation={[0, 0.2, 0]}>
        {[-0.35, 0, 0.35].map((x) => (
          <mesh key={x} position={[x, 0, 0]}>
            <boxGeometry args={[0.22, 0.08, 1.7]} />
            <meshStandardMaterial color="#6b4a31" roughness={1} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function UnsownPlot({ feature }: { feature: GardenFeature }) {
  return (
    <group position={feature.position}>
      <mesh position={[0, 0.03, 0]} scale={[1.25, 0.09, 0.88]}>
        <sphereGeometry args={[1, 20, 8]} />
        <meshStandardMaterial color="#4f321d" roughness={1} />
      </mesh>
      {Array.from({ length: 11 }, (_, i) => {
        const a = (i / 11) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 1.18, 0.1, Math.sin(a) * 0.82]}>
            <dodecahedronGeometry args={[0.11, 0]} />
            <meshStandardMaterial color="#6d6a60" roughness={1} />
          </mesh>
        );
      })}
      <GlowSphere color="#f3c77b" position={[0, 0.2, 0]} size={0.42} opacity={0.09} />
    </group>
  );
}

function FeatureObject({
  feature,
  bark,
  leaf,
  onInspect,
}: {
  feature: GardenFeature;
  bark: THREE.Texture;
  leaf: THREE.Texture;
  onInspect?: (featureId: string) => void;
}) {
  return (
    <>
      {feature.id === "website-tree" && <WebsiteTree feature={feature} bark={bark} leaf={leaf} />}
      {feature.id === "noctyrium" && <NoctyriumSapling feature={feature} bark={bark} leaf={leaf} />}
      {feature.id === "term-3" && <SeedPlot feature={feature} />}
      {feature.id === "term-2" && <StandardTree feature={feature} bark={bark} leaf={leaf} variant="scarred" />}
      {feature.id === "term-1" && <StandardTree feature={feature} bark={bark} leaf={leaf} />}
      {feature.id === "utk" && <AcademicGrove feature={feature} bark={bark} leaf={leaf} />}
      {feature.id === "mcat" && <McatGrove feature={feature} bark={bark} leaf={leaf} />}
      {feature.id === "training-journey" && <StandardTree feature={feature} bark={bark} leaf={leaf} variant="apple" />}
      {feature.id === "soccer" && <SoccerMeadow feature={feature} />}
      {feature.id === "wave-depth" && <WaveDepthStream feature={feature} />}
      {feature.id === "future-plot" && <UnsownPlot feature={feature} />}
      <PhysicalPlaque feature={feature} onInspect={onInspect} />
    </>
  );
}

function TrailPath({ dirt }: { dirt: Pick<ReturnType<typeof useGardenTextures>, "dirtColor" | "dirtNormal" | "dirtRoughness"> }) {
  const geometries = useMemo(
    () => [
      ribbonGeometry(TRAIL_CURVES[0].getPoints(110), 2.35),
      ribbonGeometry(TRAIL_CURVES[1].getPoints(94), 1.82),
      ribbonGeometry(TRAIL_CURVES[2].getPoints(94), 1.86),
    ],
    []
  );
  return (
    <group>
      {geometries.map((geometry, i) => (
        <mesh key={i} geometry={geometry} receiveShadow>
          <meshStandardMaterial
            map={dirt.dirtColor}
            normalMap={dirt.dirtNormal}
            roughnessMap={dirt.dirtRoughness}
            color={i === 0 ? "#c1a17c" : "#ab8d6b"}
            roughness={1}
            emissive={i === 0 ? "#21130a" : "#160c06"}
            emissiveIntensity={0.26}
          />
        </mesh>
      ))}
    </group>
  );
}

function TerrainGround({ map }: { map: THREE.Texture }) {
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(GROUND_SPAN, GROUND_SPAN, 132, 132);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(pos.count * 3);
    const low = new THREE.Color("#23331f");
    const high = new THREE.Color("#6c765b");
    const trail = new THREE.Color("#5c624d");
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const worldZ = -pos.getY(i);
      const h = terrainHeightAt(x, worldZ);
      const dist = distanceToTrail(new THREE.Vector3(x, 0, worldZ));
      pos.setZ(i, h);
      const k = THREE.MathUtils.clamp((h + 0.42) / 1.36, 0, 1);
      c.copy(low).lerp(high, k);
      if (dist < 3.6) c.lerp(trail, 0.32);
      colors.set([c.r, c.g, c.b], i * 3);
    }
    pos.needsUpdate = true;
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <meshStandardMaterial map={map} vertexColors color="#7d8567" roughness={1} />
    </mesh>
  );
}

function ForkSignpost({ onSelectNode }: { onSelectNode?: (nodeId: string) => void }) {
  const planks = [
    { label: "Medicine & Study", node: "term-3", y: 1.56, x: -0.34, yaw: -0.4 },
    { label: "Projects & Life", node: "training-journey", y: 1.22, x: 0.38, yaw: 0.42 },
  ];
  return (
    <group position={[0.45, 0, -26.25]}>
      <mesh position={[0, 0.78, 0]} castShadow>
        <cylinderGeometry args={[0.055, 0.08, 1.58, 8]} />
        <meshStandardMaterial color="#60442e" roughness={1} />
      </mesh>
      {planks.map((plank) => (
        <group
          key={plank.node}
          position={[plank.x, plank.y, 0]}
          rotation={[0, plank.yaw, 0]}
          onClick={(ev) => {
            ev.stopPropagation();
            onSelectNode?.(plank.node);
          }}
          onPointerOver={(ev) => {
            ev.stopPropagation();
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            document.body.style.cursor = "";
          }}
        >
          <mesh castShadow>
            <boxGeometry args={[1.28, 0.25, 0.065]} />
            <meshStandardMaterial color="#7b5638" roughness={0.96} />
          </mesh>
          <mesh position={[plank.node === "term-3" ? -1.02 : 1.02, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <coneGeometry args={[0.16, 0.25, 3]} />
            <meshStandardMaterial color="#7b5638" roughness={0.96} />
          </mesh>
          <Text position={[0, 0.006, 0.044]} fontSize={0.064} maxWidth={1.02} textAlign="center" anchorX="center" anchorY="middle" color="#22170f">
            {plank.label}
          </Text>
        </group>
      ))}
      <GlowSphere color="#f0c77c" position={[0, 0.46, 0]} size={0.24} opacity={0.1} />
    </group>
  );
}

function TrailLantern({
  position,
  yaw = 0,
  side = 1,
  height = 1.72,
}: {
  position: [number, number, number];
  yaw?: number;
  side?: 1 | -1;
  height?: number;
}) {
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      <mesh position={[0, height * 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.055, height, 7]} />
        <meshStandardMaterial color="#5e4029" roughness={1} />
      </mesh>
      <mesh position={[side * 0.18, height - 0.08, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.018, 0.025, 0.42, 7]} />
        <meshStandardMaterial color="#5e4029" roughness={1} />
      </mesh>
      <mesh position={[side * 0.38, height - 0.28, 0]} castShadow>
        <boxGeometry args={[0.19, 0.28, 0.16]} />
        <meshStandardMaterial color="#4b3323" roughness={0.9} transparent opacity={0.62} />
      </mesh>
      <mesh position={[side * 0.38, height - 0.28, 0]}>
        <sphereGeometry args={[0.09, 14, 14]} />
        <meshBasicMaterial color="#ffd18a" transparent opacity={0.92} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
      <pointLight position={[side * 0.38, height - 0.28, 0]} color="#ffc778" intensity={1.35} distance={7.6} decay={2.05} />
      <GlowSphere color="#ffd18a" position={[side * 0.38, height - 0.28, 0]} size={0.48} opacity={0.13} />
    </group>
  );
}

function TrailLanterns() {
  const lanterns: {
    position: [number, number, number];
    yaw: number;
    side: 1 | -1;
    height: number;
  }[] = [
    { position: [-2.15, 0.02, 3.9], yaw: 0.32, side: 1 as const, height: 1.58 },
    { position: [2.65, 0.02, -2.2], yaw: -0.2, side: -1 as const, height: 1.72 },
    { position: [-3.2, 0.02, -7.1], yaw: 0.58, side: 1 as const, height: 1.76 },
    { position: [1.05, 0.02, -17.0], yaw: -0.24, side: -1 as const, height: 1.48 },
    { position: [-1.2, 0.02, -24.6], yaw: 0.15, side: 1 as const, height: 1.62 },
    { position: [3.5, 0.02, -28.2], yaw: -0.46, side: -1 as const, height: 1.58 },
  ];
  return (
    <>
      {lanterns.map((lantern, i) => (
        <TrailLantern key={i} {...lantern} />
      ))}
    </>
  );
}

function GroundRing({
  node,
  visible,
  onSelectNode,
}: {
  node: GardenPathNode;
  visible: boolean;
  onSelectNode?: (nodeId: string) => void;
}) {
  const ref = useRef<THREE.Group>(null!);
  useFrame((state) => {
    if (!ref.current) return;
    const k = 1 + Math.sin(state.clock.elapsedTime * 1.7) * 0.075;
    ref.current.scale.setScalar(k);
  });
  if (!visible) return null;
  return (
    <group
      ref={ref}
      position={[node.position[0], 0.07, node.position[2]]}
      onClick={(ev) => {
        ev.stopPropagation();
        onSelectNode?.(node.id);
      }}
      onPointerOver={(ev) => {
        ev.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "";
      }}
    >
      <group rotation={[-Math.PI / 2, 0, 0]}>
        <mesh>
          <torusGeometry args={[0.9, 0.018, 8, 72]} />
          <meshBasicMaterial color="#f0c77c" transparent opacity={0.68} blending={THREE.AdditiveBlending} toneMapped={false} />
        </mesh>
        <mesh>
          <ringGeometry args={[0.48, 0.82, 64]} />
          <meshBasicMaterial color="#f0c77c" transparent opacity={0.16} blending={THREE.AdditiveBlending} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
      </group>
      <mesh position={[0, 0.62, 0]}>
        <sphereGeometry args={[0.115, 18, 18]} />
        <meshBasicMaterial color="#ffd18a" transparent opacity={0.92} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.58, 0]}>
        <cylinderGeometry args={[0.2, 0.52, 1.15, 24, 1, true]} />
        <meshBasicMaterial color="#f0c77c" transparent opacity={0.06} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 0.7, 0]} color="#ffc778" intensity={0.65} distance={5.5} decay={2} />
    </group>
  );
}

function Grass({ quality }: { quality: GardenQuality }) {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const count = qualityCount(quality, 2600, 4300, 6400, 7600);
  const height = 0.48;
  const geom = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.055, height, 1, 4);
    g.translate(0, height / 2, 0);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const col = new Float32Array(pos.count * 3);
    const base = new THREE.Color("#1f331f");
    const tip = new THREE.Color("#668f53");
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const k = y / height;
      pos.setX(i, pos.getX(i) * (1 - k * 0.82));
      c.copy(base).lerp(tip, k * k);
      col.set([c.r, c.g, c.b], i * 3);
    }
    pos.needsUpdate = true;
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return g;
  }, []);
  const mat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 1 });
    applyGrassWind(m, height, quality === "low" ? 0.72 : 1);
    return m;
  }, [quality]);
  useEffect(() => {
    const rnd = mulberry32(909);
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    for (let i = 0; i < count; i++) {
      const p = scatterNearTrail(rnd, 7.6);
      const s = 0.68 + rnd() * 0.85;
      q.setFromAxisAngle(up, rnd() * Math.PI);
      m4.compose(p, q, new THREE.Vector3(s, s + rnd() * 0.5, s));
      ref.current.setMatrixAt(i, m4);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, [count]);
  useFrame((state) => {
    windUniforms.uTime.value = state.clock.elapsedTime;
  });
  return <instancedMesh ref={ref} args={[geom, mat, count]} frustumCulled={false} />;
}

function Ferns({ map, quality }: { map: THREE.Texture; quality: GardenQuality }) {
  const items = useMemo(() => {
    const rnd = mulberry32(55);
    return Array.from({ length: qualityCount(quality, 46, 78, 124, 152) }, () => {
      const p = scatterNearTrail(rnd, 6.4);
      return { x: p.x, z: p.z, s: 0.48 + rnd() * 1.04, rot: rnd() * Math.PI };
    });
  }, [quality]);
  return (
    <>
      {items.map((f, i) => (
        <group key={i} position={[f.x, f.s * 0.42, f.z]} rotation={[0, f.rot, 0]}>
          {[0, Math.PI / 2].map((ry) => (
            <mesh key={ry} rotation={[0, ry, 0]}>
              <planeGeometry args={[f.s, f.s]} />
              <meshStandardMaterial map={map} transparent alphaTest={0.15} side={THREE.DoubleSide} roughness={1} />
            </mesh>
          ))}
        </group>
      ))}
    </>
  );
}

function Rocks({ quality }: { quality: GardenQuality }) {
  const rocks = useMemo(() => {
    const rnd = mulberry32(118);
    return Array.from({ length: qualityCount(quality, 42, 70, 112, 136) }, () => {
      const p = scatterNearTrail(rnd, 8.2);
      return { p, s: 0.12 + rnd() * 0.36, r: [rnd() * 1.2, rnd() * Math.PI, rnd() * 0.8] as [number, number, number] };
    });
  }, [quality]);
  return (
    <>
      {rocks.map((rock, i) => (
        <mesh key={i} position={[rock.p.x, rock.s * 0.32, rock.p.z]} rotation={rock.r} scale={[rock.s * 1.4, rock.s * 0.7, rock.s]}>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={i % 3 === 0 ? "#6c695f" : "#55594f"} roughness={1} />
        </mesh>
      ))}
    </>
  );
}

function GiantForest({ bark, leaf, quality }: { bark: THREE.Texture; leaf: THREE.Texture; quality: GardenQuality }) {
  const trunkRef = useRef<THREE.InstancedMesh>(null!);
  const geom = useMemo(() => flutedTrunk(0.38, 1.05, 23, 17), []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ map: bark, color: "#8b5e43", roughness: 0.95 }), [bark]);
  const placements = useMemo(() => {
    const rnd = mulberry32(314);
    const out: { p: THREE.Vector3; rs: number; hs: number; rot: number; tint: THREE.Color; canopy: [number, number, number] }[] = [];
    const frame = [
      [-11.2, 10.2],
      [11.8, 9.2],
      [-10.4, 3.4],
      [11.2, 2.8],
      [-9.3, -3.2],
      [10.5, -5.6],
      [-12.2, -16],
      [12.5, -18],
    ];
    frame.forEach(([x, z], i) => {
      const p = new THREE.Vector3(x + (rnd() - 0.5) * 0.7, 0, z + (rnd() - 0.5) * 0.8);
      out.push({
        p,
        rs: 0.72 + rnd() * 0.34,
        hs: 1.1 + rnd() * 0.55,
        rot: rnd() * Math.PI * 2,
        tint: new THREE.Color(i % 2 ? "#a56e4c" : "#85583e"),
        canopy: [p.x + (rnd() - 0.5) * 1.4, 15 + rnd() * 8, p.z + (rnd() - 0.5) * 1.4],
      });
    });
    let guard = 0;
    const target = qualityCount(quality, 42, 64, 92, 118);
    while (out.length < target && guard++ < 1800) {
      const p = new THREE.Vector3((rnd() - 0.5) * 66, 0, 14 - rnd() * 94);
      if (distanceToTrail(p) < 4.4) continue;
      if (p.z < 8 && p.z > -70 && Math.abs(p.x) < 5.4) continue;
      if (gardenFeatures.some((feature) => Math.hypot(feature.position[0] - p.x, feature.position[2] - p.z) < 2.2)) continue;
      out.push({
        p,
        rs: 0.48 + rnd() * 0.82,
        hs: 0.78 + rnd() * 1.15,
        rot: rnd() * Math.PI * 2,
        tint: new THREE.Color().setHSL(0.055 + rnd() * 0.028, 0.38, 0.44 + rnd() * 0.16),
        canopy: [p.x + (rnd() - 0.5) * 1.8, 14 + rnd() * 14, p.z + (rnd() - 0.5) * 1.8],
      });
    }
    return out;
  }, [quality]);
  useEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    placements.forEach((it, i) => {
      q.setFromAxisAngle(up, it.rot);
      m.compose(it.p, q, new THREE.Vector3(it.rs, it.hs, it.rs));
      trunkRef.current.setMatrixAt(i, m);
      trunkRef.current.setColorAt(i, it.tint);
    });
    trunkRef.current.instanceMatrix.needsUpdate = true;
    if (trunkRef.current.instanceColor) trunkRef.current.instanceColor.needsUpdate = true;
  }, [placements]);
  return (
    <>
      <instancedMesh ref={trunkRef} args={[geom, mat, placements.length]} castShadow receiveShadow frustumCulled={false} />
      {placements.slice(0, qualityCount(quality, 22, 36, 58, 72)).map((it, i) => (
        <LeafCluster key={i} map={leaf} position={it.canopy} scale={2.1 + (i % 5) * 0.28} color={i % 2 ? "#1d3525" : "#263f2a"} opacity={0.55} />
      ))}
    </>
  );
}

function Fireflies({ quality }: { quality: GardenQuality }) {
  const ref = useRef<THREE.Points>(null!);
  const { geom, bases, phases } = useMemo(() => {
    const rnd = mulberry32(303);
    const n = qualityCount(quality, 48, 74, 118, 146);
    const bases = new Float32Array(n * 3);
    const phases = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const p = scatterNearTrail(rnd, 7.6);
      bases.set([p.x, 0.55 + rnd() * 3.8, p.z], i * 3);
      phases.set([rnd() * 6.28, rnd() * 6.28, rnd() * 6.28], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(bases.slice(), 3));
    return { geom: g, bases, phases };
  }, [quality]);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const arr = ref.current.geometry.attributes.position.array as Float32Array;
    const pointerInfluenceX = state.pointer.x * 0.22;
    const pointerInfluenceY = state.pointer.y * 0.08;
    for (let i = 0; i < arr.length / 3; i++) {
      arr[i * 3] = bases[i * 3] + Math.sin(t * 0.48 + phases[i * 3]) * 0.62 + pointerInfluenceX;
      arr[i * 3 + 1] = bases[i * 3 + 1] + Math.sin(t * 0.68 + phases[i * 3 + 1]) * 0.38 + pointerInfluenceY;
      arr[i * 3 + 2] = bases[i * 3 + 2] + Math.cos(t * 0.43 + phases[i * 3 + 2]) * 0.58;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
    (ref.current.material as THREE.PointsMaterial).opacity = 0.56 + Math.sin(t * 1.25) * 0.24;
  });
  return (
    <points ref={ref} geometry={geom}>
      <pointsMaterial size={0.12} color="#ffcf87" transparent opacity={0.72} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation toneMapped={false} />
    </points>
  );
}

function MistBands({ map, quality }: { map: THREE.Texture; quality: GardenQuality }) {
  const refs = useRef<THREE.Mesh[]>([]);
  const bands = useMemo(() => {
    const rnd = mulberry32(88);
    return Array.from({ length: qualityCount(quality, 6, 9, 13, 16) }, () => ({
      x: (rnd() - 0.5) * 54,
      y: 0.08 + rnd() * 0.58,
      z: 8 - rnd() * 78,
      s: 8 + rnd() * 16,
      spd: (0.55 + rnd() * 1.1) * (rnd() > 0.5 ? 1 : -1),
      ph: rnd() * 6.28,
      o: 0.025 + rnd() * 0.055,
    }));
  }, [quality]);
  useFrame((state) => {
    const tt = state.clock.elapsedTime;
    refs.current.slice(0, bands.length).forEach((mesh, i) => {
      const band = bands[i];
      if (!mesh || !band) return;
      mesh.position.x = band.x + Math.sin(tt * 0.055 * band.spd + band.ph) * 6;
      mesh.position.z = band.z + Math.cos(tt * 0.04 * band.spd + band.ph) * 3;
    });
  });
  return (
    <>
      {bands.map((b, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) refs.current[i] = el;
            else delete refs.current[i];
          }}
          position={[b.x, b.y, b.z]}
          rotation={[-Math.PI / 2 + 0.08, 0, b.ph]}
        >
          <planeGeometry args={[b.s, b.s * 0.66]} />
          <meshBasicMaterial map={map} transparent opacity={b.o} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </>
  );
}

function LightShafts({ map }: { map: THREE.Texture }) {
  const shafts = useMemo(() => {
    const rnd = mulberry32(21);
    return Array.from({ length: 12 }, () => ({
      x: (rnd() - 0.5) * 36,
      y: 10 + rnd() * 8,
      z: 4 - rnd() * 64,
      w: 1.4 + rnd() * 3.2,
      h: 18 + rnd() * 13,
      tilt: 0.18 + rnd() * 0.12,
      yaw: -0.34 + rnd() * 0.22,
      o: 0.04 + rnd() * 0.08,
    }));
  }, []);
  return (
    <>
      {shafts.map((s, i) => (
        <mesh key={i} position={[s.x, s.y, s.z]} rotation={[0, s.yaw, s.tilt]}>
          <planeGeometry args={[s.w, s.h]} />
          <meshBasicMaterial map={map} color="#b7cce7" transparent opacity={s.o} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
      ))}
    </>
  );
}

function Backdrop({ mountain }: { mountain: THREE.Texture }) {
  const sky = useMemo(() => {
    const g = new THREE.SphereGeometry(92, 32, 18);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const col = new Float32Array(pos.count * 3);
    const top = new THREE.Color("#344861");
    const bot = new THREE.Color("#071016");
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const k = THREE.MathUtils.clamp((pos.getY(i) / 92 + 0.12) / 1.08, 0, 1);
      c.copy(bot).lerp(top, k * k);
      col.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return g;
  }, []);
  return (
    <group renderOrder={-10}>
      <mesh geometry={sky}>
        <meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} depthWrite={false} />
      </mesh>
      <mesh position={[0, 13, -82]}>
        <planeGeometry args={[148, 46]} />
        <meshBasicMaterial map={mountain} transparent opacity={0.9} depthWrite={false} />
      </mesh>
      <mesh position={[24, 34, -58]}>
        <sphereGeometry args={[2.2, 24, 24]} />
        <meshBasicMaterial color="#eaf1ff" fog={false} toneMapped={false} />
      </mesh>
      <mesh position={[24, 34, -58.3]}>
        <circleGeometry args={[5.2, 32]} />
        <meshBasicMaterial color="#9fb6d8" transparent opacity={0.16} fog={false} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

function GardenCameraRig({
  currentNodeId,
  targetNodeId,
  onArrive,
}: {
  currentNodeId: string;
  targetNodeId: string;
  onArrive?: (nodeId: string) => void;
}) {
  const { camera } = useThree();
  const curveRef = useRef<THREE.CatmullRomCurve3>(new THREE.CatmullRomCurve3([nodeCamera("start"), nodeCamera("start")]));
  const progress = useRef(1);
  const routeLength = useRef(1);
  const activeTarget = useRef(targetNodeId);
  const arrived = useRef(targetNodeId);
  const look = useRef(vectorFromTuple(gardenPathNodeById(targetNodeId).lookAt));
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const targetLook = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    const ids = routeBetween(currentNodeId, targetNodeId);
    const points = [camera.position.clone(), ...ids.slice(1).map(nodeCamera)];
    if (points.length === 1) points.push(nodeCamera(targetNodeId));
    curveRef.current = new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.36);
    routeLength.current = Math.max(1, curveRef.current.getLength());
    progress.current = currentNodeId === targetNodeId ? 1 : 0;
    activeTarget.current = targetNodeId;
    arrived.current = currentNodeId === targetNodeId ? targetNodeId : "";
  }, [camera, currentNodeId, targetNodeId]);

  useFrame((state, dt) => {
    const targetNode = gardenPathNodeById(activeTarget.current);
    const speed = targetNode.cameraSpeed ?? 0.66;
    if (progress.current < 1) {
      progress.current = Math.min(1, progress.current + (Math.min(dt, 0.05) * speed * 7.8) / routeLength.current);
    }
    const t = THREE.MathUtils.smootherstep(progress.current, 0, 1);
    const p = curveRef.current.getPoint(t);
    const bob = Math.sin(state.clock.elapsedTime * 1.15) * 0.014;
    camera.position.set(p.x, p.y + bob, p.z);

    const ahead = curveRef.current.getPoint(Math.min(1, t + 0.04));
    tmp.set(ahead.x, EYE_HEIGHT + 0.04, ahead.z - 2.2);
    targetLook.copy(vectorFromTuple(targetNode.lookAt));
    tmp.lerp(targetLook, THREE.MathUtils.smoothstep(t, 0.45, 1));
    if (targetNode.allowLookAround) {
      tmp.x += state.pointer.x * 1.35;
      tmp.y += state.pointer.y * 0.52;
    }
    look.current.lerp(tmp, 1 - Math.exp(-4.8 * Math.min(dt, 0.05)));
    camera.lookAt(look.current);
    if (progress.current >= 1 && arrived.current !== activeTarget.current) {
      arrived.current = activeTarget.current;
      onArrive?.(activeTarget.current);
    }
  });
  return null;
}

function GardenScene({
  quality,
  currentNodeId,
  targetNodeId,
  onArrive,
  onSelectNode,
  onInspectFeature,
}: {
  quality: GardenQuality;
  currentNodeId: string;
  targetNodeId: string;
  onArrive?: (nodeId: string) => void;
  onSelectNode?: (nodeId: string) => void;
  onInspectFeature?: (featureId: string) => void;
}) {
  const textures = useGardenTextures();
  const floor = useMemo(() => (typeof document !== "undefined" ? makeForestFloorTexture() : null), []);
  const leaf = useMemo(() => (typeof document !== "undefined" ? makeLeafClusterTexture() : null), []);
  const fern = useMemo(() => (typeof document !== "undefined" ? makeFernTexture() : null), []);
  const mist = useMemo(() => (typeof document !== "undefined" ? makeSoftMistTexture(5) : null), []);
  const shaft = useMemo(() => (typeof document !== "undefined" ? makeShaftTexture() : null), []);
  const mountain = useMemo(() => (typeof document !== "undefined" ? makeMountainTexture() : null), []);
  const currentNode = gardenPathNodeById(currentNodeId);
  const moving = currentNodeId !== targetNodeId;
  const visibleNextNodes = new Set(moving ? [] : currentNode.nextNodes);

  if (!floor || !leaf || !fern || !mist || !shaft || !mountain) return null;

  return (
    <>
      <fog attach="fog" args={["#263a42", 10, 82]} />
      <hemisphereLight intensity={0.74} color="#8aa1bf" groundColor="#0a150e" />
      <directionalLight position={[18, 30, -20]} intensity={2.55} color="#d5e2ff" castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[9, 8, 9]} intensity={0.92} color="#f0b86f" />
      <ambientLight intensity={0.44} color="#40536e" />

      <Backdrop mountain={mountain} />
      <GardenCameraRig currentNodeId={currentNodeId} targetNodeId={targetNodeId} onArrive={onArrive} />

      <TerrainGround map={floor} />
      <TrailPath dirt={textures} />
      <ForkSignpost onSelectNode={onSelectNode} />
      <TrailLanterns />

      {gardenFeatures.map((feature) => (
        <FeatureObject key={feature.id} feature={feature} bark={textures.barkColor} leaf={leaf} onInspect={onInspectFeature} />
      ))}

      {nodeIds.map((id) => (
        <GroundRing key={id} node={gardenPathNodeById(id)} visible={visibleNextNodes.has(id)} onSelectNode={onSelectNode} />
      ))}

      <GiantForest bark={textures.barkColor} leaf={leaf} quality={quality} />
      <Grass quality={quality} />
      <Ferns map={fern} quality={quality} />
      <Rocks quality={quality} />
      <MistBands map={mist} quality={quality} />
      <LightShafts map={shaft} />
      <Fireflies quality={quality} />

      <EffectComposer multisampling={0}>
        <Bloom intensity={0.86} luminanceThreshold={0.48} luminanceSmoothing={0.42} mipmapBlur />
        <SMAA />
        <HueSaturation saturation={-0.04} hue={0} />
        <BrightnessContrast brightness={-0.012} contrast={0.12} />
        <Vignette eskil={false} offset={0.28} darkness={0.52} />
      </EffectComposer>
    </>
  );
}

function CanvasFallback() {
  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <meshBasicMaterial color="#07100d" />
    </mesh>
  );
}

export default function GardenCanvas({
  active,
  currentNodeId,
  targetNodeId,
  quality = "high",
  onArrive,
  onSelectNode,
  onInspectFeature,
}: GardenCanvasProps) {
  return (
    <Canvas
      camera={{ fov: 64, position: [0, EYE_HEIGHT, 8.5], near: 0.1, far: 125 }}
      dpr={quality === "low" ? [1, 1.2] : [1, 1.75]}
      frameloop={active ? "always" : "demand"}
      shadows
      gl={{ antialias: true, powerPreference: "high-performance", toneMappingExposure: 1.03 }}
      style={{ background: "transparent" }}
    >
      <Suspense fallback={<CanvasFallback />}>
        <GardenScene
          quality={quality}
          currentNodeId={currentNodeId}
          targetNodeId={targetNodeId}
          onArrive={onArrive}
          onSelectNode={onSelectNode}
          onInspectFeature={onInspectFeature}
        />
      </Suspense>
    </Canvas>
  );
}

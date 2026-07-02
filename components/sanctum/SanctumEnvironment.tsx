"use client";
import { Sky } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useTerrain } from "./lib/assets";
import { mulberry32 } from "./lib/rng";
import {
  buildTrailRibbon,
  groundHeight,
  SANCTUM_BOUNDS,
  scatter,
  trailLineScatter,
} from "./lib/terrain";
import { applyGrassWind } from "./shaders/grassWind";
import { applyLeafWind } from "./shaders/leafWind";
import type { QualityConfig } from "./SanctumQualityManager";

/**
 * The Living Sanctum substrate: sculpted ground with blended PBR materials, the
 * worn dirt trail ribbon, instanced wind grass, a billboard-impostor forest that
 * walls the playable area cheaply, and a distant mountain vista under a graded
 * sky. Everything heavy here is instanced or a single mesh.
 */
export default function SanctumEnvironment({ config }: { config: QualityConfig }) {
  return (
    <group>
      <Ground />
      <Trail />
      <SteppingStones />
      <GrassField config={config} />
      <ImpostorForest config={config} />
      <SunShafts config={config} />
      <SkyVista />
    </group>
  );
}

/* ————— volumetric god-ray shafts raking from the dawn sun ————— */
function makeShaftTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, "rgba(255,236,190,0.55)");
  g.addColorStop(0.55, "rgba(255,226,170,0.14)");
  g.addColorStop(1, "rgba(255,226,170,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 256);
  const side = ctx.createLinearGradient(0, 0, 64, 0);
  side.addColorStop(0, "rgba(0,0,0,1)");
  side.addColorStop(0.5, "rgba(0,0,0,0)");
  side.addColorStop(1, "rgba(0,0,0,1)");
  ctx.globalCompositeOperation = "destination-out";
  ctx.fillStyle = side;
  ctx.fillRect(0, 0, 64, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function SunShafts({ config }: { config: QualityConfig }) {
  const ref = useRef<THREE.Group>(null!);
  const tex = useMemo(() => makeShaftTexture(), []);
  // shafts aim along the sun→ground direction so every beam reads as one light
  const tilt = useMemo(() => {
    const dir = SUN_POS.clone().normalize();
    return Math.atan2(dir.x, dir.y); // lean off-vertical toward the sun azimuth
  }, []);
  const shafts = useMemo(() => {
    if (config.tier === "low") return [];
    const rnd = mulberry32(21);
    const n = config.tier === "ultra" ? 16 : 10;
    return Array.from({ length: n }, () => ({
      x: (rnd() - 0.5) * 40,
      y: 10 + rnd() * 6,
      z: 6 - rnd() * 60,
      w: 2 + rnd() * 4,
      h: 20 + rnd() * 12,
      yaw: -0.4 + rnd() * 0.3,
      o: 0.05 + rnd() * 0.07,
    }));
  }, [config.tier]);
  useFrame((s) => {
    if (ref.current) ref.current.position.x = Math.sin(s.clock.elapsedTime * 0.04) * 1.2;
  });
  if (!shafts.length) return null;
  return (
    <group ref={ref}>
      {shafts.map((sh, i) => (
        <mesh key={i} position={[sh.x, sh.y, sh.z]} rotation={[0, sh.yaw, tilt]}>
          <planeGeometry args={[sh.w, sh.h]} />
          <meshBasicMaterial
            map={tex}
            color="#ffe6b0"
            transparent
            opacity={sh.o}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ————— ground ————— */
function Ground() {
  const { map, normalMap, roughnessMap } = useTerrain("floor", 22);
  const geom = useMemo(() => {
    const w = SANCTUM_BOUNDS.maxX - SANCTUM_BOUNDS.minX + 40;
    const d = SANCTUM_BOUNDS.maxZ - SANCTUM_BOUNDS.minZ + 40;
    const g = new THREE.PlaneGeometry(w, d, 96, 96);
    g.rotateX(-Math.PI / 2);
    g.translate((SANCTUM_BOUNDS.minX + SANCTUM_BOUNDS.maxX) / 2, 0, (SANCTUM_BOUNDS.minZ + SANCTUM_BOUNDS.maxZ) / 2);
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      pos.setY(i, groundHeight(pos.getX(i), pos.getZ(i)));
    }
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <mesh geometry={geom} receiveShadow>
      <meshStandardMaterial map={map} normalMap={normalMap} roughnessMap={roughnessMap} color="#5a5e48" dithering />
    </mesh>
  );
}

/* ————— worn dirt trail ————— */
// packed earth, not pavement: a warm trodden band with speckle grit, faint
// root/rut streaks along the direction of travel, a few embedded pebbles, and
// an alpha fringe so the path dissolves into the meadow instead of ending at a
// hard machine edge. The ribbon UV runs u across the width, v along the length.
function makeDirtPath(): { map: THREE.CanvasTexture; bump: THREE.CanvasTexture; alpha: THREE.CanvasTexture } {
  const S = 256;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const ctx = c.getContext("2d")!;
  const bc = document.createElement("canvas");
  bc.width = bc.height = S;
  const bctx = bc.getContext("2d")!;
  const rnd = mulberry32(4127);

  // base earth, lighter where feet wear the centre
  const base = ctx.createLinearGradient(0, 0, S, 0);
  base.addColorStop(0, "#33291c");
  base.addColorStop(0.32, "#4a3b26");
  base.addColorStop(0.5, "#57462c");
  base.addColorStop(0.68, "#4a3b26");
  base.addColorStop(1, "#33291c");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, S, S);
  bctx.fillStyle = "#808080";
  bctx.fillRect(0, 0, S, S);

  // grit speckle
  for (let i = 0; i < 2600; i++) {
    const x = rnd() * S;
    const y = rnd() * S;
    const l = 0.35 + rnd() * 0.5;
    ctx.fillStyle = `rgba(${Math.round(90 * l + 40)}, ${Math.round(74 * l + 30)}, ${Math.round(52 * l + 18)}, ${0.25 + rnd() * 0.4})`;
    ctx.fillRect(x, y, 1 + rnd() * 1.6, 1 + rnd() * 1.6);
    bctx.fillStyle = `rgba(${rnd() > 0.5 ? 200 : 60},${rnd() > 0.5 ? 200 : 60},${rnd() > 0.5 ? 200 : 60},0.25)`;
    bctx.fillRect(x, y, 1.5, 1.5);
  }
  // faint ruts along travel (v axis = canvas y)
  for (let i = 0; i < 14; i++) {
    const x = S * (0.18 + rnd() * 0.64);
    ctx.strokeStyle = `rgba(20,14,8,${0.1 + rnd() * 0.12})`;
    ctx.lineWidth = 1.5 + rnd() * 2.5;
    ctx.beginPath();
    ctx.moveTo(x, -10);
    ctx.bezierCurveTo(x + (rnd() - 0.5) * 18, S * 0.33, x + (rnd() - 0.5) * 18, S * 0.66, x + (rnd() - 0.5) * 10, S + 10);
    ctx.stroke();
  }
  // embedded pebbles
  for (let i = 0; i < 46; i++) {
    const x = rnd() * S;
    const y = rnd() * S;
    const r = 1.5 + rnd() * 3.5;
    const l = 0.55 + rnd() * 0.4;
    ctx.fillStyle = `rgba(${Math.round(120 * l)}, ${Math.round(114 * l)}, ${Math.round(102 * l)}, 0.9)`;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * (0.6 + rnd() * 0.4), rnd() * 3, 0, Math.PI * 2);
    ctx.fill();
    const bg = bctx.createRadialGradient(x, y, 0.5, x, y, r + 1);
    bg.addColorStop(0, "#d8d8d8");
    bg.addColorStop(1, "#707070");
    bctx.fillStyle = bg;
    bctx.beginPath();
    bctx.arc(x, y, r + 0.5, 0, Math.PI * 2);
    bctx.fill();
  }

  // alpha: opaque centre, ragged dissolve at the edges (u axis = canvas x)
  const ac = document.createElement("canvas");
  ac.width = ac.height = S;
  const actx = ac.getContext("2d")!;
  const ag = actx.createLinearGradient(0, 0, S, 0);
  ag.addColorStop(0, "rgba(255,255,255,0)");
  ag.addColorStop(0.16, "rgba(255,255,255,1)");
  ag.addColorStop(0.84, "rgba(255,255,255,1)");
  ag.addColorStop(1, "rgba(255,255,255,0)");
  actx.fillStyle = ag;
  actx.fillRect(0, 0, S, S);
  // noisy bites out of the fringe so the edge never reads ruler-straight
  actx.globalCompositeOperation = "destination-out";
  for (let i = 0; i < 160; i++) {
    const edge = rnd() > 0.5;
    const x = edge ? S * (0.86 + rnd() * 0.14) : S * (0.14 - rnd() * 0.14);
    const y = rnd() * S;
    const r = 3 + rnd() * 12;
    const g = actx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(0,0,0,0.9)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    actx.fillStyle = g;
    actx.beginPath();
    actx.arc(x, y, r, 0, Math.PI * 2);
    actx.fill();
  }

  const map = new THREE.CanvasTexture(c);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.ClampToEdgeWrapping;
  map.wrapT = THREE.RepeatWrapping;
  const bump = new THREE.CanvasTexture(bc);
  bump.wrapS = THREE.ClampToEdgeWrapping;
  bump.wrapT = THREE.RepeatWrapping;
  const alpha = new THREE.CanvasTexture(ac);
  alpha.wrapS = THREE.ClampToEdgeWrapping;
  alpha.wrapT = THREE.RepeatWrapping;
  return { map, bump, alpha };
}

function Trail() {
  const { map, bump, alpha } = useMemo(() => makeDirtPath(), []);
  const geom = useMemo(() => buildTrailRibbon(3.4), []);
  return (
    <mesh geometry={geom} receiveShadow>
      <meshStandardMaterial
        map={map}
        bumpMap={bump}
        bumpScale={0.6}
        alphaMap={alpha}
        transparent
        depthWrite
        roughness={1}
        color="#b9a888"
        polygonOffset
        polygonOffsetFactor={-1}
      />
    </mesh>
  );
}

/* ————— stepping stones set into the dirt ————— */
// real geometry (not texture): flattened stone slabs strung down the centre of
// the path, catching light and casting shadow — the thing that makes the trail
// read as *laid* by someone rather than painted on.
function SteppingStones() {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const placements = useMemo(() => trailLineScatter(2.1, 0, 6011, 0.55), []);
  const geom = useMemo(() => {
    const g = new THREE.DodecahedronGeometry(0.42, 0);
    g.scale(1, 0.22, 0.8);
    return g;
  }, []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#8d887c", roughness: 0.95 }), []);
  useEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    const rnd = mulberry32(88);
    const col = new THREE.Color();
    placements.forEach((p, i) => {
      const s = 0.75 + rnd() * 0.55;
      q.setFromAxisAngle(up, rnd() * Math.PI * 2);
      m.compose(new THREE.Vector3(p.x, groundHeight(p.x, p.z) + 0.015, p.z), q, new THREE.Vector3(s, 1, s * (0.8 + rnd() * 0.4)));
      ref.current.setMatrixAt(i, m);
      col.setHSL(0.09, 0.06 + rnd() * 0.05, 0.5 + rnd() * 0.16);
      ref.current.setColorAt(i, col);
    });
    ref.current.count = placements.length;
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
  }, [placements, geom]);
  return <instancedMesh ref={ref} args={[geom, mat, placements.length]} receiveShadow castShadow frustumCulled={false} />;
}

/* ————— instanced wind grass — bowed 3-blade tufts ————— */
const GRASS_HEIGHT = 0.55;

/** hand-built tuft: three tapered blades fanned around the root, each bowing
 *  outward toward the tip, with a root→tip colour ramp baked into vertex
 *  colours. One instance = one tuft = one believable clump instead of a flat
 *  card, and the silhouette reads from every angle. */
function buildGrassTuft(): THREE.BufferGeometry {
  const ROWS = 4; // segments up the blade
  const BLADES = 3;
  const pos: number[] = [];
  const uv: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];
  const base = new THREE.Color("#2c3a22");
  const tip = new THREE.Color("#7ba55a");
  const tmp = new THREE.Color();
  let vo = 0;
  for (let b = 0; b < BLADES; b++) {
    const ang = (b / BLADES) * Math.PI * 2 + b * 0.7;
    const ca = Math.cos(ang);
    const sa = Math.sin(ang);
    const lean = 0.16 + b * 0.05; // each blade bows outward a little differently
    for (let r = 0; r <= ROWS; r++) {
      const t = r / ROWS;
      const halfW = 0.05 * (1 - t * 0.82);
      const y = t * GRASS_HEIGHT;
      const bow = t * t * lean; // quadratic bow toward the tip
      // blade-local x is perpendicular to the fan direction
      const lx = -sa * halfW;
      const lz = ca * halfW;
      const ox = ca * bow;
      const oz = sa * bow;
      pos.push(-lx + ox, y, -lz + oz, lx + ox, y, lz + oz);
      uv.push(0, t, 1, t);
      tmp.copy(base).lerp(tip, t * t);
      col.push(tmp.r, tmp.g, tmp.b, tmp.r, tmp.g, tmp.b);
      if (r < ROWS) {
        const o = vo + r * 2;
        idx.push(o, o + 1, o + 2, o + 1, o + 3, o + 2);
      }
    }
    vo += (ROWS + 1) * 2;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function GrassField({ config }: { config: QualityConfig }) {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const count = config.grassCount;

  const geom = useMemo(() => buildGrassTuft(), []);

  const mat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 1 });
    applyGrassWind(m, GRASS_HEIGHT);
    return m;
  }, []);

  useEffect(() => {
    const pts = scatter(count, 909, 0.5);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    const rnd = mulberry32(13);
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const p = pts[i] ?? { x: 0, z: 0, y: 0 };
      const s = 0.7 + rnd() * 0.9;
      q.setFromAxisAngle(up, rnd() * Math.PI * 2);
      m.compose(new THREE.Vector3(p.x, p.y, p.z), q, new THREE.Vector3(s, s + rnd() * 0.6, s));
      ref.current.setMatrixAt(i, m);
      // meadow variation: drier gold tufts among the green, subtle lightness spread
      const dry = rnd();
      c.setHSL(0.22 - dry * 0.07, 0.3 - dry * 0.1, 0.82 + rnd() * 0.22);
      ref.current.setColorAt(i, c);
    }
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
  }, [count, geom]);

  return <instancedMesh ref={ref} args={[geom, mat, count]} frustumCulled={false} />;
}

/* ————— billboard-impostor forest walling the playable area ————— */
function makeTreeImpostor(seed: number): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  const rnd = mulberry32(seed);
  // trunk
  ctx.fillStyle = "#1c160f";
  ctx.fillRect(58, 150, 12, 106);
  // canopy — overlapping soft blobs
  for (let i = 0; i < 60; i++) {
    const x = 64 + (rnd() - 0.5) * 96;
    const y = 90 + (rnd() - 0.5) * 120;
    const r = 12 + rnd() * 30;
    const g = 0.16 + rnd() * 0.12;
    ctx.fillStyle = `rgba(${Math.round(28 + g * 60)}, ${Math.round(40 + g * 90)}, ${Math.round(24 + g * 50)}, ${0.5 + rnd() * 0.4})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function ImpostorForest({ config }: { config: QualityConfig }) {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const count = config.forestCount;
  const tex = useMemo(() => makeTreeImpostor(7), []);
  const geom = useMemo(() => {
    // a cross of two perpendicular alpha planes reads as a 3D tree from any angle
    const a = new THREE.PlaneGeometry(1, 1);
    a.translate(0, 0.5, 0);
    const b = a.clone();
    b.rotateY(Math.PI / 2);
    return mergeSimple([a, b]);
  }, []);
  const mat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.42, transparent: false, side: THREE.DoubleSide, roughness: 1, color: "#5b6b4e" });
    applyLeafWind(m, 0.5, 0);
    return m;
  }, [tex]);

  useEffect(() => {
    const rnd = mulberry32(2718);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    let placed = 0;
    let guard = 0;
    while (placed < count && guard++ < count * 20) {
      // ring the playable bounds, thickening outward into fog
      const ang = rnd() * Math.PI * 2;
      const rad = 34 + rnd() * 64;
      const x = Math.cos(ang) * rad;
      const z = -30 + Math.sin(ang) * rad;
      if (x > SANCTUM_BOUNDS.minX - 2 && x < SANCTUM_BOUNDS.maxX + 2 && z > SANCTUM_BOUNDS.minZ - 2 && z < SANCTUM_BOUNDS.maxZ + 2 && rad < 42) continue;
      const h = 9 + rnd() * 12;
      const w = h * (0.55 + rnd() * 0.2);
      q.setFromAxisAngle(up, rnd() * Math.PI);
      m.compose(new THREE.Vector3(x, groundHeight(x, z) - 0.2, z), q, new THREE.Vector3(w, h, w));
      ref.current.setMatrixAt(placed, m);
      placed++;
    }
    ref.current.count = placed;
    ref.current.instanceMatrix.needsUpdate = true;
  }, [count]);

  return <instancedMesh ref={ref} args={[geom, mat, count]} frustumCulled={false} castShadow />;
}

/* ————— procedural atmospheric sky + distant mountain ridge ————— */
// low, warm dawn sun matching the analytic key-light direction
const SUN_POS = new THREE.Vector3(-60, 14, -120);

function SkyVista() {
  const ridge = useMemo(() => {
    const g = new THREE.CylinderGeometry(140, 150, 56, 96, 1, true);
    g.translate(0, 14, -30);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const rnd = mulberry32(404);
    const peaks: number[] = Array.from({ length: 96 }, () => rnd());
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i) + 30;
      const ang = (Math.atan2(z, x) / (Math.PI * 2) + 0.5) * 96;
      const p = peaks[Math.floor(ang) % 96];
      if (pos.getY(i) > 14) pos.setY(i, pos.getY(i) + p * 26 - 6); // jagged top
    }
    g.computeVertexNormals();
    return g;
  }, []);

  return (
    <group>
      {/* Preetham atmospheric scattering — a real sky with a low, hazy dawn sun */}
      <Sky
        distance={2000}
        sunPosition={[SUN_POS.x, SUN_POS.y, SUN_POS.z]}
        turbidity={9}
        rayleigh={2.4}
        mieCoefficient={0.02}
        mieDirectionalG={0.86}
      />
      <mesh geometry={ridge} renderOrder={-1}>
        <meshBasicMaterial color="#5b6b78" side={THREE.BackSide} fog />
      </mesh>
    </group>
  );
}

/* minimal positions/uv merge for tiny client geometries (impostor cross). */
function mergeSimple(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const out = new THREE.BufferGeometry();
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  let offset = 0;
  for (const g of geos) {
    const p = g.getAttribute("position");
    const u = g.getAttribute("uv");
    for (let i = 0; i < p.count; i++) {
      pos.push(p.getX(i), p.getY(i), p.getZ(i));
      uv.push(u.getX(i), u.getY(i));
    }
    const index = g.getIndex();
    if (index) for (let i = 0; i < index.count; i++) idx.push(index.getX(i) + offset);
    offset += p.count;
  }
  out.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  out.setIndex(idx);
  out.computeVertexNormals();
  return out;
}

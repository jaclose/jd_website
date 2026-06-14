"use client";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { skills, type Skill } from "@/data/garden";

/**
 * A true 3D forest — the garden as a place you walk through. From a central
 * clearing, four trails branch into the four domains of life: Mind (spruce),
 * Craft (oak), Body (palm), Spirit (acacia). Click a trail to walk down it;
 * each grove grows the skills planted in that domain — bigger as you deepen
 * them — so watering a skill literally shows up here.
 */

export interface WalkState {
  /** which branch (domain) the camera is committed to */
  route: number;
  /** progress along that branch the camera is easing toward (0 clearing → 1 grove) */
  target: number;
  /** progress the dolly has actually reached */
  current: number;
}

/* ————— the four domains, each its own trail + tree form ————— */

export const DOMAINS = [
  { id: "mind", label: "Mind", kind: "conifer", sign: "#bcd4e6", angle: -0.82 },
  { id: "craft", label: "Craft", kind: "broadleaf", sign: "#e0b48a", angle: -0.28 },
  { id: "body", label: "Body", kind: "palm", sign: "#9fd0c0", angle: 0.28 },
  { id: "spirit", label: "Spirit", kind: "elder", sign: "#e6cf9a", angle: 0.82 },
] as const;

export type DomainId = (typeof DOMAINS)[number]["id"];

const TRAILHEAD = new THREE.Vector3(0, 0, 11);
const FORK = new THREE.Vector3(0, 0, 4.5);
/** where the camera looks from the clearing: out over the fork, dead centre,
 *  low enough that all four ground trails fan symmetrically into frame */
const CLEARING_LOOK = new THREE.Vector3(0, 0.5, -3);

function forward(angle: number) {
  return new THREE.Vector3(Math.sin(angle), 0, -Math.cos(angle));
}

/** unit vector perpendicular to a trail's forward, in the ground plane */
function rightOf(angle: number) {
  return new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
}

/** a full camera route: trailhead → fork → a viewpoint before the grove */
const ROUTES = DOMAINS.map((d) => {
  const fwd = forward(d.angle);
  const mid = FORK.clone().addScaledVector(fwd, 7.5);
  const view = FORK.clone().addScaledVector(fwd, 14); // camera stops here
  return new THREE.CatmullRomCurve3([TRAILHEAD, FORK, mid, view]);
});
/** the grove's tree cluster sits a few steps beyond the camera viewpoint */
const GROVES = DOMAINS.map((d) => FORK.clone().addScaledVector(forward(d.angle), 18.5));

/** skills that live in a given domain */
export function domainSkills(domain: DomainId): Skill[] {
  const map: Record<DomainId, Skill["domain"]> = {
    mind: "mind",
    craft: "craft",
    body: "body",
    spirit: "spirit",
  };
  return skills.filter((s) => s.domain === map[domain]);
}

/* ————— canvas textures ————— */

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

function barkTexture(): THREE.Texture {
  const c = makeCanvas(256, 512);
  const ctx = c.getContext("2d")!;
  const rnd = mulberry32(91);
  ctx.fillStyle = "#3d3128";
  ctx.fillRect(0, 0, 256, 512);
  for (let i = 0; i < 240; i++) {
    const x = rnd() * 256;
    const w = 2 + rnd() * 9;
    const light = rnd() > 0.5;
    ctx.fillStyle = light ? "rgba(94,78,60,0.5)" : "rgba(26,20,15,0.55)";
    const y = rnd() * 512;
    const h = 40 + rnd() * 160;
    ctx.fillRect(x, y, w, h);
  }
  for (let i = 0; i < 70; i++) {
    ctx.fillStyle = `rgba(74,108,62,${0.12 + rnd() * 0.2})`;
    const r = 4 + rnd() * 16;
    ctx.beginPath();
    ctx.arc(rnd() * 256, 300 + rnd() * 212, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const GROUND_SPAN = 60; // world units the ground plane covers

function groundTexture(): THREE.Texture {
  const s = 1024;
  const c = makeCanvas(s, s);
  const ctx = c.getContext("2d")!;
  const rnd = mulberry32(7);
  ctx.fillStyle = "#141a10";
  ctx.fillRect(0, 0, s, s);
  for (let i = 0; i < 2600; i++) {
    const g = rnd();
    ctx.fillStyle =
      g > 0.72
        ? `rgba(74,108,62,${0.1 + rnd() * 0.22})`
        : g > 0.4
          ? `rgba(36,46,26,${0.18 + rnd() * 0.25})`
          : `rgba(52,40,28,${0.12 + rnd() * 0.2})`;
    const r = 2 + rnd() * 14;
    ctx.beginPath();
    ctx.arc(rnd() * s, rnd() * s, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const toTex = (x: number, z: number) => [
    ((x + GROUND_SPAN / 2) / GROUND_SPAN) * s,
    ((z + GROUND_SPAN / 2) / GROUND_SPAN) * s,
  ];
  // a packed-dirt clearing at the trailhead/fork
  ctx.fillStyle = "#46362478";
  const [cx, cz] = toTex(0, 7);
  ctx.beginPath();
  ctx.ellipse(cx, cz, 110, 80, 0, 0, Math.PI * 2);
  ctx.fill();
  // the four branch trails fanning out of the fork
  ctx.strokeStyle = "#4a3a28";
  ctx.lineCap = "round";
  ROUTES.forEach((route) => {
    for (const [width, alpha] of [
      [58, 0.85],
      [40, 0.5],
      [24, 0.4],
    ] as const) {
      ctx.globalAlpha = alpha;
      ctx.lineWidth = width;
      ctx.beginPath();
      for (let i = 0; i <= 50; i++) {
        const p = route.getPoint(i / 50);
        const [tx, ty] = toTex(p.x, p.z);
        if (i === 0) ctx.moveTo(tx, ty);
        else ctx.lineTo(tx, ty);
      }
      ctx.stroke();
    }
  });
  // each trail continues past the camera viewpoint into its grove clearing
  DOMAINS.forEach((dmn) => {
    const fwd = forward(dmn.angle);
    const a = FORK.clone().addScaledVector(fwd, 13);
    const b = FORK.clone().addScaledVector(fwd, 20);
    for (const [width, alpha] of [
      [40, 0.6],
      [26, 0.4],
    ] as const) {
      ctx.globalAlpha = alpha;
      ctx.lineWidth = width;
      ctx.beginPath();
      const [ax, ay] = toTex(a.x, a.z);
      const [bx, by] = toTex(b.x, b.z);
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();
    }
    // a packed clearing where the grove opens
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = "#46362478";
    const c = FORK.clone().addScaledVector(fwd, 18.5);
    const [gx, gy] = toTex(c.x, c.z);
    ctx.beginPath();
    ctx.ellipse(gx, gy, 90, 70, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#4a3a28";
  });
  ctx.globalAlpha = 1;
  // stones along the trails
  for (let i = 0; i < 140; i++) {
    const route = ROUTES[Math.floor(rnd() * ROUTES.length)];
    const p = route.getPoint(rnd());
    const [tx, ty] = toTex(p.x, p.z);
    ctx.fillStyle = `rgba(110,100,88,${0.25 + rnd() * 0.3})`;
    ctx.beginPath();
    ctx.ellipse(
      tx + (rnd() - 0.5) * 30,
      ty + (rnd() - 0.5) * 30,
      2 + rnd() * 5,
      1.5 + rnd() * 3,
      rnd() * 3,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function shaftTexture(): THREE.Texture {
  const c = makeCanvas(128, 512);
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, "rgba(255,236,190,0.55)");
  g.addColorStop(0.6, "rgba(255,236,190,0.12)");
  g.addColorStop(1, "rgba(255,236,190,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 512);
  const side = ctx.createLinearGradient(0, 0, 128, 0);
  side.addColorStop(0, "rgba(0,0,0,1)");
  side.addColorStop(0.5, "rgba(0,0,0,0)");
  side.addColorStop(1, "rgba(0,0,0,1)");
  ctx.globalCompositeOperation = "destination-out";
  ctx.fillStyle = side;
  ctx.fillRect(0, 0, 128, 512);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function fernTexture(): THREE.Texture {
  const c = makeCanvas(256, 256);
  const ctx = c.getContext("2d")!;
  const rnd = mulberry32(33);
  ctx.translate(128, 240);
  for (let f = 0; f < 7; f++) {
    const a = -Math.PI / 2 + (f - 3) * 0.38;
    ctx.strokeStyle = `rgba(${64 + rnd() * 30},${110 + rnd() * 40},${56 + rnd() * 20},0.9)`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    const ex = Math.cos(a) * 110;
    const ey = Math.sin(a) * 110;
    ctx.quadraticCurveTo(ex * 0.5, ey * 0.7, ex, ey);
    ctx.stroke();
    ctx.lineWidth = 1.6;
    for (let l = 1; l < 9; l++) {
      const t0 = l / 9;
      const px = ex * t0 * 0.92;
      const py = ey * t0 * 0.92;
      const len = 16 * (1 - t0 * 0.7);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + Math.cos(a + 1.2) * len, py + Math.sin(a + 1.2) * len);
      ctx.moveTo(px, py);
      ctx.lineTo(px + Math.cos(a - 1.2) * len, py + Math.sin(a - 1.2) * len);
      ctx.stroke();
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** 3-step toon ramp — quantises lighting into stylised bands */
function toonGradient(): THREE.DataTexture {
  const steps = new Uint8Array([70, 70, 70, 255, 150, 150, 150, 255, 235, 235, 235, 255]);
  const t = new THREE.DataTexture(steps, 3, 1, THREE.RGBAFormat);
  t.minFilter = THREE.NearestFilter;
  t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
}

/* ————— wind: shared clock for all swaying foliage ————— */
const windUniforms = { uTime: { value: 0 } };

function applyWind(mat: THREE.Material, height: number) {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = windUniforms.uTime;
    shader.uniforms.uHeight = { value: height };
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
         uniform float uTime;
         uniform float uHeight;`
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
         {
           float bladeH = clamp(transformed.y / uHeight, 0.0, 1.0);
           vec3 instPos = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
           float phase = instPos.x * 0.6 + instPos.z * 0.7;
           float sway = sin(uTime * 1.5 + phase) * 0.16 + sin(uTime * 3.0 + phase * 1.7) * 0.06;
           float bend = sway * pow(bladeH, 1.6);
           transformed.x += bend;
           transformed.z += bend * 0.45;
         }`
      );
  };
}

/** pick a point scattered near any of the four trails */
function scatterPoint(rnd: () => number, spread: number) {
  const route = ROUTES[Math.floor(rnd() * ROUTES.length)];
  const p = route.getPoint(0.15 + rnd() * 0.85);
  const side = rnd() > 0.5 ? 1 : -1;
  return new THREE.Vector3(
    p.x + side * (0.9 + rnd() * spread) + (rnd() - 0.5),
    0,
    p.z + (rnd() - 0.5) * (spread * 0.6)
  );
}

/* ————— BOTW-style instanced wind grass over the whole forest floor ————— */
function Grass({ ramp }: { ramp: THREE.Texture }) {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const COUNT = 4200;
  const HEIGHT = 0.42;

  const geom = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.06, HEIGHT, 1, 4);
    g.translate(0, HEIGHT / 2, 0);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const col = new Float32Array(pos.count * 3);
    const base = new THREE.Color("#39532f");
    const tip = new THREE.Color("#9fce7a");
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const k = y / HEIGHT;
      pos.setX(i, pos.getX(i) * (1 - k * 0.8));
      c.copy(base).lerp(tip, k * k);
      col.set([c.r, c.g, c.b], i * 3);
    }
    pos.needsUpdate = true;
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return g;
  }, []);

  const mat = useMemo(() => {
    const m = new THREE.MeshToonMaterial({
      vertexColors: true,
      gradientMap: ramp,
      side: THREE.DoubleSide,
    });
    applyWind(m, HEIGHT);
    return m;
  }, [ramp]);

  useEffect(() => {
    const rnd = mulberry32(909);
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    for (let i = 0; i < COUNT; i++) {
      const p = scatterPoint(rnd, 6.5);
      const s = 0.7 + rnd() * 0.8;
      q.setFromAxisAngle(up, rnd() * Math.PI);
      m4.compose(p, q, new THREE.Vector3(s, s + rnd() * 0.5, s));
      ref.current.setMatrixAt(i, m4);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, [geom]);

  useFrame((state) => {
    windUniforms.uTime.value = state.clock.elapsedTime;
  });

  return <instancedMesh ref={ref} args={[geom, mat, COUNT]} frustumCulled={false} />;
}

/* ————— a tree ————— */

interface TreeSpec {
  x: number;
  z: number;
  kind: "conifer" | "broadleaf" | "elder" | "palm";
  scale: number;
  seed: number;
  faint?: boolean; // unplanted projection
}

function Tree({ spec, bark, ramp }: { spec: TreeSpec; bark: THREE.Texture; ramp: THREE.Texture }) {
  const rnd = mulberry32(spec.seed);
  const lean = (rnd() - 0.5) * 0.1;
  const palm = spec.kind === "palm";
  const h = (spec.kind === "conifer" ? 7.5 : palm ? 7 : 5.5) * spec.scale;
  const rBase = 0.3 * spec.scale * (spec.kind === "elder" ? 1.5 : palm ? 0.7 : 1);
  const op = spec.faint ? 0.55 : 1;

  const roots = useMemo(() => {
    const n = 6;
    return Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2 + rnd() * 0.5;
      return { a, len: rBase * (2.2 + rnd() * 1.6), r: rBase * (0.34 + rnd() * 0.2) };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const blobs = useMemo(() => {
    if (spec.kind === "conifer" || palm) return [];
    const n = spec.kind === "elder" ? 6 : 4;
    return Array.from({ length: n }, () => ({
      x: (rnd() - 0.5) * 1.8 * spec.scale,
      y: h * (0.72 + rnd() * 0.3),
      z: (rnd() - 0.5) * 1.8 * spec.scale,
      r: (0.9 + rnd() * 0.8) * spec.scale,
      tone: rnd(),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fronds = useMemo(() => {
    if (!palm) return [];
    return Array.from({ length: 7 }, (_, i) => ({ az: (i / 7) * Math.PI * 2, droop: 0.9 + rnd() * 0.4 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const green = (t: number) => new THREE.Color().setHSL(0.29 + t * 0.05, 0.48, 0.26 + t * 0.12);

  return (
    <group position={[spec.x, 0, spec.z]} rotation={[0, rnd() * Math.PI * 2, lean]}>
      {/* trunk */}
      <mesh position={[0, h * 0.5, 0]} castShadow>
        <cylinderGeometry args={[rBase * 0.42, rBase, h, 9]} />
        <meshStandardMaterial map={bark} roughness={0.95} color="#8a7561" transparent={!!spec.faint} opacity={op} />
      </mesh>
      {!spec.faint &&
        roots.map((r, i) => (
          <mesh
            key={i}
            position={[Math.cos(r.a) * r.len * 0.42, r.r * 0.5, Math.sin(r.a) * r.len * 0.42]}
            rotation={[Math.PI / 2.25, 0, -r.a + Math.PI / 2]}
          >
            <cylinderGeometry args={[r.r * 0.18, r.r, r.len, 6]} />
            <meshStandardMaterial map={bark} roughness={1} color="#7a6852" />
          </mesh>
        ))}
      {!spec.faint && (
        <mesh position={[0, 0.1, 0]} scale={[rBase * 2.6, 0.32, rBase * 2.6]}>
          <sphereGeometry args={[1, 10, 8]} />
          <meshStandardMaterial color="#36502c" roughness={1} />
        </mesh>
      )}

      {spec.kind === "conifer" && (
        <>
          {[0.42, 0.58, 0.73, 0.87, 0.985].map((k, i) => (
            <mesh key={i} position={[0, h * k, 0]} castShadow>
              <coneGeometry args={[(1.9 - i * 0.34) * spec.scale, h * 0.3, 9]} />
              <meshToonMaterial color={green(0.25 + i * 0.12)} gradientMap={ramp} transparent={!!spec.faint} opacity={op} />
            </mesh>
          ))}
        </>
      )}

      {(spec.kind === "broadleaf" || spec.kind === "elder") && (
        <>
          {blobs.map((b, i) => (
            <mesh key={i} position={[b.x, b.y, b.z]} castShadow>
              <icosahedronGeometry args={[b.r, 1]} />
              <meshToonMaterial color={green(b.tone)} gradientMap={ramp} transparent={!!spec.faint} opacity={op} />
            </mesh>
          ))}
          <mesh position={[0.4 * spec.scale, h * 0.66, 0]} rotation={[0, 0, -0.7]}>
            <cylinderGeometry args={[rBase * 0.16, rBase * 0.3, h * 0.42, 7]} />
            <meshStandardMaterial map={bark} roughness={1} color="#84705c" transparent={!!spec.faint} opacity={op} />
          </mesh>
        </>
      )}

      {palm && (
        <>
          {fronds.map((f, i) => (
            <mesh
              key={i}
              position={[0, h, 0]}
              rotation={[f.droop * Math.cos(f.az), f.az, f.droop * Math.sin(f.az)]}
            >
              <coneGeometry args={[0.22 * spec.scale, h * 0.55, 6]} />
              <meshToonMaterial color={green(0.4 + (i % 3) * 0.1)} gradientMap={ramp} transparent={!!spec.faint} opacity={op} />
            </mesh>
          ))}
          {/* coconuts */}
          {!spec.faint && (
            <mesh position={[0, h - 0.2, 0]}>
              <sphereGeometry args={[0.22 * spec.scale, 8, 8]} />
              <meshStandardMaterial color="#5a4326" roughness={1} />
            </mesh>
          )}
        </>
      )}
    </group>
  );
}

/* ————— a wooden trail signpost at the fork ————— */
function Signpost({
  domain,
  index,
  onSelect,
}: {
  domain: (typeof DOMAINS)[number];
  index: number;
  onSelect: (i: number) => void;
}) {
  const fwd = forward(domain.angle);
  const pos = FORK.clone().addScaledVector(fwd, 1.6);
  const yaw = Math.atan2(fwd.x, fwd.z);
  return (
    <group
      position={[pos.x, 0, pos.z]}
      rotation={[0, yaw, 0]}
      onClick={(ev) => {
        ev.stopPropagation();
        onSelect(index);
      }}
      onPointerOver={(ev) => {
        ev.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "";
      }}
    >
      {/* post */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.09, 1.8, 7]} />
        <meshStandardMaterial color="#5a4630" roughness={1} />
      </mesh>
      {/* arrow plank pointing down the trail */}
      <mesh position={[0.32, 1.5, 0]} rotation={[0, 0, 0]} castShadow>
        <boxGeometry args={[0.9, 0.34, 0.06]} />
        <meshStandardMaterial color={domain.sign} roughness={0.7} />
      </mesh>
      {/* a small glowing marker so it reads as interactive */}
      <mesh position={[0.32, 1.5, 0.05]}>
        <circleGeometry args={[0.07, 16]} />
        <meshBasicMaterial color="#1c2412" />
      </mesh>
    </group>
  );
}

/* ————— a domain grove: that domain's planted skills as trees ————— */
function Grove({
  domain,
  index,
  bark,
  ramp,
}: {
  domain: (typeof DOMAINS)[number];
  index: number;
  bark: THREE.Texture;
  ramp: THREE.Texture;
}) {
  const center = GROVES[index];
  const planted = domainSkills(domain.id);
  const rnd = mulberry32(400 + index * 17);
  const fwd = forward(domain.angle);
  const right = rightOf(domain.angle);

  const { trees, stops } = useMemo(() => {
    const out: TreeSpec[] = [];
    const stopPts: { x: number; z: number }[] = [];
    // a place in trail-local coords: f forward of the grove centre, s sideways.
    const at = (f: number, s: number) => ({
      x: center.x + fwd.x * f + right.x * s,
      z: center.z + fwd.z * f + right.z * s,
    });

    // backdrop stand — a wall of this domain's species behind the centre, so
    // the grove always reads as a real stand of spruce / oak / palm / acacia
    const BACK = 9;
    for (let i = 0; i < BACK; i++) {
      const s = ((i - (BACK - 1) / 2) / (BACK - 1)) * 16 + (rnd() - 0.5) * 1.8;
      const f = 2.5 + rnd() * 5;
      const pt = at(f, s);
      out.push({ x: pt.x, z: pt.z, kind: domain.kind, scale: 0.85 + rnd() * 0.7, seed: 700 + index * 40 + i });
    }

    // the planted skills as a procession of stops the camera walks up to —
    // each set a little deeper and on the alternating side of the trail, so you
    // pass them on the way in. watering a skill (raising its stage) grows its
    // tree; an archived one stands faint, a thing the path has grown past.
    const place = (n: number, i: number) => {
      const f = n <= 1 ? 0.4 : -1.0 + (i / (n - 1)) * 5.2;
      const side = i % 2 === 0 ? -1 : 1;
      const s = side * (1.7 + (i % 3) * 0.55) + (rnd() - 0.5) * 0.7;
      return at(f, s);
    };

    if (planted.length) {
      planted.forEach((sk, i) => {
        const p = place(planted.length, i);
        const ghost = sk.status === "archived";
        out.push({ x: p.x, z: p.z, kind: domain.kind, scale: 0.6 + sk.stage * 0.18, seed: 900 + index * 50 + i, faint: ghost });
        if (!ghost) stopPts.push(p);
      });
    } else {
      // nothing planted yet — translucent projections of what could grow
      [0, 1, 2].forEach((i) => {
        const p = place(3, i);
        out.push({ x: p.x, z: p.z, kind: domain.kind, scale: 1.0 + (i % 2) * 0.3, seed: 970 + index * 9 + i, faint: true });
      });
    }
    return { trees: out, stops: stopPts };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {trees.map((t, i) => (
        <Tree key={i} spec={t} bark={bark} ramp={ramp} />
      ))}
      {/* a tended stone + a marker-light at each living stop, so a planted
          skill reads as a place someone keeps, not just another tree */}
      {stops.map((p, i) => (
        <group key={`stop-${i}`} position={[p.x, 0, p.z]}>
          <mesh position={[0, 0.12, 0]} scale={[0.55, 0.32, 0.55]}>
            <dodecahedronGeometry args={[0.5, 0]} />
            <meshStandardMaterial color="#5d6b4e" roughness={1} />
          </mesh>
          <mesh position={[0, 0.36, 0]}>
            <sphereGeometry args={[0.08, 10, 10]} />
            <meshBasicMaterial color={domain.sign} />
          </mesh>
        </group>
      ))}
    </>
  );
}

/* ————— flanking forest, ferns, shafts, spores ————— */

function Ferns({ map }: { map: THREE.Texture }) {
  const items = useMemo(() => {
    const rnd = mulberry32(55);
    return Array.from({ length: 60 }, () => {
      const p = scatterPoint(rnd, 5);
      return { x: p.x, z: p.z, s: 0.5 + rnd() * 0.9, rot: rnd() * Math.PI };
    });
  }, []);
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

function LightShafts({ map }: { map: THREE.Texture }) {
  const shafts = useMemo(() => {
    const rnd = mulberry32(21);
    return Array.from({ length: 7 }, () => {
      const p = scatterPoint(rnd, 5);
      return { x: p.x, z: p.z - 2, w: 1 + rnd() * 1.6, tilt: 0.16 + rnd() * 0.12, o: 0.05 + rnd() * 0.06 };
    });
  }, []);
  return (
    <>
      {shafts.map((s, i) => (
        <mesh key={i} position={[s.x, 5.4, s.z]} rotation={[0, 0, s.tilt]}>
          <planeGeometry args={[s.w, 12]} />
          <meshBasicMaterial
            map={map}
            transparent
            opacity={s.o}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </>
  );
}

function Spores() {
  const pts = useRef<THREE.Points>(null!);
  const geom = useMemo(() => {
    const rnd = mulberry32(77);
    const n = 200;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const p = scatterPoint(rnd, 7);
      pos.set([p.x, 0.4 + rnd() * 4.5, p.z], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  useFrame((state) => {
    pts.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.05) * 0.04;
    pts.current.position.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.15;
  });
  return (
    <points ref={pts} geometry={geom}>
      <pointsMaterial
        size={0.035}
        color="#d9e8a8"
        transparent
        opacity={0.6}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

/* ————— the dolly: camera eases along the committed branch ————— */

function Dolly({ walk }: { walk: WalkState }) {
  const look = useRef(new THREE.Vector3(0, 1.4, 0));
  const tmp = useMemo(() => new THREE.Vector3(), []);
  return (
    <DollyInner walk={walk} look={look} tmp={tmp} />
  );
}
function DollyInner({
  walk,
  look,
  tmp,
}: {
  walk: WalkState;
  look: React.MutableRefObject<THREE.Vector3>;
  tmp: THREE.Vector3;
}) {
  useFrame((state, dt) => {
    const d = Math.min(dt, 0.05);
    walk.current += (walk.target - walk.current) * (1 - Math.exp(-1.7 * d));
    const ri = Math.max(0, Math.min(ROUTES.length - 1, Math.round(walk.route)));
    const route = ROUTES[ri];
    const grove = GROVES[ri];
    const t = THREE.MathUtils.clamp(walk.current, 0, 1);
    const p = route.getPoint(t);
    const sway = Math.sin(state.clock.elapsedTime * 0.7) * 0.035;
    // 0 at the clearing → 1 once committed to a trail
    const committed = THREE.MathUtils.smoothstep(t, 0.0, 0.34);
    // raised overview at the clearing → eye-level on the walk in
    const lift = THREE.MathUtils.lerp(3.4, 1.62, committed);
    state.camera.position.set(p.x + sway, lift + Math.sin(state.clock.elapsedTime * 1.4) * 0.02, p.z);
    // clearing: look dead-centre over the fork so the four trails fan into view.
    // walking in: look toward the grove's crowns so the stand — not just its
    // trunks — fills the frame (aim at the tree cluster, not the path's end).
    tmp.set(
      THREE.MathUtils.lerp(CLEARING_LOOK.x, grove.x, committed),
      THREE.MathUtils.lerp(CLEARING_LOOK.y, 3.2, committed),
      THREE.MathUtils.lerp(CLEARING_LOOK.z, grove.z, committed)
    );
    look.current.lerp(tmp, 1 - Math.exp(-4 * d));
    state.camera.lookAt(look.current);
  });
  return null;
}

/* ————— scene root ————— */

export default function ForestCanvas({
  walk,
  active,
  onSelect,
  onReturn,
}: {
  walk: WalkState;
  active: boolean;
  onSelect?: (i: number) => void;
  onReturn?: () => void;
}) {
  const bark = useMemo(() => (typeof document !== "undefined" ? barkTexture() : null), []);
  const ground = useMemo(() => (typeof document !== "undefined" ? groundTexture() : null), []);
  const shaft = useMemo(() => (typeof document !== "undefined" ? shaftTexture() : null), []);
  const fern = useMemo(() => (typeof document !== "undefined" ? fernTexture() : null), []);
  const ramp = useMemo(() => (typeof document !== "undefined" ? toonGradient() : null), []);

  // flanking forest for density — kept clear of the central clearing so the
  // four trails read as open diverging paths from the overview
  const flank = useMemo<TreeSpec[]>(() => {
    const rnd = mulberry32(2026);
    const out: TreeSpec[] = [];
    let guard = 0;
    while (out.length < 26 && guard++ < 400) {
      const p = scatterPoint(rnd, 8);
      // skip anything that would crowd the trailhead/fork clearing
      if (p.distanceTo(FORK) < 7.5 || p.z > 8.5) continue;
      const kinds: TreeSpec["kind"][] = ["conifer", "broadleaf", "conifer", "elder"];
      out.push({ x: p.x, z: p.z, kind: kinds[Math.floor(rnd() * kinds.length)], scale: 0.7 + rnd() * 0.8, seed: out.length * 13 + 7 });
    }
    return out;
  }, []);

  if (!bark || !ground || !shaft || !fern || !ramp) return null;

  return (
    <Canvas
      camera={{ fov: 58, position: [0, 1.62, 11], near: 0.1, far: 70 }}
      dpr={[1, 1.75]}
      frameloop={active ? "always" : "never"}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      style={{ background: "transparent" }}
    >
      <fog attach="fog" args={["#16241a", 7, 34]} />
      <hemisphereLight intensity={1.0} color="#cfe6b0" groundColor="#2a2410" />
      <directionalLight position={[7, 12, -2]} intensity={2.4} color="#fff0cc" castShadow />
      <ambientLight intensity={0.4} color="#5a7048" />

      <Dolly walk={walk} />

      {/* ground — click open ground to return to the clearing */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        onClick={(ev) => {
          ev.stopPropagation();
          onReturn?.();
        }}
      >
        <planeGeometry args={[GROUND_SPAN, GROUND_SPAN]} />
        <meshStandardMaterial map={ground} roughness={1} />
      </mesh>

      {/* clickable trail strips + signposts — click to walk a domain */}
      {DOMAINS.map((d, i) => {
        const a = d.angle;
        const fwd = forward(a);
        const stripCenter = FORK.clone().addScaledVector(fwd, 6);
        return (
          <group key={d.id}>
            <mesh
              position={[stripCenter.x, 0.02, stripCenter.z]}
              rotation={[-Math.PI / 2, 0, -a]}
              onClick={(ev) => {
                ev.stopPropagation();
                onSelect?.(i);
              }}
              onPointerOver={(ev) => {
                ev.stopPropagation();
                document.body.style.cursor = "pointer";
              }}
              onPointerOut={() => {
                document.body.style.cursor = "";
              }}
            >
              <planeGeometry args={[3, 12]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
            <Signpost domain={d} index={i} onSelect={(idx) => onSelect?.(idx)} />
            <Grove domain={d} index={i} bark={bark} ramp={ramp} />
          </group>
        );
      })}

      {flank.map((t, i) => (
        <Tree key={i} spec={t} bark={bark} ramp={ramp} />
      ))}
      <Grass ramp={ramp} />
      <Ferns map={fern} />
      <LightShafts map={shaft} />
      <Spores />

      {/* canopy overhead — lifted and lighter so the clearing reads open */}
      <mesh position={[0, 16, -14]} rotation={[Math.PI / 2.2, 0, 0]}>
        <planeGeometry args={[90, 56]} />
        <meshBasicMaterial color="#0e2414" transparent opacity={0.72} side={THREE.DoubleSide} />
      </mesh>
    </Canvas>
  );
}

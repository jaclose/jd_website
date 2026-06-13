"use client";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";

/**
 * A true 3D forest — the garden as a place you walk through. Tapered
 * trunks with bark, flared roots half-buried in the soil, layered
 * canopies, ferns, god-rays, drifting spores, and a winding trail the
 * camera dollies along between survey waypoints. No flat vectors:
 * geometry, fog, and light.
 */

export interface WalkState {
  /** spline parameter the camera is easing toward */
  target: number;
  /** set by the scene every frame */
  current: number;
}

const PATH_POINTS = [
  new THREE.Vector3(0, 0, 9),
  new THREE.Vector3(-0.8, 0, 4),
  new THREE.Vector3(0.7, 0, -1),
  new THREE.Vector3(-0.6, 0, -6.5),
  new THREE.Vector3(0.5, 0, -12),
  new THREE.Vector3(-0.2, 0, -17.5),
];
export const TRAIL = new THREE.CatmullRomCurve3(PATH_POINTS);
/** spline params where the survey stands wait */
export const WAYPOINTS = [0.08, 0.5, 0.92];

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
  // moss creep
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

function groundTexture(): THREE.Texture {
  const s = 1024;
  const c = makeCanvas(s, s);
  const ctx = c.getContext("2d")!;
  const rnd = mulberry32(7);
  ctx.fillStyle = "#141a10";
  ctx.fillRect(0, 0, s, s);
  // moss + litter mottling
  for (let i = 0; i < 2400; i++) {
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
  // the trail — packed dirt following the spline's x wobble
  ctx.strokeStyle = "#4a3a28";
  ctx.lineCap = "round";
  for (const [width, alpha] of [
    [64, 0.85],
    [44, 0.5],
    [26, 0.45],
  ] as const) {
    ctx.globalAlpha = alpha;
    ctx.lineWidth = width;
    ctx.beginPath();
    for (let i = 0; i <= 60; i++) {
      const p = TRAIL.getPoint(i / 60);
      // world (x: -? .. ?, z: 9..-17.5) → texture space (ground is 44x44)
      const tx = ((p.x + 22) / 44) * s;
      const ty = ((p.z + 22) / 44) * s;
      if (i === 0) ctx.moveTo(tx, ty);
      else ctx.lineTo(tx, ty);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // stones along the path
  for (let i = 0; i < 90; i++) {
    const p = TRAIL.getPoint(rnd());
    const tx = ((p.x + 22) / 44) * s + (rnd() - 0.5) * 36;
    const ty = ((p.z + 22) / 44) * s + (rnd() - 0.5) * 36;
    ctx.fillStyle = `rgba(110,100,88,${0.25 + rnd() * 0.3})`;
    ctx.beginPath();
    ctx.ellipse(tx, ty, 2 + rnd() * 5, 1.5 + rnd() * 3, rnd() * 3, 0, Math.PI * 2);
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
    // leaflets
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

/* ————— a tree: trunk, roots, branches, canopy ————— */

interface TreeSpec {
  x: number;
  z: number;
  kind: "conifer" | "broadleaf" | "elder";
  scale: number;
  seed: number;
  /** survey stands glow a little */
  stand?: boolean;
}

function Tree({ spec, bark }: { spec: TreeSpec; bark: THREE.Texture }) {
  const rnd = mulberry32(spec.seed);
  const lean = (rnd() - 0.5) * 0.1;
  const h = (spec.kind === "conifer" ? 7.5 : 5.5) * spec.scale;
  const rBase = 0.3 * spec.scale * (spec.kind === "elder" ? 1.5 : 1);

  const roots = useMemo(() => {
    const n = 6;
    return Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2 + rnd() * 0.5;
      return {
        a,
        len: rBase * (2.2 + rnd() * 1.6),
        r: rBase * (0.34 + rnd() * 0.2),
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const blobs = useMemo(() => {
    if (spec.kind === "conifer") return [];
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

  const green = (t: number) =>
    new THREE.Color().setHSL(0.29 + t * 0.05, 0.48, 0.26 + t * 0.12);

  return (
    <group position={[spec.x, 0, spec.z]} rotation={[0, rnd() * Math.PI * 2, lean]}>
      {/* trunk */}
      <mesh position={[0, h * 0.5, 0]} castShadow>
        <cylinderGeometry args={[rBase * 0.42, rBase, h, 9]} />
        <meshStandardMaterial map={bark} roughness={0.95} color="#8a7561" />
      </mesh>
      {/* root flare — half-buried cones radiating from the base */}
      {roots.map((r, i) => (
        <mesh
          key={i}
          position={[Math.cos(r.a) * r.len * 0.42, r.r * 0.5, Math.sin(r.a) * r.len * 0.42]}
          rotation={[Math.PI / 2.25, 0, -r.a + Math.PI / 2]}
        >
          <cylinderGeometry args={[r.r * 0.18, r.r, r.len, 6]} />
          <meshStandardMaterial map={bark} roughness={1} color="#7a6852" />
        </mesh>
      ))}
      {/* moss collar */}
      <mesh position={[0, 0.1, 0]} scale={[rBase * 2.6, 0.32, rBase * 2.6]}>
        <sphereGeometry args={[1, 10, 8]} />
        <meshStandardMaterial color="#36502c" roughness={1} />
      </mesh>

      {spec.kind === "conifer" ? (
        // stacked boughs
        <>
          {[0.42, 0.58, 0.73, 0.87, 0.985].map((k, i) => (
            <mesh key={i} position={[0, h * k, 0]} castShadow>
              <coneGeometry
                args={[(1.9 - i * 0.34) * spec.scale, h * 0.3, 9]}
              />
              <meshStandardMaterial
                color={green(0.25 + i * 0.12)}
                roughness={0.92}
                flatShading
              />
            </mesh>
          ))}
        </>
      ) : (
        // clustered canopy
        <>
          {blobs.map((b, i) => (
            <mesh key={i} position={[b.x, b.y, b.z]} castShadow>
              <icosahedronGeometry args={[b.r, 1]} />
              <meshStandardMaterial
                color={green(b.tone)}
                roughness={0.92}
                flatShading
              />
            </mesh>
          ))}
          {/* a visible bough reaching into the canopy */}
          <mesh
            position={[0.4 * spec.scale, h * 0.66, 0]}
            rotation={[0, 0, -0.7]}
          >
            <cylinderGeometry args={[rBase * 0.16, rBase * 0.3, h * 0.42, 7]} />
            <meshStandardMaterial map={bark} roughness={1} color="#84705c" />
          </mesh>
        </>
      )}

      {/* survey beacon at the stands */}
      {spec.stand && (
        <mesh position={[0, 0.04, rBase * 3.4]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.34, 0.4, 40]} />
          <meshBasicMaterial color="#9fce8f" transparent opacity={0.75} />
        </mesh>
      )}
    </group>
  );
}

/* ————— ferns, shafts, spores ————— */

function Ferns({ map }: { map: THREE.Texture }) {
  const items = useMemo(() => {
    const rnd = mulberry32(55);
    return Array.from({ length: 42 }, () => {
      const t = rnd();
      const p = TRAIL.getPoint(t);
      const side = rnd() > 0.5 ? 1 : -1;
      return {
        x: p.x + side * (1 + rnd() * 4.5),
        z: p.z + (rnd() - 0.5) * 2.5,
        s: 0.5 + rnd() * 0.9,
        rot: rnd() * Math.PI,
      };
    });
  }, []);
  return (
    <>
      {items.map((f, i) => (
        <group key={i} position={[f.x, f.s * 0.42, f.z]} rotation={[0, f.rot, 0]}>
          {[0, Math.PI / 2].map((ry) => (
            <mesh key={ry} rotation={[0, ry, 0]}>
              <planeGeometry args={[f.s, f.s]} />
              <meshStandardMaterial
                map={map}
                transparent
                alphaTest={0.15}
                side={THREE.DoubleSide}
                roughness={1}
              />
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
    return Array.from({ length: 6 }, () => {
      const t = rnd();
      const p = TRAIL.getPoint(t);
      return {
        x: p.x + (rnd() - 0.5) * 6,
        z: p.z - 2 - rnd() * 3,
        w: 1 + rnd() * 1.6,
        tilt: 0.16 + rnd() * 0.12,
        o: 0.05 + rnd() * 0.06,
      };
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
    const n = 160;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const p = TRAIL.getPoint(rnd());
      pos.set([p.x + (rnd() - 0.5) * 8, 0.4 + rnd() * 4.5, p.z + (rnd() - 0.5) * 6], i * 3);
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

/* ————— the dolly: camera eases along the trail ————— */

function Dolly({ walk }: { walk: WalkState }) {
  const look = useMemo(() => new THREE.Vector3(), []);
  useFrame((state, dt) => {
    const d = Math.min(dt, 0.05);
    walk.current += (walk.target - walk.current) * (1 - Math.exp(-1.6 * d));
    const t = THREE.MathUtils.clamp(walk.current, 0, 1);
    const p = TRAIL.getPoint(t);
    const ahead = TRAIL.getPoint(Math.min(1, t + 0.06));
    const sway = Math.sin(state.clock.elapsedTime * 0.7) * 0.035;
    state.camera.position.set(p.x + sway, 1.55 + Math.sin(state.clock.elapsedTime * 1.4) * 0.02, p.z);
    look.set(ahead.x, 1.35, ahead.z);
    state.camera.lookAt(look);
  });
  return null;
}

/* ————— scene root ————— */

export default function ForestCanvas({
  walk,
  active,
}: {
  walk: WalkState;
  active: boolean;
}) {
  const bark = useMemo(() => (typeof document !== "undefined" ? barkTexture() : null), []);
  const ground = useMemo(() => (typeof document !== "undefined" ? groundTexture() : null), []);
  const shaft = useMemo(() => (typeof document !== "undefined" ? shaftTexture() : null), []);
  const fern = useMemo(() => (typeof document !== "undefined" ? fernTexture() : null), []);

  const trees = useMemo<TreeSpec[]>(() => {
    const rnd = mulberry32(2026);
    const list: TreeSpec[] = [];
    // the three survey stands, just off-trail at each waypoint
    WAYPOINTS.forEach((w, i) => {
      const p = TRAIL.getPoint(w);
      list.push({
        x: p.x + (i % 2 ? -2.1 : 2.1),
        z: p.z - 1.2,
        kind: i === 0 ? "broadleaf" : i === 1 ? "conifer" : "elder",
        scale: i === 2 ? 1.5 : 1.05,
        seed: 100 + i,
        stand: true,
      });
    });
    // supporting forest, flanking the trail
    for (let i = 0; i < 20; i++) {
      const t = rnd();
      const p = TRAIL.getPoint(t);
      const side = rnd() > 0.5 ? 1 : -1;
      const dist = 2.6 + rnd() * 6;
      list.push({
        x: p.x + side * dist,
        z: p.z + (rnd() - 0.5) * 3,
        kind: rnd() > 0.45 ? "conifer" : "broadleaf",
        scale: 0.75 + rnd() * 0.8,
        seed: i * 13 + 7,
      });
    }
    return list;
  }, []);

  if (!bark || !ground || !shaft || !fern) return null;

  return (
    <Canvas
      camera={{ fov: 55, position: [0, 1.55, 9.5], near: 0.1, far: 60 }}
      dpr={[1, 1.75]}
      frameloop={active ? "always" : "never"}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      style={{ background: "transparent" }}
    >
      <fog attach="fog" args={["#16241a", 6, 30]} />
      <hemisphereLight intensity={1.0} color="#cfe6b0" groundColor="#2a2410" />
      <directionalLight position={[7, 12, -2]} intensity={2.4} color="#fff0cc" castShadow />
      <ambientLight intensity={0.4} color="#5a7048" />

      <Dolly walk={walk} />

      {/* ground + trail */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[44, 44]} />
        <meshStandardMaterial map={ground} roughness={1} />
      </mesh>

      {trees.map((t, i) => (
        <Tree key={i} spec={t} bark={bark} />
      ))}
      <Ferns map={fern} />
      <LightShafts map={shaft} />
      <Spores />

      {/* canopy overhead — dappled green so light filters down */}
      <mesh position={[0, 10, -6]} rotation={[Math.PI / 2.3, 0, 0]}>
        <planeGeometry args={[60, 40]} />
        <meshBasicMaterial color="#0e2414" transparent opacity={0.9} side={THREE.DoubleSide} />
      </mesh>
    </Canvas>
  );
}

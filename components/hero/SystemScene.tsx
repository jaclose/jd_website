"use client";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useRouter } from "next/navigation";
import { bodies, gardenState, type CelestialBody } from "@/data/system";
import {
  hero,
  setHovered,
  requestUnhover,
  slotCenters,
  sunSlotX,
  dockRadius,
  orbitScale,
  cameraDistance,
  BAR_TOP,
  BAR_H,
  clamp01,
  easeInOutCubic,
  smoothstep,
  damp,
} from "./store";
import {
  glowTexture,
  beamTexture,
  starTexture,
  streakTexture,
  milkyWayTexture,
  nebulaTexture,
  sunTexture,
  gasGiantTexture,
  ringTexture,
  gardenTexture,
  rockyTexture,
} from "./textures";

const DOCK_DIST = 13; // how far in front of the camera the pill plane sits

const reduced =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ————— shared orbit math ————— */

const tiltCache = new Map<string, THREE.Matrix4>();
function tiltMatrix(b: CelestialBody) {
  let m = tiltCache.get(b.id);
  if (!m) {
    m = new THREE.Matrix4()
      .makeRotationY(b.phase * 0.7)
      .multiply(new THREE.Matrix4().makeRotationX(b.tilt));
    tiltCache.set(b.id, m);
  }
  return m;
}

function orbitPoint(b: CelestialBody, theta: number, out: THREE.Vector3) {
  if (b.kind === "comet") {
    const a = b.orbit;
    const ecc = 0.48;
    const semiMinor = a * Math.sqrt(1 - ecc * ecc);
    out.set(Math.cos(theta) * a - a * ecc, 0, Math.sin(theta) * semiMinor);
  } else {
    out.set(Math.cos(theta) * b.orbit, 0, Math.sin(theta) * b.orbit);
  }
  return out.applyMatrix4(tiltMatrix(b));
}

/** world point on the bar plane for a given screen px coordinate */
function dockWorld(
  cam: THREE.PerspectiveCamera,
  width: number,
  height: number,
  px: number,
  py: number,
  out: THREE.Vector3
) {
  out.set((px / width) * 2 - 1, -(py / height) * 2 + 1, 0.5);
  out.unproject(cam);
  out.sub(cam.position).normalize().multiplyScalar(DOCK_DIST).add(cam.position);
  return out;
}

function worldPerPixel(cam: THREE.PerspectiveCamera, height: number, dist: number) {
  return (2 * dist * Math.tan((cam.fov * Math.PI) / 360)) / height;
}

/* ————— atmosphere: a fresnel rim shell, rendered inside-out ————— */

const atmoVert = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;
const atmoFrag = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float rim = pow(1.0 - abs(dot(vNormal, vView)), 2.6);
    gl_FragColor = vec4(uColor, rim * uIntensity);
  }
`;

function Atmosphere({
  radius,
  color,
  intensity = 0.55,
}: {
  radius: number;
  color: string;
  intensity?: number;
}) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: atmoVert,
        fragmentShader: atmoFrag,
        uniforms: {
          uColor: { value: new THREE.Color(color) },
          uIntensity: { value: intensity },
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.BackSide,
      }),
    [color, intensity]
  );
  // the glow stands down as the system docks — pill planets stay crisp
  useFrame(() => {
    material.uniforms.uIntensity.value =
      intensity * (1 - smoothstep(hero.pS, 0.55, 1) * 0.75);
  });
  return (
    <mesh material={material} scale={1.06}>
      <sphereGeometry args={[radius, 32, 32]} />
    </mesh>
  );
}

/* ————— choreographer: smooths global progress, moves the camera ————— */

function Choreographer() {
  const { camera } = useThree();
  useFrame((state, dt) => {
    const d = Math.min(dt, 0.05);
    hero.pS = damp(hero.pS, hero.p, 5.5, d);
    hero.intro = damp(hero.intro, state.clock.elapsedTime > 0.2 ? 1 : 0, 1.4, d);

    const calm = 1 - hero.pS;
    const px = reduced ? 0 : state.pointer.x * 1.5 * calm;
    const py = reduced ? 0 : state.pointer.y * 0.7 * calm;
    const aspect = state.size.width / state.size.height;
    camera.position.x = damp(camera.position.x, px, 2.2, d);
    camera.position.y = damp(camera.position.y, 7.5 - py, 2.2, d);
    camera.position.z = damp(camera.position.z, cameraDistance(aspect), 2.2, d);
    camera.lookAt(0, 0.6, 0);
  });
  return null;
}

/* ————— meteors: an occasional streak across the upper sky ————— */

function Meteors() {
  const obj = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
    const m = new THREE.LineBasicMaterial({
      color: "#dfe8f4",
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const line = new THREE.Line(g, m);
    line.frustumCulled = false;
    return line;
  }, []);
  const s = useRef({
    active: false,
    t: 0,
    wait: 3 + Math.random() * 5,
    from: new THREE.Vector3(),
    dir: new THREE.Vector3(),
    tip: new THREE.Vector3(),
    tail: new THREE.Vector3(),
  });

  useFrame((_, dt) => {
    const st = s.current;
    const mat = obj.material as THREE.LineBasicMaterial;
    if (reduced || hero.pS > 0.4) {
      mat.opacity = 0;
      return;
    }
    if (!st.active) {
      st.wait -= dt;
      if (st.wait <= 0 && hero.intro > 0.9) {
        st.active = true;
        st.t = 0;
        st.from.set(-34 + Math.random() * 68, 13 + Math.random() * 11, -26 + Math.random() * 12);
        st.dir.set(
          (Math.random() > 0.5 ? 1 : -1) * (20 + Math.random() * 12),
          -(6 + Math.random() * 6),
          0
        );
      }
      return;
    }
    const life = 1.0;
    st.t += dt;
    const k = st.t / life;
    if (k >= 1) {
      st.active = false;
      st.wait = 6 + Math.random() * 10;
      mat.opacity = 0;
      return;
    }
    st.tip.copy(st.from).addScaledVector(st.dir, k);
    st.tail.copy(st.tip).addScaledVector(st.dir, -0.14);
    const pos = obj.geometry.attributes.position as THREE.BufferAttribute;
    pos.setXYZ(0, st.tail.x, st.tail.y, st.tail.z);
    pos.setXYZ(1, st.tip.x, st.tip.y, st.tip.z);
    pos.needsUpdate = true;
    mat.opacity = Math.sin(Math.PI * k) * 0.75;
  });

  return <primitive object={obj} />;
}

/* ————— deep sky: starfield, the galactic band, nebulae ————— */

function Starfield() {
  const mats = useRef<(THREE.PointsMaterial | null)[]>([]);
  const star = useMemo(() => starTexture(), []);
  const layers = useMemo(() => {
    const make = (count: number, rMin: number, rMax: number, warmBias: number) => {
      const pos = new Float32Array(count * 3);
      const col = new Float32Array(count * 3);
      const color = new THREE.Color();
      for (let i = 0; i < count; i++) {
        const v = new THREE.Vector3()
          .randomDirection()
          .multiplyScalar(rMin + Math.random() * (rMax - rMin));
        pos.set([v.x, v.y * 0.7, v.z], i * 3);
        // most stars cool white, a scattering of warm and blue
        const r = Math.random();
        if (r < warmBias) color.set("#f4d9a8");
        else if (r > 0.92) color.set("#a8c4f4");
        else color.set("#dde4ee");
        color.multiplyScalar(0.7 + Math.random() * 0.3);
        col.set([color.r, color.g, color.b], i * 3);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      g.setAttribute("color", new THREE.BufferAttribute(col, 3));
      return g;
    };
    return [
      { g: make(1500, 60, 120, 0.12), size: 0.5, base: 0.6 },
      { g: make(420, 42, 70, 0.18), size: 0.95, base: 0.8 },
      { g: make(110, 32, 52, 0.25), size: 1.5, base: 0.95 },
    ];
  }, []);

  useFrame((state) => {
    const o = (1 - smoothstep(hero.pS, 0.2, 0.85)) * hero.intro;
    const t = state.clock.elapsedTime;
    mats.current.forEach((m, i) => {
      if (!m) return;
      const breathe = reduced ? 1 : 0.88 + 0.12 * Math.sin(t * (0.9 + i * 0.35) + i * 2);
      m.opacity = layers[i].base * o * (i === 0 ? 1 : breathe);
    });
  });

  return (
    <>
      {layers.map((l, i) => (
        <points key={i} geometry={l.g}>
          <pointsMaterial
            ref={(m) => {
              mats.current[i] = m;
            }}
            map={star}
            size={l.size}
            sizeAttenuation
            vertexColors
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>
      ))}
    </>
  );
}

function DeepSky() {
  const way = useRef<THREE.Mesh>(null!);
  const wayMat = useRef<THREE.MeshBasicMaterial>(null!);
  const nebMats = useRef<(THREE.SpriteMaterial | null)[]>([]);
  const milky = useMemo(() => milkyWayTexture(), []);
  const nebs = useMemo(
    () =>
      [
        { t: nebulaTexture(11), c: "#3b4a7e", p: [-46, 16, -70], s: 60, o: 0.5 },
        { t: nebulaTexture(23), c: "#7e6232", p: [52, 8, -80], s: 70, o: 0.35 },
        { t: nebulaTexture(37), c: "#2e5a5e", p: [10, -24, -76], s: 52, o: 0.3 },
      ] as { t: THREE.Texture; c: string; p: [number, number, number]; s: number; o: number }[],
    []
  );

  useFrame((state) => {
    const o = (1 - smoothstep(hero.pS, 0.15, 0.8)) * hero.intro;
    if (wayMat.current) wayMat.current.opacity = 0.5 * o;
    nebMats.current.forEach((m, i) => {
      if (m) m.opacity = nebs[i].o * o * (reduced ? 1 : 0.9 + 0.1 * Math.sin(state.clock.elapsedTime * 0.3 + i * 2));
    });
  });

  return (
    <>
      <mesh ref={way} position={[0, 10, -95]} rotation={[0, 0, -0.32]}>
        <planeGeometry args={[260, 90]} />
        <meshBasicMaterial
          ref={wayMat}
          map={milky}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {nebs.map((n, i) => (
        <sprite key={i} position={n.p} scale={n.s}>
          <spriteMaterial
            ref={(m) => {
              nebMats.current[i] = m;
            }}
            map={n.t}
            color={n.c}
            transparent
            opacity={0}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </sprite>
      ))}
    </>
  );
}

/* ————— zodiacal dust: fine motes drifting through the ecliptic ————— */

function SpaceDust() {
  const mat = useRef<THREE.PointsMaterial>(null!);
  const pts = useRef<THREE.Points>(null!);
  const star = useMemo(() => starTexture(), []);
  const geom = useMemo(() => {
    const count = 700;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 3 + Math.pow(Math.random(), 0.6) * 19;
      pos.set(
        [Math.cos(a) * r, (Math.random() - 0.5) * (1.2 + r * 0.12), Math.sin(a) * r],
        i * 3
      );
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  useFrame((state, dt) => {
    pts.current.rotation.y += dt * 0.0065 * (reduced ? 0.2 : 1);
    const t = state.clock.elapsedTime;
    mat.current.opacity =
      0.22 *
      (1 - smoothstep(hero.pS, 0.05, 0.45)) *
      smoothstep(hero.intro, 0.4, 1) *
      (reduced ? 1 : 0.85 + 0.15 * Math.sin(t * 0.4));
  });

  return (
    <points ref={pts} geometry={geom}>
      <pointsMaterial
        ref={mat}
        map={star}
        size={0.07}
        sizeAttenuation
        color="#cfd6e2"
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ————— the asteroid belt between the garden and the gas giant ————— */

function Belt() {
  const mat = useRef<THREE.PointsMaterial>(null!);
  const pts = useRef<THREE.Points>(null!);
  const star = useMemo(() => starTexture(), []);
  const { size } = useThree();
  const geom = useMemo(() => {
    const count = 520;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 9.5 + Math.random() * 1.1 + (Math.random() > 0.92 ? Math.random() * 0.5 : 0);
      pos.set(
        [Math.cos(a) * r, (Math.random() - 0.5) * 0.5, Math.sin(a) * r],
        i * 3
      );
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  useFrame((_, dt) => {
    pts.current.rotation.y += dt * 0.012 * (reduced ? 0.25 : 1);
    const s = orbitScale(size.width / size.height);
    pts.current.scale.setScalar(s);
    mat.current.opacity =
      0.4 * (1 - smoothstep(hero.pS, 0.05, 0.5)) * smoothstep(hero.intro, 0.3, 1);
  });

  return (
    <points ref={pts} geometry={geom}>
      <pointsMaterial
        ref={mat}
        map={star}
        size={0.16}
        sizeAttenuation
        color="#b8ab92"
        transparent
        opacity={0}
        depthWrite={false}
      />
    </points>
  );
}

/* ————— orbit hairlines + motion trails ————— */

function OrbitLine({ body }: { body: CelestialBody }) {
  const mat = useRef<THREE.LineBasicMaterial>(null!);
  const loop = useRef<THREE.LineLoop>(null!);
  const { size } = useThree();
  const geom = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const v = new THREE.Vector3();
    for (let i = 0; i <= 160; i++) {
      pts.push(orbitPoint(body, (i / 160) * Math.PI * 2, v).clone());
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [body]);

  useFrame(() => {
    mat.current.opacity =
      0.12 * (1 - smoothstep(hero.pS, 0.05, 0.5)) * smoothstep(hero.intro, 0.2, 1);
    loop.current.scale.setScalar(orbitScale(size.width / size.height));
  });

  return (
    <lineLoop ref={loop} geometry={geom}>
      <lineBasicMaterial ref={mat} color="#9aa4b8" transparent depthWrite={false} />
    </lineLoop>
  );
}

const TRAIL_N = 36;

/** a fading arc behind the body along its orbit — reads as motion */
function OrbitTrail({ body }: { body: CelestialBody }) {
  const line = useRef<THREE.Line>(null!);
  const { size } = useThree();
  const obj = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(TRAIL_N * 3), 3));
    const col = new Float32Array(TRAIL_N * 3);
    const c = new THREE.Color(body.accent);
    for (let i = 0; i < TRAIL_N; i++) {
      const k = 1 - i / (TRAIL_N - 1); // 1 at the body, 0 at the tail end
      col.set([c.r * k * k, c.g * k * k, c.b * k * k], i * 3);
    }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const m = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const l = new THREE.Line(g, m);
    l.frustumCulled = false;
    return l;
  }, [body]);
  const v = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const theta = hero.theta.get(body.id);
    const mat = obj.material as THREE.LineBasicMaterial;
    if (theta === undefined) {
      mat.opacity = 0;
      return;
    }
    const scale = orbitScale(size.width / size.height);
    const span = 0.55; // radians of arc behind the body
    const pos = obj.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < TRAIL_N; i++) {
      orbitPoint(body, theta - (i / (TRAIL_N - 1)) * span, v);
      v.multiplyScalar(scale);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    pos.needsUpdate = true;
    mat.opacity =
      0.5 * (1 - smoothstep(hero.pS, 0.05, 0.45)) * smoothstep(hero.intro, 0.3, 1);
  });

  return <primitive object={obj} ref={line} />;
}

/* ————— individual bodies ————— */

interface BodyProps {
  body: CelestialBody;
  index: number; // stagger order (sun = 0, bodies follow)
  count: number;
}

function useGenie(body: CelestialBody | null, index: number, count: number) {
  /** returns a per-frame updater that positions/scales the given group */
  const { camera, size } = useThree();
  const theta = useRef(body ? body.phase : 0);
  const slow = useRef(1); // magnetic hover: orbit eases to a near-halt
  const lift = useRef(1); // gentle scale-up while hovered
  const vOrbit = useMemo(() => new THREE.Vector3(), []);
  const vDock = useMemo(() => new THREE.Vector3(), []);
  const vCtrl = useMemo(() => new THREE.Vector3(), []);
  const vPos = useMemo(() => new THREE.Vector3(), []);

  return (group: THREE.Group, dt: number): { e: number; scale: number } => {
    const cam = camera as THREE.PerspectiveCamera;
    const stag = 0.04;
    const pi = clamp01((hero.pS - index * stag) / (1 - stag * (count - 1)));
    const e = easeInOutCubic(pi);

    // orbital motion, slowing to a halt as the body docks —
    // and pausing under the cursor so it can be tracked and clicked
    if (body) {
      const hovered =
        hero.hovered === body.id ||
        (hero.hovered?.startsWith(`${body.id}-moon`) ?? false);
      slow.current = damp(slow.current, hovered ? 0.04 : 1, 6, dt);
      lift.current = damp(lift.current, hovered && e < 0.5 ? 1.13 : 1, 8, dt);
      const speed = ((Math.PI * 2) / body.period) * (reduced ? 0.25 : 1);
      let kepler = 1;
      if (body.kind === "comet") {
        const r = vPos.copy(group.position).length() || body.orbit;
        kepler = 1.9 - 1.1 * Math.min(1, r / body.orbit);
      }
      theta.current += dt * speed * kepler * (1 - e) * slow.current;
      hero.theta.set(body.id, theta.current);
      orbitPoint(body, theta.current, vOrbit);
      vOrbit.multiplyScalar(orbitScale(size.width / size.height));
    } else {
      vOrbit.set(0, 0, 0); // the sun
    }

    // dock slot in world space — planets sit in the pill's upper half
    const centers = slotCenters(count - 1, size.width);
    const slotPx = body ? centers[index - 1] : sunSlotX(count - 1, size.width);
    const slotPy = BAR_TOP + 24;
    dockWorld(cam, size.width, size.height, slotPx, slotPy, vDock);

    // genie path: quadratic bezier arcing upward into the bar
    vCtrl.lerpVectors(vOrbit, vDock, 0.42);
    vCtrl.y += 2.8 + vOrbit.distanceTo(vDock) * 0.06;
    const t1 = 1 - e;
    vPos
      .copy(vOrbit)
      .multiplyScalar(t1 * t1)
      .addScaledVector(vCtrl, 2 * t1 * e)
      .addScaledVector(vDock, e * e);
    group.position.copy(vPos);

    // scale: true size in orbit, pixel-locked size in the bar
    const perPx = worldPerPixel(cam, size.height, DOCK_DIST);
    const radius = body ? body.size : 1.55;
    const dockScale = (dockRadius(body ? body.kind : "terrestrial") * perPx) / radius;
    const intro = smoothstep(hero.intro, 0.12 + index * 0.07, 0.5 + index * 0.07);
    const scale = (1 + (dockScale - 1) * e) * intro * lift.current;
    group.scale.setScalar(Math.max(scale, 0.0001));

    // publish screen position for the DOM overlays — r is the VISUAL
    // radius (rings, comas, atmospheres included) so the reticle and
    // hover panel always clear the whole body
    const dist = vPos.distanceTo(cam.position);
    const ndc = vPos.clone().project(cam);
    const visual = body
      ? body.kind === "gas-giant"
        ? radius * 2.32
        : body.kind === "comet"
          ? radius * 2.1
          : radius * 1.18
      : radius * 1.1;
    hero.screen.set(body ? body.id : "sun", {
      x: ((ndc.x + 1) / 2) * size.width,
      y: ((1 - ndc.y) / 2) * size.height,
      r: (visual * scale) / worldPerPixel(cam, size.height, dist),
    });

    return { e, scale };
  };
}

function useBodyInteraction(body: CelestialBody) {
  const router = useRouter();
  return {
    onPointerOver: (ev: { stopPropagation: () => void }) => {
      ev.stopPropagation();
      setHovered(body.id);
      document.body.style.cursor = "pointer";
    },
    onPointerOut: () => {
      requestUnhover(body.id);
      document.body.style.cursor = "";
    },
    onClick: (ev: { stopPropagation: () => void; nativeEvent: PointerEvent }) => {
      ev.stopPropagation();
      const touch = ev.nativeEvent.pointerType === "touch";
      if (touch && hero.hovered !== body.id) {
        setHovered(body.id, true); // first tap opens the card
      } else {
        document.body.style.cursor = "";
        router.push(body.href);
      }
    },
  };
}

/** invisible, generous raycast target */
function HitSphere({ body, factor = 1.6 }: { body: CelestialBody; factor?: number }) {
  const handlers = useBodyInteraction(body);
  return (
    <mesh {...handlers} scale={Math.max(body.size * factor, 0.9)}>
      <sphereGeometry args={[1, 12, 12]} />
      <meshBasicMaterial visible={false} />
    </mesh>
  );
}

/** one of the giant's moons — a real destination: the essay it carries */
function Moon({
  radius,
  orbitR,
  phase,
  color,
  moonId,
  href,
  registerRef,
}: {
  radius: number;
  orbitR: number;
  phase: number;
  color: string;
  moonId: string;
  href: string;
  registerRef: (g: THREE.Group | null) => void;
}) {
  const router = useRouter();
  return (
    <group
      ref={registerRef}
      position={[Math.cos(phase) * orbitR, 0, Math.sin(phase) * orbitR]}
    >
      <mesh>
        <sphereGeometry args={[radius, 20, 20]} />
        <meshStandardMaterial color={color} roughness={1} />
      </mesh>
      {/* generous, invisible hit target — moons are small and precious.
          Sized so its inner edge stays clear of the giant's hit volume,
          so a precise hover never clips back to the planet. */}
      <mesh
        scale={radius * 6}
        onPointerOver={(ev) => {
          if (hero.pS > 0.5) return;
          ev.stopPropagation();
          setHovered(moonId);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          requestUnhover(moonId);
          document.body.style.cursor = "";
        }}
        onClick={(ev) => {
          if (hero.pS > 0.5) return; // docked: the giant owns the click
          ev.stopPropagation();
          const touch =
            (ev.nativeEvent as PointerEvent).pointerType === "touch";
          if (touch && hero.hovered !== moonId) {
            setHovered(moonId, true);
          } else {
            document.body.style.cursor = "";
            router.push(href);
          }
        }}
      >
        <sphereGeometry args={[1, 10, 10]} />
        <meshBasicMaterial visible={false} />
      </mesh>
    </group>
  );
}

function GasGiant({ body, index, count }: BodyProps) {
  const group = useRef<THREE.Group>(null!);
  const sphere = useRef<THREE.Mesh>(null!);
  const moons = useRef<THREE.Group>(null!);
  const moonRefs = useRef<(THREE.Group | null)[]>([]);
  const moonSpeed = useRef(1);
  const update = useGenie(body, index, count);
  const { camera, size } = useThree();
  const map = useMemo(() => gasGiantTexture(body.color, body.accent), [body]);
  const rings = useMemo(() => ringTexture(body.accent), [body]);
  const vWorld = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, dt) => {
    update(group.current, dt);
    sphere.current.rotation.y += dt * 0.12;
    // a hovered moon freezes its orbit so it stays under the pointer
    const moonHover = hero.hovered?.startsWith(`${body.id}-moon`) ?? false;
    moonSpeed.current = damp(moonSpeed.current, moonHover ? 0.02 : 1, 7, dt);
    moons.current.rotation.y += dt * 0.3 * moonSpeed.current;

    // publish each moon's screen position for the hover panel + reticle
    const cam = camera as THREE.PerspectiveCamera;
    moonRefs.current.forEach((m, i) => {
      if (!m) return;
      m.getWorldPosition(vWorld);
      const dist = vWorld.distanceTo(cam.position);
      const worldR = (0.16 + i * 0.025) * group.current.scale.x;
      const ndc = vWorld.project(cam);
      hero.screen.set(`${body.id}-moon-${i}`, {
        x: ((ndc.x + 1) / 2) * size.width,
        y: ((1 - ndc.y) / 2) * size.height,
        r: Math.max(6, worldR / worldPerPixel(cam, size.height, dist)),
      });
    });
  });

  return (
    <group ref={group}>
      <mesh ref={sphere} rotation={[0.18, 0, -0.1]}>
        <sphereGeometry args={[body.size, 64, 64]} />
        <meshStandardMaterial map={map} roughness={0.78} metalness={0} />
      </mesh>
      <Atmosphere radius={body.size} color={body.accent} intensity={0.5} />
      {/* the ring system */}
      <mesh rotation={[Math.PI / 2 - 0.32, 0.05, 0]}>
        <ringGeometry args={[body.size * 1.3, body.size * 2.3, 128]} />
        <meshBasicMaterial
          map={rings}
          color="#e8d9bd"
          transparent
          opacity={0.85}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {/* three moons — the three most recent essays, each clickable */}
      <group ref={moons} rotation={[0.2, 0, 0]}>
        {[2.5, 3.05, 3.6].map((r, i) => (
          <group key={i}>
            <Moon
              radius={0.16 + i * 0.025}
              orbitR={r}
              phase={(i / 3) * Math.PI * 2}
              color={["#cfc4b4", "#b9c2cf", "#cfb9a9"][i]}
              moonId={`${body.id}-moon-${i}`}
              href={body.links[i]?.href ?? body.href}
              registerRef={(g) => {
                moonRefs.current[i] = g;
              }}
            />
            {/* moon orbit hairline */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[r - 0.008, r + 0.008, 64]} />
              <meshBasicMaterial
                color="#9aa4b8"
                transparent
                opacity={0.07}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>
          </group>
        ))}
      </group>
      {/* the giant's target hugs the planet only — moons (orbiting at
          2.5+) keep their own precise, un-clipped hit volumes */}
      <HitSphere body={body} factor={1.08} />
    </group>
  );
}

function TexturedPlanet({
  body,
  index,
  count,
  map,
  atmosphere,
}: BodyProps & { map: THREE.Texture; atmosphere?: { color: string; intensity: number } }) {
  const group = useRef<THREE.Group>(null!);
  const sphere = useRef<THREE.Mesh>(null!);
  const update = useGenie(body, index, count);

  useFrame((_, dt) => {
    update(group.current, dt);
    sphere.current.rotation.y += dt * 0.18;
  });

  return (
    <group ref={group}>
      <mesh ref={sphere} rotation={[0.1, 0, 0.08]}>
        <sphereGeometry args={[body.size, 48, 48]} />
        <meshStandardMaterial map={map} roughness={0.92} metalness={0} />
      </mesh>
      {atmosphere && (
        <Atmosphere
          radius={body.size}
          color={atmosphere.color}
          intensity={atmosphere.intensity}
        />
      )}
      <HitSphere body={body} factor={2.4} />
    </group>
  );
}

function GardenPlanet(props: BodyProps) {
  const map = useMemo(
    () => gardenTexture(gardenState.vegetation, gardenState.water),
    []
  );
  // barren world: thin dusty exosphere; greener world: brighter air
  const atmoColor = gardenState.vegetation > 0.4 ? "#9fd0c0" : "#c9b896";
  return (
    <TexturedPlanet
      {...props}
      map={map}
      atmosphere={{ color: atmoColor, intensity: 0.4 }}
    />
  );
}

function RockyPlanet(props: BodyProps) {
  const map = useMemo(
    () => rockyTexture(props.body.color, props.body.accent, 17),
    [props.body]
  );
  return (
    <TexturedPlanet
      {...props}
      map={map}
      atmosphere={{ color: props.body.accent, intensity: 0.22 }}
    />
  );
}

/** STN V-1184 — a hollowed asteroid station with running lights */
function Station({ body, index, count }: BodyProps) {
  const group = useRef<THREE.Group>(null!);
  const rock = useRef<THREE.Mesh>(null!);
  const beacon = useRef<THREE.Sprite>(null!);
  const lights = useRef<THREE.Group>(null!);
  const update = useGenie(body, index, count);
  const glow = useMemo(() => glowTexture(), []);
  const geom = useMemo(() => nucleusGeometry(body.size), [body.size]);

  useFrame((state, dt) => {
    update(group.current, dt);
    rock.current.rotation.y += dt * 0.1;
    rock.current.rotation.z += dt * 0.03;
    lights.current.rotation.y += dt * 0.1; // windows ride the rock
    const t = state.clock.elapsedTime;
    const blink = reduced ? 0.8 : Math.sin(t * 2.2) > 0.4 ? 1 : 0.15;
    (beacon.current.material as THREE.SpriteMaterial).opacity = 0.85 * blink * hero.intro;
  });

  return (
    <group ref={group}>
      <mesh ref={rock} geometry={geom}>
        <meshStandardMaterial color="#5a626c" roughness={0.55} metalness={0.45} />
      </mesh>
      {/* a belt of lit windows around the equator */}
      <group ref={lights}>
        {Array.from({ length: 9 }, (_, i) => {
          const a = (i / 9) * Math.PI * 2;
          return (
            <sprite
              key={i}
              position={[
                Math.cos(a) * body.size * 0.98,
                ((i % 3) - 1) * body.size * 0.16,
                Math.sin(a) * body.size * 0.98,
              ]}
              scale={0.085}
            >
              <spriteMaterial
                map={glow}
                color="#ffd9a0"
                transparent
                opacity={0.9}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
              />
            </sprite>
          );
        })}
      </group>
      {/* docking beacon */}
      <sprite ref={beacon} position={[0, body.size * 1.35, 0]} scale={0.16}>
        <spriteMaterial
          map={glow}
          color="#e85d5d"
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
      <Atmosphere radius={body.size} color="#aeb8c4" intensity={0.16} />
      <HitSphere body={body} factor={3} />
    </group>
  );
}

const TAIL_COUNT = 220;
const DUST_COUNT = 130;

/** craggy nucleus: icosahedron with seeded radial displacement */
function nucleusGeometry(size: number): THREE.BufferGeometry {
  const g = new THREE.IcosahedronGeometry(size, 2);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  let seed = 1184;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  // displace by a few low-frequency lobes so shared vertices stay welded
  const lobes = Array.from({ length: 6 }, () => ({
    dir: new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize(),
    amp: 0.1 + rnd() * 0.22,
    freq: 1.5 + rnd() * 2.5,
  }));
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n = v.clone().normalize();
    let d = 1;
    for (const l of lobes) d += l.amp * Math.sin(n.dot(l.dir) * l.freq * Math.PI);
    v.copy(n.multiplyScalar(size * (0.78 + 0.22 * d)));
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

function Comet({ body, index, count }: BodyProps) {
  const group = useRef<THREE.Group>(null!);
  const nucleus = useRef<THREE.Mesh>(null!);
  const coma = useRef<THREE.Sprite>(null!);
  const comaWide = useRef<THREE.Sprite>(null!);
  const tailMat = useRef<THREE.PointsMaterial>(null!);
  const dustMat = useRef<THREE.PointsMaterial>(null!);
  const update = useGenie(body, index, count);
  const glow = useMemo(() => glowTexture(), []);
  const rockGeom = useMemo(() => nucleusGeometry(body.size), [body.size]);
  const jitter = useMemo(() => {
    const arr = new Float32Array(TAIL_COUNT * 3);
    for (let i = 0; i < arr.length; i++) arr[i] = (Math.random() - 0.5) * 2;
    return arr;
  }, []);
  const makeGeom = (n: number) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    return g;
  };
  const tailGeom = useMemo(() => makeGeom(TAIL_COUNT), []);
  const dustGeom = useMemo(() => makeGeom(DUST_COUNT), []);
  const dir = useMemo(() => new THREE.Vector3(), []);
  const tangent = useMemo(() => new THREE.Vector3(), []);
  const dustDir = useMemo(() => new THREE.Vector3(), []);
  const vT = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, dt) => {
    const { e, scale } = update(group.current, dt);
    // ion tail streams anti-sunward; dust tail lags along the orbit
    dir.copy(group.current.position).normalize();
    const theta = hero.theta.get(body.id) ?? body.phase;
    orbitPoint(body, theta - 0.05, vT);
    tangent.copy(group.current.position).sub(vT).normalize();
    dustDir.copy(dir).addScaledVector(tangent, -0.85).normalize();

    const fill = (
      geom: THREE.BufferGeometry,
      n: number,
      d: THREE.Vector3,
      len: number,
      spreadF: number
    ) => {
      const pos = geom.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < n; i++) {
        const t = i / n;
        const spread = t * spreadF * (1 - e);
        pos.setXYZ(
          i,
          group.current.position.x + d.x * t * len + jitter[(i * 3) % jitter.length] * spread,
          group.current.position.y + d.y * t * len + jitter[(i * 3 + 1) % jitter.length] * spread,
          group.current.position.z + d.z * t * len + jitter[(i * 3 + 2) % jitter.length] * spread
        );
      }
      pos.needsUpdate = true;
    };
    // tails and comas die out completely as the comet docks in the pill
    const len = 5.6 * (1 - e) * scale + 0.4;
    fill(tailGeom, TAIL_COUNT, dir, len, 0.8);
    fill(dustGeom, DUST_COUNT, dustDir, len * 0.55, 1.5);
    tailMat.current.opacity = 0.45 * (1 - e) * hero.intro;
    dustMat.current.opacity = 0.26 * (1 - e) * hero.intro;
    nucleus.current.rotation.x += dt * 0.4;
    nucleus.current.rotation.y += dt * 0.23;
    if (coma.current) {
      (coma.current.material as THREE.SpriteMaterial).opacity =
        0.6 * (1 - e * 0.92) * hero.intro;
      coma.current.scale.setScalar(body.size * 5 * (1 - e * 0.5));
    }
    if (comaWide.current) {
      (comaWide.current.material as THREE.SpriteMaterial).opacity =
        0.13 * (1 - e) * hero.intro;
      comaWide.current.scale.setScalar(body.size * 9 * (1 - e * 0.5));
    }
  });

  return (
    <>
      <group ref={group}>
        <mesh ref={nucleus} geometry={rockGeom}>
          <meshStandardMaterial
            color="#7e8b95"
            emissive={body.accent}
            emissiveIntensity={0.32}
            roughness={0.9}
          />
        </mesh>
        <sprite ref={coma}>
          <spriteMaterial
            map={glow}
            color="#e9f6fb"
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </sprite>
        <sprite ref={comaWide}>
          <spriteMaterial
            map={glow}
            color={body.accent}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </sprite>
        <HitSphere body={body} factor={4} />
      </group>
      <points geometry={tailGeom} frustumCulled={false}>
        <pointsMaterial
          ref={tailMat}
          map={glow}
          size={0.5}
          sizeAttenuation
          color={body.accent}
          transparent
          opacity={0.5}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      <points geometry={dustGeom} frustumCulled={false}>
        <pointsMaterial
          ref={dustMat}
          map={glow}
          size={0.62}
          sizeAttenuation
          color="#e8d9b8"
          transparent
          opacity={0.3}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </>
  );
}

/** a generic star (fallback) — bright core + soft halo */
function StarBody({ body, index, count }: BodyProps) {
  const group = useRef<THREE.Group>(null!);
  const halo = useRef<THREE.Sprite>(null!);
  const update = useGenie(body, index, count);
  const glow = useMemo(() => glowTexture(), []);

  useFrame((_, dt) => {
    update(group.current, dt);
    const dockDim = 1 - smoothstep(hero.pS, 0.6, 1) * 0.7;
    halo.current.scale.setScalar(body.size * 6);
    (halo.current.material as THREE.SpriteMaterial).opacity = 0.55 * hero.intro * dockDim;
  });

  return (
    <group ref={group}>
      <mesh>
        <sphereGeometry args={[body.size, 24, 24]} />
        <meshBasicMaterial color={body.accent} toneMapped={false} />
      </mesh>
      <sprite ref={halo}>
        <spriteMaterial
          map={glow}
          color={body.color}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
      <HitSphere body={body} factor={6} />
    </group>
  );
}

/* ————— the pulsar (QUOTE) — a neutron star sweeping two beams ————— */

function Pulsar({ body, index, count }: BodyProps) {
  const group = useRef<THREE.Group>(null!);
  const spin = useRef<THREE.Group>(null!); // rotates → lighthouse sweep
  const core = useRef<THREE.Mesh>(null!);
  const halo = useRef<THREE.Sprite>(null!);
  const ring = useRef<THREE.Mesh>(null!);
  const beamMats = useRef<THREE.MeshBasicMaterial[]>([]);
  const update = useGenie(body, index, count);
  const glow = useMemo(() => glowTexture(), []);
  const beam = useMemo(() => {
    // cone with base at the core (y=0), apex out at y=H
    const H = 7;
    const g = new THREE.ConeGeometry(1.5, H, 28, 1, true);
    g.translate(0, H / 2, 0);
    return g;
  }, []);
  const beamMap = useMemo(() => beamTexture(), []);

  useFrame((state, dt) => {
    update(group.current, dt);
    const t = state.clock.elapsedTime;
    // sharp lighthouse pulse — brief flash each rotation
    const phase = (t * 2.4) % (Math.PI * 2);
    const flash = Math.pow(Math.max(0, Math.sin(phase)), 6); // spike
    const base = 0.18 + flash * 0.9;
    const dockDim = 1 - smoothstep(hero.pS, 0.5, 1) * 0.95; // beams gone in pill
    spin.current.rotation.y += dt * (reduced ? 0.4 : 2.4);
    beamMats.current.forEach((m) => {
      if (m) m.opacity = base * hero.intro * dockDim;
    });
    const coreLift = 1 + flash * 0.4;
    core.current.scale.setScalar(coreLift);
    halo.current.scale.setScalar(body.size * (5 + flash * 4));
    (halo.current.material as THREE.SpriteMaterial).opacity =
      (0.4 + flash * 0.5) * hero.intro;
    if (ring.current) {
      ring.current.rotation.z += dt * 0.4;
      (ring.current.material as THREE.MeshBasicMaterial).opacity =
        0.4 * hero.intro * dockDim;
    }
  });

  return (
    <group ref={group}>
      {/* dense neutron core — hot blue-white, blooms */}
      <mesh ref={core}>
        <sphereGeometry args={[body.size * 1.5, 32, 32]} />
        <meshBasicMaterial color="#eaf2ff" toneMapped={false} />
      </mesh>
      <sprite ref={halo}>
        <spriteMaterial map={glow} color="#bcd4ff" transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>

      {/* magnetic axis, tilted off the spin axis → the sweep */}
      <group ref={spin}>
        <group rotation={[0.5, 0, 0.32]}>
          {[1, -1].map((dir, i) => (
            <mesh key={i} geometry={beam} rotation={[dir > 0 ? 0 : Math.PI, 0, 0]}>
              <meshBasicMaterial
                ref={(m) => {
                  if (m) beamMats.current[i] = m;
                }}
                map={beamMap}
                color="#cfe0ff"
                transparent
                opacity={0}
                depthWrite={false}
                side={THREE.DoubleSide}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          ))}
        </group>
      </group>

      {/* equatorial field ring */}
      <mesh ref={ring} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[body.size * 3, 0.03, 8, 64]} />
        <meshBasicMaterial color="#9fd0ff" transparent opacity={0.4} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>

      <HitSphere body={body} factor={9} />
    </group>
  );
}

/* ————— GLD-7 (ACHIEVEMENTS) — a tumbling ball-and-stick cluster ————— */

/** oriented bond cylinder between two atoms */
function Bond({ a, b, color }: { a: THREE.Vector3; b: THREE.Vector3; color: string }) {
  const mid = useMemo(() => a.clone().add(b).multiplyScalar(0.5), [a, b]);
  const len = useMemo(() => a.distanceTo(b), [a, b]);
  const quat = useMemo(() => {
    const dir = b.clone().sub(a).normalize();
    return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  }, [a, b]);
  return (
    <mesh position={mid} quaternion={quat}>
      <cylinderGeometry args={[0.028, 0.028, len, 8]} />
      <meshStandardMaterial color={color} roughness={0.35} metalness={0.7} />
    </mesh>
  );
}

function Molecule({ body, index, count }: BodyProps) {
  const group = useRef<THREE.Group>(null!);
  const tumble = useRef<THREE.Group>(null!);
  const halo = useRef<THREE.Sprite>(null!);
  const update = useGenie(body, index, count);
  const glow = useMemo(() => glowTexture(), []);

  // a small lit cluster — one bright nucleus, satellites in a ring + caps
  const atoms = useMemo(() => {
    const s = body.size * 1.9;
    const ring = Array.from({ length: 5 }, (_, i) => {
      const a = (i / 5) * Math.PI * 2;
      return new THREE.Vector3(Math.cos(a) * s, Math.sin(a) * s * 0.5, Math.sin(a) * s * 0.7);
    });
    return [
      { p: new THREE.Vector3(0, 0, 0), r: body.size * 1.15, lit: true },
      ...ring.map((p) => ({ p, r: body.size * (0.62 + Math.random() * 0.18), lit: false })),
      { p: new THREE.Vector3(0, s * 1.1, 0), r: body.size * 0.7, lit: false },
      { p: new THREE.Vector3(0, -s * 1.05, 0.2), r: body.size * 0.66, lit: false },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const bonds = useMemo(() => {
    const c = atoms[0].p;
    const links = atoms.slice(1).map((at) => ({ a: c, b: at.p }));
    // a couple of ring bonds for structure
    for (let i = 1; i <= 5; i++) {
      links.push({ a: atoms[i].p, b: atoms[(i % 5) + 1].p });
    }
    return links;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atoms]);

  useFrame((_, dt) => {
    update(group.current, dt);
    tumble.current.rotation.y += dt * 0.5;
    tumble.current.rotation.x += dt * 0.22;
    const dockDim = 1 - smoothstep(hero.pS, 0.6, 1) * 0.7;
    halo.current.scale.setScalar(body.size * 6);
    (halo.current.material as THREE.SpriteMaterial).opacity = 0.35 * hero.intro * dockDim;
  });

  return (
    <group ref={group}>
      <sprite ref={halo}>
        <spriteMaterial map={glow} color={body.color} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <group ref={tumble}>
        {atoms.map((at, i) => (
          <mesh key={i} position={at.p}>
            <icosahedronGeometry args={[at.r, 2]} />
            {at.lit ? (
              <meshStandardMaterial
                color="#f4e0b8"
                emissive="#d4b886"
                emissiveIntensity={0.9}
                roughness={0.3}
                metalness={0.2}
              />
            ) : (
              <meshStandardMaterial color="#c9b48a" roughness={0.32} metalness={0.55} />
            )}
          </mesh>
        ))}
        {bonds.map((bd, i) => (
          <Bond key={i} a={bd.a} b={bd.b} color="#8a7a5c" />
        ))}
      </group>
      <HitSphere body={body} factor={7} />
    </group>
  );
}

function Sun({ count }: { count: number }) {
  const group = useRef<THREE.Group>(null!);
  const surface = useRef<THREE.Mesh>(null!);
  const halo = useRef<THREE.Sprite>(null!);
  const corona = useRef<THREE.Sprite>(null!);
  const flare = useRef<THREE.Sprite>(null!);
  const streak = useRef<THREE.Sprite>(null!);
  const light = useRef<THREE.PointLight>(null!);
  const update = useGenie(null, 0, count);
  const glow = useMemo(() => glowTexture(), []);
  const surfMap = useMemo(() => sunTexture(), []);
  const streakMap = useMemo(() => streakTexture(), []);

  useFrame((state, dt) => {
    const { e } = update(group.current, dt);
    const t = state.clock.elapsedTime;
    surface.current.rotation.y += dt * 0.02;
    const breathe = reduced ? 1 : 1 + Math.sin(t * 0.8) * 0.04;
    // halos collapse harder into the pill so the docked star reads crisp
    halo.current.scale.setScalar(6.5 * breathe * (1 - e * 0.35));
    (halo.current.material as THREE.SpriteMaterial).opacity = (0.8 - e * 0.74) * hero.intro;
    corona.current.scale.setScalar(12 * (reduced ? 1 : 1 + Math.sin(t * 0.5 + 2) * 0.05));
    (corona.current.material as THREE.SpriteMaterial).opacity = 0.26 * (1 - e) * hero.intro;
    flare.current.scale.setScalar(19);
    (flare.current.material as THREE.SpriteMaterial).opacity = 0.1 * (1 - e) * hero.intro;
    streak.current.scale.set(24 * (reduced ? 1 : 1 + Math.sin(t * 0.7) * 0.08), 1.2, 1);
    (streak.current.material as THREE.SpriteMaterial).opacity = 0.18 * (1 - e) * hero.intro;
    // the point light eases off as it docks so it stops blowing out neighbours
    light.current.intensity = 420 * (1 - e * 0.62);
  });

  return (
    <group ref={group}>
      <mesh ref={surface}>
        <sphereGeometry args={[1.55, 64, 64]} />
        <meshBasicMaterial map={surfMap} toneMapped={false} />
      </mesh>
      <sprite ref={halo}>
        <spriteMaterial
          map={glow}
          color="#f4c87c"
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
      <sprite ref={corona}>
        <spriteMaterial
          map={glow}
          color="#d89a4e"
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
      <sprite ref={flare}>
        <spriteMaterial
          map={glow}
          color="#8a5f2e"
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
      <sprite ref={streak}>
        <spriteMaterial
          map={streakMap}
          color="#ffe8c0"
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
      <pointLight ref={light} color="#ffe2b0" intensity={420} decay={1.7} />
    </group>
  );
}

/* soft even fill that fades in as the system docks — so the tiny pill
   planets read crisp and evenly lit instead of half-blown by the star */
function DockFill() {
  const light = useRef<THREE.AmbientLight>(null!);
  useFrame(() => {
    light.current.intensity = 0.9 * smoothstep(hero.pS, 0.55, 0.95);
  });
  return <ambientLight ref={light} intensity={0} color="#d8e0f0" />;
}

/* ————— scene root ————— */

export default function SystemScene() {
  const count = bodies.length + 1; // bodies + the sun

  return (
    <>
      {/* selective HDR bloom — high threshold so only emissive cores
          (sun, pulsar, star halos) bleed, not the small docked planets */}
      {!reduced && (
        <EffectComposer multisampling={0}>
          <Bloom
            intensity={0.5}
            luminanceThreshold={0.78}
            luminanceSmoothing={0.28}
            mipmapBlur
          />
        </EffectComposer>
      )}
      <Choreographer />
      <ambientLight intensity={0.4} color="#aab4cc" />
      <hemisphereLight intensity={0.22} color="#bcc8e0" groundColor="#1a1410" />
      <DockFill />
      <DeepSky />
      <Starfield />
      <Meteors />
      <Belt />
      <SpaceDust />
      <Sun count={count} />
      {bodies.map((b) => (
        <OrbitLine key={`ring-${b.id}`} body={b} />
      ))}
      {bodies.map((b) => (
        <OrbitTrail key={`trail-${b.id}`} body={b} />
      ))}
      {bodies.map((b, i) => {
        const props = { body: b, index: i + 1, count };
        switch (b.kind) {
          case "gas-giant":
            return <GasGiant key={b.id} {...props} />;
          case "terrestrial":
            return <GardenPlanet key={b.id} {...props} />;
          case "rocky":
            return b.id === "vault" ? (
              <Station key={b.id} {...props} />
            ) : (
              <RockyPlanet key={b.id} {...props} />
            );
          case "comet":
            return <Comet key={b.id} {...props} />;
          default:
            if (b.id === "quote") return <Pulsar key={b.id} {...props} />;
            if (b.id === "achievements") return <Molecule key={b.id} {...props} />;
            return <StarBody key={b.id} {...props} />;
        }
      })}
    </>
  );
}

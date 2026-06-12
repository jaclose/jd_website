"use client";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useRouter } from "next/navigation";
import { bodies, gardenState, type CelestialBody } from "@/data/system";
import {
  hero,
  setHovered,
  requestUnhover,
  slotCenters,
  dockRadius,
  orbitScale,
  cameraDistance,
  BAR_H,
  clamp01,
  easeInOutCubic,
  smoothstep,
  damp,
} from "./store";
import {
  glowTexture,
  gasGiantTexture,
  gardenTexture,
  rockyTexture,
} from "./textures";

const DOCK_DIST = 13; // how far in front of the camera the bar plane sits
const SUN_SLOT_X = 26; // px — the sun docks beside the wordmark

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

/* ————— starfield ————— */

function Starfield() {
  const matFar = useRef<THREE.PointsMaterial>(null!);
  const matNear = useRef<THREE.PointsMaterial>(null!);
  const [far, near] = useMemo(() => {
    const make = (count: number, rMin: number, rMax: number) => {
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const v = new THREE.Vector3()
          .randomDirection()
          .multiplyScalar(rMin + Math.random() * (rMax - rMin));
        pos.set([v.x, v.y * 0.7, v.z], i * 3);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      return g;
    };
    return [make(1100, 55, 110), make(160, 34, 60)];
  }, []);

  useFrame((state) => {
    const o = (1 - smoothstep(hero.pS, 0.2, 0.85)) * hero.intro;
    matFar.current.opacity = 0.65 * o;
    // the near layer breathes — a slow collective twinkle
    matNear.current.opacity =
      0.95 * o * (reduced ? 1 : 0.86 + 0.14 * Math.sin(state.clock.elapsedTime * 1.3));
  });

  return (
    <>
      <points geometry={far}>
        <pointsMaterial
          ref={matFar}
          size={0.55}
          sizeAttenuation
          color="#cdd6e4"
          transparent
          depthWrite={false}
        />
      </points>
      <points geometry={near}>
        <pointsMaterial
          ref={matNear}
          size={1.15}
          sizeAttenuation
          color="#e8e6e1"
          transparent
          depthWrite={false}
        />
      </points>
    </>
  );
}

/* ————— orbit hairlines ————— */

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

  // eslint-disable-next-line react/no-unknown-property
  return (
    <lineLoop ref={loop} geometry={geom}>
      <lineBasicMaterial ref={mat} color="#9aa4b8" transparent depthWrite={false} />
    </lineLoop>
  );
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
  const vOrbit = useMemo(() => new THREE.Vector3(), []);
  const vDock = useMemo(() => new THREE.Vector3(), []);
  const vCtrl = useMemo(() => new THREE.Vector3(), []);
  const vPos = useMemo(() => new THREE.Vector3(), []);

  return (group: THREE.Group, dt: number): { e: number; scale: number } => {
    const cam = camera as THREE.PerspectiveCamera;
    const stag = 0.04;
    const pi = clamp01((hero.pS - index * stag) / (1 - stag * (count - 1)));
    const e = easeInOutCubic(pi);

    // orbital motion, slowing to a halt as the body docks
    if (body) {
      const speed = ((Math.PI * 2) / body.period) * (reduced ? 0.25 : 1);
      let kepler = 1;
      if (body.kind === "comet") {
        const r = vPos.copy(group.position).length() || body.orbit;
        kepler = 1.9 - 1.1 * Math.min(1, r / body.orbit);
      }
      theta.current += dt * speed * kepler * (1 - e);
      orbitPoint(body, theta.current, vOrbit);
      vOrbit.multiplyScalar(orbitScale(size.width / size.height));
    } else {
      vOrbit.set(0, 0, 0); // the sun
    }

    // dock slot in world space
    const centers = slotCenters(count - 1, size.width);
    const slotPx = body ? centers[index - 1] : SUN_SLOT_X;
    const slotPy = BAR_H / 2 + 2;
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
    const scale = (1 + (dockScale - 1) * e) * intro;
    group.scale.setScalar(Math.max(scale, 0.0001));

    // publish screen position for the DOM overlays
    const dist = vPos.distanceTo(cam.position);
    const ndc = vPos.clone().project(cam);
    hero.screen.set(body ? body.id : "sun", {
      x: ((ndc.x + 1) / 2) * size.width,
      y: ((1 - ndc.y) / 2) * size.height,
      r: (radius * scale) / worldPerPixel(cam, size.height, dist),
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
    <mesh {...handlers} scale={Math.max(body.size * factor, 0.8)}>
      <sphereGeometry args={[1, 12, 12]} />
      <meshBasicMaterial visible={false} />
    </mesh>
  );
}

function GasGiant({ body, index, count }: BodyProps) {
  const group = useRef<THREE.Group>(null!);
  const sphere = useRef<THREE.Mesh>(null!);
  const moons = useRef<THREE.Group>(null!);
  const update = useGenie(body, index, count);
  const map = useMemo(() => gasGiantTexture(body.color, body.accent), [body]);

  useFrame((_, dt) => {
    update(group.current, dt);
    sphere.current.rotation.y += dt * 0.12;
    moons.current.rotation.y += dt * 0.3;
  });

  return (
    <group ref={group}>
      <mesh ref={sphere} rotation={[0.18, 0, -0.1]}>
        <sphereGeometry args={[body.size, 48, 48]} />
        <meshStandardMaterial map={map} roughness={0.85} metalness={0} />
      </mesh>
      {/* rings */}
      <mesh rotation={[Math.PI / 2 - 0.32, 0.05, 0]}>
        <ringGeometry args={[body.size * 1.45, body.size * 1.85, 96]} />
        <meshBasicMaterial
          color={body.accent}
          transparent
          opacity={0.28}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh rotation={[Math.PI / 2 - 0.32, 0.05, 0]}>
        <ringGeometry args={[body.size * 1.9, body.size * 2.05, 96]} />
        <meshBasicMaterial
          color={body.accent}
          transparent
          opacity={0.12}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {/* three moons — the three most recent essays */}
      <group ref={moons} rotation={[0.2, 0, 0]}>
        {[2.3, 2.85, 3.4].map((r, i) => (
          <mesh
            key={i}
            position={[
              Math.cos((i / 3) * Math.PI * 2) * r,
              0,
              Math.sin((i / 3) * Math.PI * 2) * r,
            ]}
          >
            <sphereGeometry args={[0.16 + i * 0.025, 16, 16]} />
            <meshStandardMaterial color="#cfc4b4" roughness={1} />
          </mesh>
        ))}
      </group>
      <HitSphere body={body} factor={2.2} />
    </group>
  );
}

function TexturedPlanet({
  body,
  index,
  count,
  map,
}: BodyProps & { map: THREE.Texture }) {
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
        <sphereGeometry args={[body.size, 40, 40]} />
        <meshStandardMaterial map={map} roughness={0.95} metalness={0} />
      </mesh>
      <HitSphere body={body} factor={2.4} />
    </group>
  );
}

function GardenPlanet(props: BodyProps) {
  const map = useMemo(
    () => gardenTexture(gardenState.vegetation, gardenState.water),
    []
  );
  return <TexturedPlanet {...props} map={map} />;
}

function RockyPlanet(props: BodyProps) {
  const map = useMemo(
    () => rockyTexture(props.body.color, props.body.accent, 17),
    [props.body]
  );
  return <TexturedPlanet {...props} map={map} />;
}

const TAIL_COUNT = 140;

function Comet({ body, index, count }: BodyProps) {
  const group = useRef<THREE.Group>(null!);
  const tail = useRef<THREE.Points>(null!);
  const tailMat = useRef<THREE.PointsMaterial>(null!);
  const update = useGenie(body, index, count);
  const glow = useMemo(() => glowTexture(), []);
  const jitter = useMemo(() => {
    const arr = new Float32Array(TAIL_COUNT * 3);
    for (let i = 0; i < arr.length; i++) arr[i] = (Math.random() - 0.5) * 2;
    return arr;
  }, []);
  const tailGeom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(TAIL_COUNT * 3), 3)
    );
    return g;
  }, []);
  const dir = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, dt) => {
    const { e, scale } = update(group.current, dt);
    // tail streams away from the sun, fading as the comet docks
    dir.copy(group.current.position).normalize();
    const pos = tailGeom.attributes.position as THREE.BufferAttribute;
    const len = 5.2 * (1 - e) * scale + 0.4;
    for (let i = 0; i < TAIL_COUNT; i++) {
      const t = i / TAIL_COUNT;
      const spread = t * 0.85 * (1 - e);
      pos.setXYZ(
        i,
        group.current.position.x + dir.x * t * len + jitter[i * 3] * spread,
        group.current.position.y + dir.y * t * len + jitter[i * 3 + 1] * spread,
        group.current.position.z + dir.z * t * len + jitter[i * 3 + 2] * spread
      );
    }
    pos.needsUpdate = true;
    tailMat.current.opacity = (0.5 - e * 0.35) * hero.intro;
  });

  return (
    <>
      <group ref={group}>
        <mesh>
          <icosahedronGeometry args={[body.size, 1]} />
          <meshStandardMaterial
            color={body.color}
            emissive={body.accent}
            emissiveIntensity={0.6}
            roughness={0.6}
            flatShading
          />
        </mesh>
        <HitSphere body={body} factor={4} />
      </group>
      <points ref={tail} geometry={tailGeom} frustumCulled={false}>
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
    </>
  );
}

function StarBody({ body, index, count }: BodyProps) {
  const group = useRef<THREE.Group>(null!);
  const halo = useRef<THREE.Sprite>(null!);
  const update = useGenie(body, index, count);
  const glow = useMemo(() => glowTexture(), []);
  const isPulsar = body.id === "quote";
  const cluster = body.id === "achievements";

  useFrame((state, dt) => {
    update(group.current, dt);
    const t = state.clock.elapsedTime;
    const pulse = isPulsar && !reduced ? 1 + Math.sin(t * 2.6) * 0.35 : 1;
    halo.current.scale.setScalar(body.size * 7 * pulse);
    (halo.current.material as THREE.SpriteMaterial).opacity =
      (isPulsar ? 0.55 + Math.sin(t * 2.6) * 0.25 : 0.6) * hero.intro;
  });

  return (
    <group ref={group}>
      <mesh>
        <sphereGeometry args={[body.size, 16, 16]} />
        <meshBasicMaterial color={body.accent} />
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
      {cluster &&
        [
          [0.5, 0.3, 0.1],
          [-0.4, 0.5, -0.2],
          [0.2, -0.45, 0.3],
          [-0.55, -0.2, 0.15],
        ].map((p, i) => (
          <sprite key={i} position={p as [number, number, number]} scale={0.55}>
            <spriteMaterial
              map={glow}
              color={body.accent}
              transparent
              opacity={0.5}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </sprite>
        ))}
      <HitSphere body={body} factor={6} />
    </group>
  );
}

function Sun({ count }: { count: number }) {
  const group = useRef<THREE.Group>(null!);
  const halo = useRef<THREE.Sprite>(null!);
  const update = useGenie(null, 0, count);
  const glow = useMemo(() => glowTexture(), []);

  useFrame((state, dt) => {
    const { e } = update(group.current, dt);
    const breathe = reduced ? 1 : 1 + Math.sin(state.clock.elapsedTime * 0.8) * 0.04;
    halo.current.scale.setScalar(7.5 * breathe);
    (halo.current.material as THREE.SpriteMaterial).opacity =
      (0.85 - e * 0.25) * hero.intro;
  });

  return (
    <group ref={group}>
      <mesh>
        <sphereGeometry args={[1.55, 48, 48]} />
        <meshBasicMaterial color="#ffe3ad" />
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
      <pointLight color="#ffe2b0" intensity={420} decay={1.7} />
    </group>
  );
}

/* ————— scene root ————— */

export default function SystemScene() {
  const count = bodies.length + 1; // bodies + the sun

  return (
    <>
      <Choreographer />
      <ambientLight intensity={0.45} color="#aab4cc" />
      <hemisphereLight intensity={0.25} color="#bcc8e0" groundColor="#1a1410" />
      <Starfield />
      <Meteors />
      <Sun count={count} />
      {bodies.map((b) => (
        <OrbitLine key={`ring-${b.id}`} body={b} />
      ))}
      {bodies.map((b, i) => {
        const props = { body: b, index: i + 1, count };
        switch (b.kind) {
          case "gas-giant":
            return <GasGiant key={b.id} {...props} />;
          case "terrestrial":
            return <GardenPlanet key={b.id} {...props} />;
          case "rocky":
            return <RockyPlanet key={b.id} {...props} />;
          case "comet":
            return <Comet key={b.id} {...props} />;
          default:
            return <StarBody key={b.id} {...props} />;
        }
      })}
    </>
  );
}

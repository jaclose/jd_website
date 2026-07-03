"use client";
import { useEffect, useMemo, useRef } from "react";
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
  spikedStarTexture,
  streakTexture,
  milkyWayTexture,
  nebulaTexture,
  gasGiantTexture,
  ringTexture,
  gardenTexture,
  cloudTexture,
  rockyTexture,
} from "./textures";
import { makeSunMaterial } from "./sunMaterial";
import { makeCoronaMaterial } from "./coronaMaterial";
import {
  sunWorld,
  sceneLife,
  patchPlanetMaterial,
  patchRingScatter,
  type PlanetPatchOpts,
} from "./materials";

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
  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vView = normalize(-mv.xyz);
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * mv;
  }
`;
// soft scatter shell, drawn on the shell's far hemisphere (the planet's own
// depth carves out the disc, leaving an annulus of air). The view dot runs
// 0 at the outer silhouette → ~-0.38 against the planet limb at scale 1.08,
// so the glow is densest against the limb and feathers to nothing outward —
// never a drawn circle. Sunlit: brightest along the day limb, faint in shadow.
const atmoFrag = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform vec3 uSunPos;
  uniform float uLife;
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;
  void main() {
    float depth = clamp(-dot(vNormal, vView) / 0.38, 0.0, 1.0);
    float halo = depth * depth;
    float day = dot(normalize(vWorldNormal), normalize(uSunPos - vWorldPos));
    float lit = mix(1.0, 0.22 + 0.78 * smoothstep(-0.35, 0.55, day), uLife);
    gl_FragColor = vec4(uColor, halo * uIntensity * lit);
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
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: atmoVert,
      fragmentShader: atmoFrag,
      uniforms: {
        uColor: { value: new THREE.Color(color) },
        uIntensity: { value: intensity },
        uSunPos: { value: sunWorld },
        uLife: sceneLife,
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.BackSide,
    });
  }, [color, intensity]);
  // the glow stands down as the system docks — pill planets stay crisp
  useFrame(() => {
    material.uniforms.uIntensity.value =
      intensity * (1 - smoothstep(hero.pS, 0.55, 1) * 0.75);
  });
  return (
    <mesh material={material} scale={1.08}>
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
    // every patched material reads this: 1 in free flight, 0 in the pill
    sceneLife.value = (1 - smoothstep(hero.pS, 0.45, 0.9)) * hero.intro;

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

/* ————— constellation egg: stillness joins the worlds ————— */

/**
 * After ~10 seconds without pointer or scroll on the hero, faint gold
 * hairlines connect the nav bodies in their slot order for a couple of
 * seconds, then dissolve — the site's own constellation, drawn only for
 * whoever waits. Repeats gently while the stillness holds.
 */
function Constellation() {
  const { size } = useThree();
  const idleAt = useRef(0);
  const obj = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(bodies.length * 3), 3)
    );
    const m = new THREE.LineBasicMaterial({
      color: "#d4b886",
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const l = new THREE.Line(g, m);
    l.frustumCulled = false;
    return l;
  }, []);
  const v = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    const wake = () => {
      idleAt.current = performance.now();
    };
    wake();
    window.addEventListener("pointermove", wake, { passive: true });
    window.addEventListener("pointerdown", wake, { passive: true });
    window.addEventListener("wheel", wake, { passive: true });
    window.addEventListener("keydown", wake, { passive: true });
    return () => {
      window.removeEventListener("pointermove", wake);
      window.removeEventListener("pointerdown", wake);
      window.removeEventListener("wheel", wake);
      window.removeEventListener("keydown", wake);
    };
  }, []);

  useFrame(() => {
    const mat = obj.material as THREE.LineBasicMaterial;
    if (reduced || hero.pS > 0.12 || hero.intro < 0.9 || hero.hovered) {
      mat.opacity = 0;
      return;
    }
    const idle = (performance.now() - idleAt.current) / 1000;
    if (idle < 10) {
      mat.opacity = 0;
      return;
    }
    // draw for ~3.2s, rest ~11s, repeat while the stillness holds
    const cycle = (idle - 10) % 14;
    const env = Math.min(smoothstep(cycle, 0, 0.9), 1 - smoothstep(cycle, 2.4, 3.2));
    if (env <= 0) {
      mat.opacity = 0;
      return;
    }
    const s = orbitScale(size.width / size.height);
    const pos = obj.geometry.attributes.position as THREE.BufferAttribute;
    bodies.forEach((b, i) => {
      orbitPoint(b, hero.theta.get(b.id) ?? b.phase, v).multiplyScalar(s);
      pos.setXYZ(i, v.x, v.y, v.z);
    });
    pos.needsUpdate = true;
    mat.opacity = 0.2 * env;
  });

  return <primitive object={obj} />;
}

/* ————— zodiacal light: the faint dust wedge along the ecliptic ————— */

function ZodiacalLight() {
  const sprite = useRef<THREE.Sprite>(null!);
  const glow = useMemo(() => glowTexture(), []);
  useFrame(() => {
    const m = sprite.current.material as THREE.SpriteMaterial;
    m.opacity = 0.055 * (1 - smoothstep(hero.pS, 0.1, 0.6)) * hero.intro;
  });
  return (
    <sprite ref={sprite} position={[0, 0.3, -44]} scale={[64, 7.5, 1]}>
      <spriteMaterial
        map={glow}
        color="#c8b490"
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </sprite>
  );
}

/* ————— deep sky: starfield, the galactic band, nebulae ————— */

function Starfield() {
  const mats = useRef<(THREE.PointsMaterial | null)[]>([]);
  const star = useMemo(() => starTexture(), []);
  const spiked = useMemo(() => spikedStarTexture(), []);
  // one shared clock uniform for every twinkle-patched material
  const uTime = useMemo(() => ({ value: 0 }), []);

  const layers = useMemo(() => {
    const make = (count: number, rMin: number, rMax: number, warmBias: number) => {
      const pos = new Float32Array(count * 3);
      const col = new Float32Array(count * 3);
      const phase = new Float32Array(count);
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
        phase[i] = Math.random() * 64;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      g.setAttribute("color", new THREE.BufferAttribute(col, 3));
      g.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
      return g;
    };
    return [
      { g: make(1500, 60, 120, 0.12), size: 0.5, base: 0.6, twinkle: false, tex: star },
      { g: make(420, 42, 70, 0.18), size: 0.95, base: 0.8, twinkle: true, tex: star },
      { g: make(110, 32, 52, 0.25), size: 1.5, base: 0.95, twinkle: true, tex: star },
      // sparse hero stars: big, spiked, individually alive
      { g: make(26, 40, 84, 0.3), size: 4.6, base: 0.85, twinkle: true, tex: spiked },
    ];
  }, [star, spiked]);

  // per-star twinkle: phase attribute scales point size + brightness in-shader,
  // so each star breathes on its own clock instead of whole layers pulsing.
  const patchTwinkle = (m: THREE.PointsMaterial) => {
    m.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = uTime;
      shader.vertexShader =
        "attribute float aPhase;\nvarying float vTw;\nuniform float uTime;\n" +
        shader.vertexShader.replace(
          "gl_PointSize = size;",
          [
            "vTw = 0.72 + 0.38 * sin(uTime * (0.9 + fract(aPhase * 0.37) * 1.9) + aPhase * 7.0);",
            "gl_PointSize = size * (0.82 + 0.3 * vTw);",
          ].join("\n"),
        );
      shader.fragmentShader =
        "varying float vTw;\n" +
        shader.fragmentShader.replace(
          "#include <color_fragment>",
          "#include <color_fragment>\n\tdiffuseColor.rgb *= vTw;",
        );
    };
  };

  useFrame((state) => {
    const o = (1 - smoothstep(hero.pS, 0.2, 0.85)) * hero.intro;
    uTime.value = state.clock.elapsedTime;
    mats.current.forEach((m, i) => {
      if (!m) return;
      m.opacity = layers[i].base * o;
    });
  });

  return (
    <>
      {layers.map((l, i) => (
        <points key={i} geometry={l.g}>
          <pointsMaterial
            ref={(m) => {
              mats.current[i] = m;
              if (m && l.twinkle && !reduced && !m.userData.twinkled) {
                m.userData.twinkled = true;
                patchTwinkle(m);
                m.needsUpdate = true;
              }
            }}
            map={l.tex}
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
  const focus = useRef(1); // damped hover emphasis
  const baseColor = useMemo(() => new THREE.Color("#9aa4b8"), []);
  const accentColor = useMemo(() => new THREE.Color(body.accent), [body.accent]);
  const geom = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const v = new THREE.Vector3();
    for (let i = 0; i <= 160; i++) {
      pts.push(orbitPoint(body, (i / 160) * Math.PI * 2, v).clone());
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [body]);

  useFrame((_, dt) => {
    // hover focus: the hovered body's path lights up in its own colour,
    // every other path recedes — the system becomes an instrument you read
    const hovered = hero.hovered;
    const mine = hovered === body.id || !!hovered?.startsWith(`${body.id}-`);
    const target = hovered ? (mine ? 3.2 : 0.45) : 1;
    focus.current = damp(focus.current, target, 6, Math.min(dt, 0.05));
    const lift = THREE.MathUtils.clamp((focus.current - 1) / 2.2, 0, 1);
    mat.current.color.copy(baseColor).lerp(accentColor, lift);
    mat.current.opacity =
      0.12 * focus.current * (1 - smoothstep(hero.pS, 0.05, 0.5)) * smoothstep(hero.intro, 0.2, 1);
    loop.current.scale.setScalar(orbitScale(size.width / size.height));
  });

  return (
    <lineLoop ref={loop} geometry={geom}>
      <lineBasicMaterial ref={mat} color="#9aa4b8" transparent depthWrite={false} />
    </lineLoop>
  );
}

const TRAIL_N = 48;
const TRAIL_BACK = 0.34; // radians of fading history behind the body
const TRAIL_AHEAD = 0.85; // radians of glowing path ahead of it
const GAS_GIANT_MOONS = [
  { orbitR: 2.5, radius: 0.16, color: "#cfc4b4" },
  { orbitR: 3.08, radius: 0.185, color: "#b9c2cf" },
  { orbitR: 4.18, radius: 0.21, color: "#cfb9a9" },
] as const;

/** a gradient arc along the orbit — bright over the path the body is about
 *  to travel, a short fading wake behind it. Reads as motion with a heading. */
function OrbitTrail({ body }: { body: CelestialBody }) {
  const line = useRef<THREE.Line>(null!);
  const { size } = useThree();
  const obj = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(TRAIL_N * 3), 3));
    const col = new Float32Array(TRAIL_N * 3);
    const c = new THREE.Color(body.accent);
    for (let i = 0; i < TRAIL_N; i++) {
      const o = -TRAIL_BACK + (i / (TRAIL_N - 1)) * (TRAIL_BACK + TRAIL_AHEAD);
      const k =
        o < 0
          ? Math.pow(1 + o / TRAIL_BACK, 2) * 0.45 // the wake
          : Math.pow(1 - o / TRAIL_AHEAD, 1.6); // the road ahead
      col.set([c.r * k, c.g * k, c.b * k], i * 3);
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
    const pos = obj.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < TRAIL_N; i++) {
      const o = -TRAIL_BACK + (i / (TRAIL_N - 1)) * (TRAIL_BACK + TRAIL_AHEAD);
      orbitPoint(body, theta + o, v);
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
  const tAcc = useRef(Math.random() * 8); // clock for the docked idle breath
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

    // scale: true size in orbit, pixel-locked size in the bar —
    // docked bodies breathe (±2%, 8s, offset per slot) so the pill stays alive
    tAcc.current += dt;
    const breathe = reduced
      ? 1
      : 1 + Math.sin(tAcc.current * 0.785 + index * 1.7) * 0.02 * e;
    const perPx = worldPerPixel(cam, size.height, DOCK_DIST);
    const radius = body ? body.size : 1.55;
    const dockScale = (dockRadius(body ? body.kind : "terrestrial") * perPx) / radius;
    const intro = smoothstep(hero.intro, 0.12 + index * 0.07, 0.5 + index * 0.07);
    const scale = (1 + (dockScale - 1) * e) * intro * lift.current * breathe;
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
  const aurN = useRef<THREE.Mesh>(null!);
  const aurS = useRef<THREE.Mesh>(null!);
  const update = useGenie(body, index, count);
  const { camera, size } = useThree();
  const map = useMemo(() => gasGiantTexture(body.color, body.accent), [body]);
  const rings = useMemo(() => ringTexture(body.accent), [body]);
  const giantMat = useMemo(
    () =>
      patchPlanetMaterial(
        new THREE.MeshStandardMaterial({ map, roughness: 0.74, metalness: 0 }),
        { wrap: 0.2 }
      ),
    [map]
  );
  const ringMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: rings,
        color: "#e8d9bd",
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    [rings]
  );
  const ringUniforms = useMemo(() => patchRingScatter(ringMat), [ringMat]);
  const vWorld = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, dt) => {
    const { e } = update(group.current, dt);
    sphere.current.rotation.y += dt * 0.12;
    ringUniforms.uPlanetPos.value.copy(group.current.position);
    // aurora ovals breathe on the poles, gone once docked
    const t = state.clock.elapsedTime;
    const aur = (0.2 + (reduced ? 0 : 0.12 * Math.sin(t * 1.15))) * (1 - e) * hero.intro;
    (aurN.current.material as THREE.MeshBasicMaterial).opacity = aur;
    (aurS.current.material as THREE.MeshBasicMaterial).opacity = aur * 0.75;
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
      const worldR = (GAS_GIANT_MOONS[i]?.radius ?? 0.16) * group.current.scale.x;
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
      <mesh ref={sphere} rotation={[0.18, 0, -0.1]} material={giantMat}>
        <sphereGeometry args={[body.size, 64, 64]} />
      </mesh>
      <Atmosphere radius={body.size} color={body.accent} intensity={0.5} />
      {/* aurora ovals hugging the magnetic poles */}
      <group rotation={[0.18, 0, -0.1]}>
        <mesh ref={aurN} position={[0, body.size * 0.74, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[body.size * 0.52, 0.024, 6, 40]} />
          <meshBasicMaterial
            color={body.accent}
            transparent
            opacity={0}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        <mesh ref={aurS} position={[0, -body.size * 0.74, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[body.size * 0.52, 0.02, 6, 40]} />
          <meshBasicMaterial
            color={body.accent}
            transparent
            opacity={0}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>
      {/* the ring system — brighter on the sunward arc, shadowed behind */}
      <mesh rotation={[Math.PI / 2 - 0.32, 0.05, 0]} material={ringMat}>
        <ringGeometry args={[body.size * 1.3, body.size * 2.3, 128]} />
      </mesh>
      {/* three moons — the three most recent essays, each clickable */}
      <group ref={moons} rotation={[0.2, 0, 0]}>
        {GAS_GIANT_MOONS.map((moon, i) => (
          <group key={i}>
            <Moon
              radius={moon.radius}
              orbitR={moon.orbitR}
              phase={(i / GAS_GIANT_MOONS.length) * Math.PI * 2}
              color={moon.color}
              moonId={`${body.id}-moon-${i}`}
              href={body.links[i]?.href ?? body.href}
              registerRef={(g) => {
                moonRefs.current[i] = g;
              }}
            />
            {/* moon orbit hairline */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[moon.orbitR - 0.008, moon.orbitR + 0.008, 64]} />
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
  roughness = 0.92,
  patch,
  children,
}: BodyProps & {
  map: THREE.Texture;
  atmosphere?: { color: string; intensity: number };
  roughness?: number;
  patch?: PlanetPatchOpts;
  children?: React.ReactNode;
}) {
  const group = useRef<THREE.Group>(null!);
  const sphere = useRef<THREE.Mesh>(null!);
  const update = useGenie(body, index, count);
  const material = useMemo(
    () =>
      patchPlanetMaterial(
        new THREE.MeshStandardMaterial({ map, roughness, metalness: 0 }),
        patch
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [map, roughness]
  );

  useFrame((_, dt) => {
    update(group.current, dt);
    sphere.current.rotation.y += dt * 0.18;
  });

  return (
    <group ref={group}>
      <mesh ref={sphere} rotation={[0.1, 0, 0.08]} material={material}>
        <sphereGeometry args={[body.size, 48, 48]} />
      </mesh>
      {atmosphere && (
        <Atmosphere
          radius={body.size}
          color={atmosphere.color}
          intensity={atmosphere.intensity}
        />
      )}
      {children}
      <HitSphere body={body} factor={2.4} />
    </group>
  );
}

/** the garden world's independently rotating cloud deck — its living detail */
function CloudLayer({ radius }: { radius: number }) {
  const mesh = useRef<THREE.Mesh>(null!);
  const material = useMemo(
    () =>
      patchPlanetMaterial(
        new THREE.MeshStandardMaterial({
          map: cloudTexture(),
          transparent: true,
          roughness: 1,
          metalness: 0,
          depthWrite: false,
          opacity: 0.9,
        }),
        { wrap: 0.24 }
      ),
    []
  );
  useFrame((_, dt) => {
    mesh.current.rotation.y += dt * (reduced ? 0.012 : 0.05);
    material.opacity = 0.9 - smoothstep(hero.pS, 0.5, 1) * 0.5;
  });
  return (
    <mesh ref={mesh} rotation={[0.1, 1.7, 0.08]} material={material}>
      <sphereGeometry args={[radius * 1.018, 48, 48]} />
    </mesh>
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
      roughness={0.62} // seas and humid air catch a soft specular glint
      atmosphere={{ color: atmoColor, intensity: 0.5 }}
    >
      <CloudLayer radius={props.body.size} />
    </TexturedPlanet>
  );
}

function RockyPlanet(props: BodyProps) {
  const map = useMemo(
    () => rockyTexture(props.body.color, props.body.accent, 17),
    [props.body]
  );
  // the deployments world carries settlements — its night side glows
  const patch = useMemo<PlanetPatchOpts>(
    () =>
      props.body.id === "deployments"
        ? { nightLights: 1.1, nightColor: props.body.accent }
        : {},
    [props.body]
  );
  return (
    <TexturedPlanet
      {...props}
      map={map}
      patch={patch}
      atmosphere={{ color: props.body.accent, intensity: 0.3 }}
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

/** craggy nucleus: icosahedron with seeded radial displacement */
function nucleusGeometry(size: number): THREE.BufferGeometry {
  const g = new THREE.IcosahedronGeometry(size, 3);
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

/* ————— the comet: nucleus, coma, and a real double tail ————— */

const TAIL_SEGS = 26;
const DUST_GRAINS = 46;

/** a camera-facing ribbon strip: two vertices per segment, UV.v running
 *  head(0) → tip(1) so beamTexture fades it along its length. Positions are
 *  rebuilt every frame from a curve. */
function makeRibbonGeometry(segs: number): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  const pos = new Float32Array((segs + 1) * 2 * 3);
  const uv = new Float32Array((segs + 1) * 2 * 2);
  const idx: number[] = [];
  for (let i = 0; i <= segs; i++) {
    const v = i / segs;
    uv.set([0, v], i * 4);
    uv.set([1, v], i * 4 + 2);
    if (i < segs) {
      const a = i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

/**
 * C/2025 JD. The ion tail is a narrow blue ribbon streaming dead anti-sunward
 * with slow magnetotail kinks; the dust tail is a wide warm ribbon that curves
 * back along the orbit; loose grains drift down it. The whole display breathes
 * with solar distance — brightest and longest near perihelion — and folds away
 * as the comet docks.
 */
function Comet({ body, index, count }: BodyProps) {
  const group = useRef<THREE.Group>(null!);
  const nucleus = useRef<THREE.Mesh>(null!);
  const ice = useRef<THREE.Sprite>(null!);
  const coma = useRef<THREE.Sprite>(null!);
  const ionMesh = useRef<THREE.Mesh>(null!);
  const dustMesh = useRef<THREE.Mesh>(null!);
  const grains = useRef<THREE.Points>(null!);
  const update = useGenie(body, index, count);
  const { camera, size } = useThree();
  const glow = useMemo(() => glowTexture(), []);
  const beam = useMemo(() => beamTexture(), []);
  const star = useMemo(() => starTexture(), []);
  const rockGeom = useMemo(() => nucleusGeometry(body.size), [body.size]);
  const ionGeom = useMemo(() => makeRibbonGeometry(TAIL_SEGS), []);
  const dustGeom = useMemo(() => makeRibbonGeometry(TAIL_SEGS), []);
  const grainData = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(DUST_GRAINS * 3), 3)
    );
    g.setAttribute(
      "color",
      new THREE.BufferAttribute(new Float32Array(DUST_GRAINS * 3), 3)
    );
    const seed = Array.from({ length: DUST_GRAINS }, () => ({
      speed: 0.05 + Math.random() * 0.1,
      phase: Math.random(),
      j1: Math.random() - 0.5,
      j2: Math.random() - 0.5,
      tint: 0.4 + Math.random() * 0.6,
    }));
    return { g, seed };
  }, []);

  const antiSun = useMemo(() => new THREE.Vector3(), []);
  const tangent = useMemo(() => new THREE.Vector3(), []);
  const n1 = useMemo(() => new THREE.Vector3(), []);
  const n2 = useMemo(() => new THREE.Vector3(), []);
  const vA = useMemo(() => new THREE.Vector3(), []);
  const vB = useMemo(() => new THREE.Vector3(), []);
  const P = useMemo(() => new THREE.Vector3(), []);
  const Pn = useMemo(() => new THREE.Vector3(), []);
  const W = useMemo(() => new THREE.Vector3(), []);
  const camLocal = useMemo(() => new THREE.Vector3(), []);
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);

  useFrame((state, dt) => {
    const { e, scale } = update(group.current, dt);
    const t = reduced ? 8 : state.clock.elapsedTime;
    const live = (1 - e) * hero.intro;
    const sOrbit = orbitScale(size.width / size.height);

    // geometry of the moment: which way is away from the sun, which way
    // is the orbit heading — both from real positions, not approximations
    camLocal.copy(camera.position).sub(group.current.position).normalize();
    antiSun.copy(group.current.position).sub(sunWorld);
    if (antiSun.lengthSq() < 1e-6) antiSun.set(1, 0, 0);
    antiSun.normalize();
    // stage cheat: when the true anti-sun runs down the camera axis the tail
    // foreshortens into the coma — swing it part-way off-axis so the comet
    // always shows its plume without losing the away-from-the-sun sense
    antiSun.addScaledVector(camLocal, -antiSun.dot(camLocal) * 0.55).normalize();
    const theta = hero.theta.get(body.id) ?? body.phase;
    orbitPoint(body, theta, vA).multiplyScalar(sOrbit);
    orbitPoint(body, theta - 0.06, vB).multiplyScalar(sOrbit);
    tangent.copy(vA).sub(vB).normalize();
    n1.crossVectors(antiSun, up);
    if (n1.lengthSq() < 1e-6) n1.set(0, 0, 1);
    n1.normalize();
    n2.crossVectors(antiSun, n1);

    // activity: a sungrazer wakes up near perihelion, sleeps out far
    const rSun = group.current.position.distanceTo(sunWorld);
    const act = THREE.MathUtils.clamp(1.9 - rSun / (body.orbit * sOrbit), 0.7, 1.35);
    const L = ((7.2 * (1 - e) + 0.4) * act) / Math.max(scale, 0.0001);
    const sz = body.size;

    // curve definitions in group-local space (the group never rotates)
    const ionCurve = (s: number, out: THREE.Vector3) =>
      out
        .copy(antiSun)
        .multiplyScalar(s * L)
        .addScaledVector(n1, Math.sin(s * 6.5 - t * 2.4) * L * 0.045 * s)
        .addScaledVector(n2, Math.sin(s * 3.7 - t * 1.6 + 1.7) * L * 0.03 * s);
    const dustCurve = (s: number, out: THREE.Vector3) =>
      out
        .copy(antiSun)
        .multiplyScalar(s * L * 0.8)
        .addScaledVector(tangent, -(s * s) * L * 0.5)
        .addScaledVector(n1, Math.sin(s * 2.2 + t * 0.35) * L * 0.02 * s);

    const fillRibbon = (
      geom: THREE.BufferGeometry,
      curve: (s: number, out: THREE.Vector3) => THREE.Vector3,
      widthOf: (s: number) => number
    ) => {
      const pos = geom.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i <= TAIL_SEGS; i++) {
        const s = i / TAIL_SEGS;
        curve(s, P);
        if (i < TAIL_SEGS) {
          curve(s + 0.04, Pn).sub(P);
        } else {
          curve(s - 0.04, Pn);
          Pn.subVectors(P, Pn);
        }
        W.crossVectors(Pn, camLocal);
        if (W.lengthSq() < 1e-8) W.copy(n1);
        W.normalize().multiplyScalar(widthOf(s));
        pos.setXYZ(i * 2, P.x - W.x, P.y - W.y, P.z - W.z);
        pos.setXYZ(i * 2 + 1, P.x + W.x, P.y + W.y, P.z + W.z);
      }
      pos.needsUpdate = true;
    };

    fillRibbon(ionGeom, ionCurve, (s) => sz * (0.5 + 2.1 * s));
    fillRibbon(dustGeom, dustCurve, (s) => sz * (0.9 + 3.8 * s));
    (ionMesh.current.material as THREE.MeshBasicMaterial).opacity =
      Math.min(1, 0.8 * act) * live;
    (dustMesh.current.material as THREE.MeshBasicMaterial).opacity =
      Math.min(1, 0.5 * act) * live;

    // grains ride the dust curve outward, scattering wider as they go
    const gp = grainData.g.attributes.position as THREE.BufferAttribute;
    const gc = grainData.g.attributes.color as THREE.BufferAttribute;
    for (let i = 0; i < DUST_GRAINS; i++) {
      const sd = grainData.seed[i];
      const s = (sd.phase + t * sd.speed) % 1;
      dustCurve(s, P)
        .addScaledVector(n1, sd.j1 * sz * (0.5 + 3.0 * s))
        .addScaledVector(n2, sd.j2 * sz * (0.4 + 2.2 * s));
      gp.setXYZ(i, P.x, P.y, P.z);
      const fade = (1 - s) * sd.tint;
      gc.setXYZ(i, fade, fade * 0.93, fade * 0.8);
    }
    gp.needsUpdate = true;
    gc.needsUpdate = true;
    (grains.current.material as THREE.PointsMaterial).opacity = 0.85 * live * act;

    nucleus.current.rotation.x += dt * 0.4;
    nucleus.current.rotation.y += dt * 0.23;
    // coma: bright ice core wrapping the nucleus, wide envelope anti-sunward
    const comaP = (0.55 + 0.35 * act) * (1 - e * 0.9) * hero.intro;
    (ice.current.material as THREE.SpriteMaterial).opacity = comaP;
    ice.current.scale.setScalar(sz * 3.0 * (1 - e * 0.5) * (0.75 + 0.35 * act));
    coma.current.position.copy(antiSun).multiplyScalar(sz * 1.1 * (1 - e));
    (coma.current.material as THREE.SpriteMaterial).opacity =
      0.24 * act * (1 - e) * hero.intro;
    coma.current.scale.setScalar(sz * 8 * (1 - e * 0.5));
  });

  return (
    <group ref={group}>
      {/* icy nucleus — small and half-lost in its own coma, as it should be */}
      <mesh ref={nucleus} geometry={rockGeom} scale={0.55}>
        <meshStandardMaterial
          color="#9fb2c2"
          emissive={body.accent}
          emissiveIntensity={0.32}
          roughness={0.85}
          metalness={0.05}
        />
      </mesh>
      {/* bright inner coma + soft outer envelope */}
      <sprite ref={ice}>
        <spriteMaterial map={glow} color="#eaf6fb" transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <sprite ref={coma}>
        <spriteMaterial map={glow} color={body.accent} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      {/* the double tail — warm curved dust beneath, blue ion over it */}
      <mesh ref={dustMesh} geometry={dustGeom} frustumCulled={false}>
        <meshBasicMaterial map={beam} color="#e8d3a6" transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={ionMesh} geometry={ionGeom} frustumCulled={false}>
        <meshBasicMaterial map={beam} color="#a9d6ff" transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
      </mesh>
      <points ref={grains} geometry={grainData.g} frustumCulled={false}>
        <pointsMaterial
          map={star}
          size={body.size * 0.42}
          sizeAttenuation
          vertexColors
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      <HitSphere body={body} factor={4} />
    </group>
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
  const disk = useRef<THREE.Mesh>(null!);
  const jetMats = useRef<THREE.MeshBasicMaterial[]>([]);
  const coneMats = useRef<THREE.MeshBasicMaterial[]>([]);
  const update = useGenie(body, index, count);
  const glow = useMemo(() => glowTexture(), []);
  const beamMap = useMemo(() => beamTexture(), []);
  const diskMap = useMemo(() => ringTexture("#9fd0ff"), []);

  // a thin tapered jet and a wider, fainter search cone around it
  const jet = useMemo(() => {
    const H = 8;
    const g = new THREE.ConeGeometry(0.13, H, 16, 1, true);
    g.translate(0, H / 2, 0);
    return g;
  }, []);
  const cone = useMemo(() => {
    const H = 8;
    const g = new THREE.ConeGeometry(1.4, H, 20, 1, true);
    g.translate(0, H / 2, 0);
    return g;
  }, []);

  useFrame((state, dt) => {
    update(group.current, dt);
    const t = state.clock.elapsedTime;
    // sharp lighthouse pulse — a brief flash twice per rotation
    const flash = Math.pow(Math.max(0, Math.sin(t * 2.4)), 8);
    const dockDim = 1 - smoothstep(hero.pS, 0.5, 1); // jets gone in pill
    spin.current.rotation.y += dt * (reduced ? 0.5 : 2.6);
    jetMats.current.forEach((m) => {
      if (m) m.opacity = (0.32 + flash * 0.6) * hero.intro * dockDim;
    });
    coneMats.current.forEach((m) => {
      if (m) m.opacity = (0.04 + flash * 0.16) * hero.intro * dockDim;
    });
    core.current.scale.setScalar(1 + flash * 0.5);
    halo.current.scale.setScalar(body.size * (4 + flash * 5));
    (halo.current.material as THREE.SpriteMaterial).opacity = (0.45 + flash * 0.5) * hero.intro;
    if (disk.current) {
      disk.current.rotation.z += dt * 0.5;
      (disk.current.material as THREE.MeshBasicMaterial).opacity = 0.5 * hero.intro * dockDim;
    }
  });

  return (
    <group ref={group}>
      {/* dense neutron core — hot blue-white, blooms */}
      <mesh ref={core}>
        <sphereGeometry args={[body.size * 1.4, 32, 32]} />
        <meshBasicMaterial color="#eaf4ff" toneMapped={false} />
      </mesh>
      <sprite ref={halo}>
        <spriteMaterial map={glow} color="#aaccff" transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>

      {/* accretion disk — a tilted glowing ring in the equatorial plane */}
      <mesh ref={disk} rotation={[Math.PI / 2 - 0.35, 0, 0]} scale={body.size * 3.2}>
        <ringGeometry args={[0.5, 1.5, 64]} />
        <meshBasicMaterial map={diskMap} color="#9fd0ff" transparent opacity={0.5} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* magnetic axis tilted off the spin axis → the lighthouse sweep */}
      <group ref={spin}>
        <group rotation={[0.6, 0, 0.42]}>
          {[1, -1].map((d, i) => (
            <group key={i} rotation={[d > 0 ? 0 : Math.PI, 0, 0]}>
              {/* the bright thin jet */}
              <mesh geometry={jet}>
                <meshBasicMaterial
                  ref={(m) => { if (m) jetMats.current[i] = m; }}
                  map={beamMap}
                  color="#dcebff"
                  transparent
                  opacity={0}
                  depthWrite={false}
                  side={THREE.DoubleSide}
                  blending={THREE.AdditiveBlending}
                />
              </mesh>
              {/* the faint search cone of light around it */}
              <mesh geometry={cone}>
                <meshBasicMaterial
                  ref={(m) => { if (m) coneMats.current[i] = m; }}
                  map={beamMap}
                  color="#9fc4ff"
                  transparent
                  opacity={0}
                  depthWrite={false}
                  side={THREE.DoubleSide}
                  blending={THREE.AdditiveBlending}
                />
              </mesh>
            </group>
          ))}
        </group>
      </group>

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
  const coronaRing = useRef<THREE.Mesh>(null!);
  const prom1 = useRef<THREE.Mesh>(null!);
  const prom2 = useRef<THREE.Mesh>(null!);
  const flare = useRef<THREE.Sprite>(null!);
  const streak = useRef<THREE.Sprite>(null!);
  const light = useRef<THREE.PointLight>(null!);
  const update = useGenie(null, 0, count);
  const glow = useMemo(() => glowTexture(), []);
  const sunMat = useMemo(() => makeSunMaterial(), []);
  const coronaMat = useMemo(() => makeCoronaMaterial(), []);
  const streakMap = useMemo(() => streakTexture(), []);
  const haloBase = useMemo(() => new THREE.Color("#f4c87c"), []);
  const haloEmber = useMemo(() => new THREE.Color("#d9834a"), []);

  useFrame((state, dt) => {
    const { e } = update(group.current, dt);
    const t = state.clock.elapsedTime;
    sunWorld.copy(group.current.position); // patched materials track the star
    sunMat.uniforms.uTime.value = t;
    // docked, the star banks to an ember with a soft 1/f flicker
    const flick = reduced
      ? 1
      : 1 +
        (Math.sin(t * 8.3) * 0.3 + Math.sin(t * 3.7 + 1.3) * 0.45 + Math.sin(t * 17.9) * 0.25) *
          0.05 *
          e;
    sunMat.uniforms.uEmber.value = e * flick;
    surface.current.rotation.y += dt * 0.02;
    const breathe = reduced ? 1 : 1 + Math.sin(t * 0.8) * 0.04;
    // halos collapse harder into the pill so the docked star reads crisp
    halo.current.scale.setScalar(6.5 * breathe * (1 - e * 0.35));
    (halo.current.material as THREE.SpriteMaterial).color.copy(haloBase).lerp(haloEmber, e);
    (halo.current.material as THREE.SpriteMaterial).opacity =
      (0.8 - e * 0.74) * hero.intro * flick;
    // the flame corona: billboarded to the camera, alive in-shader, and
    // standing down as the star docks into the pill
    coronaMat.uniforms.uTime.value = reduced ? 12.4 : t;
    coronaMat.uniforms.uFade.value = (1 - e) * hero.intro;
    coronaRing.current.quaternion.copy(state.camera.quaternion);
    // prominences: two slow plasma arcs wheeling around the limb
    if (!reduced) {
      prom1.current.rotation.z = t * 0.05;
      prom2.current.rotation.z = -t * 0.037 + 2.1;
    }
    const promFade = (1 - e) * hero.intro;
    (prom1.current.material as THREE.MeshBasicMaterial).opacity = 0.34 * promFade * (0.8 + Math.sin(t * 0.9) * 0.2);
    (prom2.current.material as THREE.MeshBasicMaterial).opacity = 0.26 * promFade * (0.8 + Math.cos(t * 0.7) * 0.2);
    flare.current.scale.setScalar(19);
    (flare.current.material as THREE.SpriteMaterial).opacity = 0.1 * (1 - e) * hero.intro;
    streak.current.scale.set(24 * (reduced ? 1 : 1 + Math.sin(t * 0.7) * 0.08), 1.2, 1);
    (streak.current.material as THREE.SpriteMaterial).opacity = 0.18 * (1 - e) * hero.intro;
    // the point light eases off as it docks so it stops blowing out neighbours
    // (nearly out in the pill — DockFill carries the docked illumination)
    light.current.intensity = 420 * (1 - e * 0.94) * flick;
  });

  return (
    <group ref={group}>
      <mesh ref={surface} material={sunMat}>
        <icosahedronGeometry args={[1.55, 24]} />
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
      {/* living corona — radial flame teeth drawn in-shader; the plane is
          sized so the photosphere lands at r=0.5 of its UV space */}
      <mesh ref={coronaRing} material={coronaMat}>
        <planeGeometry args={[6.4, 6.4]} />
      </mesh>
      {/* prominence arcs riding just off the photosphere */}
      <mesh ref={prom1} rotation={[0.35, 0, 0]}>
        <torusGeometry args={[1.86, 0.028, 6, 48, 1.15]} />
        <meshBasicMaterial color="#ff9a4d" transparent opacity={0.3} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
      <mesh ref={prom2} rotation={[-0.5, 0.2, 0]}>
        <torusGeometry args={[1.98, 0.02, 6, 48, 0.85]} />
        <meshBasicMaterial color="#ffb668" transparent opacity={0.22} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
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
    light.current.intensity = 1.15 * smoothstep(hero.pS, 0.5, 0.95);
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
            intensity={0.46}
            luminanceThreshold={0.8}
            luminanceSmoothing={0.5}
            mipmapBlur
          />
        </EffectComposer>
      )}
      <Choreographer />
      {/* starlight only — the sun's point light owns the scene, so worlds
          carry real crescents and terminators instead of flat even fill */}
      <ambientLight intensity={0.13} color="#aab4cc" />
      <hemisphereLight intensity={0.08} color="#bcc8e0" groundColor="#1a1410" />
      <DockFill />
      <DeepSky />
      <ZodiacalLight />
      <Starfield />
      <Meteors />
      <Constellation />
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

"use client";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * The "living monitor" — the one screen in the Room that still glows with the
 * site itself, a window back into the world the visitor came from (the POV
 * reward). Fully self-contained: a 2D canvas is painted with the site's identity
 * (faux browser chrome, the name, the solar-system hero motif gently orbiting, a
 * drifting scanline) and used as an unlit (`meshBasicMaterial`) emissive screen —
 * no iframe, no cross-origin, no external fonts, so it can never break the build
 * or wash the scene. Redraws are throttled; the texture only updates a few times
 * a second.
 */
const W = 512;
const H = 288;

export default function LivingMonitor({
  width = 1.32,
  height = 0.74,
  ...props
}: { width?: number; height?: number } & React.ComponentProps<"mesh">) {
  const { canvas, ctx, texture } = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    return { canvas, ctx, texture };
  }, []);

  const last = useRef(0);

  const draw = (time: number) => {
    // background — near-black with a cool wash, the site's space-black
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#0a0e16");
    bg.addColorStop(1, "#05070c");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // ── faux browser chrome ──
    ctx.fillStyle = "#11151f";
    ctx.fillRect(0, 0, W, 26);
    const dots = ["#7a3b44", "#7a6a3b", "#3b7a52"];
    dots.forEach((c, i) => {
      ctx.beginPath();
      ctx.fillStyle = c;
      ctx.arc(16 + i * 16, 13, 4, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = "#1a2030";
    ctx.fillRect(72, 6, W - 88, 15);
    ctx.fillStyle = "#8aa0bf";
    ctx.font = "11px monospace";
    ctx.textBaseline = "middle";
    ctx.fillText("jafardabbagh.com", 84, 14);

    // ── solar-system hero motif, gently orbiting (the "live" tell) ──
    const cx = W / 2;
    const cy = 128;
    // sun
    const sun = ctx.createRadialGradient(cx, cy, 0, cx, cy, 26);
    sun.addColorStop(0, "#ffe6a8");
    sun.addColorStop(0.5, "#e9c46a");
    sun.addColorStop(1, "rgba(233,196,106,0)");
    ctx.fillStyle = sun;
    ctx.beginPath();
    ctx.arc(cx, cy, 26, 0, Math.PI * 2);
    ctx.fill();
    // orbits + planets
    const orbits = [
      { r: 46, speed: 0.6, size: 3.2, color: "#9fce8f" },
      { r: 68, speed: 0.38, size: 4.4, color: "#7fa0c4" },
      { r: 92, speed: 0.24, size: 2.6, color: "#e8e6e1" },
    ];
    ctx.lineWidth = 1;
    for (const o of orbits) {
      ctx.strokeStyle = "rgba(232,230,225,0.10)";
      ctx.beginPath();
      ctx.ellipse(cx, cy, o.r, o.r * 0.42, 0, 0, Math.PI * 2);
      ctx.stroke();
      const a = time * o.speed;
      const px = cx + Math.cos(a) * o.r;
      const py = cy + Math.sin(a) * o.r * 0.42;
      ctx.fillStyle = o.color;
      ctx.beginPath();
      ctx.arc(px, py, o.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── name + tagline ──
    ctx.textAlign = "center";
    ctx.fillStyle = "#f3efe6";
    ctx.font = "300 30px Georgia, 'Times New Roman', serif";
    ctx.fillText("JAFAR DABBAGH", cx, 218);
    ctx.fillStyle = "#9fce8f";
    ctx.font = "10px monospace";
    ctx.fillText("· T H E   S A N C T U M ·", cx, 244);
    // blinking caret to feel live
    if (Math.floor(time * 1.4) % 2 === 0) {
      ctx.fillStyle = "rgba(233,196,106,0.8)";
      ctx.fillRect(cx + 96, 236, 6, 12);
    }
    ctx.textAlign = "left";

    // ── drifting scanline + soft vignette ──
    const sy = ((time * 40) % (H + 40)) - 20;
    const scan = ctx.createLinearGradient(0, sy - 18, 0, sy + 18);
    scan.addColorStop(0, "rgba(143,166,196,0)");
    scan.addColorStop(0.5, "rgba(143,166,196,0.06)");
    scan.addColorStop(1, "rgba(143,166,196,0)");
    ctx.fillStyle = scan;
    ctx.fillRect(0, sy - 18, W, 36);
    const vig = ctx.createRadialGradient(cx, cy, 60, cx, cy, 300);
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);

    texture.needsUpdate = true;
  };

  // first paint immediately, then refresh a few times a second
  const inited = useRef(false);
  if (!inited.current) {
    inited.current = true;
    draw(0);
  }

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (t - last.current < 0.08) return; // ~12fps redraw — cheap
    last.current = t;
    draw(t);
  });

  return (
    <mesh {...props}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}

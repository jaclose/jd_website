"use client";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * The "living monitor" — the one screen in the Room that still glows with the
 * site itself: a faithful miniature of the jafardabbagh.com solar-system hero, a
 * window back into the world the visitor came from (the POV reward). Fully
 * self-contained — a 2D canvas is painted with the real hero composition (nebula,
 * the ringed sun with orbiting bodies, the name, the tagline, the HUD readout)
 * and used as an unlit emissive screen, so there's no iframe, no cross-origin and
 * no external fonts to break the build or wash the scene. Redraws are throttled.
 */
const W = 640;
const H = 360;

interface Body {
  r: number; // orbit radius (px, x)
  squash: number; // y/x ratio of the elliptical orbit
  speed: number;
  size: number;
  color: string;
  ring?: boolean;
  phase: number;
}

export default function LivingMonitor({
  width = 1.32,
  height = 0.74,
  ...props
}: { width?: number; height?: number } & React.ComponentProps<"mesh">) {
  const { canvas, ctx, texture, stars, bodies } = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    // deterministic starfield
    let s = 1337;
    const rand = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
    const stars = Array.from({ length: 220 }, () => ({
      x: rand() * W,
      y: rand() * H,
      r: rand() * 1.3 + 0.2,
      a: rand() * 0.6 + 0.2,
      tw: rand() * Math.PI * 2,
    }));
    const bodies: Body[] = [
      { r: 70, squash: 0.4, speed: 0.55, size: 6, color: "#8a8f9c", phase: 2.1 },
      { r: 108, squash: 0.42, speed: 0.33, size: 9, color: "#b98a55", ring: true, phase: 0.4 },
      { r: 150, squash: 0.4, speed: 0.22, size: 5, color: "#5566a0", phase: 3.7 },
      { r: 196, squash: 0.38, speed: 0.16, size: 7, color: "#7d7f86", phase: 1.2 },
    ];
    return { canvas, ctx, texture, stars, bodies };
  }, []);

  const last = useRef(0);
  const label = (text: string, x: number, y: number, color: string, size = 10, spacing = 2, align: CanvasTextAlign = "left") => {
    ctx.font = `${size}px ui-monospace, Menlo, monospace`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.letterSpacing = `${spacing}px`;
    ctx.fillText(text, x, y);
    ctx.letterSpacing = "0px";
  };

  const draw = (time: number) => {
    // ── deep space background ──
    ctx.fillStyle = "#06080d";
    ctx.fillRect(0, 0, W, H);

    // brown nebula band drifting across the top (like the hero)
    const drift = Math.sin(time * 0.05) * 16;
    for (let i = 0; i < 5; i++) {
      const nx = 120 + i * 130 + drift;
      const ny = 40 + (i % 2) * 26;
      const g = ctx.createRadialGradient(nx, ny, 0, nx, ny, 150);
      g.addColorStop(0, `rgba(150,110,70,${0.1 + (i % 2) * 0.05})`);
      g.addColorStop(1, "rgba(150,110,70,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, 150);
    }

    // starfield
    for (const st of stars) {
      ctx.globalAlpha = st.a * (0.6 + 0.4 * Math.sin(time * 1.5 + st.tw));
      ctx.fillStyle = "#cfd6e2";
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // big blue world easing in from the top-left corner
    const bw = ctx.createRadialGradient(20, 30, 10, 20, 30, 150);
    bw.addColorStop(0, "#2b3f6e");
    bw.addColorStop(0.7, "#16213c");
    bw.addColorStop(1, "rgba(22,33,60,0)");
    ctx.fillStyle = bw;
    ctx.beginPath();
    ctx.arc(20, 30, 150, 0, Math.PI * 2);
    ctx.fill();

    // ── the system: ringed sun + orbiting bodies (right of centre) ──
    const cx = W * 0.6;
    const cy = H * 0.52;
    // orbit lines
    ctx.lineWidth = 1;
    for (const b of bodies) {
      ctx.strokeStyle = "rgba(200,210,230,0.08)";
      ctx.beginPath();
      ctx.ellipse(cx, cy, b.r, b.r * b.squash, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    // the sun — corona + flat accretion disk through it
    const corona = ctx.createRadialGradient(cx, cy, 0, cx, cy, 64);
    corona.addColorStop(0, "#fff0c8");
    corona.addColorStop(0.35, "#f0b24e");
    corona.addColorStop(0.7, "#c8742a");
    corona.addColorStop(1, "rgba(200,116,42,0)");
    ctx.fillStyle = corona;
    ctx.beginPath();
    ctx.arc(cx, cy, 64, 0, Math.PI * 2);
    ctx.fill();
    const disk = ctx.createLinearGradient(cx - 150, cy, cx + 150, cy);
    disk.addColorStop(0, "rgba(214,170,110,0)");
    disk.addColorStop(0.5, "rgba(230,186,120,0.5)");
    disk.addColorStop(1, "rgba(214,170,110,0)");
    ctx.fillStyle = disk;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1, 0.12);
    ctx.beginPath();
    ctx.arc(0, 0, 150, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // sun core
    ctx.fillStyle = "#ffdf8e";
    ctx.beginPath();
    ctx.arc(cx, cy, 26, 0, Math.PI * 2);
    ctx.fill();

    // orbiting bodies
    for (const b of bodies) {
      const a = time * b.speed + b.phase;
      const px = cx + Math.cos(a) * b.r;
      const py = cy + Math.sin(a) * b.r * b.squash;
      if (b.ring) {
        ctx.strokeStyle = "rgba(200,180,140,0.7)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(px, py, b.size * 1.9, b.size * 0.7, -0.5, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(px, py, b.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── left-hand title block (mirrors the real hero) ──
    label("JD-1184 · A PERSONAL UNIVERSE", 30, 132, "rgba(180,176,166,0.7)", 10, 2.4);
    ctx.textAlign = "left";
    ctx.letterSpacing = "0px";
    ctx.fillStyle = "#f3efe6";
    ctx.font = "300 50px Georgia, 'Times New Roman', serif";
    ctx.fillText("Jafar", 28, 188);
    ctx.fillText("Dabbagh", 28, 236);
    ctx.fillStyle = "rgba(196,192,182,0.72)";
    ctx.font = "italic 13px Georgia, serif";
    ctx.fillText("Essays, field notes, and a Sanctum that", 30, 266);
    ctx.fillText("terraforms its planet — study, faith, presence.", 30, 284);
    label("HOVER A BODY TO SCAN — CLICK TO TRAVEL", 30, 312, "rgba(159,206,143,0.7)", 9, 1.8);

    // ── top-right HUD readout ──
    label("SOL 2026.06.26 · SYS JD-1184", W - 24, 30, "rgba(190,170,120,0.8)", 10, 1.6, "right");
    label("7 ESSAYS IN ORBIT · 3 DISPATCHES", W - 24, 48, "rgba(180,176,166,0.6)", 10, 1.6, "right");
    label("BIOSPHERE 27 PTS · VEG 100%", W - 24, 66, "rgba(180,176,166,0.6)", 10, 1.6, "right");
    label("ACHIEVEMENTS 5/8 ·", W - 132, 84, "rgba(180,176,166,0.6)", 10, 1.6, "right");
    label("ALL SYSTEMS NOMINAL", W - 24, 84, "rgba(159,206,143,0.9)", 10, 1.6, "right");

    // bottom-centre prompt + blinking caret
    label("SCROLL TO COLLAPSE THE SYSTEM", W / 2, H - 16, "rgba(150,150,150,0.55)", 9, 2, "center");
    ctx.textAlign = "left";

    // ── CRT polish: drifting scanline + vignette ──
    const sy = ((time * 50) % (H + 40)) - 20;
    const scan = ctx.createLinearGradient(0, sy - 20, 0, sy + 20);
    scan.addColorStop(0, "rgba(150,180,220,0)");
    scan.addColorStop(0.5, "rgba(150,180,220,0.05)");
    scan.addColorStop(1, "rgba(150,180,220,0)");
    ctx.fillStyle = scan;
    ctx.fillRect(0, sy - 20, W, 40);
    const vig = ctx.createRadialGradient(W / 2, H / 2, 120, W / 2, H / 2, 420);
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(1, "rgba(0,0,0,0.5)");
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

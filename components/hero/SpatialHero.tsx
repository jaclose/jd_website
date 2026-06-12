"use client";
import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { motion } from "framer-motion";
import SystemScene from "./SystemScene";
import NavBar from "./NavBar";
import HoverCard from "./HoverCard";
import { hero, setHovered, clamp01, smoothstep } from "./store";
import { gardenState } from "@/data/system";
import { essays, fieldNotes } from "@/lib/content";
import { unlockedCount, achievements } from "@/data/achievements";

/**
 * The spatial hero. A fixed full-viewport canvas hosts the JD-1184 system;
 * scrolling through the 175vh spacer below collapses the system into the
 * nav bar (and scrolling back up releases it). Pointer events pass through
 * the canvas — the scene raycasts from events bubbling on the page root.
 */
export default function SpatialHero() {
  const [root, setRoot] = useState<HTMLElement | null>(null);
  const [sol, setSol] = useState<string | null>(null);
  const title = useRef<HTMLDivElement>(null);
  const hint = useRef<HTMLDivElement>(null);
  const hud = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRoot(document.getElementById("page-root"));
    const d = new Date();
    setSol(
      `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`
    );

    const onScroll = () => {
      hero.p = clamp01(window.scrollY / (window.innerHeight * 0.82));
    };
    onScroll();
    hero.pS = hero.p; // no replay when landing mid-page
    window.addEventListener("scroll", onScroll, { passive: true });

    let raf = 0;
    const tick = () => {
      const fade = 1 - smoothstep(hero.pS, 0.02, 0.32);
      if (title.current) {
        title.current.style.opacity = String(fade);
        title.current.style.transform = `translateY(${hero.pS * -34}px)`;
      }
      if (hint.current) hint.current.style.opacity = String(fade);
      if (hud.current) hud.current.style.opacity = String(fade);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      {/* scroll runway for the collapse */}
      <div aria-hidden style={{ height: "175vh" }} />

      <div className="pointer-events-none fixed inset-0 z-40">
        {root && (
          <Canvas
            eventSource={root}
            eventPrefix="client"
            camera={{ fov: 38, position: [0, 7.5, 26], near: 0.1, far: 300 }}
            dpr={[1, 2]}
            gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
            onPointerMissed={() => setHovered(null)}
            style={{ pointerEvents: "none", background: "transparent" }}
          >
            <SystemScene />
          </Canvas>
        )}
      </div>

      {/* editorial title, lower left */}
      <div
        ref={title}
        className="pointer-events-none fixed bottom-[12vh] left-6 z-20 md:left-14"
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="label mb-4 text-starlight/80">
            JD-1184 · A PERSONAL UNIVERSE
          </p>
          <h1 className="font-display text-[clamp(2.8rem,8vw,6.5rem)] font-light leading-[0.95] tracking-tight text-ink">
            Jafar
            <br />
            Dabbagh
          </h1>
          <p className="mt-5 max-w-sm font-serif text-lg italic leading-relaxed text-faint">
            Essays, field notes, and a garden that terraforms its planet —
            dispatches from study, faith, and the battle to stay present.
          </p>
          <p className="label mt-6 !text-[9px] text-dim">
            HOVER A BODY TO SCAN — CLICK TO TRAVEL
          </p>
        </motion.div>
      </div>

      {/* mission HUD, upper right — live readings from the system */}
      <div
        ref={hud}
        className="pointer-events-none fixed right-6 top-6 z-20 hidden text-right md:right-14 md:block"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.4, delay: 1.1 }}
          className="space-y-1.5"
        >
          <p className="label !text-[9px] text-faint">
            {sol ? `SOL ${sol}` : " "} · SYS JD-1184
          </p>
          <p className="label !text-[9px] text-dim">
            {essays.length} ESSAYS IN ORBIT · {fieldNotes.length} DISPATCHES
          </p>
          <p className="label !text-[9px] text-dim">
            BIOSPHERE {gardenState.points} PTS · VEG{" "}
            {Math.round(gardenState.vegetation * 100)}%
          </p>
          <p className="label !text-[9px] text-dim">
            ACHIEVEMENTS {unlockedCount}/{achievements.length} ·{" "}
            <span className="text-leaf">ALL SYSTEMS NOMINAL</span>
          </p>
        </motion.div>
      </div>

      {/* scroll hint */}
      <div
        ref={hint}
        className="pointer-events-none fixed bottom-7 left-1/2 z-20 -translate-x-1/2"
      >
        <motion.div
          className="flex flex-col items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 1.6 }}
        >
          <span className="label !text-[9px] text-dim">
            SCROLL TO COLLAPSE THE SYSTEM
          </span>
          <motion.span
            className="block h-9 w-px bg-gradient-to-b from-starlight/70 to-transparent"
            animate={{ scaleY: [1, 0.55, 1], opacity: [0.9, 0.4, 0.9] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </div>

      <NavBar />
      <HoverCard />
    </>
  );
}

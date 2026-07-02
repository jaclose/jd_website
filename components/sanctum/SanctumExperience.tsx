"use client";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { gardenFeatureById } from "@/data/gardenFeatures";
import SanctumBuildStamp from "./SanctumBuildStamp";
import SanctumFallback from "./SanctumFallback";
import SanctumInspector from "./SanctumInspector";
import SanctumQuestTracker from "./SanctumQuestTracker";
import SanctumToasts from "./SanctumToasts";
import { useJourneyNav } from "./SanctumPathController";
import { detectQuality, resolveConfig } from "./SanctumQualityManager";
import { branchLabel } from "./lib/journey";
import { preloadZone } from "./lib/assets";
import { useProgress } from "./lib/progress";
import { pointerLook, sanctumAudio, sanctumControl } from "./lib/store";

const SanctumCanvas = dynamic(() => import("./SanctumCanvas"), { ssr: false });

function hasWebGL(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * Client entry for Sanctum. Detects device caps; falls back to the 2.5D still
 * for reduced-motion / no-WebGL; otherwise mounts the lazy canvas + a diegetic
 * overlay that mirrors the journey state machine (step forward, step through the
 * doorway, choose a fork, inspect a plaque). Pointer/touch position is bridged to
 * the camera rig for clamped look-around.
 */
export default function SanctumExperience({ id }: { id?: string } = {}) {
  const [ready, setReady] = useState(false);
  const [caps, setCaps] = useState<{ tier: ReturnType<typeof detectQuality>["tier"]; reducedMotion: boolean; webgl: boolean }>(
    { tier: "high", reducedMotion: false, webgl: true },
  );
  const stage = useRef<HTMLDivElement>(null);
  const nav = useJourneyNav();
  // lazy-mount: the heavy canvas only spins up once the section nears the viewport
  // (so it can live as a homepage section without taxing the landing paint), and
  // the frame loop pauses while it's scrolled away.
  const [near, setNear] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const q = detectQuality();
    // ?sanctumQuality=low|medium|high|ultra forces a tier (debugging / low-power).
    const forced = new URLSearchParams(window.location.search).get("sanctumQuality");
    const tier = (["low", "medium", "high", "ultra"].includes(forced ?? "") ? forced : q.tier) as typeof q.tier;
    setCaps({ tier, reducedMotion: q.reducedMotion, webgl: hasWebGL() });
    setReady(true);
    // look-around is on for everyone now: mouse drives it by hover, touch by drag.
    pointerLook.enabled = true;
    // restore quests / achievements / secrets from the last visit
    useProgress.getState().hydrate();
  }, []);

  useEffect(() => {
    if (!ready) return;
    const el = stage.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        setNear(e.isIntersecting);
        if (e.isIntersecting && !mounted) {
          setMounted(true);
          preloadZone("sanctum");
        }
      },
      { rootMargin: "300px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ready, mounted]);

  const config = useMemo(() => resolveConfig(caps.tier, caps.reducedMotion), [caps]);
  const fallback = caps.reducedMotion || !caps.webgl;

  // mouse looks by hover position; dragging (mouse or touch) turns. In free-roam
  // drag deltas feed the rig's true 360° heading; in guided mode touch-drag still
  // pans the clamped look cone.
  const drag = useRef<{ active: boolean; x: number; y: number }>({ active: false, x: 0, y: 0 });
  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointerLook.enabled || !stage.current) return;
    const r = stage.current.getBoundingClientRect();
    if (drag.current.active) {
      const dx = (e.clientX - drag.current.x) / r.width;
      const dy = (e.clientY - drag.current.y) / r.height;
      if (sanctumControl.freeRoam) {
        pointerLook.dragDX += dx;
        pointerLook.dragDY += dy;
      } else if (e.pointerType !== "mouse") {
        pointerLook.x = Math.max(-1, Math.min(1, pointerLook.x + dx * 2.4));
        pointerLook.y = Math.max(-1, Math.min(1, pointerLook.y + dy * 2.4));
      }
      drag.current.x = e.clientX;
      drag.current.y = e.clientY;
      return;
    }
    if (e.pointerType === "mouse") {
      pointerLook.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      pointerLook.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
    }
  };
  const onPointerDown = (e: React.PointerEvent) => {
    // mouse drags only while free-roaming (guided keeps plain hover + clicks);
    // touch/pen always drags.
    if (e.pointerType !== "mouse" || sanctumControl.freeRoam) {
      drag.current = { active: true, x: e.clientX, y: e.clientY };
    }
  };
  const onPointerUp = () => {
    drag.current.active = false;
  };
  const onPointerLeave = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse") {
      pointerLook.x = 0; // recentre on mouse-out; touch keeps where you turned
      pointerLook.y = 0;
    }
    drag.current.active = false;
  };

  // Walking takes inline control: free-roam on + page scroll/snap paused so
  // arrow keys and drag drive the scene, not the pager. The rig can also enter
  // free-roam itself (just start walking with WASD), so the overlay *subscribes*
  // to the control bridge instead of owning the state. Esc / "Exit walk" returns.
  const [walking, setWalking] = useState(false);
  const enterWalk = () => sanctumControl.setFreeRoam(true);
  const exitWalk = () => sanctumControl.setFreeRoam(false);
  useEffect(
    () =>
      sanctumControl.onFreeRoam((on) => {
        setWalking(on);
        sanctumControl.focused = on;
        if (on) window.__lenis?.stop();
        else window.__lenis?.start();
      }),
    [],
  );
  useEffect(() => {
    if (!walking) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") exitWalk();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [walking]);
  // release control if the section scrolls fully away (homepage) or unmounts
  useEffect(() => {
    if (walking && !near) exitWalk();
  }, [walking, near]);
  useEffect(() => () => {
    sanctumControl.setFreeRoam(false);
    sanctumControl.focused = false;
    window.__lenis?.start();
  }, []);

  const [soundOn, setSoundOn] = useState(false);
  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    sanctumAudio.on = next;
    if (next) sanctumAudio.resume(); // resume within the click gesture (autoplay policy)
    sanctumAudio.apply(next);
  };

  const inspected = gardenFeatureById(nav.inspectedFeatureId ?? undefined);

  // the single contextual "advance" affordance
  const primary = useMemo(() => {
    if (nav.moving) return null;
    if (nav.currentNode.id === "room") return { label: "Step toward the light", run: nav.stepForward };
    if (nav.currentNode.id === "threshold") return { label: "Step through the doorway", run: nav.stepForward };
    if (nav.forward) return { label: `Continue · ${nav.forward.label}`, run: () => nav.goTo(nav.forward!.id) };
    return null;
  }, [nav]);

  const locationLabel = nav.moving ? `Walking toward ${nav.targetNode.label}` : nav.currentNode.label;
  const zoneLabel =
    nav.zone === "room" ? "The Room of Entanglement" : nav.zone === "threshold" ? "The Threshold" : branchLabel(nav.currentNode.branch);

  // One stable <section id> for every state (loading / fallback / live). SectionSnap
  // registers its snap targets once by id, so the element must exist from the first
  // render (incl. SSR) and never be swapped out — that's the fix for "won't snap /
  // not updating on the dashboard". `touch-none` is applied only while walking so
  // it never traps mobile page-scroll when you're just passing the section.
  return (
    <section
      ref={stage}
      id={id}
      onPointerMove={onPointerMove}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
      className={`relative h-svh w-full overflow-hidden bg-space-deep ${walking ? "touch-none" : ""}`}
    >
      {!ready ? null : fallback ? (
        <>
          <SanctumFallback
            reducedMotion={caps.reducedMotion}
            reason={caps.webgl ? "Reduced-motion mode · a still of the walk" : "WebGL unavailable · a still of the walk"}
          />
          <SanctumBuildStamp />
        </>
      ) : (
        <>
      <div className="absolute inset-0">
        {mounted ? (
          <SanctumCanvas
            config={config}
            zone={nav.zone}
            targetNodeId={nav.targetNodeId}
            moving={nav.moving}
            started={nav.started}
            active={near}
            onArrive={nav.arrive}
            onInspect={nav.inspect}
          />
        ) : null}
      </div>

      {/* title / location */}
      <div className="pointer-events-none absolute left-5 top-24 z-20 max-w-[min(86vw,440px)] md:left-10">
        <p className="label mb-3 text-leaf/80 [text-shadow:0_1px_10px_rgba(3,8,5,0.9)]">A place between disorder and restoration</p>
        <h1 className="font-display text-[clamp(2.1rem,4.6vw,3.9rem)] font-light leading-none text-ink [text-shadow:0_2px_22px_rgba(3,8,5,0.95)]">
          The Sanctum
        </h1>
        <p className="label mt-3 text-[8px]! tracking-[0.22em]! text-leaf/65 [text-shadow:0_1px_8px_rgba(3,8,5,0.9)]">
          {zoneLabel === locationLabel ? zoneLabel : `${zoneLabel} · ${locationLabel}`}
        </p>
      </div>

      {/* top-right control cluster: walk handoff + spatial ambience toggle */}
      <div className="absolute right-5 top-16 z-30 flex items-center gap-2">
        {nav.zone === "sanctum" ? (
          <button
            type="button"
            onClick={walking ? exitWalk : enterWalk}
            className={`border px-3 py-1.5 font-mono text-[0.62rem] uppercase tracking-[0.18em] backdrop-blur-md transition-colors ${
              walking
                ? "border-leaf/55 bg-leaf/15 text-ink"
                : "border-hairline bg-[rgba(5,10,7,0.6)] text-leaf/85 hover:border-leaf/50 hover:text-ink"
            }`}
            aria-label={walking ? "Exit free walk" : "Walk here freely"}
          >
            {walking ? "Exit walk" : "Walk here"}
          </button>
        ) : null}
        <button
          type="button"
          onClick={toggleSound}
          className="border border-hairline bg-[rgba(5,10,7,0.6)] px-3 py-1.5 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-leaf/85 backdrop-blur-md transition-colors hover:border-leaf/50 hover:text-ink"
          aria-label={soundOn ? "Turn ambience off" : "Turn ambience on"}
        >
          {soundOn ? "Sound ◼" : "Sound ◻"}
        </button>
      </div>

      {/* framing corners */}
      {["left-4 top-20 border-l border-t", "right-4 top-20 border-r border-t", "left-4 bottom-4 border-l border-b", "right-4 bottom-4 border-r border-b"].map(
        (pos) => (
          <span key={pos} aria-hidden className={`pointer-events-none absolute z-20 h-5 w-5 border-leaf/30 ${pos}`} />
        ),
      )}

      {/* control dock */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${nav.currentNodeId}-${nav.targetNodeId}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.3 }}
          className="absolute bottom-8 left-1/2 z-20 w-[min(94vw,640px)] -translate-x-1/2 border border-hairline bg-[rgba(5,10,7,0.78)] p-3 shadow-[0_18px_70px_rgba(0,0,0,0.42)] backdrop-blur-md md:bottom-10"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="label text-[7px]! tracking-[0.22em]! text-leaf/75">{nav.moving ? "Moving" : zoneLabel}</p>
              <p className="mt-1 truncate font-mono text-sm text-ink">{locationLabel}</p>
              <p className="mt-1 hidden font-mono text-[0.6rem] text-faint md:block">
                {walking
                  ? "WASD walk · Shift run · drag or ←→ turn · Esc rejoin trail"
                  : nav.zone === "sanctum"
                    ? "WASD to wander off-trail · cursor looks · markers open plaques"
                    : "cursor looks around"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {primary ? (
                <button
                  type="button"
                  onClick={primary.run}
                  className="border border-leaf/45 bg-leaf/10 px-4 py-2 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-ink shadow-[0_0_28px_rgba(159,206,143,0.18)] transition-colors hover:bg-leaf/20"
                >
                  {primary.label}
                </button>
              ) : null}

              {!nav.moving && nav.atFork
                ? nav.choices.map((choice) => (
                    <button
                      key={choice.id}
                      type="button"
                      onClick={() => nav.goTo(choice.id)}
                      className="border border-[rgba(232,230,225,0.14)] px-3 py-2 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-leaf/90 transition-colors hover:border-leaf/50 hover:text-ink"
                    >
                      {branchLabel(choice.branch)}
                    </button>
                  ))
                : null}

              {!nav.moving && nav.currentNode.featureId ? (
                <button
                  type="button"
                  onClick={() => nav.inspect(nav.currentNode.featureId!)}
                  className="border border-[rgba(232,230,225,0.14)] px-3 py-2 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-faint transition-colors hover:border-leaf/40 hover:text-ink"
                >
                  Inspect Plaque
                </button>
              ) : null}

              {!nav.moving && nav.back ? (
                <button
                  type="button"
                  onClick={() => nav.goTo(nav.back!.id)}
                  className="border border-transparent px-2 py-2 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-dim transition-colors hover:text-leaf"
                >
                  Backtrack
                </button>
              ) : null}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* the game layer: quest log + achievement toasts */}
      <SanctumQuestTracker visible={nav.zone === "sanctum"} />
      <SanctumToasts />

      <SanctumInspector feature={inspected} onClose={() => nav.inspect(null)} />
      <SanctumBuildStamp />
        </>
      )}
    </section>
  );
}

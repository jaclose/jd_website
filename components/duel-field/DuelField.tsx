"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
} from "framer-motion";
import { deployments, type Deployment } from "@/data/deployments";
import { DuelStarfield } from "./DuelStarfield";
import { DuelFieldBoard } from "./DuelFieldBoard";
import { DuelCard } from "./DuelCard";
import { DuelInspectPanel } from "./DuelInspectPanel";

type DuelPhase = "rest" | "hand" | "field";

/* ————— Soft procedural audio cue (no file assets) ————— */
function blip(kind: "draw" | "summon") {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    const t = ctx.currentTime;
    if (kind === "draw") {
      o.type = "sine";
      o.frequency.setValueAtTime(440, t);
      o.frequency.exponentialRampToValueAtTime(880, t + 0.16);
      g.gain.setValueAtTime(0.05, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
    } else {
      o.type = "triangle";
      o.frequency.setValueAtTime(200, t);
      o.frequency.exponentialRampToValueAtTime(52, t + 0.26);
      g.gain.setValueAtTime(0.14, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.36);
    }
    o.start();
    o.stop(t + 0.4);
    setTimeout(() => ctx.close(), 700);
  } catch {
    /* audio blocked — silent is fine */
  }
}

function CardBack({ style, className }: { style?: React.CSSProperties; className?: string }) {
  return (
    <div
      style={style}
      className={`absolute h-full w-full rounded-[12px] border-2 border-[rgba(212,184,134,0.34)] bg-[linear-gradient(160deg,#0d1322,#070b12)] shadow-[0_16px_44px_rgba(0,0,0,0.6)] ${className ?? ""}`}
    >
      <div className="absolute inset-2 rounded-[8px] border border-[rgba(212,184,134,0.16)]" />
      <svg viewBox="0 0 60 60" className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2">
        <g transform="translate(30 30)" fill="none" stroke="#d4b886" strokeWidth="1.2" opacity="0.85">
          <circle r="13" />
          <circle r="13" cx="5.5" cy="-2.5" stroke="#070b12" strokeWidth="3" />
        </g>
        <circle cx="44" cy="16" r="1.6" fill="#d4b886" opacity="0.85" />
      </svg>
    </div>
  );
}

export default function DeploymentsDeck() {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<DuelPhase>(reduce ? "field" : "rest");
  const [revealed, setRevealed] = useState<boolean>(!!reduce);
  const [shake, setShake] = useState(false);
  const [summonGlow, setSummonGlow] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [summoning, setSummoning] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [seizureAck, setSeizureAck] = useState(true); // assume acked until checked
  const fieldRef = useRef<HTMLDivElement>(null);

  const hand = deployments;
  const active = hand[0];

  // Track mouse position for cursor-aware effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // photosensitivity notice — shown once, then remembered
  useEffect(() => {
    try {
      setSeizureAck(!!localStorage.getItem("jd1184-duel-ack"));
    } catch {
      /* private mode — show it, harmless */
      setSeizureAck(false);
    }
  }, []);
  const ackSeizure = () => {
    setSeizureAck(true);
    try {
      localStorage.setItem("jd1184-duel-ack", "1");
    } catch {
      /* ignore */
    }
  };

  // after a beat at rest, invite the visitor to draw
  useEffect(() => {
    if (phase !== "rest" || reduce) {
      setShowPrompt(false);
      return;
    }
    const t = setTimeout(() => setShowPrompt(true), 4200);
    return () => clearTimeout(t);
  }, [phase, reduce]);

  const draw = () => {
    blip("draw");
    setPhase("hand");
  };

  const summon = () => {
    blip("summon");
    setSummoning(true);
    setPhase("field");

    // The landing uses a soft glow and brief shake, avoiding a bright flash.
    setTimeout(() => {
      setSummonGlow(true);
      setShake(true);
      setTimeout(() => setSummonGlow(false), 900);
      setTimeout(() => {
        setShake(false);
        setSummoning(false);
      }, 460);
    }, 540);
  };

  const reset = () => {
    setRevealed(false);
    setPhase("rest");
    setSummonGlow(false);
    setSummoning(false);
  };

  return (
    <section
      id="deployments"
      className="biome-archive relative flex min-h-svh w-full items-center justify-center overflow-hidden"
    >
      <style>{`
        @keyframes dep-shake {
          0%, 100% { transform: translate(0, 0); }
          20% { transform: translate(-6px, 3px); }
          40% { transform: translate(6px, -2px); }
          60% { transform: translate(-4px, 2px); }
          80% { transform: translate(3px, -1px); }
        }
      `}</style>

      {/* Dynamic starfield background */}
      <DuelStarfield
        active={phase !== "rest"}
        mouseX={mousePos.x}
        mouseY={mousePos.y}
      />

      {/* Heading */}
      <div className="pointer-events-none absolute left-6 top-20 z-20 md:left-12">
        <p className="label mb-2 text-starlight/70 [text-shadow:0_1px_10px_rgba(0,0,0,0.9)]">
          DEPLOYMENTS · SHIPPED BUILDS
        </p>
        <h2 className="font-display text-[clamp(2rem,5vw,4rem)] font-light leading-none text-ink [text-shadow:0_2px_20px_rgba(0,0,0,0.95)]">
          The Duel Field
        </h2>
        <p className="label mt-2 text-[8px]! tracking-[0.26em]! text-dim">
          {phase === "rest"
            ? "DRAW TO BEGIN"
            : phase === "hand"
              ? "SUMMON THE BUILD"
              : "DEPLOYED · CLICK TO INSPECT"}
        </p>
      </div>

      {/* Play area */}
      <div
        ref={fieldRef}
        className="absolute inset-0 z-10"
        style={shake ? { animation: "dep-shake 0.45s ease-in-out" } : undefined}
      >
        {/* The game board */}
        <DuelFieldBoard
          active={phase !== "rest"}
          mouseX={mousePos.x}
          mouseY={mousePos.y}
          summoning={summoning}
        />

        {/* Summon glow effect */}
        <AnimatePresence>
          {summonGlow && (
            <motion.span
              aria-hidden
              initial={{ opacity: 0, scale: 0.72 }}
              animate={{ opacity: [0, 0.24, 0], scale: [0.72, 1.12, 1.55] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              className="pointer-events-none absolute left-1/2 top-[46%] h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(212,184,134,0.24)] bg-[radial-gradient(circle,rgba(212,184,134,0.24),rgba(127,212,232,0.08)_42%,transparent_68%)] blur-md"
            />
          )}
        </AnimatePresence>

        {/* Draw invitation — appears after a beat, points to the deck */}
        <AnimatePresence>
          {phase === "rest" && showPrompt && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12, transition: { duration: 0.3 } }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-none absolute left-1/2 top-[39%] z-30 -translate-x-1/2 text-center"
            >
              <motion.div animate={{ y: [0, -7, 0] }} transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}>
                <p className="label text-[8px]! tracking-[0.34em]! text-starlight/70">A BUILD AWAITS THE FIELD</p>
                <p className="mt-2 font-display text-[clamp(1.6rem,3vw,2.4rem)] font-light text-ink [text-shadow:0_2px_18px_rgba(0,0,0,0.9)]">
                  Draw the card
                </p>
                <p className="label mt-2 text-[8px]! tracking-[0.3em]! text-dim">FROM THE DECK, LOWER-RIGHT ↘</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Deck pile */}
        <AnimatePresence>
          {phase === "rest" && (
            <motion.button
              type="button"
              onClick={draw}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={{ y: -5 }}
              aria-label={`Draw the ${active?.name} card`}
              className="group absolute bottom-[10%] right-[8%] z-20 h-[clamp(11rem,22vw,15rem)] w-[clamp(8rem,16vw,11rem)] cursor-pointer"
            >
              <CardBack style={{ transform: "rotate(-7deg) translate(7px,7px)" }} />
              <CardBack style={{ transform: "rotate(-3deg) translate(3px,3px)" }} />
              <CardBack className="transition-transform duration-300 group-hover:-translate-y-1.5" />
              <span className="label absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px]! tracking-[0.3em]! text-starlight/85">
                DRAW ↑
              </span>
              <span className="label absolute -top-6 left-1/2 -translate-x-1/2 text-[7px]! text-dim">
                {hand.length} IN DECK
              </span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Active card */}
        {active && phase !== "rest" && (
          <motion.div
            initial={
              reduce
                ? false
                : { x: 0, y: -480, rotateZ: -3, scale: 0.7, opacity: 0 }
            }
            animate={
              phase === "field"
                ? { x: 0, y: 0, rotateZ: 0, scale: [0.7, 1.16, 1.02], opacity: 1 }
                : { x: 0, y: 150, rotateZ: 0, scale: 0.82, opacity: 1 }
            }
            transition={
              reduce
                ? { duration: 0 }
                : phase === "field"
                  ? { duration: 0.78, ease: [0.5, 0, 0.2, 1], times: [0, 0.7, 1] }
                  : { type: "spring", stiffness: 150, damping: 16 }
            }
            className="absolute left-1/2 top-[46%] z-30 h-[clamp(13rem,26vw,18rem)] w-[clamp(9.5rem,19vw,13rem)] -translate-x-1/2 -translate-y-1/2 cursor-pointer"
            onClick={() => (phase === "hand" ? summon() : setRevealed((v) => !v))}
            role="button"
            aria-label={
              phase === "hand" ? `Summon ${active.name}` : `Inspect ${active.name}`
            }
          >
            <DuelCard
              deployment={active}
              tilt={phase === "field"}
              mouseX={mousePos.x}
              mouseY={mousePos.y}
            />
            {phase === "hand" && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="label absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px]! tracking-[0.3em]! text-starlight/85"
              >
                CLICK TO SUMMON ↑
              </motion.span>
            )}
          </motion.div>
        )}

        {/* Inspection panel */}
        {active && (
          <DuelInspectPanel deployment={active} visible={phase === "field" && revealed} />
        )}

        {/* Hint for deployed card */}
        {phase === "field" && !revealed && (
          <span className="label absolute bottom-[8%] left-1/2 -translate-x-1/2 text-[8px]! tracking-[0.3em]! text-starlight/70">
            CLICK THE CARD TO INSPECT
          </span>
        )}
      </div>

      {/* Photosensitivity notice — once, then remembered */}
      <AnimatePresence>
        {!seizureAck && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.5 }}
            className="absolute bottom-6 left-1/2 z-50 flex max-w-[92vw] -translate-x-1/2 items-center gap-3 rounded-md border border-hairline bg-[rgba(6,9,15,0.94)] px-4 py-2.5 backdrop-blur-md"
          >
            <span aria-hidden className="text-starlight/80">⚠</span>
            <p className="label text-[7.5px]! tracking-[0.16em]! text-faint">
              BRIEF FLASHING LIGHT IN THIS SCENE · PHOTOSENSITIVITY NOTICE
            </p>
            <button
              type="button"
              onClick={ackSeizure}
              className="label shrink-0 text-[8px]! tracking-[0.24em]! text-starlight transition-colors hover:text-ink"
            >
              GOT IT ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="absolute bottom-6 left-6 z-40 flex items-center gap-5 md:left-12">
        <p className="label text-[8px]! text-dim">ONE BUILD ON THE FIELD · MORE SHIP IN TIME</p>
        {phase !== "rest" && !reduce && (
          <button
            type="button"
            onClick={reset}
            className="label text-[8px]! tracking-[0.26em]! text-dim transition-colors hover:text-starlight"
          >
            ⟲ RETURN TO DECK
          </button>
        )}
      </div>
    </section>
  );
}

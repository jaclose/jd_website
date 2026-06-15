"use client";
import { useMemo, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import { deployments, type Deployment } from "@/data/deployments";

/* ————— soft procedural cue (no audio assets) ————— */
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

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ————— the night-sky duel field (procedural; swaps to a real image
   the moment one is dropped at /public/cards/duel-field.jpg) ————— */
function NightSkyField({ live }: { live: boolean }) {
  const lights = useMemo(() => {
    const rnd = mulberry32(71);
    return Array.from({ length: 120 }, () => {
      const edge = rnd();
      // ring the perimeter, denser toward the top (skyline)
      const x = rnd() * 100;
      const y = edge < 0.55 ? rnd() * 42 : 58 + rnd() * 42;
      const warm = rnd() > 0.45;
      return {
        x,
        y,
        s: 0.4 + rnd() * 1.8,
        o: 0.2 + rnd() * 0.6,
        c: warm ? "#e8c074" : "#7fd4e8",
        beam: rnd() > 0.9,
      };
    });
  }, []);
  return (
    <div className="absolute inset-0 overflow-hidden bg-[radial-gradient(ellipse_at_50%_-10%,#1a2740,#0a1020_45%,#04060c_80%)]">
      {/* distant skyline lights */}
      {lights.map((l, i) => (
        <span
          key={i}
          aria-hidden
          className="absolute rounded-full"
          style={{
            left: `${l.x}%`,
            top: `${l.y}%`,
            width: `${l.s}px`,
            height: l.beam ? `${l.s * 26}px` : `${l.s}px`,
            background: l.c,
            opacity: l.o * (live ? 1 : 0.6),
            boxShadow: `0 0 ${l.s * 5}px ${l.c}`,
          }}
        />
      ))}

      {/* the arena floor — a tilted card-zone grid */}
      <div className="absolute left-1/2 top-[54%] -translate-x-1/2 -translate-y-1/2" style={{ perspective: 1500 }}>
        <div
          className="relative grid grid-cols-5 grid-rows-4 gap-[1.4%] rounded-[30px] border border-[rgba(160,180,220,0.22)] bg-[linear-gradient(180deg,rgba(24,34,56,0.6),rgba(8,12,22,0.85))] p-[2.2%] shadow-[0_60px_120px_rgba(0,0,0,0.7)]"
          style={{ width: "min(78vw,1040px)", height: "min(52vw,680px)", transform: "rotateX(58deg)" }}
        >
          {Array.from({ length: 20 }, (_, i) => {
            const isMonsterCenter = i === 12; // row 2 (from front), centre column
            return (
              <div
                key={i}
                className="rounded-[6px] border"
                style={{
                  borderColor: isMonsterCenter ? "rgba(212,184,134,0.55)" : "rgba(120,150,200,0.14)",
                  background: isMonsterCenter
                    ? "radial-gradient(circle,rgba(212,184,134,0.18),transparent 70%)"
                    : "linear-gradient(180deg,rgba(40,56,86,0.18),rgba(10,16,28,0.25))",
                  boxShadow: isMonsterCenter ? "inset 0 0 30px rgba(212,184,134,0.25)" : "none",
                }}
              />
            );
          })}
          {/* centre medallion */}
          <span aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 h-[34%] w-[34%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(160,180,220,0.18)] bg-[radial-gradient(circle,rgba(60,80,120,0.16),transparent_70%)]" />
        </div>
      </div>

      {/* atmospheric vignette */}
      <span aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,transparent_40%,rgba(2,4,8,0.85))]" />
    </div>
  );
}

/* ————— the card — an original frame with a tinge of the duel game ————— */
function DuelCard({ d, tilt }: { d: Deployment; tilt?: boolean }) {
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 200, damping: 18 });
  const sry = useSpring(ry, { stiffness: 200, damping: 18 });
  const glareX = useTransform(sry, [-12, 12], ["0%", "100%"]);
  const glareY = useTransform(srx, [12, -12], ["0%", "100%"]);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!tilt) return;
    const r = e.currentTarget.getBoundingClientRect();
    ry.set(((e.clientX - r.left) / r.width - 0.5) * 18);
    rx.set(-((e.clientY - r.top) / r.height - 0.5) * 18);
  };

  return (
    <motion.div
      onPointerMove={onMove}
      onPointerLeave={() => {
        rx.set(0);
        ry.set(0);
      }}
      style={tilt ? { rotateX: srx, rotateY: sry, transformPerspective: 1000 } : undefined}
      className="group relative h-full w-full rounded-[12px] border-2 border-[rgba(212,184,134,0.5)] bg-[linear-gradient(160deg,#12182a,#0a0e18)] p-2 shadow-[0_24px_70px_rgba(0,0,0,0.7)]"
    >
      {d.rarity !== "common" && (
        <span aria-hidden className="pointer-events-none absolute -inset-1 rounded-[16px] bg-[radial-gradient(circle_at_50%_30%,rgba(120,110,200,0.4),transparent_70%)] opacity-60 blur-md" />
      )}
      <div className="relative flex h-full flex-col [transform-style:preserve-3d]">
        {/* name bar + attribute */}
        <div className="flex items-center justify-between gap-2 px-0.5" style={{ transform: "translateZ(12px)" }}>
          <h3 className="truncate font-display text-[clamp(0.9rem,1.4vw,1.2rem)] font-light leading-none text-ink">{d.name}</h3>
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-[rgba(212,184,134,0.6)] bg-[rgba(212,184,134,0.12)] text-[7px] text-starlight" title={d.attribute}>
            ☾
          </span>
        </div>
        {/* level stars */}
        <div className="mt-1 flex justify-end gap-0.5 px-0.5" style={{ transform: "translateZ(10px)" }}>
          {Array.from({ length: d.level }, (_, i) => (
            <span key={i} className="text-[0.6rem] leading-none text-starlight">◈</span>
          ))}
        </div>
        {/* art window */}
        <div className="relative mt-1.5 aspect-square w-full overflow-hidden rounded-[4px] border border-[rgba(212,184,134,0.3)] bg-[#05080f]" style={{ transform: "translateZ(16px)" }}>
          {d.art ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={d.art} alt={d.name} className="h-full w-full object-contain" />
          ) : null}
          <span className="label absolute left-1.5 top-1.5 text-[5px]! tracking-[0.2em]! text-starlight/80">{d.rarity.toUpperCase()}</span>
        </div>
        {/* type line */}
        <p className="label mt-1.5 border-y border-[rgba(212,184,134,0.25)] py-1 text-[6.5px]! tracking-[0.12em]! text-starlight/90" style={{ transform: "translateZ(8px)" }}>
          [ {d.cardType.toUpperCase()} ]
        </p>
        {/* effect box */}
        <p className="mt-1.5 font-serif text-[0.62rem] italic leading-tight text-faint">{d.effect}</p>
        {/* atk/def-style footer */}
        <div className="mt-auto flex items-end justify-end gap-3 border-t border-[rgba(212,184,134,0.2)] pt-1" style={{ transform: "translateZ(8px)" }}>
          <span className="label text-[6px]! text-dim">
            BUILD <span className="text-starlight">{d.stats.version}</span>
          </span>
          <span className="label text-[6px]! text-dim">
            <span className="text-ink">{d.stats.platform}</span>
          </span>
        </div>
      </div>

      {/* holographic foil */}
      {d.rarity !== "common" && (
        <>
          <motion.span aria-hidden style={{ left: glareX, top: glareY }} className="pointer-events-none absolute h-[150%] w-[150%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(180,170,240,0.3),transparent_55%)] opacity-0 mix-blend-screen transition-opacity duration-300 group-hover:opacity-100" />
          <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[12px] bg-[linear-gradient(115deg,transparent_28%,rgba(127,212,232,0.18)_44%,rgba(180,150,236,0.22)_50%,rgba(212,184,134,0.18)_56%,transparent_70%)] bg-[length:300%_100%] opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-hover:[animation:dep-foil_2.4s_linear_infinite]" />
        </>
      )}
    </motion.div>
  );
}

function CardBack({ style, className }: { style?: React.CSSProperties; className?: string }) {
  return (
    <div style={style} className={`absolute h-full w-full rounded-[12px] border-2 border-[rgba(212,184,134,0.34)] bg-[linear-gradient(160deg,#0d1322,#070b12)] shadow-[0_16px_44px_rgba(0,0,0,0.6)] ${className ?? ""}`}>
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
  const [phase, setPhase] = useState<"rest" | "hand" | "field">(reduce ? "field" : "rest");
  const [revealed, setRevealed] = useState<boolean>(!!reduce);
  const [shake, setShake] = useState(false);
  const [flash, setFlash] = useState(false);
  const hand = deployments;
  const active = hand[0];
  const fieldRef = useRef<HTMLDivElement>(null);

  const draw = () => {
    blip("draw");
    setPhase("hand");
  };
  const summon = () => {
    blip("summon");
    setPhase("field");
    // the slam: a flash + a brief field shake as it lands in the centre zone
    setTimeout(() => {
      setFlash(true);
      setShake(true);
      setTimeout(() => setFlash(false), 220);
      setTimeout(() => setShake(false), 460);
    }, 540);
  };
  const reset = () => {
    setRevealed(false);
    setPhase("rest");
  };

  return (
    <section
      id="deployments"
      className="biome-archive relative flex min-h-svh w-full items-center justify-center overflow-hidden"
    >
      <style>{`@keyframes dep-foil{0%{background-position:0% 0}100%{background-position:300% 0}}
        @keyframes dep-shake{0%,100%{transform:translate(0,0)}20%{transform:translate(-6px,3px)}40%{transform:translate(6px,-2px)}60%{transform:translate(-4px,2px)}80%{transform:translate(3px,-1px)}}`}</style>

      <NightSkyField live={phase !== "rest"} />

      {/* heading */}
      <div className="pointer-events-none absolute left-6 top-20 z-20 md:left-12">
        <p className="label mb-2 text-starlight/70 [text-shadow:0_1px_10px_rgba(0,0,0,0.9)]">DEPLOYMENTS · SHIPPED BUILDS</p>
        <h2 className="font-display text-[clamp(2rem,5vw,4rem)] font-light leading-none text-ink [text-shadow:0_2px_20px_rgba(0,0,0,0.95)]">
          The Duel Field
        </h2>
        <p className="label mt-2 text-[8px]! tracking-[0.26em]! text-dim">
          {phase === "rest" ? "DRAW TO BEGIN" : phase === "hand" ? "SUMMON THE BUILD" : "DEPLOYED · CLICK TO INSPECT"}
        </p>
      </div>

      {/* the play area (shakes on summon) */}
      <div
        ref={fieldRef}
        className="absolute inset-0 z-10"
        style={shake ? { animation: "dep-shake 0.45s ease-in-out" } : undefined}
      >
        {/* summon flash */}
        <AnimatePresence>
          {flash && (
            <motion.span
              aria-hidden
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute left-1/2 top-[46%] h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(212,184,134,0.7),transparent_60%)] blur-xl"
            />
          )}
        </AnimatePresence>

        {/* deck pile */}
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
              <span className="label absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px]! tracking-[0.3em]! text-starlight/85">DRAW ↑</span>
              <span className="label absolute -top-6 left-1/2 -translate-x-1/2 text-[7px]! text-dim">{hand.length} IN DECK</span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* the active card */}
        {active && phase !== "rest" && (
          <motion.div
            initial={reduce ? false : { x: 0, y: -480, rotateZ: -3, scale: 0.7, opacity: 0 }}
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
            aria-label={phase === "hand" ? `Summon ${active.name}` : `Inspect ${active.name}`}
          >
            <DuelCard d={active} tilt={phase === "field"} />
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

        {/* reveal panel */}
        <AnimatePresence>
          {phase === "field" && revealed && active && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.4 }}
              className="absolute bottom-[7%] left-1/2 z-40 w-[min(92vw,32rem)] -translate-x-1/2 border border-hairline bg-[rgba(6,9,15,0.94)] p-4 backdrop-blur-md"
            >
              <div className="flex items-baseline justify-between border-b border-hairline pb-2">
                <span className="label text-[8px]! tracking-[0.26em]! text-starlight/85">{active.name.toUpperCase()} · DEPLOYED</span>
                <span className="label text-[7px]! text-dim">[ {active.cardType.toUpperCase()} ]</span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-px bg-[rgba(232,230,225,0.06)] text-center">
                {[
                  ["BUILD", active.stats.version],
                  ["PLATFORM", active.stats.platform],
                  ["SIZE", active.stats.size],
                ].map(([k, v]) => (
                  <div key={k} className="bg-[rgba(6,10,16,0.9)] px-2 py-2">
                    <p className="label text-[6px]! text-dim">{k}</p>
                    <p className="mt-0.5 font-mono text-[0.72rem] text-ink">{v}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-3">
                <a href={active.downloadUrl} target="_blank" rel="noopener noreferrer" className="flex-1 border border-[rgba(212,184,134,0.5)] bg-[rgba(212,184,134,0.1)] py-2.5 text-center text-starlight transition-colors hover:bg-[rgba(212,184,134,0.2)]">
                  <span className="label text-[9px]! tracking-[0.28em]!">DOWNLOAD ↓</span>
                </a>
                <a href={active.repoUrl} target="_blank" rel="noopener noreferrer" className="label text-[8px]! tracking-[0.24em]! text-dim transition-colors hover:text-starlight">
                  REPO ↗
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {phase === "field" && !revealed && (
          <span className="label absolute bottom-[8%] left-1/2 -translate-x-1/2 text-[8px]! tracking-[0.3em]! text-starlight/70">
            CLICK THE CARD TO INSPECT
          </span>
        )}
      </div>

      {/* controls */}
      <div className="absolute bottom-6 left-6 z-40 flex items-center gap-5 md:left-12">
        <p className="label text-[8px]! text-dim">ONE BUILD ON THE FIELD · MORE SHIP IN TIME</p>
        {phase !== "rest" && !reduce && (
          <button type="button" onClick={reset} className="label text-[8px]! tracking-[0.26em]! text-dim transition-colors hover:text-starlight">
            ⟲ RETURN TO DECK
          </button>
        )}
      </div>
    </section>
  );
}

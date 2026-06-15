"use client";
import { useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import { deployments, type Deployment } from "@/data/deployments";

/* ————— a soft procedural cue (no audio assets) ————— */
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
      o.frequency.setValueAtTime(180, t);
      o.frequency.exponentialRampToValueAtTime(58, t + 0.22);
      g.gain.setValueAtTime(0.11, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
    }
    o.start();
    o.stop(t + 0.34);
    setTimeout(() => ctx.close(), 600);
  } catch {
    /* audio blocked — silent is fine */
  }
}

/* ————— the card art: a drawn constellation + crescent, or real art ————— */
function CardArt({ d }: { d: Deployment }) {
  if (d.art) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={d.art} alt={d.name} className="h-full w-full object-cover" />;
  }
  return (
    <svg viewBox="0 0 200 150" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="dep-sky" cx="38%" cy="32%" r="85%">
          <stop offset="0%" stopColor="#1a2640" />
          <stop offset="55%" stopColor="#0c1322" />
          <stop offset="100%" stopColor="#05080f" />
        </radialGradient>
      </defs>
      <rect width="200" height="150" fill="url(#dep-sky)" />
      {/* crescent moon */}
      <g transform="translate(150 38)">
        <circle r="15" fill="#e8d9b6" />
        <circle r="15" cx="6.5" cy="-3" fill="#0c1322" />
      </g>
      {/* constellation */}
      <g stroke="#d4b886" strokeWidth="0.6" opacity="0.7">
        <line x1="34" y1="96" x2="58" y2="78" />
        <line x1="58" y1="78" x2="80" y2="92" />
        <line x1="80" y1="92" x2="104" y2="70" />
        <line x1="104" y1="70" x2="92" y2="48" />
      </g>
      {[
        [34, 96, 2.1], [58, 78, 1.6], [80, 92, 1.8], [104, 70, 2.3], [92, 48, 1.5],
        [20, 40, 1], [46, 26, 1.2], [120, 110, 1], [150, 96, 1.3], [70, 120, 0.9], [165, 64, 1],
      ].map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="#f1e6c8" opacity={0.5 + (i % 3) * 0.18} />
      ))}
    </svg>
  );
}

/* ————— the card face — an original midnight-ink frame ————— */
function CardFace({ d, tilt }: { d: Deployment; tilt?: boolean }) {
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 200, damping: 18 });
  const sry = useSpring(ry, { stiffness: 200, damping: 18 });
  const glareX = useTransform(sry, [-10, 10], ["0%", "100%"]);
  const glareY = useTransform(srx, [10, -10], ["0%", "100%"]);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!tilt) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    ry.set(px * 16);
    rx.set(-py * 16);
  };
  const onLeave = () => {
    rx.set(0);
    ry.set(0);
  };

  return (
    <motion.div
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={tilt ? { rotateX: srx, rotateY: sry, transformPerspective: 900 } : undefined}
      className="group relative h-full w-full rounded-[14px] border border-[rgba(212,184,134,0.34)] bg-[#0a0f18] p-2.5 shadow-[0_28px_70px_rgba(0,0,0,0.6)]"
    >
      {/* rarity glow */}
      {d.rarity !== "common" && (
        <span aria-hidden className="pointer-events-none absolute -inset-1 rounded-[18px] bg-[radial-gradient(circle_at_50%_30%,rgba(212,184,134,0.3),transparent_70%)] opacity-50 blur-md" />
      )}
      <div className="relative flex h-full flex-col overflow-hidden rounded-[10px] [transform-style:preserve-3d]">
        {/* art window */}
        <div className="relative h-[52%] shrink-0 overflow-hidden rounded-[8px] border border-[rgba(212,184,134,0.18)]" style={{ transform: "translateZ(18px)" }}>
          <CardArt d={d} />
          <span className="label absolute left-2 top-2 text-[6px]! tracking-[0.22em]! text-starlight/80">
            {d.rarity.toUpperCase()}
          </span>
        </div>

        {/* name plate */}
        <div className="mt-2 flex items-baseline justify-between border-b border-hairline pb-1.5" style={{ transform: "translateZ(10px)" }}>
          <h3 className="font-display text-[1.15rem] font-light leading-none text-ink">{d.name}</h3>
          <span className="label text-[6px]! tracking-[0.2em]! text-starlight/70">◆</span>
        </div>
        <p className="label mt-1.5 text-[6.5px]! tracking-[0.2em]! text-dim">{d.typeLine.toUpperCase()}</p>

        {/* description */}
        <p className="mt-2 font-serif text-[0.74rem] italic leading-snug text-faint">{d.description}</p>

        {/* build "stats", reimagined as figures */}
        <div className="mt-auto grid grid-cols-2 gap-px border border-hairline bg-[rgba(232,230,225,0.06)] text-center" style={{ transform: "translateZ(8px)" }}>
          <div className="bg-[#0a0f18] px-2 py-1.5">
            <p className="label text-[6px]! text-dim">BUILD</p>
            <p className="font-mono text-[0.7rem] text-starlight">{d.stats.version}</p>
          </div>
          <div className="bg-[#0a0f18] px-2 py-1.5">
            <p className="label text-[6px]! text-dim">PLATFORM</p>
            <p className="font-mono text-[0.7rem] text-ink">{d.stats.platform}</p>
          </div>
        </div>
      </div>

      {/* holographic foil — a pointer-tracked glare + a hover sheen */}
      {d.rarity !== "common" && (
        <>
          <motion.span
            aria-hidden
            style={{ left: glareX, top: glareY }}
            className="pointer-events-none absolute h-[140%] w-[140%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(212,184,134,0.25),transparent_55%)] opacity-0 mix-blend-screen transition-opacity duration-300 group-hover:opacity-100"
          />
          <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[14px] bg-[linear-gradient(115deg,transparent_30%,rgba(159,182,216,0.16)_45%,rgba(212,184,134,0.18)_50%,transparent_62%)] bg-[length:300%_100%] opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-hover:[animation:dep-foil_2.6s_linear_infinite]" />
        </>
      )}
    </motion.div>
  );
}

/* ————— a face-down card back, for the deck pile ————— */
function CardBack({ style, className }: { style?: React.CSSProperties; className?: string }) {
  return (
    <div
      style={style}
      className={`absolute h-full w-full rounded-[14px] border border-[rgba(212,184,134,0.3)] bg-[linear-gradient(160deg,#0d1422,#070b12)] shadow-[0_18px_50px_rgba(0,0,0,0.55)] ${className ?? ""}`}
    >
      <div className="absolute inset-2 rounded-[10px] border border-[rgba(212,184,134,0.14)]" />
      <svg viewBox="0 0 60 60" className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2">
        <g transform="translate(30 30)" fill="none" stroke="#d4b886" strokeWidth="1.2" opacity="0.8">
          <circle r="13" />
          <circle r="13" cx="5.5" cy="-2.5" stroke="#070b12" strokeWidth="3" />
        </g>
        <circle cx="44" cy="16" r="1.6" fill="#d4b886" opacity="0.8" />
      </svg>
    </div>
  );
}

export default function DeploymentsDeck() {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<"rest" | "hand" | "field">(reduce ? "field" : "rest");
  const [revealed, setRevealed] = useState<boolean>(!!reduce);
  const hand = deployments;
  const active = hand[0]; // the summoned card (single-card flow today)
  const stage = useRef<HTMLDivElement>(null);

  const draw = () => {
    blip("draw");
    setPhase("hand");
  };
  const summon = () => {
    blip("summon");
    setPhase("field");
  };

  return (
    <section
      id="deployments"
      className="biome-archive relative flex min-h-svh flex-col justify-center overflow-hidden px-6 py-24 md:px-12"
    >
      <style>{`@keyframes dep-foil{0%{background-position:0% 0}100%{background-position:300% 0}}`}</style>

      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-8 flex items-end justify-between border-b border-hairline pb-5">
          <div>
            <p className="label mb-3 text-starlight/70">DEPLOYMENTS · SHIPPED BUILDS</p>
            <h2 className="font-display text-[clamp(1.9rem,4vw,3.2rem)] font-light leading-none text-ink">
              The Duel Field
            </h2>
          </div>
          <span className="label hidden text-[10px]! text-dim sm:block">
            {phase === "rest" ? "DRAW" : phase === "hand" ? "SUMMON" : "DEPLOYED"}
          </span>
        </div>

        {/* the field */}
        <div
          ref={stage}
          className="relative h-[64svh] min-h-[26rem] w-full overflow-hidden rounded-xl border border-hairline bg-[radial-gradient(ellipse_at_50%_30%,rgba(38,52,74,0.4),rgba(6,9,15,0.9)_70%)]"
        >
          {/* summon ring at field centre */}
          <span
            aria-hidden
            className={`pointer-events-none absolute left-1/2 top-[46%] h-44 w-32 -translate-x-1/2 -translate-y-1/2 rounded-lg border transition-all duration-500 ${
              phase === "hand" ? "border-starlight/40 [box-shadow:0_0_40px_rgba(212,184,134,0.18)]" : "border-[rgba(232,230,225,0.08)]"
            }`}
          />

          {/* the deck pile — rest state */}
          <AnimatePresence>
            {phase === "rest" && (
              <motion.button
                type="button"
                onClick={draw}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ y: -4 }}
                aria-label={`Draw the ${active?.name} card`}
                className="group absolute bottom-8 right-8 z-10 h-44 w-32 cursor-pointer md:right-12"
              >
                <CardBack style={{ transform: "rotate(-7deg) translate(6px,6px)" }} />
                <CardBack style={{ transform: "rotate(-3deg) translate(3px,3px)" }} />
                <CardBack className="transition-transform duration-300 group-hover:-translate-y-1" />
                <span className="label absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px]! tracking-[0.28em]! text-starlight/80">
                  DRAW ↑
                </span>
                <span className="label absolute -top-5 left-1/2 -translate-x-1/2 text-[7px]! text-dim">
                  {hand.length} IN DECK
                </span>
              </motion.button>
            )}
          </AnimatePresence>

          {/* the active card — in hand, or summoned to the field */}
          {active && phase !== "rest" && (
            <motion.div
              initial={reduce ? false : { x: 150, y: 120, rotateY: 180, rotateZ: 8, scale: 0.78, opacity: 0 }}
              animate={
                phase === "field"
                  ? { x: 0, y: 0, rotateY: 0, rotateZ: 0, scale: 1.06, opacity: 1 }
                  : { x: 0, y: 150, rotateY: 0, rotateZ: 0, scale: 0.86, opacity: 1 }
              }
              transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 140, damping: 17 }}
              className="absolute left-1/2 top-[46%] z-20 h-44 w-32 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
              onClick={() => (phase === "hand" ? summon() : setRevealed((v) => !v))}
              role="button"
              aria-label={phase === "hand" ? `Summon ${active.name}` : `Inspect ${active.name}`}
            >
              <CardFace d={active} tilt={phase === "field"} />
              {phase === "hand" && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="label absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px]! tracking-[0.28em]! text-starlight/80"
                >
                  CLICK TO SUMMON ↑
                </motion.span>
              )}
            </motion.div>
          )}

          {/* reveal panel — stats + download */}
          <AnimatePresence>
            {phase === "field" && revealed && active && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                transition={{ duration: 0.4 }}
                className="absolute bottom-6 left-1/2 z-30 w-[min(92%,30rem)] -translate-x-1/2 border border-hairline bg-[rgba(6,10,16,0.92)] p-4 backdrop-blur-md"
              >
                <div className="flex items-baseline justify-between border-b border-hairline pb-2">
                  <span className="label text-[8px]! tracking-[0.26em]! text-starlight/80">{active.name.toUpperCase()} · DEPLOYED</span>
                  <span className="label text-[7px]! text-dim">{active.typeLine.toUpperCase()}</span>
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
                  <a
                    href={active.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 border border-[rgba(212,184,134,0.5)] bg-[rgba(212,184,134,0.1)] py-2.5 text-center text-starlight transition-colors hover:bg-[rgba(212,184,134,0.2)]"
                  >
                    <span className="label text-[9px]! tracking-[0.28em]!">DOWNLOAD ↓</span>
                  </a>
                  <a
                    href={active.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="label text-[8px]! tracking-[0.24em]! text-dim transition-colors hover:text-starlight"
                  >
                    REPO ↗
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* hint when summoned but not yet inspected */}
          {phase === "field" && !revealed && (
            <span className="label absolute bottom-6 left-1/2 -translate-x-1/2 text-[8px]! tracking-[0.28em]! text-starlight/70">
              CLICK THE CARD TO INSPECT
            </span>
          )}
        </div>

        {/* reset / footnote */}
        <div className="mt-5 flex items-center justify-between">
          <p className="label text-[8px]! text-dim">
            ONE BUILD ON THE FIELD · MORE SHIP IN TIME
          </p>
          {phase !== "rest" && !reduce && (
            <button
              type="button"
              onClick={() => {
                setRevealed(false);
                setPhase("rest");
              }}
              className="label text-[8px]! tracking-[0.26em]! text-dim transition-colors hover:text-starlight"
            >
              ⟲ RETURN TO DECK
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

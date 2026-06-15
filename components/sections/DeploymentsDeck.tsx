import DuelField from "@/components/duel-field/DuelField";

export default function DeploymentsDeck() {
<<<<<<< HEAD
  return <DuelField />;
=======
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<"rest" | "hand" | "field">(reduce ? "field" : "rest");
  const [revealed, setRevealed] = useState<boolean>(!!reduce);
  const [shake, setShake] = useState(false);
  const [summonGlow, setSummonGlow] = useState(false);
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
    // the landing uses a soft glow and brief shake, avoiding a bright flash.
    setTimeout(() => {
      setSummonGlow(true);
      setShake(true);
      setTimeout(() => setSummonGlow(false), 900);
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
        {/* summon glow */}
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
                <a href={active.webUrl} target="_blank" rel="noopener noreferrer" className="flex-1 border border-[rgba(212,184,134,0.5)] bg-[rgba(212,184,134,0.1)] py-2.5 text-center text-starlight transition-colors hover:bg-[rgba(212,184,134,0.2)]">
                  <span className="label text-[9px]! tracking-[0.28em]!">WEB APP ↗</span>
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
>>>>>>> b8b9bdf (Polish PC and wire remaining achievements)
}

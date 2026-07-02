"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import type { GardenFeature } from "@/data/gardenFeatures";

/**
 * The discovery card — what opens when you inspect a landmark. Visual-first:
 * name, year, a single line of plaque text, and the growth data drawn as
 * concentric tree rings (the garden's own metaphor) instead of labelled meter
 * bars. The long-form story and event log stay one tap away behind "the story",
 * so the walk stays a walk and reading is a choice.
 */
function featureKicker(feature: GardenFeature) {
  if (feature.id === "noctyrium") return "Active Project · Medical Study System";
  if (feature.branch === "medicine") return "Academic Timeline";
  if (feature.branch === "projects") return "Projects & Life";
  return "Site Landmark";
}

const ACCENT: Record<string, string> = {
  main: "#9fce8f",
  medicine: "#9fd8e8",
  projects: "#d4b886",
};

function eventTone(status?: "past" | "current" | "future") {
  if (status === "current") return "text-leaf";
  if (status === "future") return "text-[rgba(167,183,199,0.82)]";
  return "text-[rgba(232,230,225,0.76)]";
}

/** growth entries as concentric tree rings — innermost is the first entry. */
function GrowthRings({ growth, accent }: { growth: NonNullable<GardenFeature["growth"]>; accent: string }) {
  const rings = growth.slice(0, 4);
  const C = 60; // centre
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 120 120" className="h-28 w-28 shrink-0 -rotate-90">
        {rings.map((ring, i) => {
          const r = 18 + i * 13;
          const circ = 2 * Math.PI * r;
          const frac = Math.max(0.04, Math.min(1, ring.value / 100));
          return (
            <g key={ring.label}>
              <circle cx={C} cy={C} r={r} fill="none" stroke="rgba(232,230,225,0.1)" strokeWidth="5" />
              <circle
                cx={C}
                cy={C}
                r={r}
                fill="none"
                stroke={accent}
                strokeOpacity={0.5 + 0.5 * frac}
                strokeWidth="5"
                strokeDasharray={`${circ * frac} ${circ}`}
                strokeLinecap="round"
              />
            </g>
          );
        })}
        <circle cx={C} cy={C} r={4} fill={accent} fillOpacity={0.8} />
      </svg>
      <div className="min-w-0 space-y-1.5">
        {rings.map((ring) => (
          <div key={ring.label} className="flex items-baseline gap-2">
            <span className="font-mono text-[0.6rem] tabular-nums text-faint">{Math.round(ring.value)}</span>
            <span className="truncate font-mono text-[0.62rem] uppercase tracking-[0.12em] text-[rgba(232,230,225,0.78)]">
              {ring.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SanctumInspector({
  feature,
  onClose,
}: {
  feature: GardenFeature | undefined;
  onClose: () => void;
}) {
  const [showStory, setShowStory] = useState(false);
  const accent = feature ? ACCENT[feature.branch] ?? ACCENT.main : ACCENT.main;
  return (
    <AnimatePresence>
      {feature ? (
        <motion.aside
          key={feature.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.26 }}
          className="pointer-events-auto absolute bottom-40 right-4 z-30 w-[min(92vw,390px)] border border-hairline bg-[rgba(5,10,8,0.86)] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-md md:bottom-24 md:right-8"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="label text-[7px]! tracking-[0.22em]! text-leaf/75">{featureKicker(feature)}</p>
              <h3 className="mt-2 font-display text-2xl font-light leading-tight text-ink">
                {feature.title}
                {feature.year ? (
                  <span className="ml-2 align-middle font-mono text-[0.62rem] uppercase tracking-[0.16em] text-faint">
                    {feature.year}
                  </span>
                ) : null}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="label shrink-0 text-[8px]! tracking-[0.18em]! text-dim transition-colors hover:text-ink"
            >
              Close
            </button>
          </div>

          <p className="mt-3 font-serif text-base leading-snug text-[rgba(232,230,225,0.84)]">{feature.plaqueText}</p>

          {feature.growth?.length ? (
            <div className="mt-4 border-t border-[rgba(232,230,225,0.1)] pt-3">
              <p className="label mb-2 text-[7px]! tracking-[0.2em]! text-leaf/70">Growth Rings</p>
              <GrowthRings growth={feature.growth} accent={accent} />
            </div>
          ) : null}

          {feature.story ? (
            <div className="mt-4 border-t border-[rgba(232,230,225,0.1)] pt-3">
              <button
                type="button"
                onClick={() => setShowStory((v) => !v)}
                className="flex w-full items-baseline justify-between text-left"
              >
                <span className="label text-[7px]! tracking-[0.2em]! text-leaf/70">The Story</span>
                <span className="font-mono text-[0.62rem] text-faint">{showStory ? "−" : "+"}</span>
              </button>
              {showStory ? (
                <div className="mt-2">
                  <p className="font-serif text-sm leading-snug text-[rgba(232,230,225,0.78)]">{feature.story.summary}</p>
                  {feature.story.events?.length ? (
                    <div className="mt-3 space-y-2">
                      {feature.story.events.map((event) => (
                        <div key={`${feature.id}-${event.label}`} className="border-l border-[rgba(159,206,143,0.22)] pl-3">
                          <p className={`font-mono text-[0.64rem] uppercase tracking-[0.14em] ${eventTone(event.status)}`}>
                            {event.label}
                          </p>
                          <p className="mt-1 font-mono text-[0.64rem] leading-snug text-faint">{event.detail}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          {feature.links?.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {feature.links.map((link) => (
                <a
                  key={`${feature.id}-${link.label}`}
                  href={link.href}
                  target={link.href.startsWith("http") ? "_blank" : undefined}
                  rel={link.href.startsWith("http") ? "noreferrer" : undefined}
                  className="border border-[rgba(232,230,225,0.14)] px-3 py-2 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-leaf/90 transition-colors hover:border-leaf/50 hover:text-ink"
                >
                  {link.label}
                </a>
              ))}
            </div>
          ) : null}
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}

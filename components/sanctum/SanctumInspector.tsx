"use client";
import { AnimatePresence, motion } from "framer-motion";
import type { GardenFeature } from "@/data/gardenFeatures";

/**
 * Landmark plaque panel — the only place text appears, and only on demand when a
 * marker is clicked. Reuses the existing gardenFeatures content (plaque, story
 * seed, growth rings, event rings, links) the old walk already authored; this is
 * a refined port of ForestScene's GardenFeatureInspector.
 */
function featureKicker(feature: GardenFeature) {
  if (feature.id === "noctyrium") return "Active Project · Medical Study System";
  if (feature.branch === "medicine") return "Academic Timeline";
  if (feature.branch === "projects") return "Projects & Life";
  return "Site Landmark";
}

function eventTone(status?: "past" | "current" | "future") {
  if (status === "current") return "text-leaf";
  if (status === "future") return "text-[rgba(167,183,199,0.82)]";
  return "text-[rgba(232,230,225,0.76)]";
}

export default function SanctumInspector({
  feature,
  onClose,
}: {
  feature: GardenFeature | undefined;
  onClose: () => void;
}) {
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
              <h3 className="mt-2 font-display text-2xl font-light leading-tight text-ink">{feature.title}</h3>
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
          <p className="mt-3 font-mono text-[0.68rem] leading-relaxed text-faint">{feature.visualNotes}</p>
          {feature.story ? (
            <div className="mt-4 border-t border-[rgba(232,230,225,0.1)] pt-3">
              <p className="label text-[7px]! tracking-[0.2em]! text-leaf/70">Story Seed</p>
              <p className="mt-2 font-serif text-sm leading-snug text-[rgba(232,230,225,0.78)]">{feature.story.summary}</p>
            </div>
          ) : null}
          {feature.growth?.length ? (
            <div className="mt-4 space-y-2">
              <p className="label text-[7px]! tracking-[0.2em]! text-leaf/70">Growth Rings</p>
              {feature.growth.map((ring) => (
                <div key={`${feature.id}-${ring.label}`} className="grid grid-cols-[86px_1fr] items-center gap-3">
                  <span className="truncate font-mono text-[0.62rem] uppercase tracking-[0.12em] text-faint">{ring.label}</span>
                  <span className="group relative h-2 overflow-hidden bg-[rgba(232,230,225,0.08)]">
                    <span
                      className="block h-full bg-[linear-gradient(90deg,rgba(159,206,143,0.28),rgba(240,199,124,0.76))]"
                      style={{ width: `${Math.max(4, Math.min(100, ring.value))}%` }}
                    />
                  </span>
                </div>
              ))}
            </div>
          ) : null}
          {feature.story?.events?.length ? (
            <div className="mt-4 space-y-2">
              <p className="label text-[7px]! tracking-[0.2em]! text-leaf/70">Event Rings</p>
              {feature.story.events.map((event) => (
                <div key={`${feature.id}-${event.label}`} className="border-l border-[rgba(159,206,143,0.22)] pl-3">
                  <p className={`font-mono text-[0.64rem] uppercase tracking-[0.14em] ${eventTone(event.status)}`}>{event.label}</p>
                  <p className="mt-1 font-mono text-[0.64rem] leading-snug text-faint">{event.detail}</p>
                </div>
              ))}
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

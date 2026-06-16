"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Deployment } from "@/data/deployments";

interface DuelInspectPanelProps {
  deployment: Deployment;
  visible: boolean;
}

export function DuelInspectPanel({ deployment: d, visible }: DuelInspectPanelProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.4 }}
          className="absolute bottom-[7%] left-1/2 z-40 w-[min(92vw,32rem)] -translate-x-1/2 border border-hairline bg-[rgba(6,9,15,0.94)] p-4 backdrop-blur-md"
        >
          {/* Header */}
          <div className="flex items-baseline justify-between border-b border-hairline pb-2">
            <span className="label text-[8px]! tracking-[0.26em]! text-starlight/85">
              {d.name.toUpperCase()} · DEPLOYED
            </span>
            <span className="label text-[7px]! text-dim">[ {d.cardType.toUpperCase()} ]</span>
          </div>

          {/* Metadata Grid */}
          <div className="mt-3 grid grid-cols-3 gap-px bg-[rgba(232,230,225,0.06)] text-center">
            {[
              ["BUILD", d.stats.version],
              ["PLATFORM", d.stats.platform],
              ["SIZE", d.stats.size],
            ].map(([k, v]) => (
              <div key={k} className="bg-[rgba(6,10,16,0.9)] px-2 py-2">
                <p className="label text-[6px]! text-dim">{k}</p>
                <p className="mt-0.5 font-mono text-[0.72rem] text-ink">{v}</p>
              </div>
            ))}
          </div>

          {/* Description */}
          <div className="mt-3 rounded border border-[rgba(160,180,220,0.12)] bg-[rgba(40,60,100,0.08)] p-2.5">
            <p className="text-[0.65rem] leading-relaxed text-faint">{d.effect}</p>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex flex-col gap-2">
            {/* Primary: WEB / OPEN DEPLOYMENT */}
            {d.webUrl && (
              <a
                href={d.webUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-center gap-2 border border-[rgba(212,184,134,0.6)] bg-[linear-gradient(180deg,rgba(212,184,134,0.15),rgba(212,184,134,0.08))] py-3 text-center transition-all duration-200 hover:border-[rgba(212,184,134,0.9)] hover:bg-[linear-gradient(180deg,rgba(212,184,134,0.25),rgba(212,184,134,0.15))] hover:shadow-[0_0_20px_rgba(212,184,134,0.2)]"
              >
                <span className="label text-[9px]! tracking-[0.28em]! text-starlight group-hover:text-ink">
                  WEB
                </span>
                <span className="text-[0.7rem] text-starlight/60 group-hover:text-starlight/90">↗</span>
              </a>
            )}

            {/* Secondary buttons row */}
            <div className="flex gap-2">
              {/* DOWNLOAD - disabled/coming soon if not available */}
              {!d.downloadUrl ? (
                <div className="flex-1 border border-[rgba(212,184,134,0.25)] bg-[rgba(212,184,134,0.04)] py-2.5 text-center opacity-50">
                  <span className="label text-[8px]! tracking-[0.24em]! text-dim">
                    DOWNLOAD
                  </span>
                  <span className="label block text-[6px]! text-dim/70 mt-0.5">COMING SOON</span>
                </div>
              ) : (
                <a
                  href={d.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 border border-[rgba(212,184,134,0.4)] bg-[rgba(212,184,134,0.08)] py-2.5 text-center transition-colors hover:bg-[rgba(212,184,134,0.14)]"
                >
                  <span className="label text-[8px]! tracking-[0.24em]! text-dim hover:text-starlight">
                    DOWNLOAD ↓
                  </span>
                </a>
              )}

              {/* REPO link */}
              <a
                href={d.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="label text-[8px]! tracking-[0.24em]! text-dim transition-colors hover:text-starlight border border-[rgba(160,180,220,0.12)] px-3 py-2.5 flex items-center justify-center hover:border-[rgba(160,180,220,0.3)]"
              >
                REPO ↗
              </a>
            </div>
          </div>

          {/* Close hint */}
          <p className="label mt-3 text-center text-[6px]! text-dim/60">
            CLICK THE CARD TO CLOSE
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

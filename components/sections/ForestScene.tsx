"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { AnimatePresence, motion, useInView } from "framer-motion";
import {
  gardenFeatureById,
  type GardenBranch,
  type GardenFeature,
} from "@/data/gardenFeatures";
import { gardenPathNodeById } from "@/data/gardenPaths";
import type { GardenQuality } from "@/components/garden/GardenCanvas";

const GardenCanvas = dynamic(() => import("@/components/garden/GardenCanvas"), {
  ssr: false,
});

const VISITED_BRANCHES_KEY = "jd1184-garden-visited-branches";

function branchLabel(branch: GardenBranch) {
  if (branch === "medicine") return "Medicine & Study";
  if (branch === "projects") return "Projects & Life";
  return "Main Trail";
}

function actionLabel(nodeId: string, fromBranch?: GardenBranch) {
  if (nodeId === "term-3") return "Medicine & Study";
  if (nodeId === "training-journey") return "Projects & Life";
  if (nodeId === "main-fork" && fromBranch && fromBranch !== "main") return "Return to Fork";
  return gardenPathNodeById(nodeId).label;
}

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

function GardenFeatureInspector({
  feature,
  onClose,
}: {
  feature: GardenFeature;
  onClose: () => void;
}) {
  const storyEvents = feature.story?.events ?? [];
  const growth = feature.growth ?? [];

  return (
    <motion.aside
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.26 }}
      className="absolute bottom-40 right-4 z-30 w-[min(92vw,390px)] border border-hairline bg-[rgba(5,10,8,0.86)] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-md md:bottom-24 md:right-8"
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
          <p className="mt-2 font-serif text-sm leading-snug text-[rgba(232,230,225,0.78)]">
            {feature.story.summary}
          </p>
        </div>
      ) : null}
      {growth.length ? (
        <div className="mt-4 space-y-2">
          <p className="label text-[7px]! tracking-[0.2em]! text-leaf/70">Growth Rings</p>
          {growth.map((ring) => (
            <div key={`${feature.id}-${ring.label}`} className="grid grid-cols-[86px_1fr] items-center gap-3">
              <span className="truncate font-mono text-[0.62rem] uppercase tracking-[0.12em] text-faint">
                {ring.label}
              </span>
              <span className="group relative h-2 overflow-hidden bg-[rgba(232,230,225,0.08)]">
                <span
                  className="block h-full bg-[linear-gradient(90deg,rgba(159,206,143,0.28),rgba(240,199,124,0.76))]"
                  style={{ width: `${Math.max(4, Math.min(100, ring.value))}%` }}
                />
                <span className="pointer-events-none absolute left-0 top-3 hidden w-[220px] border border-[rgba(232,230,225,0.12)] bg-[rgba(5,10,8,0.94)] p-2 font-mono text-[0.62rem] leading-snug text-faint shadow-xl group-hover:block">
                  {ring.detail}
                </span>
              </span>
            </div>
          ))}
        </div>
      ) : null}
      {storyEvents.length ? (
        <div className="mt-4 space-y-2">
          <p className="label text-[7px]! tracking-[0.2em]! text-leaf/70">Event Rings</p>
          {storyEvents.map((event) => (
            <div key={`${feature.id}-${event.label}`} className="border-l border-[rgba(159,206,143,0.22)] pl-3">
              <p className={`font-mono text-[0.64rem] uppercase tracking-[0.14em] ${eventTone(event.status)}`}>
                {event.label}
              </p>
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
  );
}

export default function ForestScene({ surveyHref }: { surveyHref?: string } = {}) {
  const section = useRef<HTMLElement>(null);
  const near = useInView(section, { margin: "220px 0px 220px 0px" });
  const [started, setStarted] = useState(false);
  const [currentNodeId, setCurrentNodeId] = useState("start");
  const [targetNodeId, setTargetNodeId] = useState("start");
  const [inspectedFeatureId, setInspectedFeatureId] = useState<string | null>(null);
  const [quality, setQuality] = useState<GardenQuality>("high");

  useEffect(() => {
    const updateQuality = () => {
      if (typeof window === "undefined") return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce || window.innerWidth < 760) setQuality("low");
      else if (window.devicePixelRatio > 1.6 && window.innerWidth > 1300) setQuality("high");
      else setQuality("medium");
    };
    updateQuality();
    window.addEventListener("resize", updateQuality);
    return () => window.removeEventListener("resize", updateQuality);
  }, []);

  const currentNode = gardenPathNodeById(currentNodeId);
  const targetNode = gardenPathNodeById(targetNodeId);
  const currentFeature = gardenFeatureById(currentNode.featureId);
  const inspectedFeature = gardenFeatureById(inspectedFeatureId ?? undefined);
  const moving = currentNodeId !== targetNodeId;
  const choices = currentNode.nextNodes.map((id) => gardenPathNodeById(id));
  const locationLabel = moving ? `Walking toward ${targetNode.label}` : currentNode.label;

  const goTo = (nodeId: string) => {
    const node = gardenPathNodeById(nodeId);
    if (!started) setStarted(true);
    setTargetNodeId(nodeId);
    setInspectedFeatureId(null);

    if (typeof window !== "undefined" && node.branch !== "main") {
      try {
        const visited = new Set(
          JSON.parse(localStorage.getItem(VISITED_BRANCHES_KEY) || "[]") as string[]
        );
        visited.add(node.branch);
        localStorage.setItem(VISITED_BRANCHES_KEY, JSON.stringify([...visited]));
      } catch {
        /* localStorage unavailable */
      }
    }
  };

  const beginWalk = () => goTo("website-tree");

  const primaryAction = useMemo(() => {
    if (moving) return null;
    if (!started) return null;
    if (choices.length === 1) return { label: actionLabel(choices[0].id, currentNode.branch), nodeId: choices[0].id };
    return null;
  }, [choices, currentNode.branch, moving, started]);

  return (
    <section ref={section} id="garden" className="biome-forest relative min-h-svh overflow-hidden">
      <div className="absolute inset-0">
        <GardenCanvas
          active={near}
          currentNodeId={currentNodeId}
          targetNodeId={targetNodeId}
          quality={quality}
          onArrive={setCurrentNodeId}
          onSelectNode={goTo}
          onInspectFeature={setInspectedFeatureId}
        />
      </div>

      <div aria-hidden className="forest-vignette pointer-events-none absolute inset-0" />

      <div className="pointer-events-none absolute left-5 top-24 z-20 max-w-[min(86vw,430px)] md:left-10">
        <p className="label mb-3 text-leaf/80 [text-shadow:0_1px_10px_rgba(3,8,5,0.9)]">
          Guided nature walk
        </p>
        <h2 className="font-display text-[clamp(2.1rem,4.5vw,3.8rem)] font-light leading-none text-ink [text-shadow:0_2px_22px_rgba(3,8,5,0.95)]">
          The Sanctum
        </h2>
        <p className="label mt-3 text-[8px]! tracking-[0.22em]! text-leaf/65 [text-shadow:0_1px_8px_rgba(3,8,5,0.9)]">
          {branchLabel(targetNode.branch)} · {locationLabel}
        </p>
      </div>

      <div className="absolute right-5 top-24 z-20 hidden max-w-[260px] text-right md:right-10 md:block">
        <p className="label text-[8px]! tracking-[0.24em]! text-leaf/70">
          Trail camera · look around
        </p>
        <p className="mt-2 font-mono text-[0.68rem] leading-relaxed text-faint">
          Follow the path, inspect glowing plaque orbs, and choose a fork when the trail waits.
        </p>
      </div>

      {["left-4 top-20 border-l border-t", "right-4 top-20 border-r border-t", "left-4 bottom-4 border-l border-b", "right-4 bottom-4 border-r border-b"].map(
        (pos) => (
          <span key={pos} aria-hidden className={`pointer-events-none absolute z-20 h-5 w-5 border-leaf/35 ${pos}`} />
        )
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={`${started}-${currentNodeId}-${targetNodeId}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.32 }}
          className="absolute bottom-8 left-1/2 z-20 w-[min(94vw,620px)] -translate-x-1/2 border border-hairline bg-[rgba(5,10,7,0.78)] p-3 shadow-[0_18px_70px_rgba(0,0,0,0.42)] backdrop-blur-md md:bottom-10"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="label text-[7px]! tracking-[0.22em]! text-leaf/75">
                {moving ? "Moving along the trail" : started ? branchLabel(currentNode.branch) : "Trailhead"}
              </p>
              <p className="mt-1 truncate font-mono text-sm text-ink">
                {started ? locationLabel : "Click the glowing trail marker, or begin the walk below."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {!started ? (
                <button
                  type="button"
                  onClick={beginWalk}
                  className="border border-leaf/45 bg-leaf/10 px-4 py-2 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-ink shadow-[0_0_28px_rgba(159,206,143,0.18)] transition-colors hover:bg-leaf/20"
                >
                  Begin the Walk
                </button>
              ) : null}

              {primaryAction ? (
                <button
                  type="button"
                  onClick={() => goTo(primaryAction.nodeId)}
                  className="border border-leaf/45 bg-leaf/10 px-4 py-2 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-ink transition-colors hover:bg-leaf/20"
                >
                  {primaryAction.label}
                </button>
              ) : null}

              {!moving && started && currentNode.type === "fork"
                ? choices.map((choice) => (
                    <button
                      key={choice.id}
                      type="button"
                      onClick={() => goTo(choice.id)}
                      className="border border-[rgba(232,230,225,0.14)] px-3 py-2 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-leaf/90 transition-colors hover:border-leaf/50 hover:text-ink"
                    >
                      {actionLabel(choice.id, currentNode.branch)}
                    </button>
                  ))
                : null}

              {!moving && currentFeature ? (
                <button
                  type="button"
                  onClick={() => setInspectedFeatureId(currentFeature.id)}
                  className="border border-[rgba(232,230,225,0.14)] px-3 py-2 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-faint transition-colors hover:border-leaf/40 hover:text-ink"
                >
                  Inspect Plaque
                </button>
              ) : null}

              {!moving && started && currentNode.previousNode ? (
                <button
                  type="button"
                  onClick={() => goTo(currentNode.previousNode!)}
                  className="border border-transparent px-2 py-2 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-dim transition-colors hover:text-leaf"
                >
                  Backtrack
                </button>
              ) : null}

              {!moving && started && currentNodeId !== "start" ? (
                <button
                  type="button"
                  onClick={() => goTo("start")}
                  className="border border-transparent px-2 py-2 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-dim transition-colors hover:text-leaf"
                >
                  Return Start
                </button>
              ) : null}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {inspectedFeature ? (
          <GardenFeatureInspector feature={inspectedFeature} onClose={() => setInspectedFeatureId(null)} />
        ) : null}
      </AnimatePresence>

      <div className="absolute bottom-24 right-5 z-20 hidden md:block">
        {surveyHref ? (
          <a href={surveyHref} className="label text-[8px]! tracking-[0.24em]! text-leaf transition-colors hover:text-ink">
            Full Survey
          </a>
        ) : (
          <Link href="/garden" className="label text-[8px]! tracking-[0.24em]! text-leaf transition-colors hover:text-ink">
            Enter the Sanctum
          </Link>
        )}
      </div>
    </section>
  );
}

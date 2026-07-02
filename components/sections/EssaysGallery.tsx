"use client";
import Link from "next/link";
import { essayArtifacts } from "@/data/essays";
import EssayArtifact from "@/components/essay-archive/EssayArtifact";
import EssayReaderModal from "@/components/essay-archive/EssayReaderModal";
import { useEssayTransition } from "@/components/essay-archive/useEssayTransition";
import "@/components/essay-archive/essayArchive.css";

/**
 * The essays as a full-viewport scene — a working corner of the Essay
 * Archive on the dashboard. The three leading works sit on the shelf as
 * collector artifacts (same holo cards as /essays) and unseal into the
 * cinematic reader right here; the CTA walks you into the full archive.
 */
export default function EssaysGallery() {
  const { state, open, close } = useEssayTransition();
  const shelf = essayArtifacts.slice(0, 3);

  return (
    <section
      id="essays"
      className="biome-essays relative flex min-h-svh flex-col justify-center overflow-hidden px-6 py-24 md:px-10"
    >
      <div className="mx-auto w-full max-w-6xl">
        <p className="label mb-4 text-starlight/70">
          JD-1184 b · THE ESSAY ARCHIVE · {String(essayArtifacts.length).padStart(2, "0")} WORKS PRESERVED
        </p>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-[clamp(2.2rem,5vw,3.6rem)] font-light leading-none text-ink">
            Essays
          </h2>
          <Link
            href="/essays"
            className="border border-hairline px-4 py-2 font-mono text-[0.66rem] uppercase tracking-[0.2em] text-starlight/85 transition-colors hover:border-starlight/60 hover:text-ink"
          >
            Enter the archive ⟶
          </Link>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {shelf.map((artifact) => (
            <EssayArtifact key={artifact.id} artifact={artifact} onOpen={open} />
          ))}
        </div>
      </div>

      {state ? <EssayReaderModal state={state} onClose={close} /> : null}
    </section>
  );
}

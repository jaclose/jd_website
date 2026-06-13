import type { Metadata } from "next";
import { essays } from "@/lib/content";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import EssayDeck from "@/components/essays/EssayDeck";

export const metadata: Metadata = {
  title: "Essays — Jafar Dabbagh",
  description: "Long-form thought from the JD-1184 system, dealt as a deck.",
};

export default function EssaysPage() {
  return (
    <>
      <SiteHeader current="essays" />
      <main className="mx-auto max-w-6xl px-6 pb-28 pt-36 md:px-10">
        <Reveal>
          <p className="label mb-4 text-starlight/70">
            JD-1184 b · GAS GIANT · {essays.length} TRANSMISSIONS
          </p>
          <h1 className="font-display text-[clamp(2.6rem,7vw,5rem)] font-light leading-none text-ink">
            Essays
          </h1>
          <p className="mt-6 max-w-xl font-serif text-xl italic leading-relaxed text-faint">
            The active deck — every essay a holographic card. Older dispatches
            and deep surveys wait in storage.
          </p>
        </Reveal>

        <div className="mt-16">
          <EssayDeck />
        </div>
      </main>
      <Footer />
    </>
  );
}

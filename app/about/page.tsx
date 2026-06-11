import type { Metadata } from "next";
import { about } from "@/lib/content";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "About — Jafar Dabbagh",
  description:
    "The inner world. Never satisfied with surfaces — the thought before the action, the mercy inside the motion.",
};

export default function AboutPage() {
  return (
    <>
      <SiteHeader current="about" />
      <main className="mx-auto max-w-3xl px-6 pb-28 pt-36 md:px-8">
        <Reveal>
          <p className="label mb-4 text-starlight/70">JD-1184 d · ROCKY INNER WORLD</p>
          <h1 className="font-display text-[clamp(2.6rem,7vw,5rem)] font-light leading-none text-ink">
            About
          </h1>
        </Reveal>
        <Reveal delay={0.1}>
          <article
            className="prose-space mt-16"
            dangerouslySetInnerHTML={{ __html: about.html }}
          />
        </Reveal>
      </main>
      <Footer />
    </>
  );
}

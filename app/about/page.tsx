import type { Metadata } from "next";
import Image from "next/image";
import { about } from "@/lib/content";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import LifeMap from "@/components/about/LifeMap";
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
      <main className="mx-auto max-w-5xl px-6 pb-28 pt-36 md:px-8">
        <Reveal>
          <div className="flex flex-col items-start gap-8 md:flex-row md:items-center md:gap-10">
            <Image
              src="/brand/avatar.png"
              alt="Jafar Dabbagh"
              width={116}
              height={116}
              className="h-24 w-24 md:h-29 md:w-29"
              priority
            />
            <div>
              <p className="label mb-4 text-starlight/70">
                JD-1184 d · ROCKY INNER WORLD
              </p>
              <h1 className="font-display text-[clamp(2.6rem,7vw,5rem)] font-light leading-none text-ink">
                About
              </h1>
            </div>
          </div>
        </Reveal>

        {/* the fault line — from the site itself */}
        <Reveal delay={0.08}>
          <blockquote className="mt-16 border-l border-starlight/50 pl-6 font-serif text-[clamp(1.3rem,2.6vw,1.7rem)] italic leading-relaxed text-[rgba(232,230,225,0.82)] md:pl-8">
            I write from the fault line where ambition, faith, and endurance
            push against each other. Medicine is the craft I train in, but
            meaning is the curriculum I return to. Every test, every
            conversation, every mercy disguised as difficulty shapes the same
            aim: to become someone steady in exhaustion, honest in hardship,
            and useful in the quiet battles no transcript will ever show.
          </blockquote>
        </Reveal>

        {/* the dominion — life as a strategic map */}
        <Reveal delay={0.1}>
          <div className="mt-20">
            <p className="label mb-6 text-[9px]! text-starlight/70">
              CARTOGRAPHY · EVERY PROVINCE A CHAPTER
            </p>
            <LifeMap />
          </div>
        </Reveal>

        {/* two frames from the surface */}
        <Reveal delay={0.12}>
          <div className="mt-20 grid gap-6 sm:grid-cols-[1fr_1.45fr]">
            <figure>
              <div className="relative aspect-3/4 overflow-hidden">
                <Image
                  src="/images/essays/hello-world.jpg"
                  alt="Graduation day — cap, gown, and the river behind"
                  fill
                  sizes="(max-width: 640px) 100vw, 38vw"
                  className="object-cover"
                />
              </div>
              <figcaption className="label mt-3 text-[8px]! text-dim">
                THE FIVE-YEAR ROAD, WALKED IN TWO
              </figcaption>
            </figure>
            <figure>
              <div className="relative aspect-3/4 overflow-hidden sm:aspect-auto sm:h-full">
                <Image
                  src="/images/horizon.jpg"
                  alt="Sitting above a sunlit coastline, two fingers raised"
                  fill
                  sizes="(max-width: 640px) 100vw, 55vw"
                  className="object-cover"
                />
              </div>
              <figcaption className="label mt-3 text-[8px]! text-dim">
                BETWEEN CHAPTERS · THE WORLD KEEPS ITS LIGHT ON
              </figcaption>
            </figure>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <article
            className="prose-space mt-20"
            dangerouslySetInnerHTML={{ __html: about.html }}
          />
        </Reveal>
      </main>
      <Footer />
    </>
  );
}

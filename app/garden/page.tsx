import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import SeedCutscene from "@/components/garden/SeedCutscene";
import GardenGallery from "@/components/garden/GardenGallery";
import AchievementsGrid from "@/components/garden/AchievementsGrid";
import { biosphere } from "@/data/garden";

export const metadata: Metadata = {
  title: "The Garden — Jafar Dabbagh",
  description:
    "Every skill is a tree. The garden terraforms its planet as the work deepens.",
};

export default function GardenPage() {
  const bio = biosphere();
  return (
    <>
      <SiteHeader current="garden" />
      <main>
        <SeedCutscene />
        <GardenGallery />

        {/* planet status — how the garden terraforms JD-1184 c */}
        <section className="mx-auto max-w-4xl px-6 py-28 text-center md:px-10">
          <Reveal>
            <p className="label mb-8 text-leaf/80">TERRAFORMING REPORT</p>
            {bio.count === 0 ? (
              <p className="mx-auto max-w-2xl font-serif text-2xl leading-relaxed text-[rgba(232,230,225,0.85)]">
                The planet keeps the score — and the score is{" "}
                <strong>zero</strong>. Regolith from pole to pole, waiting.
                When the first skill is planted the green will show from orbit
                at 15 growth points; the first seas condense at 50.
              </p>
            ) : (
              <p className="mx-auto max-w-2xl font-serif text-2xl leading-relaxed text-[rgba(232,230,225,0.85)]">
                The planet keeps the score. <strong>{bio.points} growth points</strong>{" "}
                across {bio.count} trees — vegetation at{" "}
                {Math.round(bio.vegetation * 100)}%
                {bio.water > 0
                  ? `, hydrosphere at ${Math.round(bio.water * 100)}%.`
                  : ". The first seas condense at 50 points."}
              </p>
            )}
            <div className="mx-auto mt-12 max-w-md space-y-5">
              {[
                ["VEGETATION", bio.vegetation, "bg-leaf"],
                ["HYDROSPHERE", bio.water, "bg-comet"],
              ].map(([k, v, c]) => (
                <div key={k as string}>
                  <div className="mb-2 flex justify-between">
                    <span className="label text-[8px]! text-dim">{k}</span>
                    <span className="label text-[8px]! text-faint">
                      {Math.round((v as number) * 100)}%
                    </span>
                  </div>
                  <div className="h-px w-full bg-hairline">
                    <div
                      className={`h-px ${c}`}
                      style={{ width: `${(v as number) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        <AchievementsGrid />
      </main>
      <Footer />
    </>
  );
}

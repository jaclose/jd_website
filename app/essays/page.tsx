import type { Metadata } from "next";
import { essays } from "@/lib/content";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import EssaysPage from "@/components/essay-archive/EssaysPage";

export const metadata: Metadata = {
  title: "Essays — Jafar Dabbagh",
  description: `The JD-1184 essay archive: ${essays.length} long-form works preserved — reflections, research, and personal observations.`,
  alternates: { canonical: "/essays" },
};

/**
 * The Essay Archive. Essays are preserved artifacts (Field Notes are the
 * living fragments) — so this page is a private reading room: hero
 * atmosphere, one featured centerpiece, and the collection shelved beneath
 * it. Everything renders from data/essays.ts + the migrated content; the
 * permanent per-essay pages at /essays/[slug] are untouched.
 */
export default function EssaysArchiveRoute() {
  return (
    <>
      <SiteHeader current="essays" />
      <main>
        <EssaysPage />
      </main>
      <Footer />
    </>
  );
}

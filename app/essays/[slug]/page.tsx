import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { essays, essayBySlug, formatDate, readingTime } from "@/lib/content";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import ReadingProgress from "@/components/ReadingProgress";

export function generateStaticParams() {
  return essays.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const essay = essayBySlug(slug);
  if (!essay) return {};
  return {
    title: `${essay.title} — Jafar Dabbagh`,
    description: essay.excerpt.slice(0, 160),
  };
}

export default async function EssayPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const essay = essayBySlug(slug);
  if (!essay) notFound();

  const idx = essays.findIndex((e) => e.slug === slug);
  const prev = essays[idx + 1]; // older
  const next = essays[idx - 1]; // newer

  return (
    <>
      <SiteHeader current="essays" />
      <ReadingProgress />
      <main className="mx-auto max-w-3xl px-6 pb-28 pt-36 md:px-8">
        <Link
          href="/essays"
          className="label mb-10 inline-block !text-[9px] text-dim transition-colors hover:text-starlight"
        >
          ⟵ ALL TRANSMISSIONS
        </Link>
        <header className="mb-16 text-center">
          <p className="label mb-6 !text-[10px] text-starlight/70">
            JD-1184 b · TRANSMISSION {String(essays.length - idx).padStart(2, "0")}
          </p>
          <h1 className="font-display text-[clamp(2.2rem,6vw,4rem)] font-light leading-[1.08] text-ink">
            {essay.title}
          </h1>
          <p className="label mt-8 !text-[10px] text-dim">
            {formatDate(essay.date).toUpperCase()} · {readingTime(essay.words).toUpperCase()} READ
          </p>
          <span
            aria-hidden
            className="mx-auto mt-10 block h-px w-24 bg-gradient-to-r from-transparent via-starlight/60 to-transparent"
          />
        </header>

        <article
          className="prose-space dropcap"
          dangerouslySetInnerHTML={{ __html: essay.html }}
        />

        <nav className="mt-24 grid gap-px border border-[rgba(232,230,225,0.1)] bg-[rgba(232,230,225,0.1)] sm:grid-cols-2">
          {[
            { e: prev, label: "OLDER ←", align: "text-left" },
            { e: next, label: "→ NEWER", align: "text-right sm:col-start-2" },
          ].map(({ e, label, align }) =>
            e ? (
              <Link
                key={e.slug}
                href={`/essays/${e.slug}`}
                className={`group bg-space p-6 transition-colors hover:bg-[#0a0c14] ${align}`}
              >
                <span className="label !text-[8px] text-dim">{label}</span>
                <p className="mt-2 font-display text-lg font-light text-ink transition-colors group-hover:text-starlight">
                  {e.title}
                </p>
              </Link>
            ) : (
              <div key={label} className={`hidden bg-space p-6 sm:block ${align}`} />
            )
          )}
        </nav>
      </main>
      <Footer />
    </>
  );
}

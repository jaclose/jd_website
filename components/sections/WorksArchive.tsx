import Image from "next/image";
import { works } from "@/data/works";
import Reveal from "@/components/Reveal";

/**
 * The Archive as a gallery — the four instruments hang like plates in a
 * records room, each wearing its actual title page. Grid-paper weather.
 */
export default function WorksArchive() {
  return (
    <section
      id="archive"
      className="biome-archive relative flex min-h-svh flex-col justify-center overflow-hidden px-6 py-24 md:px-12"
    >
      <div className="mx-auto w-full max-w-7xl">
        <Reveal>
          <div className="mb-12 flex items-end justify-between border-b border-hairline pb-5">
            <div>
              <p className="label mb-3 text-starlight/70">
                DEEP SURVEYS · SOME OF MY MOST ENJOYABLE WORKS
              </p>
              <h2 className="font-display text-[clamp(1.9rem,4vw,3.2rem)] font-light leading-none text-ink">
                The Archive
              </h2>
            </div>
            <span className="label hidden text-[10px]! text-dim sm:block">04</span>
          </div>
        </Reveal>

        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4 lg:gap-7">
          {works.map((w, i) => (
            <Reveal key={w.id} delay={i * 0.06}>
              <a
                href={w.pdf}
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
              >
                <div className="relative aspect-155/200 overflow-hidden border border-[rgba(232,230,225,0.1)] shadow-[0_18px_50px_rgba(0,0,0,0.5)] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-2">
                  <Image
                    src={`/images/works/${w.pdf.split("/").pop()!.replace(".pdf", ".jpg")}`}
                    alt={`Title page of ${w.title}`}
                    fill
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-[filter] duration-700 filter-[saturate(0.7)_brightness(0.82)] group-hover:filter-[saturate(1)_brightness(1)]"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-space/70 via-transparent to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-40" />
                  <span className="label absolute bottom-3 left-3.5 text-[8px]! text-ink/85">
                    {String(i + 1).padStart(2, "0")} · {w.year}
                  </span>
                  <span className="label absolute right-3.5 top-3 border border-[rgba(212,184,134,0.4)] bg-space/60 px-2 py-1 text-[7px]! tracking-[0.22em]! text-starlight backdrop-blur-sm">
                    {w.discipline.toUpperCase()}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-[1.08rem] font-light leading-snug text-ink transition-colors duration-300 group-hover:text-starlight">
                  {w.title}
                </h3>
                <p className="label mt-2 text-[7px]! tracking-[0.22em]! text-dim">
                  {w.venue.toUpperCase()} ·{" "}
                  <span className="text-starlight/70">OPEN PDF ↗</span>
                </p>
              </a>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <p className="label mt-10 text-[9px]! text-dim">
            INSTRUMENTS RETIRED TO THE ARCHIVE · CHEMISTRY, PSYCHOLOGY, GEOLOGY, BIOETHICS
          </p>
        </Reveal>
      </div>
    </section>
  );
}

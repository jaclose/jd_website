"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { signals, GITHUB_USER, GITHUB_REPO } from "@/data/signals";
import { unlockVisitor } from "@/lib/visitor";

interface Commit {
  sha: string;
  message: string;
  date: string;
}

/**
 * The uplink array — the site phoning home to the services Jafar uses.
 * GitHub streams live (public API); the rest are antennae waiting on an
 * OAuth relay, drawn as a radar console so the empty state still reads
 * as "listening" rather than "broken".
 */
export default function SignalsSection() {
  const section = useRef<HTMLElement>(null);
  const inView = useInView(section, { once: true, margin: "-25% 0px -25% 0px" });
  const [commits, setCommits] = useState<Commit[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (inView) unlockVisitor("tuned-in");
  }, [inView]);

  useEffect(() => {
    if (!inView || commits || failed) return;
    const ctrl = new AbortController();
    fetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/commits?per_page=5`, {
      signal: ctrl.signal,
      headers: { Accept: "application/vnd.github+json" },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: { sha: string; commit: { message: string; author: { date: string } } }[]) =>
        setCommits(
          data.map((c) => ({
            sha: c.sha.slice(0, 7),
            message: c.commit.message.split("\n")[0],
            date: c.commit.author.date.slice(0, 10),
          }))
        )
      )
      .catch(() => setFailed(true));
    return () => ctrl.abort();
  }, [inView, commits, failed]);

  return (
    <section
      ref={section}
      id="signals"
      className="biome-signals relative flex min-h-svh flex-col justify-center overflow-hidden px-6 py-24 md:px-12"
    >
      {/* radar sweep backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center opacity-[0.12]">
        <div className="relative h-[120vmin] w-[120vmin] rounded-full border border-comet/30">
          {[0.75, 0.5, 0.25].map((s) => (
            <span
              key={s}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-comet/20"
              style={{ width: `${s * 100}%`, height: `${s * 100}%` }}
            />
          ))}
          <motion.span
            className="absolute left-1/2 top-1/2 h-1/2 w-px origin-bottom bg-linear-to-t from-comet/60 to-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />
        </div>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl">
        <div className="mb-10 flex items-end justify-between border-b border-hairline pb-5">
          <div>
            <p className="label mb-3 text-comet/70">LIVE UPLINK ARRAY · TELEMETRY FROM EARTH</p>
            <h2 className="font-display text-[clamp(1.9rem,4vw,3.2rem)] font-light leading-none text-ink">
              Signals
            </h2>
          </div>
          <span className="label hidden text-[10px]! text-dim sm:block">06</span>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
          {/* ——— GitHub: live feed ——— */}
          <a
            href={signals[0].href}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col border border-hairline bg-[rgba(8,10,16,0.55)] p-6 transition-colors hover:border-[rgba(232,230,225,0.2)]"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="flex items-center gap-3">
                <span aria-hidden className="text-lg text-ink">{signals[0].glyph}</span>
                <span>
                  <span className="block font-display text-lg font-light text-ink">GitHub</span>
                  <span className="label text-[7px]! text-dim">{signals[0].channel.toUpperCase()}</span>
                </span>
              </span>
              <span className="flex items-center gap-2">
                <span className={`h-1.5 w-1.5 rounded-full ${commits ? "animate-pulse bg-leaf" : failed ? "bg-[#d77a7a]" : "bg-starlight"}`} />
                <span className="label text-[7px]! text-dim">
                  {commits ? "LIVE" : failed ? "OFFLINE" : "ACQUIRING"}
                </span>
              </span>
            </div>
            <ul className="flex-1 space-y-2 font-mono">
              {commits
                ? commits.map((c) => (
                    <li key={c.sha} className="flex items-baseline gap-3 border-b border-[rgba(232,230,225,0.05)] pb-2 text-[0.72rem]">
                      <span className="shrink-0 text-starlight/80">{c.sha}</span>
                      <span className="truncate text-faint transition-colors group-hover:text-ink">{c.message}</span>
                      <span className="ml-auto shrink-0 text-[0.62rem] text-dim">{c.date}</span>
                    </li>
                  ))
                : Array.from({ length: 5 }, (_, i) => (
                    <li key={i} className="flex items-center gap-3 pb-2">
                      <span className="h-2.5 w-14 animate-pulse rounded bg-[rgba(232,230,225,0.08)]" />
                      <span className="h-2.5 flex-1 animate-pulse rounded bg-[rgba(232,230,225,0.05)]" />
                    </li>
                  ))}
              {failed && (
                <li className="text-[0.72rem] text-dim">
                  signal lost — the repository is private or the array is rate-limited. visit on GitHub ↗
                </li>
              )}
            </ul>
            <span className="label mt-4 text-[8px]! text-comet/70 transition-colors group-hover:text-comet">
              OPEN THE REPOSITORY ↗
            </span>
          </a>

          {/* ——— pending uplinks ——— */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
            {signals.slice(1).map((s) => (
              <a
                key={s.id}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center gap-4 overflow-hidden border border-hairline bg-[rgba(8,10,16,0.5)] p-5 transition-colors hover:border-[rgba(232,230,225,0.18)]"
              >
                <span
                  aria-hidden
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full border text-lg"
                  style={{ borderColor: `${s.accent}55`, color: s.accent }}
                >
                  {s.glyph}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="font-display text-base font-light text-ink">{s.label}</span>
                    <span className="label text-[6.5px]! text-dim">STANDBY</span>
                  </span>
                  <span className="label mt-1 block text-[7px]! tracking-[0.18em]! text-dim">
                    {s.pending}
                  </span>
                </span>
                {/* scanning shimmer */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 -translate-x-full opacity-0 transition group-hover:translate-x-full group-hover:opacity-100 group-hover:duration-1000"
                  style={{ background: `linear-gradient(90deg, transparent, ${s.accent}18, transparent)` }}
                />
              </a>
            ))}
          </div>
        </div>

        <p className="label mt-8 text-[8px]! tracking-[0.24em]! text-dim">
          GITHUB STREAMS LIVE FROM THE PUBLIC API · STRAVA, SPOTIFY & MYMIND AWAIT THEIR OAUTH RELAY
        </p>
      </div>
    </section>
  );
}

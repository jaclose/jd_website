"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { signals, mymind, GITHUB_USER, GITHUB_REPO, type Signal } from "@/data/signals";
import { unlockVisitor } from "@/lib/visitor";

interface Commit {
  sha: string;
  message: string;
  date: string;
}

type NativeProvider = Exclude<Signal["id"], "github">;
type NativeSignal = Signal & {
  id: NativeProvider;
  endpoint: `/api/signals/${NativeProvider}`;
};

interface SetupSignalResponse {
  provider: NativeProvider;
  configured: false;
  message: string;
  needs: string[];
  docs?: string;
  scopes?: string[];
  officialApiAvailable?: boolean;
}

interface StravaActivity {
  id: string;
  name: string;
  type: string;
  distanceMeters: number;
  movingTimeSeconds: number;
  totalElevationGainMeters: number;
  startDate: string | null;
  averageSpeedMetersPerSecond: number | null;
  achievementCount: number;
  kudosCount: number;
}

interface StravaSignalResponse {
  provider: "strava";
  configured: true;
  generatedAt: string;
  activities: StravaActivity[];
  summary: {
    activityCount: number;
    totalDistanceMeters: number;
    totalMovingTimeSeconds: number;
    latestStartDate: string | null;
  };
}

interface SpotifyItem {
  id: string;
  name: string;
  type: string;
  artists: string[];
  collection: string | null;
  imageUrl: string | null;
  durationMs: number | null;
  playedAt: string | null;
}

interface SpotifySignalResponse {
  provider: "spotify";
  configured: true;
  generatedAt: string;
  current: SpotifyItem | null;
  isPlaying: boolean;
  progressMs: number | null;
  device: string | null;
  note: string | null;
  recent: SpotifyItem[];
}

type SignalResponse = SetupSignalResponse | StravaSignalResponse | SpotifySignalResponse;

interface NativeState {
  loading: boolean;
  data: SignalResponse | null;
  error: string | null;
}

const nativeSignals = signals.slice(1) as NativeSignal[];

function createNativeStates(): Record<NativeProvider, NativeState> {
  return {
    strava: { loading: false, data: null, error: null },
    spotify: { loading: false, data: null, error: null },
  };
}

function formatDistance(meters: number) {
  const miles = meters / 1609.344;
  return `${miles >= 10 ? miles.toFixed(0) : miles.toFixed(1)} mi`;
}

function formatElevation(meters: number) {
  return `${Math.round(meters * 3.28084)} ft`;
}

function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function formatDate(value: string | null) {
  if (!value) return "undated";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));
}

function formatArtists(artists: string[]) {
  return artists.length ? artists.join(", ") : "Unknown artist";
}

function statusFor(signal: NativeSignal, state: NativeState) {
  if (state.loading) return "ACQUIRING";
  if (state.error) return "OFFLINE";
  if (state.data && !state.data.configured && signal.embeds?.length) return "LIVE EMBED";
  if (state.data && !state.data.configured) return "NEEDS API";
  if (state.data?.configured) return "LIVE";
  return signal.embeds?.length ? "EMBED READY" : "STANDBY";
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <span className="border border-[rgba(232,230,225,0.08)] bg-[rgba(232,230,225,0.025)] p-3">
      <span className="label block text-[6.5px]! tracking-[0.18em]! text-dim">{label}</span>
      <span className="mt-1 block font-mono text-sm text-ink">{value}</span>
    </span>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 3 }, (_, i) => (
        <span key={i} className="block h-8 animate-pulse rounded bg-[rgba(232,230,225,0.05)]" />
      ))}
    </div>
  );
}

function EmbedFallback({ signal, setup }: { signal: NativeSignal; setup?: SetupSignalResponse }) {
  const message =
    signal.id === "spotify"
      ? "Player embed is live. Native now-playing can take over after the Spotify token lands."
      : "Strava public widget is live here; the native relay can stay optional.";

  if (!signal.embeds?.length) {
    return setup ? <p className="font-serif text-sm leading-relaxed text-faint">{setup.message}</p> : null;
  }

  return (
    <div className="space-y-3">
      <p className="font-serif text-sm leading-relaxed text-faint">{message}</p>
      <div className="grid gap-2">
        {signal.embeds.map((embed) => (
          <div key={embed.src} className="space-y-2">
            <iframe
              title={embed.title}
              src={embed.src}
              height={embed.height}
              loading="lazy"
              frameBorder={0}
              scrolling="no"
              allow={embed.allow}
              className="mx-auto w-full max-w-[300px] rounded-[2px] border border-[rgba(232,230,225,0.08)] bg-space-deep"
            />
            {embed.note ? <p className="font-mono text-[0.62rem] leading-relaxed text-dim">{embed.note}</p> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function StravaPanel({ data }: { data: StravaSignalResponse }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <Metric label="DISTANCE" value={formatDistance(data.summary.totalDistanceMeters)} />
        <Metric label="TIME" value={formatDuration(data.summary.totalMovingTimeSeconds)} />
        <Metric label="LATEST" value={formatDate(data.summary.latestStartDate)} />
      </div>
      {data.activities.length ? (
        <ul className="space-y-2 font-mono">
          {data.activities.map((activity) => (
            <li
              key={activity.id}
              className="grid gap-1 border-b border-[rgba(232,230,225,0.06)] pb-2 text-[0.72rem] text-faint"
            >
              <span className="flex items-baseline justify-between gap-3">
                <span className="truncate text-ink">{activity.name}</span>
                <span className="shrink-0 text-dim">{formatDate(activity.startDate)}</span>
              </span>
              <span className="flex flex-wrap gap-x-3 gap-y-1 text-[0.65rem] uppercase tracking-wider text-dim">
                <span>{activity.type}</span>
                <span>{formatDistance(activity.distanceMeters)}</span>
                <span>{formatDuration(activity.movingTimeSeconds)}</span>
                <span>{formatElevation(activity.totalElevationGainMeters)}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="font-serif text-sm text-faint">Strava returned no recent authorized activities.</p>
      )}
    </div>
  );
}

function SpotifyPanel({ data }: { data: SpotifySignalResponse }) {
  const progress =
    data.current?.durationMs && data.progressMs !== null
      ? Math.min((data.progressMs / data.current.durationMs) * 100, 100)
      : 0;

  return (
    <div className="space-y-4">
      {data.current ? (
        <div className="grid grid-cols-[64px_1fr] gap-3">
          {data.current.imageUrl ? (
            <img
              src={data.current.imageUrl}
              alt=""
              className="h-16 w-16 rounded-[2px] border border-[rgba(232,230,225,0.1)] object-cover"
            />
          ) : (
            <span className="h-16 w-16 border border-[rgba(232,230,225,0.1)] bg-space-deep" />
          )}
          <div className="min-w-0">
            <p className="label mb-1 text-[6.5px]! tracking-[0.18em]! text-leaf">
              {data.isPlaying ? "PLAYING NOW" : "PAUSED / LAST ACTIVE"}
            </p>
            <p className="truncate font-display text-base font-light text-ink">{data.current.name}</p>
            <p className="truncate font-mono text-[0.68rem] text-faint">{formatArtists(data.current.artists)}</p>
            {data.current.collection ? (
              <p className="truncate font-mono text-[0.62rem] text-dim">{data.current.collection}</p>
            ) : null}
            {data.current.durationMs ? (
              <span className="mt-2 block h-1 overflow-hidden rounded bg-[rgba(232,230,225,0.08)]">
                <span className="block h-full bg-leaf" style={{ width: `${progress}%` }} />
              </span>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="font-serif text-sm text-faint">Nothing is playing right now. Showing recent tracks when available.</p>
      )}

      {data.note ? <p className="font-mono text-[0.65rem] text-dim">{data.note}</p> : null}

      {data.recent.length ? (
        <ul className="space-y-2 font-mono">
          {data.recent.map((track) => (
            <li key={`${track.id}-${track.playedAt}`} className="flex items-baseline gap-3 text-[0.7rem]">
              <span className="min-w-0 flex-1 truncate text-faint">{track.name}</span>
              <span className="shrink-0 text-dim">{formatDate(track.playedAt)}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function NativeBody({ signal, state }: { signal: NativeSignal; state: NativeState }) {
  if (state.loading) return <LoadingRows />;
  if (state.error) {
    return signal.embeds?.length ? (
      <EmbedFallback signal={signal} />
    ) : (
      <p className="font-serif text-sm leading-relaxed text-[#d77a7a]">{state.error}</p>
    );
  }
  if (!state.data) return <p className="font-serif text-sm text-faint">Waiting for the local API relay.</p>;
  if (!state.data.configured) return <EmbedFallback signal={signal} setup={state.data} />;

  if (signal.id === "strava" && state.data.provider === "strava") return <StravaPanel data={state.data} />;
  if (signal.id === "spotify" && state.data.provider === "spotify") return <SpotifyPanel data={state.data} />;

  return <p className="font-serif text-sm text-[#d77a7a]">Signal response did not match the requested provider.</p>;
}

function NativeSignalCard({
  signal,
  state,
  className = "",
}: {
  signal: NativeSignal;
  state: NativeState;
  className?: string;
}) {
  return (
    <article
      className={`group relative min-w-0 overflow-hidden border border-hairline bg-[rgba(8,10,16,0.5)] p-4 transition-colors hover:border-[rgba(232,230,225,0.18)] ${className}`}
    >
      <div className="relative z-10 flex items-start gap-4">
        <span
          aria-hidden
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border text-base"
          style={{ borderColor: `${signal.accent}55`, color: signal.accent }}
        >
          {signal.glyph}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span className="font-display text-base font-light text-ink">{signal.label}</span>
            <span className="label text-[6.5px]! text-dim">{statusFor(signal, state)}</span>
          </span>
          <span className="label mt-1 block text-[7px]! tracking-[0.18em]! text-dim">{signal.pending}</span>
        </span>
      </div>

      <div className="relative z-10 mt-3 pl-0 sm:pl-14 lg:pl-0">
        <NativeBody signal={signal} state={state} />
      </div>

      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -translate-x-full opacity-0 transition group-hover:translate-x-full group-hover:opacity-100 group-hover:duration-1000"
        style={{ background: `linear-gradient(90deg, transparent, ${signal.accent}18, transparent)` }}
      />
    </article>
  );
}

/**
 * GitHub streams from a public API. Strava and Spotify render native cards
 * when token relays exist, then fall back to public embeds when they do not.
 */
export default function SignalsSection() {
  const section = useRef<HTMLElement>(null);
  const nativeRequested = useRef(false);
  const inView = useInView(section, { once: true, margin: "-25% 0px -25% 0px" });
  const [commits, setCommits] = useState<Commit[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [nativeStates, setNativeStates] = useState<Record<NativeProvider, NativeState>>(createNativeStates);
  const stravaSignal = nativeSignals.find((signal) => signal.id === "strava");
  const spotifySignal = nativeSignals.find((signal) => signal.id === "spotify");

  useEffect(() => {
    if (inView) unlockVisitor("tuned-in");
  }, [inView]);

  useEffect(() => {
    if (!inView || commits || failed) return;
    const ctrl = new AbortController();
    fetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/commits?per_page=4`, {
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

  useEffect(() => {
    if (!inView || nativeRequested.current) return;
    nativeRequested.current = true;
    const ctrl = new AbortController();

    nativeSignals.forEach((signal) => {
      setNativeStates((prev) => ({
        ...prev,
        [signal.id]: { ...prev[signal.id], loading: true, error: null },
      }));

      fetch(signal.endpoint, { signal: ctrl.signal })
        .then(async (response) => {
          const payload = (await response.json()) as SignalResponse | { message?: string };
          if (!response.ok) {
            const message =
              typeof payload === "object" && payload && "message" in payload && payload.message
                ? String(payload.message)
                : `${signal.label} API returned ${response.status}`;
            throw new Error(message);
          }
          setNativeStates((prev) => ({
            ...prev,
            [signal.id]: { loading: false, data: payload as SignalResponse, error: null },
          }));
        })
        .catch((error) => {
          if (error instanceof Error && error.name === "AbortError") return;
          setNativeStates((prev) => ({
            ...prev,
            [signal.id]: {
              loading: false,
              data: null,
              error: error instanceof Error ? error.message : `${signal.label} API request failed.`,
            },
          }));
        });
    });

    return () => ctrl.abort();
  }, [inView]);

  return (
    <section
      ref={section}
      id="signals"
      className="biome-signals relative flex min-h-svh flex-col justify-center overflow-hidden px-6 py-20 md:px-12"
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

      <div className="relative z-10 mx-auto w-full max-w-7xl">
        <div className="mb-7 flex items-end justify-between border-b border-hairline pb-4">
          <div>
            <p className="label mb-2 text-comet/70">LIVE UPLINK ARRAY · TELEMETRY FROM EARTH</p>
            <h2 className="font-display text-[clamp(1.9rem,4vw,3.2rem)] font-light leading-none text-ink">
              Signals
            </h2>
          </div>
          <span className="label hidden text-[10px]! text-dim sm:block">06</span>
        </div>

        <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(420px,1fr)_340px_minmax(300px,0.8fr)] lg:items-start">
          {/* ——— GitHub: live feed ——— */}
          <a
            href={signals[0].href}
            target="_blank"
            rel="noopener noreferrer"
            className="group min-w-0 border border-hairline bg-[rgba(8,10,16,0.55)] p-5 transition-colors hover:border-[rgba(232,230,225,0.2)]"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="flex items-center gap-3">
                <span aria-hidden className="text-lg text-ink">
                  {signals[0].glyph}
                </span>
                <span>
                  <span className="block font-display text-lg font-light text-ink">GitHub</span>
                  <span className="label text-[7px]! text-dim">{signals[0].channel.toUpperCase()}</span>
                </span>
              </span>
              <span className="flex items-center gap-2">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    commits ? "animate-pulse bg-leaf" : failed ? "bg-[#d77a7a]" : "bg-starlight"
                  }`}
                />
                <span className="label text-[7px]! text-dim">
                  {commits ? "LIVE" : failed ? "OFFLINE" : "ACQUIRING"}
                </span>
              </span>
            </div>
            <ul className="min-w-0 space-y-2 font-mono">
              {commits
                ? commits.map((c) => (
                    <li
                      key={c.sha}
                      className="flex items-baseline gap-3 border-b border-[rgba(232,230,225,0.05)] pb-2 text-[0.72rem]"
                    >
                      <span className="shrink-0 text-starlight/80">{c.sha}</span>
                      <span className="min-w-0 flex-1 truncate text-faint transition-colors group-hover:text-ink">
                        {c.message}
                      </span>
                      <span className="ml-auto shrink-0 text-[0.62rem] text-dim">{c.date}</span>
                    </li>
                  ))
                : Array.from({ length: 4 }, (_, i) => (
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

          {stravaSignal ? (
            <NativeSignalCard
              signal={stravaSignal}
              state={nativeStates[stravaSignal.id]}
              className="lg:min-h-[606px]"
            />
          ) : null}

          <div className="grid min-w-0 gap-4">
            {spotifySignal ? <NativeSignalCard signal={spotifySignal} state={nativeStates[spotifySignal.id]} /> : null}

            {/* mymind — link-out antenna (no public API, account-gated) */}
            <a
              href={mymind.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative min-w-0 overflow-hidden border border-hairline bg-[rgba(8,10,16,0.5)] p-4 transition-colors hover:border-[rgba(232,230,225,0.18)]"
            >
              <div className="relative z-10 flex items-start gap-4">
                <span
                  aria-hidden
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full border text-base"
                  style={{ borderColor: `${mymind.accent}55`, color: mymind.accent }}
                >
                  {mymind.glyph}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="font-display text-base font-light text-ink">{mymind.label}</span>
                    <span className="label text-[6.5px]! text-dim">{mymind.status}</span>
                  </span>
                  <span className="label mt-1 block text-[7px]! tracking-[0.18em]! text-dim">
                    {mymind.channel.toUpperCase()}
                  </span>
                  <p className="mt-2 font-serif text-sm leading-relaxed text-faint">{mymind.note}</p>
                  <span className="label mt-3 inline-block text-[8px]! text-comet/70 transition-colors group-hover:text-comet">
                    OPEN IN MYMIND ↗
                  </span>
                </span>
              </div>
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 -translate-x-full opacity-0 transition group-hover:translate-x-full group-hover:opacity-100 group-hover:duration-1000"
                style={{ background: `linear-gradient(90deg, transparent, ${mymind.accent}18, transparent)` }}
              />
            </a>
          </div>
        </div>

        <p className="label mt-5 text-[8px]! tracking-[0.24em]! text-dim">
          GITHUB API · STRAVA PUBLIC WIDGET · SPOTIFY PLAYER WIDGET WITH NATIVE RELAY READY · MYMIND LINK-OUT
        </p>
      </div>
    </section>
  );
}

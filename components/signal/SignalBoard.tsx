"use client";

import type { CSSProperties, ReactNode } from "react";
import { nativeSignals, signalDesign, socialNodes, type SignalDesign, type SignalFrame, type SignalTheme } from "@/data/signals";
import type {
  NativeProvider,
  NativeState,
  SetupSignalResponse,
  SpotifySignalResponse,
  StravaActivity,
  StravaSignalResponse,
} from "@/components/signal/types";

interface SignalBoardProps {
  states: Record<NativeProvider, NativeState>;
  design?: SignalDesign;
}

const themeClasses: Record<SignalTheme, string> = {
  motherboard: "signal-board--motherboard",
  archive: "signal-board--archive",
  clinical: "signal-board--clinical",
  celestial: "signal-board--celestial",
  terminal: "signal-board--terminal",
  minimal: "signal-board--minimal",
};

const frameClasses: Record<SignalFrame, string> = {
  chip: "signal-chip--chip",
  glass: "signal-chip--glass",
  ledger: "signal-chip--ledger",
  orbital: "signal-chip--orbital",
  console: "signal-chip--console",
  card: "signal-chip--card",
  waveform: "signal-chip--waveform",
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function signalStyle(accent: string): CSSProperties {
  return { "--signal-accent": accent } as CSSProperties;
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
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours) return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

function formatPace(activity: StravaActivity) {
  if (!activity.distanceMeters || !activity.movingTimeSeconds) return "n/a";
  const secondsPerMile = activity.movingTimeSeconds / (activity.distanceMeters / 1609.344);
  const minutes = Math.floor(secondsPerMile / 60);
  const seconds = Math.round(secondsPerMile % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}/mi`;
}

function formatDate(value: string | null) {
  if (!value) return "undated";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));
}

function formatRelative(value: string | null) {
  if (!value) return "sync pending";
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return "sync pending";

  const diffMs = Date.now() - then;
  const minutes = Math.max(1, Math.round(diffMs / 60000));
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours}h ago`;

  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function formatSport(type: string) {
  return type
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatArtists(artists: string[]) {
  return artists.length ? artists.join(", ") : "Unknown artist";
}

function progressPercent(data: SpotifySignalResponse) {
  if (!data.current?.durationMs || data.progressMs === null) return 0;
  return Math.max(0, Math.min((data.progressMs / data.current.durationMs) * 100, 100));
}

function isFreshActivity(activity: StravaActivity | null) {
  if (!activity?.startDate) return false;
  const start = new Date(activity.startDate).getTime();
  if (Number.isNaN(start)) return false;
  return Date.now() - start < 24 * 60 * 60 * 1000;
}

function ChipFrame({
  accent,
  frame,
  active = false,
  className,
  children,
}: {
  accent: string;
  frame: SignalFrame;
  active?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <article
      className={cx(
        "signal-chip group relative min-w-0 overflow-hidden p-4 sm:p-5",
        frameClasses[frame],
        active && "signal-chip--active",
        className
      )}
      style={signalStyle(accent)}
    >
      <span aria-hidden className="signal-chip__corner signal-chip__corner--tl" />
      <span aria-hidden className="signal-chip__corner signal-chip__corner--tr" />
      <span aria-hidden className="signal-chip__corner signal-chip__corner--bl" />
      <span aria-hidden className="signal-chip__corner signal-chip__corner--br" />
      <div className="relative z-10">{children}</div>
    </article>
  );
}

function StatusPip({ label, tone = "live" }: { label: string; tone?: "live" | "idle" | "warn" }) {
  return (
    <span className="inline-flex items-center gap-2 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-faint">
      <span
        aria-hidden
        className={cx(
          "h-1.5 w-1.5 rounded-full",
          tone === "live" && "animate-pulse bg-[var(--signal-accent)]",
          tone === "idle" && "bg-starlight/70",
          tone === "warn" && "bg-[#d77a7a]"
        )}
      />
      {label}
    </span>
  );
}

function TelemetryStat({ label, value }: { label: string; value: string }) {
  return (
    <span className="signal-stat min-w-0">
      <span className="label block text-[0.42rem]! tracking-[0.18em]! text-dim">{label}</span>
      <span className="mt-1 block truncate font-mono text-[0.83rem] text-ink">{value}</span>
    </span>
  );
}

function LoadingTelemetry() {
  return (
    <div className="grid gap-3">
      <span className="h-16 animate-pulse bg-[rgba(232,230,225,0.055)]" />
      <span className="h-8 animate-pulse bg-[rgba(232,230,225,0.04)]" />
      <span className="h-8 animate-pulse bg-[rgba(232,230,225,0.035)]" />
    </div>
  );
}

function SetupTelemetry({
  setup,
  provider,
  message,
}: {
  setup?: SetupSignalResponse;
  provider: string;
  message?: string;
}) {
  return (
    <div className="space-y-4">
      <p className="font-serif text-[1.02rem] leading-relaxed text-faint">
        {message ?? setup?.message ?? `${provider} relay is standing by for its next API response.`}
      </p>
      {setup?.needs?.length ? (
        <div className="grid gap-2">
          {setup.needs.map((item) => (
            <span key={item} className="signal-stat font-mono text-[0.64rem] uppercase tracking-[0.14em] text-dim">
              {item}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function RouteTrace({ active }: { active: boolean }) {
  return (
    <svg className="h-24 w-full" viewBox="0 0 280 96" role="img" aria-label="Etched route trace">
      <path
        d="M14 68 C 46 28, 78 72, 104 38 S 164 26, 184 55 S 230 82, 266 30"
        fill="none"
        stroke="rgba(232,230,225,0.16)"
        strokeWidth="1"
      />
      <path
        className={cx(active && "signal-route")}
        d="M14 68 C 46 28, 78 72, 104 38 S 164 26, 184 55 S 230 82, 266 30"
        fill="none"
        stroke="var(--signal-accent)"
        strokeLinecap="round"
        strokeWidth="2"
      />
      {[14, 104, 184, 266].map((x, index) => (
        <circle
          key={x}
          cx={x}
          cy={[68, 38, 55, 30][index]}
          r={index === 0 || index === 3 ? 3.5 : 2.5}
          fill="rgba(6,7,11,0.96)"
          stroke="var(--signal-accent)"
          strokeWidth="1.2"
        />
      ))}
    </svg>
  );
}

function StravaCore({ state, frame }: { state: NativeState; frame: SignalFrame }) {
  const signal = nativeSignals.find((item) => item.id === "strava")!;
  const data = state.data?.configured && state.data.provider === "strava" ? state.data : null;
  const setup = state.data && !state.data.configured && state.data.provider === "strava" ? state.data : undefined;
  const latest = data?.activities[0] ?? null;
  const active = Boolean(data && isFreshActivity(latest));
  const status = state.loading ? "ACQUIRING" : state.error ? "OFFLINE" : data ? "LIVE" : setup ? "STANDBY" : "READY";

  return (
    <ChipFrame accent={signal.accent} frame={frame} active={active} className="lg:min-h-[430px]">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="label text-[0.5rem]! tracking-[0.24em]! text-[var(--signal-accent)]">{signal.title}</p>
          <h3 className="mt-2 font-display text-[clamp(1.8rem,4vw,3.25rem)] font-light leading-none text-ink">
            Recent Activity
          </h3>
        </div>
        <StatusPip label={status} tone={state.error ? "warn" : data ? "live" : "idle"} />
      </div>

      {state.loading ? (
        <LoadingTelemetry />
      ) : state.error ? (
        <SetupTelemetry provider="Strava" message={state.error} />
      ) : latest && data ? (
        <div className="space-y-5">
          <div className="signal-core-readout">
            <div className="min-w-0">
              <p className="font-mono text-[0.72rem] uppercase tracking-[0.22em] text-dim">
                {formatDate(latest.startDate)} · {formatSport(latest.type)}
              </p>
              <p className="mt-2 truncate font-display text-[clamp(1.65rem,4vw,2.85rem)] font-light leading-none text-ink">
                {formatDistance(latest.distanceMeters)}
              </p>
              <p className="mt-2 truncate font-serif text-base italic text-faint">{latest.name}</p>
            </div>
            <span className="signal-core-orbit" aria-hidden>
              <StravaMark />
            </span>
          </div>

          <RouteTrace active={active} />

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <TelemetryStat label="Time" value={formatDuration(latest.movingTimeSeconds)} />
            <TelemetryStat label="Pace" value={formatPace(latest)} />
            <TelemetryStat
              label={latest.averageHeartRate ? "HR avg" : "Elev"}
              value={latest.averageHeartRate ? `${Math.round(latest.averageHeartRate)} bpm` : formatElevation(latest.totalElevationGainMeters)}
            />
            <TelemetryStat label="Synced" value={formatRelative(data.generatedAt)} />
          </div>

          <div className="grid gap-2 border-t border-[rgba(232,230,225,0.08)] pt-4 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-dim sm:grid-cols-3">
            <span>{data.summary.activityCount} logged</span>
            <span>{formatDistance(data.summary.totalDistanceMeters)} window</span>
            <span>{formatDuration(data.summary.totalMovingTimeSeconds)} moving</span>
          </div>
        </div>
      ) : (
        <SetupTelemetry setup={setup} provider="Strava" />
      )}
    </ChipFrame>
  );
}

function Waveform({ active }: { active: boolean }) {
  const bars = [22, 36, 18, 44, 28, 52, 24, 40, 30, 48, 20, 34];

  return (
    <div className={cx("signal-waveform", active && "signal-waveform--active")} aria-hidden>
      {bars.map((height, index) => (
        <span key={`${height}-${index}`} style={{ height: `${height}px`, animationDelay: `${index * 120}ms` }} />
      ))}
    </div>
  );
}

function SpotifyFrequency({ state, frame }: { state: NativeState; frame: SignalFrame }) {
  const signal = nativeSignals.find((item) => item.id === "spotify")!;
  const data = state.data?.configured && state.data.provider === "spotify" ? state.data : null;
  const setup = state.data && !state.data.configured && state.data.provider === "spotify" ? state.data : undefined;
  const current = data?.current ?? data?.recent[0] ?? null;
  const status = state.loading ? "ACQUIRING" : state.error ? "OFFLINE" : data?.isPlaying ? "LIVE" : current ? "RECENT" : "READY";

  return (
    <ChipFrame accent={signal.accent} frame={frame} active={Boolean(data?.isPlaying)}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="label text-[0.5rem]! tracking-[0.24em]! text-[var(--signal-accent)]">{signal.title}</p>
          <h3 className="mt-2 font-display text-[clamp(1.45rem,3vw,2.2rem)] font-light leading-none text-ink">
            Now Playing
          </h3>
        </div>
        <StatusPip label={status} tone={state.error ? "warn" : current ? "live" : "idle"} />
      </div>

      {state.loading ? (
        <LoadingTelemetry />
      ) : state.error ? (
        <SetupTelemetry provider="Spotify" message={state.error} />
      ) : current && data ? (
        <div className="grid gap-4 sm:grid-cols-[96px_1fr] sm:items-center">
          <div className="signal-album-frame">
            {current.imageUrl ? (
              <img src={current.imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="grid h-full w-full place-items-center text-[var(--signal-accent)]">
                <SpotifyMark />
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="label text-[0.48rem]! tracking-[0.2em]! text-dim">
              {data.isPlaying ? "LIVE AUDIO SIGNAL" : "RECENT AUDIO SIGNAL"}
            </p>
            <p className="mt-2 truncate font-display text-[clamp(1.35rem,3vw,1.95rem)] font-light leading-none text-ink">
              {current.name}
            </p>
            <p className="mt-1 truncate font-mono text-[0.75rem] text-faint">{formatArtists(current.artists)}</p>
            {current.collection ? (
              <p className="mt-1 truncate font-mono text-[0.65rem] text-dim">{current.collection}</p>
            ) : null}
            <div className="mt-4">
              <span className="block h-1 overflow-hidden bg-[rgba(232,230,225,0.09)]">
                <span className="block h-full bg-[var(--signal-accent)]" style={{ width: `${progressPercent(data)}%` }} />
              </span>
            </div>
          </div>
          <div className="sm:col-span-2">
            <Waveform active={data.isPlaying} />
          </div>
        </div>
      ) : (
        <SetupTelemetry setup={setup} provider="Spotify" />
      )}
    </ChipFrame>
  );
}

function SocialNodeChip({ node, frame }: { node: (typeof socialNodes)[number]; frame: SignalFrame }) {
  return (
    <a
      href={node.href}
      target="_blank"
      rel="noopener noreferrer me"
      className={cx("signal-social-node group block min-w-0", frameClasses[frame])}
      style={signalStyle(node.accent)}
      aria-label={`${node.label}: ${node.nodeLabel}`}
    >
      <span aria-hidden className="signal-social-node__trace" />
      <span className="relative z-10 flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center border border-[rgba(232,230,225,0.1)] bg-[rgba(3,4,8,0.72)] text-[var(--signal-accent)] transition-colors group-hover:border-[var(--signal-accent)]">
          <BrandIcon id={node.id} />
        </span>
        <span className="min-w-0">
          <span className="block truncate font-display text-base font-light text-ink">{node.label}</span>
          <span className="label mt-1 block text-[0.43rem]! tracking-[0.18em]! text-dim">{node.nodeLabel}</span>
          <span className="mt-2 block truncate font-mono text-[0.65rem] text-faint">{node.handle}</span>
        </span>
      </span>
    </a>
  );
}

function CircuitTraces() {
  return (
    <svg aria-hidden className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block" viewBox="0 0 1180 560">
      <path className="signal-trace signal-trace--gold" d="M360 180 H485 Q520 180 520 215 V280 Q520 318 558 318 H720" />
      <path className="signal-trace signal-trace--cyan" d="M370 390 H470 Q515 390 515 430 V465 H760" />
      <path className="signal-trace signal-trace--cyan" d="M865 210 V305 Q865 335 895 335 H1035" />
      <path className="signal-trace signal-trace--gold" d="M850 430 H930 Q960 430 960 388 V360" />
      <path className="signal-trace signal-trace--dim" d="M205 92 H300 Q338 92 338 130 V168" />
      <circle className="signal-trace-node" cx="520" cy="280" r="4" />
      <circle className="signal-trace-node" cx="865" cy="305" r="4" />
      <circle className="signal-trace-node signal-trace-node--gold" cx="960" cy="388" r="4" />
    </svg>
  );
}

export default function SignalBoard({ states, design = signalDesign }: SignalBoardProps) {
  return (
    <div className="relative z-10 mx-auto w-full max-w-7xl">
      <div className="mb-7 flex flex-col gap-4 border-b border-hairline pb-5 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          <h2 className="font-display text-[clamp(2.25rem,6vw,4.8rem)] font-light leading-[0.92] text-ink">
            Signal Layer
          </h2>
          <p className="mt-4 max-w-2xl font-serif text-[clamp(1.1rem,2vw,1.45rem)] leading-relaxed text-faint">
            A live uplink into motion, music, building, and public archives.
          </p>
        </div>
        <span className="label text-[0.62rem]! text-dim">LIVE UPLINK BOARD · 06</span>
      </div>

      <div
        className={cx(
          "signal-board relative overflow-hidden border border-[rgba(232,230,225,0.12)] p-3 sm:p-5 lg:p-6",
          themeClasses[design.theme],
          design.animationLevel !== "none" && "signal-board--animated"
        )}
      >
        <CircuitTraces />
        <div aria-hidden className="signal-mobile-rail lg:hidden" />

        <div className="relative z-10 grid gap-4 lg:grid-cols-[minmax(360px,0.98fr)_minmax(360px,1.02fr)] lg:grid-rows-[auto_auto]">
          <StravaCore state={states.strava} frame={design.stravaFrame} />
          <SpotifyFrequency state={states.spotify} frame={design.spotifyFrame} />

          {design.showSocialNodes ? (
            <div className="grid gap-3 sm:grid-cols-3 lg:col-span-2 lg:grid-cols-3">
              {socialNodes.map((node) => (
                <SocialNodeChip key={node.id} node={node} frame={design.socialFrame} />
              ))}
            </div>
          ) : null}
        </div>

        <p className="relative z-10 mt-5 font-mono text-[0.58rem] uppercase tracking-[0.22em] text-dim">
          API relays: Strava + Spotify · Static nodes: GitHub / LinkedIn / Instagram · iframe layer disabled
        </p>
      </div>
    </div>
  );
}

function StravaMark() {
  return (
    <svg className="h-7 w-7" viewBox="0 0 32 32" fill="currentColor" aria-hidden>
      <path d="M13.2 4 5.4 20h4.6l3.2-6.7 3.2 6.7H21L13.2 4Z" />
      <path d="m21.2 15.8-4.6 9.8h3l1.6-3.4 1.7 3.4h3.7l-5.4-9.8Z" opacity="0.72" />
    </svg>
  );
}

function SpotifyMark() {
  return (
    <svg className="h-7 w-7" viewBox="0 0 32 32" fill="none" aria-hidden>
      <circle cx="16" cy="16" r="13" fill="currentColor" opacity="0.16" />
      <path
        d="M9.2 12.4c4.8-1.4 9.3-1.1 13.7 1.1M10.1 16.3c3.9-1.1 7.8-.8 11.5.9M11.2 20c3-.7 5.8-.5 8.5.8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function BrandIcon({ id }: { id: (typeof socialNodes)[number]["id"] }) {
  if (id === "github") {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12 .7a11.3 11.3 0 0 0-3.6 22c.57.1.78-.25.78-.55v-2.1c-3.18.69-3.85-1.36-3.85-1.36-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.24 3.33.95.1-.74.4-1.24.72-1.52-2.54-.29-5.21-1.27-5.21-5.64 0-1.25.45-2.26 1.18-3.06-.12-.29-.51-1.45.11-3.02 0 0 .96-.31 3.13 1.17A10.9 10.9 0 0 1 12 5.5c.97 0 1.93.13 2.84.38 2.17-1.48 3.13-1.17 3.13-1.17.62 1.57.23 2.73.11 3.02.74.8 1.18 1.81 1.18 3.06 0 4.38-2.67 5.34-5.22 5.63.41.35.77 1.04.77 2.1v3.63c0 .3.2.66.79.55A11.3 11.3 0 0 0 12 .7Z"
        />
      </svg>
    );
  }

  if (id === "linkedin") {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M5.34 7.77A2.45 2.45 0 1 1 5.34 2.88a2.45 2.45 0 0 1 0 4.9ZM3.25 21.1h4.17V9.3H3.25v11.8Zm6.52 0h4.17v-6.43c0-1.7.32-3.34 2.43-3.34 2.07 0 2.1 1.94 2.1 3.45v6.32h4.16v-7.13c0-3.5-.75-6.18-4.84-6.18-1.96 0-3.28 1.08-3.82 2.1h-.06V9.3H9.77v11.8Z" />
      </svg>
    );
  }

  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4.1" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
    </svg>
  );
}

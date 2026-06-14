/**
 * Live uplinks — the section of the site that phones home to the
 * services Jafar actually uses. GitHub is wired and public (no token).
 * The others are "antennae" awaiting an OAuth relay; flip `live` and add
 * the fetcher when the keys exist. Keep this list as the single source.
 */
export interface Signal {
  id: "github" | "strava" | "spotify" | "mymind";
  label: string;
  channel: string; // what it broadcasts
  accent: string;
  glyph: string;
  live: boolean;
  status?: "LIVE" | "LINKED" | "STANDBY";
  /** shown until the uplink is live */
  pending: string;
  href?: string;
  endpoint?: `/api/signals/${"strava" | "spotify" | "mymind"}`;
  embeds?: {
    title: string;
    src: string;
    height: number;
    allow?: string;
    note?: string;
  }[];
}

export const GITHUB_USER = "jaclose";
export const GITHUB_REPO = "jd_website";

export const signals: Signal[] = [
  {
    id: "github",
    label: "GitHub",
    channel: "commits to this universe",
    accent: "#e8e6e1",
    glyph: "⌥",
    live: true,
    status: "LIVE",
    pending: "",
    href: `https://github.com/${GITHUB_USER}`,
  },
  {
    id: "strava",
    label: "Strava",
    channel: "the miles under the study",
    accent: "#fc5200",
    glyph: "▲",
    live: false,
    status: "LINKED",
    pending: "NATIVE API RELAY · iframe fallback available",
    endpoint: "/api/signals/strava",
    embeds: [
      {
        title: "Jafar's latest Strava rides",
        src: "https://www.strava.com/athletes/86740264/latest-rides/562f0d8d70db1930e3b1fc8e5bcec6e3549c0da9",
        height: 454,
      },
      {
        title: "Jafar's Strava activity summary",
        src: "https://www.strava.com/athletes/86740264/activity-summary/562f0d8d70db1930e3b1fc8e5bcec6e3549c0da9",
        height: 160,
      },
    ],
  },
  {
    id: "spotify",
    label: "Spotify",
    channel: "what plays while the work happens",
    accent: "#1db954",
    glyph: "♪",
    live: false,
    status: "LINKED",
    pending: "NATIVE API RELAY · player embed fallback available",
    endpoint: "/api/signals/spotify",
    embeds: [
      {
        title: "Spotify track player",
        src: "https://open.spotify.com/embed/track/0Lc3coQTcMMJiiEFi7BG2z?utm_source=generator",
        height: 152,
        allow: "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture",
        note: "Spotify iframes can embed tracks/playlists, but currently-playing needs the API relay.",
      },
    ],
  },
  {
    id: "mymind",
    label: "mymind",
    channel: "the saved fragments, the half-thoughts",
    accent: "#c9a0e8",
    glyph: "❖",
    live: false,
    status: "STANDBY",
    pending: "PRIVATE API WATCH · ready when mymind exposes an endpoint",
    endpoint: "/api/signals/mymind",
  },
];

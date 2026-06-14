/**
 * Live uplinks — the section of the site that phones home to the
 * services Jafar actually uses. GitHub is wired and public; Strava and
 * Spotify use embeddable widgets until their optional OAuth relays are set.
 */
export interface Signal {
  id: "github" | "strava" | "spotify";
  label: string;
  channel: string; // what it broadcasts
  accent: string;
  glyph: string;
  live: boolean;
  status?: "LIVE" | "LINKED" | "STANDBY";
  /** shown until the uplink is live */
  pending: string;
  href?: string;
  endpoint?: `/api/signals/${"strava" | "spotify"}`;
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
    pending: "PUBLIC WIDGET · NATIVE API OPTIONAL",
    endpoint: "/api/signals/strava",
    embeds: [
      {
        title: "Jafar's latest Strava rides",
        src: "https://www.strava.com/athletes/86740264/latest-rides/562f0d8d70db1930e3b1fc8e5bcec6e3549c0da9",
        height: 454,
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
    pending: "PLAYER WIDGET · NATIVE API OPTIONAL",
    endpoint: "/api/signals/spotify",
    embeds: [
      {
        title: "Spotify track player",
        src: "https://open.spotify.com/embed/track/0Lc3coQTcMMJiiEFi7BG2z?utm_source=generator",
        height: 152,
        allow: "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture",
        note: "Currently-playing will switch on when the Spotify relay token is added.",
      },
    ],
  },
];

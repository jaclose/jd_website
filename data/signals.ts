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
  /** shown until the uplink is live */
  pending: string;
  href?: string;
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
    pending: "AWAITING UPLINK · runs & rides will surface here",
    href: "https://www.strava.com",
  },
  {
    id: "spotify",
    label: "Spotify",
    channel: "what plays while the work happens",
    accent: "#1db954",
    glyph: "♪",
    live: false,
    pending: "AWAITING UPLINK · recent listening will surface here",
    href: "https://open.spotify.com",
  },
  {
    id: "mymind",
    label: "mymind",
    channel: "the saved fragments, the half-thoughts",
    accent: "#c9a0e8",
    glyph: "❖",
    live: false,
    pending: "AWAITING UPLINK · saved cards will surface here",
    href: "https://mymind.com",
  },
];

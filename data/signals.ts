/**
 * Signal Layer configuration.
 *
 * Spotify and Strava are live API uplinks. Public social profiles are link-out
 * nodes so the section stays focused instead of becoming a feed wall.
 */
export type NativeSignalId = "strava" | "spotify";
export type SocialNodeId = "github" | "linkedin" | "instagram";

export type SignalTheme = "motherboard" | "archive" | "clinical" | "celestial" | "terminal" | "minimal";
export type SignalFrame = "chip" | "glass" | "ledger" | "orbital" | "console" | "card" | "waveform";

export interface NativeSignal {
  id: NativeSignalId;
  label: string;
  title: string;
  nodeLabel: string;
  channel: string;
  accent: string;
  endpoint: `/api/signals/${NativeSignalId}`;
}

export interface SocialNode {
  id: SocialNodeId;
  label: string;
  nodeLabel: string;
  href: string;
  type: "build" | "professional" | "visual";
  accent: string;
  handle: string;
}

export interface SignalDesign {
  theme: SignalTheme;
  stravaFrame: SignalFrame;
  spotifyFrame: SignalFrame;
  socialFrame: SignalFrame;
  showSocialNodes: boolean;
  animationLevel: "none" | "subtle" | "active";
}

export const GITHUB_USER = "jaclose";
export const GITHUB_REPO = "jd_website";

export const nativeSignals: NativeSignal[] = [
  {
    id: "strava",
    label: "Strava",
    title: "Physical Core",
    nodeLabel: "BODY SIGNAL",
    channel: "recent training telemetry",
    accent: "#fc7a1f",
    endpoint: "/api/signals/strava",
  },
  {
    id: "spotify",
    label: "Spotify",
    title: "Current Frequency",
    nodeLabel: "AUDIO SIGNAL",
    channel: "now playing / recent track",
    accent: "#67e8a5",
    endpoint: "/api/signals/spotify",
  },
];

export const socialNodes: SocialNode[] = [
  {
    id: "github",
    label: "GitHub",
    nodeLabel: "Build Archive",
    href: `https://github.com/${GITHUB_USER}`,
    type: "build",
    accent: "#e8e6e1",
    handle: `@${GITHUB_USER}`,
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    nodeLabel: "Professional Signal",
    href: "https://www.linkedin.com/in/jafardabbagh/",
    type: "professional",
    accent: "#72c7ff",
    handle: "in/jafardabbagh",
  },
  {
    id: "instagram",
    label: "Instagram",
    nodeLabel: "Visual Archive",
    href: "https://www.instagram.com/jafardabbagh/",
    type: "visual",
    accent: "#f2a6c8",
    handle: "@jafardabbagh",
  },
];

export const signalDesign: SignalDesign = {
  theme: "motherboard",
  stravaFrame: "chip",
  spotifyFrame: "waveform",
  socialFrame: "chip",
  showSocialNodes: true,
  animationLevel: "subtle",
};

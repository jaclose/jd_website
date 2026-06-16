import type { Metadata } from "next";
import { Fraunces, Cormorant_Garamond, IBM_Plex_Mono, Amiri } from "next/font/google";
import SmoothScroll from "@/components/SmoothScroll";
import Cursor from "@/components/Cursor";
import VisitTracker from "@/components/VisitTracker";
import AchievementToast from "@/components/AchievementToast";
import { SITE_URL } from "@/lib/seo";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["opsz"],
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
});

const amiri = Amiri({
  subsets: ["arabic"],
  weight: ["400"],
  variable: "--font-amiri",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Jafar Dabbagh — the JD-1184 system",
  description:
    "Essays, field notes, and a garden that terraforms its planet. Dispatches from study, faith, and the battle to stay present.",
  authors: [{ name: "Jafar Dabbagh", url: SITE_URL }],
  creator: "Jafar Dabbagh",
  openGraph: {
    type: "website",
    siteName: "Jafar Dabbagh",
    url: SITE_URL,
    locale: "en_US",
    title: "Jafar Dabbagh — the JD-1184 system",
    description:
      "Essays, field notes, and a garden that terraforms its planet. Dispatches from study, faith, and the battle to stay present.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Jafar Dabbagh — the JD-1184 system",
    description:
      "Essays, field notes, and a garden that terraforms its planet.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        id="page-root"
        className={`${fraunces.variable} ${cormorant.variable} ${plexMono.variable} ${amiri.variable} grain`}
      >
        <SmoothScroll />
        <VisitTracker />
        {children}
        <Cursor />
        <AchievementToast />
      </body>
    </html>
  );
}

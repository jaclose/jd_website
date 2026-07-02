import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Fraunces, Cormorant_Garamond, IBM_Plex_Mono, Amiri } from "next/font/google";
import SmoothScroll from "@/components/SmoothScroll";
import Cursor from "@/components/Cursor";
import VisitTracker from "@/components/VisitTracker";
import AchievementToast from "@/components/AchievementToast";
import { SITE_URL } from "@/lib/seo";
import "./globals.css";

const siteTitle = "Jafar Dabbagh | JD-1184";
const siteDescription =
  "Essays, field notes, and a living Sanctum on study, faith, discipline, medicine, and the work of becoming useful.";
const previewImage = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "Jafar Dabbagh — JD-1184, essays, field notes, and the Sanctum",
};

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
  title: siteTitle,
  description: siteDescription,
  authors: [{ name: "Jafar Dabbagh", url: SITE_URL }],
  creator: "Jafar Dabbagh",
  openGraph: {
    type: "website",
    siteName: "Jafar Dabbagh",
    url: SITE_URL,
    locale: "en_US",
    title: siteTitle,
    description: siteDescription,
    images: [previewImage],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: [previewImage],
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
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

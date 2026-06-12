import type { Metadata } from "next";
import { Fraunces, Cormorant_Garamond, IBM_Plex_Mono, Amiri } from "next/font/google";
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
  title: "Jafar Dabbagh — the JD-1184 system",
  description:
    "Essays, field notes, and a garden that terraforms its planet. Dispatches from study, faith, and the battle to stay present.",
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
        {children}
      </body>
    </html>
  );
}

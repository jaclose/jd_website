import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Jafar Dabbagh",
    template: "%s | Jafar Dabbagh",
  },
  description:
    "Personal site of Jafar Dabbagh — portfolio, writing, and contact.",
  metadataBase: new URL("https://jafardabbagh.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://jafardabbagh.com",
    siteName: "Jafar Dabbagh",
    title: "Jafar Dabbagh",
    description:
      "Personal site of Jafar Dabbagh — portfolio, writing, and contact.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Jafar Dabbagh",
    description:
      "Personal site of Jafar Dabbagh — portfolio, writing, and contact.",
    creator: "@jafardabbagh",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 antialiased">
        <Nav />
        <main className="flex-1 pt-16">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

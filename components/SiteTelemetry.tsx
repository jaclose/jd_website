"use client";
import { usePathname } from "next/navigation";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function SiteTelemetry() {
  const pathname = usePathname();
  // Confirmation URLs briefly contain a private credential; never instrument them.
  if (pathname === "/newsletter/confirm") return null;
  return <><Analytics /><SpeedInsights /></>;
}

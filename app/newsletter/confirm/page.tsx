import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import ConfirmPreferences from "@/components/newsletter/ConfirmPreferences";
export const metadata: Metadata = { title: "Your email preferences — Jafar Dabbagh", robots: { index: false, follow: false }, referrer: "no-referrer" };
export default function ConfirmPage() {
  return <><SiteHeader current="newsletter" /><main className="letters-confirm"><p className="label text-starlight">Correspondence · JD-1184</p><h1>Your letters.<br /><em>Your choice.</em></h1><ConfirmPreferences /></main></>;
}

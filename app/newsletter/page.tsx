import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import NewsletterSignup from "@/components/newsletter/NewsletterSignup";
export const metadata: Metadata = { title: "Letters from JD-1184 — Jafar Dabbagh", description: "Essays, field notes, and occasional project updates, by invitation. Choose your letters and confirm your email.", alternates: { canonical: "/newsletter" } };
export default function NewsletterPage() {
  return <><SiteHeader current="newsletter" /><main className="letters-page">
    <header className="letters-intro"><p className="label text-starlight">Correspondence · JD-1184</p><h1>A letter,<br /><em>by invitation.</em></h1><p>A longer thought when it’s ready. A note from the middle of things. An update on what I’m building.</p><p>New writing as it appears, or a weekly or monthly letter with previews. Choose your pace.</p><div className="letter-orbit" aria-hidden><span /><i /></div><Link prefetch={false} href="/essays" className="editorial-link">Read before you subscribe ↗</Link><Link prefetch={false} href="/newsletter/preview" className="editorial-link">Preview a letter ↗</Link></header>
    <div className="letters-forms"><NewsletterSignup source="newsletter" heading="Make room for a letter" /><section id="preferences" className="scroll-mt-28"><NewsletterSignup source="preferences" manage heading="Already on the list?" blurb="Get a private link to change your choices or unsubscribe from everything." /></section></div>
    <p className="letters-signature">Jafar Dabbagh <span>From study, faith, and the workbench.</span></p>
  </main></>;
}

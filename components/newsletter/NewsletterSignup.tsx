"use client";
import Link from "next/link";
import { useId, useState } from "react";
import PreferenceChoices from "./PreferenceChoices";
import type { NewsletterPreference } from "@/lib/newsletter/preferences";

export default function NewsletterSignup({ source, contentSlug, contentType = "all", heading = "Letters from JD-1184", blurb = "Essays, field notes, and occasional project updates. Choose what reaches you.", manage = false }: {
  source?: string; contentSlug?: string; contentType?: "essay" | "field_note" | "all"; heading?: string; blurb?: string; manage?: boolean;
}) {
  const id = useId();
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [preferences, setPreferences] = useState<NewsletterPreference[]>(contentType === "all" ? [] : [contentType]);
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [error, setError] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (status === "loading") return;
    if (!manage && !preferences.length) { setError("Choose at least one kind of update."); setStatus("error"); return; }
    setStatus("loading"); setError("");
    try {
      const response = await fetch("/api/newsletter/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, company, preferences, consent, intent: manage ? "manage" : "subscribe", source, slug: contentSlug }) });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "We couldn’t send your link. Please try again later.");
      setStatus("sent");
    } catch (err) { setError(err instanceof Error ? err.message : "Connection failed. Please try again."); setStatus("error"); }
  }
  return <section className="newsletter-signup" aria-label={manage ? "Manage email preferences" : "Newsletter signup"}>
    <p className="label text-starlight">{heading}</p>
    {status === "sent" ? <div role="status" className="newsletter-success"><h2>Check your inbox.</h2><p>Open the link to review and confirm your preferences. It expires in 30 minutes. You’re only subscribed after you confirm.</p><button type="button" className="editorial-link" onClick={() => setStatus("idle")}>Use a different address</button></div> : <>
      <p className="newsletter-blurb">{blurb}</p>
      <form onSubmit={submit} aria-busy={status === "loading"}>
        <div className="newsletter-honeypot" aria-hidden="true"><label>Leave empty<input name="company" tabIndex={-1} autoComplete="off" value={company} onChange={e => setCompany(e.target.value)} /></label></div>
        {!manage && <PreferenceChoices value={preferences} onChange={setPreferences} disabled={status === "loading"} />}
        <label className="newsletter-email" htmlFor={`${id}-email`}>Email address<input id={`${id}-email`} type="email" name="email" autoComplete="email" required maxLength={254} placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} disabled={status === "loading"} /></label>
        {!manage && <label className="newsletter-consent"><input type="checkbox" required checked={consent} onChange={e => setConsent(e.target.checked)} disabled={status === "loading"} /><span>Email me the updates I select. I can change my preferences or unsubscribe at any time.</span></label>}
        <button className="newsletter-submit" disabled={status === "loading"}>{status === "loading" ? "Sending your link…" : manage ? "Email my preference link →" : "Send confirmation link →"}</button>
        {status === "error" && <p role="alert" className="newsletter-error">{error}</p>}
      </form>
      <p className="newsletter-footnote">{!manage && <>Already subscribed? <Link href="/newsletter#preferences">Manage preferences</Link>. </>}<Link href="/newsletter/privacy">How your email is used</Link>.</p>
    </>}
  </section>;
}

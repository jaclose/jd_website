"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import PreferenceChoices from "./PreferenceChoices";
import type { NewsletterPreference } from "@/lib/newsletter/preferences";

export default function ConfirmPreferences() {
  const token = useRef("");
  const [choices, setChoices] = useState<NewsletterPreference[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "saving" | "done" | "error">("loading");
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    let revision = 0;
    const open = () => {
      const currentRevision = ++revision;
      // A second email link can open in the same tab without remounting React.
      // Keep credentials in memory only, out of analytics and referrers.
      if (window.location.hash) token.current = window.location.hash.slice(1);
      window.history.replaceState(null, "", window.location.pathname);
      setStatus("loading");
      fetch("/api/newsletter/preferences", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: token.current, action: "read" }) }).then(async response => {
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "We couldn’t load your preferences.");
      if (active && revision === currentRevision) { setChoices(result.preferences); setStatus("ready"); }
      }).catch(err => { if (active && revision === currentRevision) { setError(err.message); setStatus("error"); } });
    };
    open();
    window.addEventListener("hashchange", open);
    return () => { active = false; window.removeEventListener("hashchange", open); };
  }, []);
  async function save(preferences: NewsletterPreference[]) {
    if (status !== "ready") return;
    setStatus("saving");
    try {
      const response = await fetch("/api/newsletter/preferences", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: token.current, action: "save", preferences }) });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "We couldn’t save your preferences.");
      setChoices(preferences); setStatus("done"); token.current = "";
    } catch (err) { setError(err instanceof Error ? err.message : "Connection failed."); setStatus("error"); }
  }
  return <section className="newsletter-signup">
    {(status === "loading" || status === "saving") && <p role="status">{status === "loading" ? "Opening your preferences…" : "Saving your choices…"}</p>}
    {(status === "ready" || status === "saving") && <form onSubmit={e => { e.preventDefault(); void save(choices); }}><PreferenceChoices value={choices} onChange={setChoices} disabled={status === "saving"} /><p className="newsletter-footnote">Confirm to receive only the selected updates. Leave everything unchecked to unsubscribe.</p><button className="newsletter-submit" disabled={status === "saving"}>Confirm preferences →</button><button type="button" disabled={status === "saving"} className="editorial-link" onClick={() => void save([])}>Unsubscribe from everything</button></form>}
    {status === "done" && <div role="status" className="newsletter-success"><h2>{choices.length ? "Your choices are saved." : "You’re unsubscribed."}</h2><p>{choices.length ? "Only the letters you selected will reach you." : "No more essays, field notes, or project updates will be sent to this address."}</p><Link className="editorial-link" href="/essays">Return to the writing ↗</Link></div>}
    {status === "error" && <><p role="alert" className="newsletter-error">{error}</p><Link className="editorial-link" href="/newsletter#preferences">Request a new link →</Link></>}
  </section>;
}

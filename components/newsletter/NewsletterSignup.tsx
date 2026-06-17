"use client";
import { useState } from "react";

type Status = "idle" | "loading" | "subscribed" | "already" | "error";

/**
 * Newsletter signup → /api/newsletter/subscribe (Resend). Honeypot + all UI
 * states, accessible, mobile-friendly, dark, literary — not SaaS-slop.
 */
export default function NewsletterSignup({
  source,
  contentSlug,
  contentType = "announcement",
  heading = "Subscribe to new writing",
  blurb = "New essays, field notes, and rare announcements. No spam. Unsubscribe anytime.",
}: {
  source?: string;
  contentSlug?: string;
  contentType?: "essay" | "field_note" | "announcement";
  heading?: string;
  blurb?: string;
}) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [company, setCompany] = useState(""); // honeypot
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "loading") return;
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, firstName, company, source, contentSlug, contentType }),
      });
      const data = await res.json().catch(() => ({ ok: false, error: "" }));
      if (data.ok) {
        setStatus(data.status === "already_subscribed" ? "already" : "subscribed");
      } else {
        setStatus("error");
        setError(data.error || "Couldn't sign you up just now.");
      }
    } catch {
      setStatus("error");
      setError("The relay is down — try again shortly.");
    }
  };

  const done = status === "subscribed" || status === "already";

  return (
    <section
      aria-label="Newsletter signup"
      className="mx-auto max-w-xl border border-hairline bg-[rgba(8,11,18,0.5)] p-6 backdrop-blur-sm md:p-8"
    >
      <p className="label text-[9px]! tracking-[0.28em]! text-starlight/70">{heading.toUpperCase()}</p>
      {done ? (
        <p className="mt-3 font-serif text-base italic leading-snug text-leaf">
          {status === "already"
            ? "You're already on the list — watch the sky."
            : "You're on the manifest. The next transmission will find you."}
        </p>
      ) : (
        <>
          <p className="mt-2 font-serif text-base italic leading-snug text-faint">{blurb}</p>
          <form onSubmit={submit} className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-stretch">
            {/* honeypot — visually hidden, not display:none, off the a11y tree */}
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              name="company"
              className="absolute h-0 w-0 overflow-hidden opacity-0"
            />
            <label className="sr-only" htmlFor="nl-name">
              First name (optional)
            </label>
            <input
              id="nl-name"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name"
              autoComplete="given-name"
              className="w-full border border-hairline bg-[rgba(0,0,0,0.25)] px-3 py-2.5 font-mono text-xs text-ink outline-none transition-colors placeholder:text-dim focus:border-starlight/50 sm:w-32"
            />
            <label className="sr-only" htmlFor="nl-email">
              Email address
            </label>
            <input
              id="nl-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              autoComplete="email"
              className="w-full flex-1 border border-hairline bg-[rgba(0,0,0,0.25)] px-3 py-2.5 font-mono text-xs text-ink outline-none transition-colors placeholder:text-dim focus:border-starlight/50"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="label shrink-0 border border-[rgba(212,184,134,0.5)] bg-[rgba(212,184,134,0.1)] px-5 py-2.5 text-[9px]! tracking-[0.24em]! text-starlight transition-colors hover:bg-[rgba(212,184,134,0.2)] disabled:opacity-50"
            >
              {status === "loading" ? "···" : "SUBSCRIBE"}
            </button>
          </form>
          {status === "error" && error ? (
            <p role="alert" className="mt-3 font-mono text-[11px] text-comet/80">
              {error}
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}

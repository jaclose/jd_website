"use client";
import { useState } from "react";

/**
 * Email signup — relays to Buttondown via /api/subscribe. New essays and
 * field notes go out automatically through Buttondown's RSS automation
 * (pointed at /feed.xml); announcements are sent by hand.
 */
export default function Subscribe() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [msg, setMsg] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === "loading") return;
    setState("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({ ok: false, message: "" }));
      setMsg(data.message ?? "");
      setState(data.ok ? "ok" : "error");
      if (data.ok) setEmail("");
    } catch {
      setState("error");
      setMsg("The relay is down — try again shortly.");
    }
  };

  return (
    <div className="min-w-0">
      <p className="label text-[9px]! tracking-[0.28em]! text-starlight/70">RECEIVE TRANSMISSIONS</p>
      <p className="mt-2 max-w-xs font-serif text-sm italic leading-snug text-faint">
        A signal when a new essay or field note leaves the system.
      </p>
      {state === "ok" ? (
        <p className="mt-3 font-mono text-xs text-leaf">{msg || "You're on the manifest."}</p>
      ) : (
        <form onSubmit={submit} className="mt-3 flex max-w-xs items-center border-b border-hairline focus-within:border-starlight/50">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your frequency · email"
            aria-label="Email address"
            className="min-w-0 flex-1 bg-transparent py-2 font-mono text-xs text-ink outline-none placeholder:text-dim"
          />
          <button
            type="submit"
            disabled={state === "loading"}
            className="label shrink-0 py-2 pl-3 text-[8px]! tracking-[0.26em]! text-starlight transition-colors hover:text-ink disabled:opacity-50"
          >
            {state === "loading" ? "···" : "TRANSMIT ↗"}
          </button>
        </form>
      )}
      {state === "error" && msg ? <p className="mt-2 font-mono text-[11px] text-comet/80">{msg}</p> : null}
    </div>
  );
}

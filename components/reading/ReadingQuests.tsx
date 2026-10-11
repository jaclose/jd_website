"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { essayArtifacts } from "@/data/essays";
import { readingQuests } from "@/data/readingQuests";
import { downloadJournal, useReadingJournal } from "./useReadingJournal";

export default function ReadingQuests({ compact = false }: { compact?: boolean }) {
  const [selected, setSelected] = useState<string>(readingQuests[0].id);
  const entries = useReadingJournal(s => s.entries);
  const error = useReadingJournal(s => s.error);
  useEffect(() => {
    useReadingJournal.getState().hydrate();
    const requested = new URLSearchParams(window.location.search).get("trail");
    if (requested && readingQuests.some(q => q.id === requested)) setSelected(requested);
  }, []);
  const quest = readingQuests.find(q => q.id === selected)!;
  const works = quest.slugs.map(slug => essayArtifacts.find(e => e.id === slug)).filter(e => !!e);
  const complete = essayArtifacts.filter(e => entries[e.id]?.completedAt).length;
  return <section id={compact ? "sanctum-reading" : "reading-quests"} className={`reading-quests ${compact ? "reading-quests--compact" : ""}`} aria-label="Reading quests">
    <div className="journal-heading"><div><p className="label text-starlight">Reading quests · {String(complete).padStart(2, "0")} / {String(essayArtifacts.length).padStart(2, "0")} chapters</p><h2>Follow a thought<br /><em>all the way through.</em></h2><p>Three trails through the archive. Begin anywhere, keep a thought, and return when you’re ready.</p></div><div className="journal-seal" aria-hidden><span>{String(complete).padStart(2, "0")}</span><small>CHAPTERS<br />CARRIED</small></div></div>
    <div className="quest-tabs" role="group" aria-label="Choose a reading trail">{readingQuests.map((q, i) => <button key={q.id} type="button" aria-pressed={selected === q.id} onClick={() => setSelected(q.id)}><span>0{i + 1}</span>{q.title}<small>{q.slugs.filter(s => entries[s]?.completedAt).length}/{q.slugs.length}</small></button>)}</div>
    <div className="quest-route"><div className="quest-brief"><p className="label">The route</p><h3>{quest.title}</h3><p>{quest.subtitle}</p><Link prefetch={false} href="/garden#quest-journal" className="editorial-link">Your Sanctum journal ↗</Link></div><ol>{works.map((e, i) => <li key={e.id} data-complete={!!entries[e.id]?.completedAt}><span className="quest-node" aria-hidden>{entries[e.id]?.completedAt ? "✓" : String(i + 1).padStart(2, "0")}</span><div><p className="label">{e.readTime} · {entries[e.id]?.completedAt ? "Completed" : entries[e.id] ? "In progress" : "Unexplored"}</p><h4><Link prefetch={false} href={`/essays/${e.id}`}>{e.title}</Link></h4><p>{e.thesis}</p><Link prefetch={false} className="editorial-link" href={`/essays/${e.id}`}>{entries[e.id]?.completedAt ? "Read again" : entries[e.id] ? "Continue reading" : "Begin chapter"} →</Link></div></li>)}</ol></div>
    <div className="journal-foot"><p>Saved on this device. Every essay remains open.</p><button type="button" className="editorial-link" onClick={() => downloadJournal({ reading: entries })}>Export reading journal ↓</button></div>{error && <p role="alert">{error}</p>}
  </section>;
}

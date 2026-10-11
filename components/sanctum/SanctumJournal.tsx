"use client";
import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { gardenFeatures } from "@/data/gardenFeatures";
import { sanctumQuests, sanctumAchievements } from "./lib/quests";
import { questProgress, useProgress } from "./lib/progress";
import ReadingQuests from "@/components/reading/ReadingQuests";
import { downloadJournal, useReadingJournal } from "@/components/reading/useReadingJournal";

export default function SanctumJournal() {
  const progress = useProgress();
  const reading = useReadingJournal(s => s.entries);
  useEffect(() => { useProgress.getState().hydrate(); useReadingJournal.getState().hydrate(); }, []);
  const selected = sanctumQuests.find(q => q.id === progress.trackedQuestId) ?? sanctumQuests[0];
  const quests = sanctumQuests.filter(q => !q.secret || Object.keys(progress.secrets).length);
  const completed = quests.filter(q => questProgress(q.id, progress.visited, progress.secrets).complete).length;
  return <section id="quest-journal" className="sanctum-journal" aria-label="Sanctum quest journal">
    <div className="journal-heading"><div><p className="label text-leaf">JD-1184 c · Your field journal</p><h2>A world remembers<br /><em>where you’ve been.</em></h2><p>Choose a trail. Walk its landmarks, or explore their stories here. Each essay you finish lights a small lamp around the AXOM orb in the greenhouse.</p></div><Image src="/cards/axom-orb.svg" alt="AXOM ivory mark on a graphite orb" width={280} height={280} className="journal-orb" /></div>
    <div className="journal-stats"><p><strong>{String(completed).padStart(2, "0")}</strong> trails completed</p><p><strong>{String(Object.keys(progress.achievements).length).padStart(2, "0")}</strong> discoveries recorded</p><p><strong>{String(Object.values(reading).filter(r => r.completedAt).length).padStart(2, "0")}</strong> essays carried</p></div>
    <div className="sanctum-journal-grid"><div className="sanctum-trails" role="group" aria-label="Choose a Sanctum trail">{quests.map(q => { const p = questProgress(q.id, progress.visited, progress.secrets); return <button type="button" key={q.id} aria-pressed={selected.id === q.id} onClick={() => progress.trackQuest(q.id)}><span className="label">{q.kicker} · {p.done}/{p.total}</span><strong>{q.title}</strong><span>{p.complete ? "Trail completed" : selected.id === q.id ? "Following this trail" : "Track this trail →"}</span></button>; })}<p className="journal-hint">Four quiet things wait off the trail. Their locations stay unmarked until you find them in the world.</p></div>
      <div className="journal-objectives"><p className="label text-leaf">{questProgress(selected.id, progress.visited, progress.secrets).complete ? "Completed trail" : "Tracked trail"}</p><h3>{selected.title}</h3><p>{selected.brief}</p><ol>{selected.objectives.map(o => { const feature = gardenFeatures.find(f => f.id === o.id); const done = !!(progress.visited[o.id] || progress.secrets[o.id]); return <li key={o.id} data-complete={done}><details><summary><span aria-hidden>{done ? "✓" : "○"}</span>{o.label}<span className="journal-expand" aria-hidden>+</span></summary><div><p>{feature?.plaqueText ?? (selected.secret ? "Seek this quiet thing in the living Sanctum." : "The threshold gives way to a living garden. This is where your trail begins.")}</p>{feature?.story && <p>{feature.story.summary}</p>}{!selected.secret && <div className="journal-actions"><button type="button" className="journal-button" disabled={done} onClick={() => progress.visit(o.id)}>{done ? "Visit recorded" : "Record this visit"}</button><a className="editorial-link" href={`/garden?sanctumStart=${o.id === "trailhead" ? "start" : o.id}`}>Walk here ↗</a></div>}{feature?.links?.map(l => <a className="editorial-link journal-source" key={l.href} href={l.href} target={l.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">{l.label} ↗</a>)}</div></details></li>; })}</ol><p role="status" className="journal-hint">{questProgress(selected.id, progress.visited, progress.secrets).complete ? "Trail complete. Its discovery is now in your journal." : "Your next visit continues this trail."}</p></div></div>
    <details className="journal-achievements"><summary>Your discoveries · {Object.keys(progress.achievements).length}/{sanctumAchievements.length}</summary><ul>{sanctumAchievements.map(a => <li key={a.id} data-earned={!!progress.achievements[a.id]}><strong>{a.secret && !progress.achievements[a.id] ? "An unmarked discovery" : a.title}</strong><p>{a.secret && !progress.achievements[a.id] ? "Waiting off the trail." : a.detail}</p><span className="label">{progress.achievements[a.id] ? "Recorded" : "Undiscovered"}</span></li>)}</ul></details>
    <div className="journal-foot"><p>Progress stays on this device. Keep a copy for your own records.</p><button type="button" className="editorial-link" onClick={() => downloadJournal({ reading, sanctum: { visited: progress.visited, secrets: progress.secrets, achievements: progress.achievements, metresWalked: progress.metresWalked, trackedQuestId: progress.trackedQuestId } })}>Export your journal ↓</button></div>{progress.storageError && <p role="alert">{progress.storageError}</p>}
    <ReadingQuests compact /><Link className="editorial-link" href="/newsletter">Take a letter from this world with you ↗</Link>
  </section>;
}

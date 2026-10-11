"use client";
import { useEffect, useRef, useState, type RefObject } from "react";
import Link from "next/link";
import { useReadingJournal } from "./useReadingJournal";
import { readingQuests } from "@/data/readingQuests";

export default function ReadingCheckpoint({ slug, scrollRoot }: { slug: string; scrollRoot?: RefObject<HTMLDivElement | null> }) {
  const end = useRef<HTMLElement>(null);
  const [reached, setReached] = useState(false);
  const entry = useReadingJournal(s => s.entries[slug]);
  const error = useReadingJournal(s => s.error);
  const update = useReadingJournal(s => s.update);
  const trail = readingQuests.find(q => q.slugs.some(s => s === slug));
  const next = trail?.slugs[trail.slugs.findIndex(s => s === slug) + 1];
  useEffect(() => {
    useReadingJournal.getState().hydrate();
    if (!useReadingJournal.getState().entries[slug]) update(slug, {});
    const observer = new IntersectionObserver(([e]) => { if (e.isIntersecting) setReached(true); }, { root: scrollRoot?.current ?? null });
    if (end.current) observer.observe(end.current);
    return () => observer.disconnect();
  }, [slug, scrollRoot, update]);
  return <section ref={end} className="reading-checkpoint" aria-label="Your reading journal">
    <p className="label text-starlight">Your journal · {entry?.completedAt ? "Chapter completed" : "End of the chapter"}</p>
    <h2>{entry?.completedAt ? "Something to carry with you." : "Pause here for a moment."}</h2>
    <p>A chapter counts when you say it does. Your reading and reflections stay on this device.</p>
    <button type="button" className="journal-button" disabled={!reached || !!entry?.completedAt} onClick={() => update(slug, { completedAt: Date.now(), position: 1 })}>{entry?.completedAt ? "Read · recorded in your journal" : "Mark as read"}</button>
    {entry?.completedAt && <button type="button" className="journal-undo editorial-link" onClick={() => update(slug, { completedAt: undefined })}>Mark unread</button>}
    <label className="journal-reflection">A thought to keep <span>Optional · private · {entry?.reflection.length ?? 0}/1600</span><textarea maxLength={1600} rows={3} placeholder="What stayed with you?" value={entry?.reflection ?? ""} onChange={e => update(slug, { reflection: e.target.value })} /></label>
    {error && <p role="alert">{error}</p>}
    <div className="journal-actions">{next && <Link prefetch={false} className="editorial-link" href={`/essays/${next}`}>Next chapter →</Link>}<Link prefetch={false} className="editorial-link" href={`/essays${trail ? `?trail=${trail.id}` : ""}#reading-quests`}>Return to your reading trail ↗</Link></div>
    <span role="status" className="sr-only">{entry?.completedAt ? "Chapter completed. Your reading trail has been updated." : ""}</span>
  </section>;
}

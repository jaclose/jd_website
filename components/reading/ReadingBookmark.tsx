"use client";
import { useEffect, useState, type RefObject } from "react";
import { useReadingJournal } from "./useReadingJournal";
export default function ReadingBookmark({ slug, scrollRoot }: { slug: string; scrollRoot?: RefObject<HTMLDivElement | null> }) {
  const [saved, setSaved] = useState(0);
  useEffect(() => {
    const store = useReadingJournal.getState(); store.hydrate();
    setSaved(useReadingJournal.getState().entries[slug]?.position ?? 0);
    const root = scrollRoot?.current;
    const target = root ?? window;
    let last = 0;
    const onScroll = () => {
      if (Date.now() - last < 1000) return;
      const article = (root ?? document).querySelector("article.prose-space");
      if (!article) return;
      const top = root?.getBoundingClientRect().top ?? 0;
      const height = (root?.clientHeight ?? window.innerHeight);
      const rect = article.getBoundingClientRect();
      if (rect.top > top || rect.bottom < top) return;
      const position = Math.max(0, Math.min(1, (top - rect.top) / Math.max(1, rect.height - height)));
      if (position > .01) { last = Date.now(); store.update(slug, { position }); }
    };
    target.addEventListener("scroll", onScroll, { passive: true });
    return () => target.removeEventListener("scroll", onScroll);
  }, [slug, scrollRoot]);
  function resume() {
    const root = scrollRoot?.current;
    const article = (root ?? document).querySelector("article.prose-space");
    if (!article) return;
    const height = root?.clientHeight ?? window.innerHeight;
    const rect = article.getBoundingClientRect();
    const offset = (root?.scrollTop ?? window.scrollY) + rect.top - (root?.getBoundingClientRect().top ?? 0) + saved * Math.max(1, rect.height - height);
    (root ?? window).scrollTo({ top: offset, behavior: "instant" });
    setSaved(0);
  }
  return saved > .02 && saved < .98 ? <div className="reading-bookmark"><p>A bookmark is waiting.</p><button type="button" className="editorial-link" onClick={resume}>Resume at {Math.round(saved * 100)}% →</button></div> : null;
}

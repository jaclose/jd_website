"use client";
import { useEffect } from "react";
import Snap from "lenis/snap";

/**
 * Scroll choreography for the homepage: when a scroll settles near a
 * section boundary, the page glides the rest of the way so every scene
 * arrives framed. Proximity-based — long sections still read freely.
 */
export default function SectionSnap({ ids }: { ids: string[] }) {
  useEffect(() => {
    const lenis = window.__lenis;
    if (!lenis) return;

    const snap = new Snap(lenis, {
      type: "mandatory",
      duration: 1.05,
      debounce: 260,
    });

    // top of page — the full system
    snap.add(0);
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) snap.addElement(el, { align: ["start"] });
    }
    // the footer is the final landing
    const footer = document.querySelector("footer");
    if (footer instanceof HTMLElement) snap.addElement(footer, { align: ["end"] });
    return () => {
      snap.destroy();
    };
  }, [ids]);
  return null;
}

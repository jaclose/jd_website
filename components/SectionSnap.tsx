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
      type: "proximity",
      distanceThreshold: "30%",
      duration: 0.9,
      debounce: 350,
    });

    // top of page — the full system
    snap.add(0);
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) snap.addElement(el, { align: ["start"] });
    }
    return () => {
      snap.destroy();
    };
  }, [ids]);
  return null;
}

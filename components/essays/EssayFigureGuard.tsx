"use client";
import { useEffect } from "react";

/**
 * Defensive guard for the scientific-paper figures. Those <img>s are injected
 * as raw HTML via dangerouslySetInnerHTML, so they can't carry React error
 * handlers. If a figure image ever fails to load (a missing/renamed file in
 * production), we swap the broken <img> for a styled "image unavailable" plate
 * and log a clear warning — the essay never collapses to a broken-image icon
 * or a blank column, and the scholarly figcaption stays intact.
 */
export default function EssayFigureGuard() {
  useEffect(() => {
    const imgs = Array.from(
      document.querySelectorAll<HTMLImageElement>(
        ".scientific-paper .paper-figure img"
      )
    );

    const fail = (img: HTMLImageElement) => {
      if (img.dataset.fallbackApplied) return;
      img.dataset.fallbackApplied = "1";
      const src = img.getAttribute("src") ?? "(unknown source)";
      const figure = img.closest("figure");
      const label =
        figure?.querySelector("figcaption strong")?.textContent?.trim() ??
        figure?.id ??
        "Figure";

      console.warn(
        `[essay] missing figure image — "${label}" could not load (${src}). ` +
          `Rendering fallback plate instead.`
      );

      const plate = document.createElement("div");
      plate.className = "paper-figure-fallback";
      plate.setAttribute("role", "img");
      plate.setAttribute("aria-label", img.getAttribute("alt") ?? label);
      plate.innerHTML =
        `<span class="paper-figure-fallback__mark" aria-hidden="true">⌖</span>` +
        `<span class="paper-figure-fallback__label">${label} · image unavailable</span>`;
      img.replaceWith(plate);
    };

    imgs.forEach((img) => {
      img.addEventListener("error", () => fail(img));
      // already failed before this effect ran (cached error / SSR markup)
      if (img.complete && img.naturalWidth === 0) fail(img);
    });
  }, []);

  return null;
}

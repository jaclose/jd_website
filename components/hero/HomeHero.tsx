"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import SiteHeader from "@/components/SiteHeader";

const SpatialHero = dynamic(() => import("./SpatialHero"), { ssr: false });

/** The same system, with a calm chart for touch, reduced motion and unavailable WebGL. */
export default function HomeHero() {
  const [spatial, setSpatial] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 900px) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    const update = () => {
      if (!media.matches) { setSpatial(false); return; }
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2");
      setSpatial(!!gl);
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
    };
    update(); media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  if (spatial) return <><SpatialHero /><nav className="hero-shortcuts" aria-label="Start here"><Link href="#statement">Start reading ↓</Link><Link href="/newsletter">Letters by email ↗</Link></nav></>;
  return <><SiteHeader /><section className="quiet-system">
    <div className="quiet-orbits" aria-hidden><i /><i /><i /><b /><span>JD-1184</span></div>
    <div className="quiet-title"><p className="label text-starlight">JD-1184 · A personal universe</p><h1>Jafar<br /><em>Dabbagh</em></h1><p>Medicine, faith, and the work of becoming useful.</p><Link className="editorial-link" href="#statement">Start reading <span aria-hidden>↓</span></Link></div>
  </section></>;
}

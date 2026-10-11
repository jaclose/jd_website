"use client";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useState } from "react";
import { deployments } from "@/data/deployments";
const DuelField = dynamic(() => import("@/components/duel-field/DuelField"), { ssr: false });

export default function DeploymentsDeck() {
  const [interactive, setInteractive] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 900px) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    const update = () => setInteractive(media.matches);
    update(); media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  if (interactive) return <DuelField />;
  return <section id="deployments" className="calm-deployments">
    <p className="label text-starlight">JD-1184 · Projects in the world</p>
    <h2>The Duel Field</h2>
    {deployments.map(d => <article key={d.id} className="calm-deployment">
      {d.art && <Image src={d.art} alt={`${d.name} app mark`} width={512} height={512} sizes="(max-width: 600px) 220px, 320px" />}
      <div><p className="label">{d.stats.version} · {d.stats.platform}</p><h3>{d.name}</h3><p>{d.effect}</p><nav aria-label={`${d.name} links`}>
        {d.webUrl && <a className="editorial-link" href={d.webUrl} target="_blank" rel="noopener noreferrer">Open {d.name} ↗</a>}
        <a className="editorial-link" href={d.repoUrl} target="_blank" rel="noopener noreferrer">View source ↗</a>
      </nav></div>
    </article>)}
  </section>;
}

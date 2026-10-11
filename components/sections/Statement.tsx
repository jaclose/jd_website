import Image from "next/image";
import Link from "next/link";
import { essays, fieldNotes, formatDate } from "@/lib/content";
import { essayMeta } from "@/data/meta";

export default function Statement() {
  const latest = essays[0];
  const note = fieldNotes[0];
  const art = latest && essayMeta[latest.slug];
  return (
    <section id="statement" className="editorial-entry scroll-mt-24">
      <div className="editorial-intro">
        <p className="label text-starlight">A field guide to JD-1184</p>
        <h2>Chasing truth in<br /><em>struggle & stillness.</em></h2>
        <p>I’m Jafar, a medical student at St. George’s University. I write about faith, attention, and the work of becoming useful. I also build the tools I wish I had.</p>
        <Link prefetch={false} className="editorial-link" href="/about">Meet the person behind the system <span aria-hidden>↗</span></Link>
      </div>
      <div className="editorial-dispatches">
        {latest && <Link prefetch={false} href={`/essays/${latest.slug}`} className="editorial-feature">
          {art && <div className="editorial-cover"><Image src={art.cover} alt={art.alt} fill sizes="(max-width: 700px) 34vw, 230px" /></div>}
          <div><p className="label">Latest essay · {formatDate(latest.date)}</p><h3>{latest.title}</h3><p>{art?.subtitle || latest.excerpt}</p><span className="editorial-link">Read the essay <span aria-hidden>↗</span></span></div>
        </Link>}
        {note && <Link prefetch={false} className="editorial-row" href={`/field-notes#${note.slug}`}><span className="label">From the field · {formatDate(note.date)}</span><h3>{note.title}</h3><span aria-hidden>↗</span></Link>}
        <a className="editorial-row" href="https://axom.info" target="_blank" rel="noopener noreferrer"><span className="label">On the workbench · Pre-beta</span><h3>AXOM. A system for the work.</h3><span aria-hidden>↗</span></a>
      </div>
      <nav className="editorial-index" aria-label="Explore the site">
        {[['01', 'Essays', '/essays'], ['02', 'Field Notes', '/field-notes'], ['03', 'The Sanctum', '/garden'], ['04', 'Projects', '/#deployments'], ['05', 'Letters by email', '/newsletter']].map(([n, label, href]) => <Link prefetch={false} key={href} href={href}><span>{n}</span>{label}<span aria-hidden>↗</span></Link>)}
      </nav>
    </section>
  );
}

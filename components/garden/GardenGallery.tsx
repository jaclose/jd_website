import { garden, gardenArchive, STAGE_NAMES } from "@/data/garden";
import TreeGlyph from "@/components/TreeGlyph";

/** The readable counterpart to the walk. No horizontal scroll or motion prerequisite. */
export default function GardenGallery() {
  return <section className="garden-register" aria-labelledby="garden-register-title"><p className="label text-leaf">The living record · JD-1184 c</p><h2 id="garden-register-title">What grows here.</h2><p className="garden-register-intro">The projects, disciplines, and practices behind the landscape. Each has its own pace.</p>
    <div className="garden-plots">{garden.filter(p => p.status !== "archived").map(item => <article key={item.id} id={`plot-${item.id}`}>
      <TreeGlyph skill={item} height={120} className="garden-plot-tree" />
      <div><p className="label">{item.domain} · {STAGE_NAMES[item.stage]}</p><h3>{item.title}</h3><p>{item.note}</p><div className="garden-plot-links">{item.projectUrl && <a href={item.projectUrl} target="_blank" rel="noopener noreferrer">Open {item.title} ↗</a>}{item.repoUrl && <a href={item.repoUrl} target="_blank" rel="noopener noreferrer">Source ↗</a>}</div></div>
    </article>)}</div>
    <details className="garden-history"><summary>Earlier roots · project history</summary><p>Earlier experiments remain part of the record. Current medical-study work is gathered under AXOM.</p>{gardenArchive.map(item => <article key={item.id}><h3>{item.title}</h3><p>{item.description}</p>{item.repoUrl && <a href={item.repoUrl} target="_blank" rel="noopener noreferrer">Original repository ↗</a>}</article>)}</details>
  </section>;
}

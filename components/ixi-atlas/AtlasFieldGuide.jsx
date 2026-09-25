import Link from "next/link";
import { atlasGuides, getAtlasGuide } from "../../lib/ixi-atlas/guideRegistry.mjs";
import { atlasLessonHref } from "../../lib/ixi-atlas/helpRoutes.mjs";
import { atlasAssemblyHref, atlasFamilyHref } from "../../lib/ixi-atlas/navigation.mjs";
import styles from "./IXITechnicalAtlas.module.css";

export default function AtlasFieldGuide({ topic }) {
  const guide = getAtlasGuide(topic);
  const demoHref = guide.demo?.startsWith("family:") ? atlasFamilyHref(guide.demo.split(":")[1]) : guide.demo === "chassis" ? atlasAssemblyHref("chassis") : atlasAssemblyHref("machine", guide.demo === "machine" ? "object" : guide.demo);
  return <section className={styles.guideLayout} aria-label={guide.title}>
    <article className={styles.guideArticle}>
      <div className={styles.guideKicker}><span>{guide.group}</span><b>{guide.coverage}</b></div>
      <h1 tabIndex={-1} id="atlas-lesson-title">{guide.title}</h1>
      <p className={styles.guideSummary}>{guide.summary}</p>
      <ol className={styles.guideSteps}>{guide.steps.map(([title, text], index) => <li key={title}>
        <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><div><h2>{title}</h2><p>{text}</p></div>
      </li>)}</ol>
      <div className={styles.guideOutcome}><span>WHAT TO CHECK</span><p>{guide.result}</p></div>
      {guide.demo && <Link className={styles.guideDemoLink} href={demoHref} shallow>
        <span>{guide.coverage === "Interactive lesson" ? "TRY THE DEMONSTRATION" : "EXPLORE THE SHARED CONTROLS"}</span>
        <strong>{guide.demo === "chassis" ? "Open the Chassis blueprint" : "Open the Machine Card workbench"} <i>↗</i></strong>
        <small>{guide.demo === "chassis" ? "Select the stations and inspect their layout." : "Use a sample machine. Your records stay unchanged."}</small>
      </Link>}
      {guide.coverage === "Quick start" && <p className={styles.guideCoverage}>This is a quick-start guide. A complete interactive walkthrough for this workflow is still in development. Available actions depend on your access and the selected record.</p>}
    </article>
    <aside className={styles.guideAside}>
      <span className={styles.guideAsideTitle}>CONTINUE EXPLORING</span>
      <nav aria-label="Related Atlas lessons">{guide.related.map(id => <Link key={id} href={atlasLessonHref(id)} shallow><span>{getAtlasGuide(id).title}</span><b aria-hidden="true">→</b></Link>)}</nav>
      <div className={styles.guideReturn}><strong>Your work stays open.</strong><p>Return to your original browser tab when ready. You can visit any Atlas lesson from here.</p></div>
      <details className={styles.guideAllTopics}><summary>ALL {atlasGuides.length} GUIDES</summary><nav aria-label="All Atlas lessons">{atlasGuides.map(item => <Link key={item.id} href={atlasLessonHref(item.id)} shallow aria-current={topic === item.id ? "page" : undefined}>{item.title}</Link>)}</nav></details>
    </aside>
  </section>;
}

import Link from "next/link";
import { atlasFamilies } from "../../lib/ixi-atlas/familyRegistry.mjs";
import { atlasAssemblyHref, atlasFamilyHref } from "../../lib/ixi-atlas/navigation.mjs";
import styles from "./AtlasFamilyWorkbench.module.css";

export default function AtlasFamilyNav({ selected = "" }) {
  return <nav className={styles.familyNav} aria-label="Machine Card families">
    <Link shallow href={atlasAssemblyHref("machine")} aria-current={!selected ? "page" : undefined}>Marketplace & shared controls</Link>
    {atlasFamilies.map(family => <Link shallow key={family.id} href={atlasFamilyHref(family.id)} aria-current={selected === family.id ? "page" : undefined}>{family.title}</Link>)}
  </nav>;
}


import styles from "./operatingNav.module.css";

// One destination map for the authenticated operating workspaces. The pages
// retain their own tools and data; this component only supplies navigation.
const DESTINATIONS = [
  { label: "DASHBOARD", detail: "Your working space", icon: "▦", href: "/account" },
  { label: "AOS / WORK", detail: "Company & objects", icon: "◫", href: "/aos/work" },
  { label: "INVENTORY", detail: "Owned machines", icon: "▤", href: "/account/my-listings-v2" },
  { label: "SALES DESK", detail: "Customers & deals", icon: "▣", href: "/sales-desk" },
  { label: "TRAN$ACT", detail: "Financial work", icon: "$", href: "/transact" },
  { label: "SOLD", detail: "Sales & settlement", icon: "✓", href: "/sold" },
  { label: "POST", detail: "Add a machine", icon: "+", href: "/post-free" },
  { label: "MARKETPLACE", detail: "Browse machines", icon: "⌕", href: "/browse-v2" }
];

export default function IXIOperatingNav({ active, className = "", canFinancial = true }) {
  return <nav className={`${styles.nav} ${className}`} aria-label="IXI operating environments">
    {DESTINATIONS.filter(item => canFinancial || item.href !== "/transact").map(item => <a key={item.href} href={item.href} aria-current={active === item.href ? "page" : undefined}>
      <span className={styles.icon} aria-hidden="true">{item.icon}</span>
      <span className={styles.copy}><strong>{item.label}</strong><small>{item.detail}</small></span>
      <span className={styles.arrow} aria-hidden="true">↗</span>
    </a>)}
  </nav>;
}

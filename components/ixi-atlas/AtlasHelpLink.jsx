import { useRouter } from "next/router";
import { atlasHelpHref } from "../../lib/ixi-atlas/helpRoutes.mjs";

export default function AtlasHelpLink({ topic = "", moduleId = "" }) {
  const router = useRouter();
  return <a className="atlas-help-link" data-ixi-atlas-help
    href={atlasHelpHref({ pathname: router.pathname, moduleId, topic })}
    target="_blank" rel="noopener noreferrer" aria-label="Help / Atlas — opens in a new tab"
    title="Instructions for this workspace. Opens in a new tab.">
    <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 6c-3-2-6-2-9-1v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1Zm0 0v14" /></svg>
    <span>HELP <i>/ ATLAS</i></span>
    <style jsx>{`
      .atlas-help-link { display:inline-flex; flex-shrink:0; align-items:center; justify-content:center; gap:7px; min-height:44px; padding:0 11px; border:1px solid rgba(255,196,0,.36); border-radius:5px; background:#12140f; color:#f3cf55!important; text-decoration:none; font:750 11px/1.2 "Inter Variable",Inter,sans-serif; letter-spacing:.03em; white-space:nowrap; }
      .atlas-help-link:hover { background:#242317; border-color:#f3c400; }
      .atlas-help-link:focus-visible { outline:2px solid #00bce7; outline-offset:3px; }
      .atlas-help-link i { font-style:normal; }
      @media(max-width:850px) { .atlas-help-link { padding:0 8px; gap:5px; font-size:10px; } .atlas-help-link i { display:none; } }
    `}</style>
  </a>;
}

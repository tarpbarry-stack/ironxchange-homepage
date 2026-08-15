import { getIXITransactModules } from "./IXITransactModuleRegistry";

const clean = value => String(value ?? "").trim();

export default function IXITransactConsolePanel({
  context = {},
  onClose = null,
  onOpenModule = null
}) {
  const objectType = clean(context?.primary?.objectType);
  const modules = getIXITransactModules({
    objectType,
    permissions: Array.isArray(context?.permissions) ? context.permissions : []
  });

  return (
    <div className="ixi-transact-console">
      <header>
        <div>
          <span>IXI TRAN$ACT</span>
          <strong>CONSOLE</strong>
          <small>{clean(context?.primary?.label) || "AOS OBJECT"}</small>
        </div>
        <button type="button" onClick={() => onClose?.()}>×</button>
      </header>

      <main>
        <div className="console-label">APPLICATION MODULES</div>
        <div className="module-list">
          {modules.map(module => (
            <button
              type="button"
              key={module.id}
              onClick={() => onOpenModule?.(module, context)}
            >
              <span>{clean(module.group).toUpperCase()}</span>
              <strong>{module.label}</strong>
              <small>{module.documentType}</small>
              <b>›</b>
            </button>
          ))}
        </div>

        <div className="console-label context-label">LOCKED CONTEXT</div>
        <div className="context-grid">
          <div><span>OBJECT</span><b>{clean(context?.primary?.label) || "—"}</b></div>
          <div><span>TYPE</span><b>{objectType || "—"}</b></div>
          <div><span>LOCATION</span><b>{clean(context?.location?.label) || "—"}</b></div>
          <div><span>ACTOR</span><b>{clean(context?.actor?.label) || "CURRENT USER"}</b></div>
          <div><span>PASSPORT</span><b>{clean(context?.primary?.passportId) || "PENDING"}</b></div>
          <div><span>ACTIVE WO</span><b>{clean(context?.activeWorkOrder?.workOrderNumber || context?.activeWorkOrder?.id) || "NONE"}</b></div>
        </div>
      </main>

      <style jsx>{`
        .ixi-transact-console,.ixi-transact-console *{box-sizing:border-box}
        .ixi-transact-console{position:relative;width:298px;height:471px;overflow:hidden;border:1px solid rgba(255,196,0,.16);border-radius:14px;background:linear-gradient(180deg,rgba(255,196,0,.028),transparent 34%),#0b0c0c;color:#f3f3f3;font-family:Arial,sans-serif;box-shadow:0 18px 34px rgba(0,0,0,.42)}
        header{position:absolute;top:0;left:0;right:0;height:48px;padding:7px 9px;border-bottom:1px solid rgba(255,255,255,.06);display:flex;justify-content:space-between;align-items:flex-start}
        header span{display:block;color:#ffc400;font-size:6.5px;font-weight:950;letter-spacing:.08em}
        header strong{display:block;margin-top:3px;font-size:15px;font-weight:950}
        header small{display:block;margin-top:2px;max-width:210px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#707672;font-size:5px;font-weight:900;text-transform:uppercase}
        header button{width:22px;height:22px;padding:0;border:1px solid rgba(255,255,255,.08);border-radius:4px;background:#080909;color:#ffc400;font-size:14px}
        main{position:absolute;top:48px;bottom:0;left:0;right:0;overflow-y:auto;padding:7px;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.13) transparent}
        .console-label{margin:1px 2px 5px;color:#767c79;font-size:5.5px;font-weight:950;letter-spacing:.08em}
        .module-list{display:grid;grid-template-columns:1fr 1fr;gap:5px}
        .module-list button{position:relative;height:54px;padding:6px 18px 6px 7px;border:1px solid rgba(255,255,255,.07);border-radius:5px;background:linear-gradient(180deg,#141717,#0d0f0f);color:#eee;text-align:left}
        .module-list button span{display:block;color:#666c69;font-size:4.5px;font-weight:950}
        .module-list button strong{display:block;margin-top:4px;font-size:7.5px;font-weight:950}
        .module-list button small{display:block;margin-top:3px;color:#ffc400;font-size:4.5px;font-weight:900}
        .module-list button b{position:absolute;right:7px;top:20px;color:#ffc400;font-size:11px}
        .context-label{margin-top:9px}
        .context-grid{display:grid;grid-template-columns:1fr 1fr;gap:4px}
        .context-grid div{min-height:44px;padding:6px;border:1px solid rgba(255,255,255,.055);border-radius:5px;background:#0f1111;overflow:hidden}
        .context-grid span{display:block;color:#676d69;font-size:4.5px;font-weight:950}
        .context-grid b{display:block;margin-top:5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#eceeec;font-size:6px;font-weight:950;text-transform:uppercase}
      `}</style>
    </div>
  );
}

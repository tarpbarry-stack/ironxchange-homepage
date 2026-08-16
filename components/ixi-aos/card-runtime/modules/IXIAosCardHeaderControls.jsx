import { useState } from "react";
import { useIXIAosCardCommands } from "../IXIAosCardCommandContext";
import { getObjectActionCapabilities } from "../IXIAosSemanticObjectPresentation";
import IXIAosOfficeSkinCompatibilityStyles from "./IXIAosOfficeSkinCompatibilityStyles";
import IXIAosLocationVisualCorrections from "./IXIAosLocationVisualCorrections";
import IXIAosTransactContrastPass from "./IXIAosTransactContrastPass";
import IXIAosCardSkinSystemStyles from "./IXIAosCardSkinSystemStyles";
import IXIAosExpandedSkinStyles from "./IXIAosExpandedSkinStyles";

const DEFAULT_SKINS = [
  { id: "v12", label: "V12" },
  { id: "default", label: "DEFAULT" },
  { id: "steel", label: "STEEL" },
  { id: "blueprint", label: "BLUE" },
  { id: "industrial", label: "INDUSTRIAL" },
  { id: "ledger", label: "LEDGER" },
  { id: "foundry", label: "FOUNDRY" },
  { id: "stock", label: "STOCK CERTIFICATE" },
  { id: "bond", label: "BOND CERTIFICATE" },
  { id: "modern-money", label: "MODERN MONEY" },
  { id: "old-currency", label: "OLD CURRENCY" }
];

export default function IXIAosCardHeaderControls({
  canAdd = false,
  canEdit = false,
  canTransact = null,
  canHide = true,
  canDelete = true,
  editing = false,
  onAdd = null,
  onToggleEdit = null,
  onTransact = null,
  onHide = null,
  onDelete = null,
  onOpenConsole = null,
  skinId = "",
  skinOptions = [],
  onSkinChange = null
}) {
  const runtimeCommands = useIXIAosCardCommands();
  const effective = getObjectActionCapabilities(runtimeCommands?.object || {});
  const [menuOpen, setMenuOpen] = useState(false);
  const [localSkinId, setLocalSkinId] = useState("v12");

  const resolvedOnTransact =
    typeof onTransact === "function"
      ? onTransact
      : runtimeCommands?.onOpenTransact;

  const transactRequested =
    canTransact === null || canTransact === undefined
      ? effective.canTransact === true
      : canTransact === true;

  const showAdd = canAdd === true && effective.canCreate !== false && typeof onAdd === "function";
  const showEdit = canEdit === true && effective.canEdit !== false && typeof onToggleEdit === "function";
  const showTransact = transactRequested && effective.canTransact === true && typeof resolvedOnTransact === "function";
  const showConsole = effective.canOpenConsole !== false && typeof onOpenConsole === "function";
  const showHide = canHide !== false && effective.canHide !== false && typeof onHide === "function";
  const showDelete = canDelete !== false && effective.canDelete === true && typeof onDelete === "function";

  function stop(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
  }

  const supplied = Array.isArray(skinOptions)
    ? skinOptions.filter(option => option && typeof option === "object" && String(option.id || "").trim())
    : [];

  const options = Array.from(
    new Map(
      [...DEFAULT_SKINS, ...supplied]
        .map(option => [String(option.id || "").trim(), option])
    ).values()
  );

  const resolvedSkinId = String(skinId || localSkinId || "v12").trim();

  function chooseSkin(event, id) {
    stop(event);
    setLocalSkinId(id);
    onSkinChange?.(id);
    setMenuOpen(false);
  }

  return (
    <div className={`ixi-aos-card-header-controls skin-${resolvedSkinId}`} data-card-skin={resolvedSkinId} onPointerDown={event => event.stopPropagation()}>
      {showAdd ? <button type="button" className="header-action add" onClick={event => { stop(event); onAdd(); }}>+</button> : null}
      {showEdit ? <button type="button" className={`header-action edit ${editing ? "active" : ""}`} onClick={event => { stop(event); if (!editing) onToggleEdit(); }}>EDIT</button> : null}
      {showTransact ? <button type="button" className="header-action transact" onClick={event => { stop(event); resolvedOnTransact(); }}>$</button> : null}

      <div className="menu-shell">
        <button type="button" className="header-action menu" onClick={event => { stop(event); setMenuOpen(value => !value); }}>⋮</button>
        {menuOpen ? (
          <div className="header-menu" onClick={event => event.stopPropagation()}>
            <div className="skin-menu-group">
              <div className="menu-label">SKIN</div>
              {options.map(option => {
                const id = String(option.id || "").trim();
                return (
                  <button key={id} type="button" className={id === resolvedSkinId ? "skin-option active" : "skin-option"} onClick={event => chooseSkin(event, id)}>
                    {String(option.label || id).trim()}
                    {id === resolvedSkinId ? <span>✓</span> : null}
                  </button>
                );
              })}
            </div>
            {showConsole ? <button type="button" onClick={event => { stop(event); setMenuOpen(false); onOpenConsole(); }}>OPEN CONSOLE</button> : null}
            {showHide ? <button type="button" onClick={event => { stop(event); setMenuOpen(false); onHide(); }}>HIDE</button> : null}
            {showDelete ? <button type="button" className="danger" onClick={event => { stop(event); setMenuOpen(false); onDelete(); }}>DELETE</button> : null}
          </div>
        ) : null}
      </div>

      <style jsx>{`
        .ixi-aos-card-header-controls{position:absolute;top:9px;right:8px;height:20px;display:flex;align-items:center;z-index:180}.header-action{height:20px;min-width:22px;display:grid;place-items:center;padding:0 6px;border:0;border-left:1px solid rgba(255,255,255,.055);background:transparent;color:rgba(255,255,255,.48);font:950 6px/1 Arial;cursor:pointer}.ixi-aos-card-header-controls>.header-action:first-child{border-left:0}.header-action.add{min-width:23px;color:#ffc400;font-size:17px;font-weight:500}.header-action.edit{min-width:34px;color:rgba(255,255,255,.62)}.header-action.transact{min-width:25px;color:#ffc400;font-size:16px;font-weight:500}.header-action.menu{min-width:23px;color:rgba(255,255,255,.52);font-size:15px}.header-action:hover,.header-action.active{color:#ffc400;background:rgba(255,255,255,.02)}.menu-shell{position:relative;display:flex}.header-menu{position:absolute;top:24px;right:0;width:148px;max-height:328px;overflow:auto;display:flex;flex-direction:column;gap:4px;padding:6px;border:1px solid rgba(255,255,255,.10);border-radius:6px;background:rgba(8,8,8,.985);box-shadow:0 14px 30px rgba(0,0,0,.46);z-index:200}.skin-menu-group{display:flex;flex-direction:column;gap:3px;padding-bottom:5px;border-bottom:1px solid rgba(255,255,255,.06)}.menu-label{padding:2px 6px;color:rgba(255,255,255,.28);font-size:5px;font-weight:950}.header-menu button{width:100%;height:25px;padding:0 7px;border:1px solid rgba(255,255,255,.06);border-radius:4px;background:rgba(255,255,255,.02);color:rgba(255,255,255,.62);font-size:6px;font-weight:950;text-align:left}.header-menu button:hover,.header-menu button.active{border-color:rgba(255,196,0,.28);color:#ffc400}.skin-option{display:flex!important;align-items:center;justify-content:space-between}.danger:hover{color:#ff7070!important}
      `}</style>

      <IXIAosOfficeSkinCompatibilityStyles />
      <IXIAosLocationVisualCorrections />
      <IXIAosTransactContrastPass />
      <IXIAosCardSkinSystemStyles />
      <IXIAosExpandedSkinStyles />
    </div>
  );
}

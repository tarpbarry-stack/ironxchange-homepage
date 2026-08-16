import { useState } from "react";

import {
  useIXIAosCardCommands
} from "../IXIAosCardCommandContext";

import IXIAosActionNotice from "./IXIAosActionNotice";
import IXIAosOfficeSkinCompatibilityStyles from "./IXIAosOfficeSkinCompatibilityStyles";

const DEFAULT_SKINS = [
  { id: "v12", label: "V12" },
  { id: "steel", label: "STEEL" },
  { id: "blueprint", label: "BLUE" },
  { id: "industrial", label: "INDUSTRIAL" }
];

export default function IXIAosCardHeaderControls({
  canAdd = false,
  canEdit = false,
  canTransact = null,
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [localSkinId, setLocalSkinId] = useState("v12");

  const runtimeHasTransact =
    typeof runtimeCommands?.onOpenTransact === "function";

  const resolvedOnTransact =
    typeof onTransact === "function"
      ? onTransact
      : runtimeCommands?.onOpenTransact;

  const showTransact =
    typeof resolvedOnTransact === "function" &&
    (runtimeHasTransact || canTransact !== false);

  function stop(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
  }

  const suppliedSkinOptions = Array.isArray(skinOptions)
    ? skinOptions.filter(option =>
        option &&
        typeof option === "object" &&
        String(option.id || "").trim()
      )
    : [];

  const resolvedSkinOptions = Array.from(
    new Map(
      [...DEFAULT_SKINS, ...suppliedSkinOptions].map(option => [
        String(option.id || "").trim(),
        option
      ])
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
    <div
      className={`ixi-aos-card-header-controls skin-${resolvedSkinId}`}
      data-card-skin={resolvedSkinId}
      onPointerDown={event => event.stopPropagation()}
    >
      {canAdd ? (
        <button
          type="button"
          className="header-action add"
          aria-label="Add related object"
          title="Add related object"
          onClick={event => {
            stop(event);
            onAdd?.();
          }}
        >
          +
        </button>
      ) : null}

      {canEdit ? (
        <button
          type="button"
          className={["header-action", "edit", editing ? "active" : ""]
            .filter(Boolean)
            .join(" ")}
          aria-label="Edit this object"
          title="Edit this object"
          onClick={event => {
            stop(event);
            if (!editing) onToggleEdit?.();
          }}
        >
          EDIT
        </button>
      ) : null}

      {showTransact ? (
        <button
          type="button"
          className="header-action transact"
          aria-label="Open IXI TRAN$ACT"
          title="Open IXI TRAN$ACT for this object"
          onClick={event => {
            stop(event);
            resolvedOnTransact?.();
          }}
        >
          $
        </button>
      ) : null}

      <div className="menu-shell">
        <button
          type="button"
          className="header-action menu"
          aria-label="More actions"
          title="More actions"
          onClick={event => {
            stop(event);
            setMenuOpen(current => !current);
          }}
        >
          ⋮
        </button>

        {menuOpen ? (
          <div className="header-menu" onClick={event => event.stopPropagation()}>
            <div className="skin-menu-group">
              <div className="menu-label">SKIN</div>
              {resolvedSkinOptions.map(option => {
                const id = String(option.id || "").trim();
                const label = String(option.label || id).trim();

                return (
                  <button
                    key={id}
                    type="button"
                    className={id === resolvedSkinId ? "skin-option active" : "skin-option"}
                    onClick={event => chooseSkin(event, id)}
                  >
                    {label}
                    {id === resolvedSkinId ? <span>✓</span> : null}
                  </button>
                );
              })}
            </div>

            {typeof onOpenConsole === "function" ? (
              <button
                type="button"
                onClick={event => {
                  stop(event);
                  setMenuOpen(false);
                  onOpenConsole?.();
                }}
              >
                OPEN CONSOLE
              </button>
            ) : null}

            {typeof onHide === "function" ? (
              <button
                type="button"
                onClick={event => {
                  stop(event);
                  setMenuOpen(false);
                  onHide?.();
                }}
              >
                HIDE
              </button>
            ) : null}

            {typeof onDelete === "function" ? (
              <button
                type="button"
                className="danger"
                onClick={event => {
                  stop(event);
                  setMenuOpen(false);
                  onDelete?.();
                }}
              >
                DELETE
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <IXIAosActionNotice variant="office" />

      <style jsx>{`
        .ixi-aos-card-header-controls {
          position: absolute;
          top: 9px;
          right: 8px;
          height: 20px;
          display: flex;
          align-items: center;
          gap: 0;
          z-index: 180;
        }

        .header-action {
          position: relative;
          height: 20px;
          min-width: 22px;
          display: grid;
          place-items: center;
          padding: 0 6px;
          border: 0;
          border-left: 1px solid rgba(255,255,255,.055);
          border-radius: 0;
          background: transparent;
          color: rgba(255,255,255,.48);
          font-family: Arial, Helvetica, sans-serif;
          font-size: 6px;
          font-weight: 950;
          letter-spacing: .035em;
          line-height: 1;
          cursor: pointer;
        }

        .ixi-aos-card-header-controls > .header-action:first-child {
          border-left: 0;
        }

        .header-action.add {
          min-width: 23px;
          color: rgba(255,196,0,.88);
          font-size: 17px;
          font-weight: 500;
          letter-spacing: 0;
        }

        .header-action.edit {
          min-width: 34px;
          color: rgba(255,255,255,.58);
        }

        .header-action.transact {
          min-width: 25px;
          color: rgba(255,196,0,.92);
          font-size: 16px;
          font-weight: 500;
          letter-spacing: 0;
        }

        .header-action.menu {
          min-width: 23px;
          padding: 0 4px;
          color: rgba(255,255,255,.52);
          font-size: 15px;
          letter-spacing: 0;
        }

        .header-action:hover,
        .header-action.active {
          color: #ffc400;
          background: rgba(255,255,255,.02);
        }

        .menu-shell {
          position: relative;
          display: flex;
          align-items: center;
        }

        .header-menu {
          position: absolute;
          top: 24px;
          right: 0;
          width: 132px;
          max-height: 305px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 6px;
          border: 1px solid rgba(255,255,255,.10);
          border-radius: 6px;
          background: rgba(8,8,8,.985);
          box-shadow: 0 14px 30px rgba(0,0,0,.46);
          z-index: 200;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,.14) transparent;
        }

        .skin-menu-group {
          display: flex;
          flex-direction: column;
          gap: 3px;
          margin-bottom: 2px;
          padding-bottom: 5px;
          border-bottom: 1px solid rgba(255,255,255,.06);
        }

        .menu-label {
          padding: 2px 6px 1px;
          color: rgba(255,255,255,.28);
          font-size: 5px;
          font-weight: 950;
          letter-spacing: .08em;
        }

        .header-menu button {
          width: 100%;
          height: 25px;
          padding: 0 7px;
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 4px;
          background: rgba(255,255,255,.02);
          color: rgba(255,255,255,.62);
          font-size: 6px;
          font-weight: 950;
          text-align: left;
          cursor: pointer;
        }

        .header-menu button:hover,
        .header-menu button.skin-option.active {
          border-color: rgba(255,196,0,.28);
          color: #ffc400;
        }

        .header-menu button.skin-option {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex: 0 0 25px;
        }

        .header-menu button.skin-option span {
          color: #ffc400;
          font-size: 7px;
        }

        .header-menu button.danger:hover {
          border-color: rgba(229,62,62,.44);
          color: rgb(255,112,112);
        }
      `}</style>

      <IXIAosOfficeSkinCompatibilityStyles />
    </div>
  );
}

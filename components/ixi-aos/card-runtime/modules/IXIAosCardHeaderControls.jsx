import {
  useState
} from "react";


export default function IXIAosCardHeaderControls({
  canAdd = false,
  canEdit = false,

  editing = false,

  onAdd = null,
  onToggleEdit = null,

  onHide = null,
  onDelete = null,

  onOpenConsole = null,

  skinId = "",
  skinOptions = [],
  onSkinChange = null
}) {
  const [
    menuOpen,
    setMenuOpen
  ] =
    useState(false);


  function stop(
    event
  ) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
  }


  const resolvedSkinOptions =
    Array.isArray(skinOptions)
      ? skinOptions.filter(option =>
          option &&
          typeof option === "object" &&
          String(option.id || "").trim()
        )
      : [];


  return (
    <div
      className="ixi-aos-card-header-controls"
      onPointerDown={
        event =>
          event.stopPropagation()
      }
    >
      {canAdd ? (
        <button
          type="button"
          className="header-action add"
          aria-label="Add object"
          title="Add object"
          onClick={
            event => {
              stop(event);
              onAdd?.();
            }
          }
        >
          +
        </button>
      ) : null}


      {canEdit ? (
        <button
          type="button"
          className={[
            "header-action",
            "edit",
            editing
              ? "active"
              : ""
          ]
            .filter(Boolean)
            .join(" ")}
          aria-label="Edit card"
          title="Edit card"
          onClick={
            event => {
              stop(event);

              if (!editing) {
                onToggleEdit?.();
              }
            }
          }
        >
          EDIT
        </button>
      ) : null}


      <div className="menu-shell">
        <button
          type="button"
          className="header-action menu"
          aria-label="Card menu"
          title="Card menu"
          onClick={
            event => {
              stop(event);
              setMenuOpen(
                current =>
                  !current
              );
            }
          }
        >
          ⋮
        </button>


        {menuOpen ? (
          <div
            className="header-menu"
            onClick={
              event =>
                event.stopPropagation()
            }
          >
            {resolvedSkinOptions.length &&
            typeof onSkinChange === "function" ? (
              <div className="skin-menu-group">
                <div className="menu-label">
                  SKIN
                </div>

                {resolvedSkinOptions.map(option => {
                  const id =
                    String(option.id || "").trim();

                  const label =
                    String(
                      option.label ||
                      id
                    ).trim();

                  return (
                    <button
                      key={id}
                      type="button"
                      className={
                        id === skinId
                          ? "skin-option active"
                          : "skin-option"
                      }
                      onClick={
                        event => {
                          stop(event);
                          onSkinChange?.(id);
                          setMenuOpen(false);
                        }
                      }
                    >
                      {label}
                      {id === skinId ? (
                        <span>✓</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ) : null}


            {typeof onOpenConsole ===
            "function" ? (
              <button
                type="button"
                onClick={
                  event => {
                    stop(event);
                    setMenuOpen(false);
                    onOpenConsole?.();
                  }
                }
              >
                OPEN CONSOLE
              </button>
            ) : null}


            {typeof onHide ===
            "function" ? (
              <button
                type="button"
                onClick={
                  event => {
                    stop(event);
                    setMenuOpen(false);
                    onHide?.();
                  }
                }
              >
                HIDE
              </button>
            ) : null}


            {typeof onDelete ===
            "function" ? (
              <button
                type="button"
                className="danger"
                onClick={
                  event => {
                    stop(event);
                    setMenuOpen(false);
                    onDelete?.();
                  }
                }
              >
                DELETE
              </button>
            ) : null}
          </div>
        ) : null}
      </div>


      <style jsx>{`
        .ixi-aos-card-header-controls {
          position: absolute;
          top: 9px;
          right: 10px;
          display: flex;
          align-items: center;
          gap: 5px;
          z-index: 180;
        }

        .header-action {
          height: 22px;
          padding: 0 6px;
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 4px;
          background: rgba(8,8,8,.92);
          color: rgba(255,255,255,.58);
          font-size: 7px;
          font-weight: 950;
          line-height: 1;
          cursor: pointer;
        }

        .header-action.add {
          width: 22px;
          padding: 0;
          color: rgba(255,196,0,.90);
          font-size: 14px;
          font-weight: 700;
        }

        .header-action.menu {
          width: 22px;
          padding: 0;
          font-size: 13px;
        }

        .header-action:hover,
        .header-action.active {
          border-color: rgba(255,196,0,.34);
          color: #ffc400;
          background: rgba(255,196,0,.045);
        }

        .menu-shell {
          position: relative;
        }

        .header-menu {
          position: absolute;
          top: 27px;
          right: 0;
          width: 122px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 6px;
          border: 1px solid rgba(255,255,255,.10);
          border-radius: 6px;
          background: rgba(8,8,8,.985);
          box-shadow: 0 14px 30px rgba(0,0,0,.46);
          z-index: 200;
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
    </div>
  );
}

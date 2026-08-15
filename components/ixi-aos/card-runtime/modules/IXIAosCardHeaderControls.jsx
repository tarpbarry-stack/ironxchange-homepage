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

  onOpenConsole = null
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
          aria-label={
            editing
              ? "Finish editing"
              : "Edit card"
          }
          title={
            editing
              ? "Finish editing"
              : "Edit card"
          }
          onClick={
            event => {
              stop(event);
              onToggleEdit?.();
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
          position: relative;

          flex: 0 0 auto;

          display: flex;
          align-items: center;

          gap: 5px;

          z-index: 80;
        }

        .header-action {
          height: 22px;

          padding: 0 6px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .08
            );

          border-radius: 4px;

          background:
            rgba(
              255,
              255,
              255,
              .025
            );

          color:
            rgba(
              255,
              255,
              255,
              .48
            );

          font-size: 6.5px;
          font-weight: 950;

          line-height: 1;

          cursor: pointer;
        }

        .header-action.add {
          width: 22px;
          padding: 0;

          color:
            rgba(
              255,
              196,
              0,
              .86
            );

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
          border-color:
            rgba(
              255,
              196,
              0,
              .34
            );

          color: #ffc400;

          background:
            rgba(
              255,
              196,
              0,
              .045
            );
        }

        .menu-shell {
          position: relative;
        }

        .header-menu {
          position: absolute;

          top: 27px;
          right: 0;

          width: 112px;

          display: flex;
          flex-direction: column;

          gap: 4px;

          padding: 6px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .10
            );

          border-radius: 6px;

          background:
            rgba(
              8,
              8,
              8,
              .985
            );

          box-shadow:
            0 14px 30px
            rgba(
              0,
              0,
              0,
              .46
            );

          z-index: 200;
        }

        .header-menu button {
          width: 100%;
          height: 25px;

          padding: 0 7px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .06
            );

          border-radius: 4px;

          background:
            rgba(
              255,
              255,
              255,
              .02
            );

          color:
            rgba(
              255,
              255,
              255,
              .62
            );

          font-size: 6px;
          font-weight: 950;

          text-align: left;

          cursor: pointer;
        }

        .header-menu button:hover {
          border-color:
            rgba(
              255,
              196,
              0,
              .28
            );

          color: #ffc400;
        }

        .header-menu button.danger:hover {
          border-color:
            rgba(
              229,
              62,
              62,
              .44
            );

          color:
            rgb(
              255,
              112,
              112
            );
        }
      `}</style>
    </div>
  );
}

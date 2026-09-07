import {
  useEffect,
  useState
} from "react";

import {
  IXI_AOS_BOARD_SKINS,
  normalizeIXIAosBoardSkinId
} from "./IXIAosBoardSkinLibrary";


function getSkinPreviewStyle(skinId) {
  if (skinId === "v12") return {};

  return {
    backgroundImage:
      `url('/images/ixi-aos-board-${skinId}.webp')`,
    backgroundPosition:
      skinId === "ixi-101"
        ? "center 82%"
        : "center",
    backgroundSize:
      skinId === "ixi-101"
        ? "145% auto"
        : "cover"
  };
}


export default function IXIAosBoardSkinPicker({
  open = false,
  selectedSkinId = "ixi-101",
  onSelect = null,
  onClose = null
}) {
  const activeSkinId =
    normalizeIXIAosBoardSkinId(
      selectedSkinId
    );

  const [pendingSkinId, setPendingSkinId] =
    useState(activeSkinId);

  const selectedSkin =
    IXI_AOS_BOARD_SKINS.find(
      skin => skin.skinId === pendingSkinId
    ) || IXI_AOS_BOARD_SKINS[0];

  useEffect(() => {
    if (!open) return;
    setPendingSkinId(activeSkinId);
  }, [open, activeSkinId]);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = event => {
      if (event.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  function useSelectedSkin() {
    onSelect?.(selectedSkin.skinId);
    onClose?.();
  }

  return (
    <div
      className="ixi-board-skin-layer"
      role="presentation"
      onPointerDown={event => {
        event.stopPropagation();
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <section
        className="ixi-board-skin-picker"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ixi-board-skin-title"
        aria-describedby="ixi-board-skin-description"
      >
        <header className="ixi-board-skin-header">
          <div>
            <span>IXI AOS WORK</span>
            <h2 id="ixi-board-skin-title">SELECT BOARD SKIN</h2>
            <p id="ixi-board-skin-description">
              Choose the operating surface for this AOS workspace.
            </p>
          </div>

          <button
            type="button"
            className="ixi-board-skin-close"
            aria-label="Close board skin library"
            onClick={() => onClose?.()}
          >
            ×
          </button>
        </header>

        <div className="ixi-board-skin-content">
          <div className="ixi-board-skin-directory">
            <div className="ixi-board-skin-directory-title">
              <span>BOARD SKIN LIBRARY</span>
              <strong>{IXI_AOS_BOARD_SKINS.length}</strong>
            </div>

            <div className="ixi-board-skin-grid">
              {IXI_AOS_BOARD_SKINS.map(skin => {
                const selected = skin.skinId === pendingSkinId;
                const active = skin.skinId === activeSkinId;

                return (
                  <button
                    key={skin.skinId}
                    type="button"
                    className={`ixi-board-skin-tile ${selected ? "selected" : ""}`}
                    aria-pressed={selected}
                    onClick={() => setPendingSkinId(skin.skinId)}
                    onDoubleClick={() => {
                      onSelect?.(skin.skinId);
                      onClose?.();
                    }}
                  >
                    <span
                      className="ixi-board-skin-thumbnail"
                      style={getSkinPreviewStyle(skin.skinId)}
                      aria-hidden="true"
                    />

                    <span className="ixi-board-skin-tile-copy">
                      <b>{skin.name}</b>
                      <span>{skin.designation}</span>
                    </span>

                    <small>{active ? "ACTIVE" : "SELECT"}</small>
                  </button>
                );
              })}
            </div>
          </div>

          <aside className="ixi-board-skin-selection">
            <div className="ixi-board-skin-selection-title">
              <span>SELECTED SKIN</span>
              <strong>{selectedSkin.name}</strong>
            </div>

            <div className="ixi-board-skin-stage">
              <div
                className="ixi-board-skin-stage-art"
                style={getSkinPreviewStyle(selectedSkin.skinId)}
                aria-hidden="true"
              />

              <div className="ixi-board-skin-stage-copy">
                <span>{selectedSkin.name}</span>
                <strong>{selectedSkin.designation}</strong>
                <p>{selectedSkin.description}</p>
              </div>
            </div>

            <div className="ixi-board-skin-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => onClose?.()}
              >
                CANCEL
              </button>

              <button
                type="button"
                className="primary"
                onClick={useSelectedSkin}
              >
                USE {selectedSkin.name}
              </button>
            </div>

            <footer>
              <span>LIBRARY 01</span>
              <span>{IXI_AOS_BOARD_SKINS.length} SKINS REGISTERED</span>
            </footer>
          </aside>
        </div>
      </section>

      <style jsx>{`
        .ixi-board-skin-layer,
        .ixi-board-skin-layer * { box-sizing: border-box; }

        .ixi-board-skin-layer {
          position: fixed;
          inset: 0;
          z-index: 999990;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 28px;
          background: rgba(0, 0, 0, .82);
          backdrop-filter: blur(8px);
        }

        .ixi-board-skin-picker {
          width: min(1180px, calc(100vw - 56px));
          height: min(820px, calc(100vh - 56px));
          overflow: hidden;
          border: 1px solid rgba(255, 196, 0, .34);
          border-radius: 18px;
          background: linear-gradient(180deg, #151816, #090b0a);
          color: #eef1ef;
          box-shadow: 0 36px 100px #000, inset 0 1px rgba(255, 255, 255, .08);
        }

        .ixi-board-skin-header {
          height: 108px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          padding: 18px 22px;
          border-bottom: 1px solid rgba(255, 255, 255, .08);
          background: linear-gradient(180deg, rgba(255, 255, 255, .035), transparent);
        }

        .ixi-board-skin-header span,
        footer span {
          display: block;
          color: #ffc400;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .09em;
        }

        h2 {
          margin: 6px 0 0;
          color: #eef1ef;
          font-size: 24px;
          line-height: 1;
          font-weight: 950;
          letter-spacing: -.02em;
        }

        .ixi-board-skin-header p {
          margin: 8px 0 0;
          color: #929a95;
          font-size: 12px;
          font-weight: 650;
        }

        .ixi-board-skin-close {
          width: 46px;
          height: 46px;
          flex: 0 0 46px;
          border: 1px solid #3d443f;
          border-radius: 10px;
          background: #101310;
          color: #ffc400;
          font-size: 28px;
          line-height: 1;
          cursor: pointer;
        }

        .ixi-board-skin-content {
          height: calc(100% - 108px);
          display: grid;
          grid-template-columns: minmax(0, 1fr) 430px;
        }

        .ixi-board-skin-directory {
          min-width: 0;
          min-height: 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border-right: 1px solid rgba(255, 255, 255, .08);
        }

        .ixi-board-skin-directory-title,
        .ixi-board-skin-selection-title {
          height: 42px;
          flex: 0 0 42px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          border-bottom: 1px solid rgba(255, 255, 255, .07);
          color: #8e9691;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .08em;
        }

        .ixi-board-skin-directory-title strong,
        .ixi-board-skin-selection-title strong {
          color: #ffc400;
          font-size: 12px;
        }

        .ixi-board-skin-grid {
          min-height: 0;
          flex: 1;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          grid-auto-rows: 150px;
          gap: 9px;
          padding: 12px;
          overflow-x: hidden;
          overflow-y: auto;
          overscroll-behavior: contain;
          scrollbar-gutter: stable;
          scrollbar-width: thin;
          scrollbar-color: #3d4540 #090b0a;
        }

        .ixi-board-skin-grid::-webkit-scrollbar { width: 5px; }
        .ixi-board-skin-grid::-webkit-scrollbar-track { background: #090b0a; }
        .ixi-board-skin-grid::-webkit-scrollbar-thumb {
          border: 1px solid #151916;
          border-radius: 999px;
          background: #3d4540;
        }

        .ixi-board-skin-tile {
          min-width: 0;
          display: grid;
          grid-template-rows: 92px minmax(0, 1fr);
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 8px;
          padding: 8px;
          border: 1px solid #343a36;
          border-radius: 9px;
          background: linear-gradient(180deg, #171a18, #101311);
          color: #eef1ef;
          text-align: left;
          cursor: pointer;
          transition: border-color 140ms ease, background 140ms ease, transform 140ms ease;
        }

        .ixi-board-skin-tile:hover {
          border-color: rgba(255, 196, 0, .48);
          background: #191b18;
          transform: translateY(-1px);
        }

        .ixi-board-skin-tile.selected {
          border-color: #ffc400;
          box-shadow: inset 0 0 0 1px rgba(255, 196, 0, .22);
        }

        .ixi-board-skin-thumbnail {
          grid-column: 1 / -1;
          display: block;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, .08);
          border-radius: 5px;
          background-color: #050606;
          background-repeat: no-repeat;
        }

        .ixi-board-skin-tile-copy {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .ixi-board-skin-tile-copy b {
          color: #ffc400;
          font-size: 13px;
          font-weight: 950;
        }

        .ixi-board-skin-tile-copy span {
          max-width: 100%;
          overflow: hidden;
          color: #858e88;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: .06em;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .ixi-board-skin-tile small {
          align-self: start;
          color: rgba(255, 255, 255, .28);
          font-size: 7px;
          font-weight: 950;
          letter-spacing: .08em;
        }

        .ixi-board-skin-selection {
          min-width: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          overflow: hidden;
        }

        .ixi-board-skin-selection-title { width: 100%; }

        .ixi-board-skin-stage {
          width: calc(100% - 28px);
          margin: 14px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, .1);
          border-radius: 10px;
          background: #050606;
          box-shadow: 0 20px 45px rgba(0, 0, 0, .46);
        }

        .ixi-board-skin-stage-art {
          width: 100%;
          aspect-ratio: 16 / 9;
          border-bottom: 1px solid rgba(255, 255, 255, .08);
          background-color: #050606;
          background-repeat: no-repeat;
        }

        .ixi-board-skin-stage-copy {
          min-height: 150px;
          padding: 18px;
        }

        .ixi-board-skin-stage-copy span {
          color: #ffc400;
          font-size: 11px;
          font-weight: 950;
          letter-spacing: .08em;
        }

        .ixi-board-skin-stage-copy strong {
          display: block;
          margin-top: 6px;
          color: #eef1ef;
          font-size: 21px;
          font-weight: 950;
          letter-spacing: -.01em;
        }

        .ixi-board-skin-stage-copy p {
          margin: 12px 0 0;
          color: #8d958f;
          font-size: 11px;
          font-weight: 650;
          line-height: 1.55;
        }

        .ixi-board-skin-actions {
          width: 100%;
          display: grid;
          grid-template-columns: 120px minmax(0, 1fr);
          gap: 8px;
          margin-top: auto;
          padding: 0 14px 14px;
        }

        .ixi-board-skin-actions button {
          height: 44px;
          border-radius: 7px;
          font-size: 11px;
          font-weight: 950;
          letter-spacing: .05em;
          cursor: pointer;
        }

        .ixi-board-skin-actions .secondary {
          border: 1px solid #3a403c;
          background: #111411;
          color: #aab0ac;
        }

        .ixi-board-skin-actions .primary {
          border: 1px solid #ffc400;
          background: #ffc400;
          color: #090a09;
        }

        footer {
          width: 100%;
          min-height: 38px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 0 16px;
          border-top: 1px solid rgba(255, 255, 255, .06);
        }

        footer span:last-child { color: rgba(255, 255, 255, .25); }

        .ixi-board-skin-close:focus-visible,
        .ixi-board-skin-tile:focus-visible,
        .ixi-board-skin-actions button:focus-visible {
          outline: 2px solid #ffc400;
          outline-offset: 2px;
        }

        @media (max-width: 900px) {
          .ixi-board-skin-layer { padding: 10px; }

          .ixi-board-skin-picker {
            width: calc(100vw - 20px);
            height: calc(100vh - 20px);
          }

          .ixi-board-skin-header {
            height: 118px;
            padding: 14px;
          }

          h2 { font-size: 18px; }
          .ixi-board-skin-header p { font-size: 10px; }

          .ixi-board-skin-content {
            position: relative;
            height: calc(100% - 118px);
            grid-template-columns: 1fr;
          }

          .ixi-board-skin-directory {
            height: 100%;
            padding-bottom: 72px;
            border-right: 0;
          }

          .ixi-board-skin-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            grid-auto-rows: 132px;
          }

          .ixi-board-skin-tile {
            grid-template-rows: 76px minmax(0, 1fr);
          }

          .ixi-board-skin-selection {
            position: absolute;
            left: 10px;
            right: 10px;
            bottom: 10px;
            height: 58px;
            display: flex;
            justify-content: center;
            padding: 7px;
            border: 1px solid rgba(255, 255, 255, .1);
            border-radius: 9px;
            background: #0d100e;
            box-shadow: 0 -10px 30px #000;
          }

          .ixi-board-skin-selection-title,
          .ixi-board-skin-stage,
          footer { display: none; }

          .ixi-board-skin-actions {
            margin: 0;
            padding: 0;
          }
        }
      `}</style>
    </div>
  );
}

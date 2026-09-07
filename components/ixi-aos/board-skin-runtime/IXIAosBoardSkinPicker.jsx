import { useEffect } from "react";

import {
  IXI_AOS_BOARD_SKINS,
  normalizeIXIAosBoardSkinId
} from "./IXIAosBoardSkinLibrary";

export default function IXIAosBoardSkinPicker({
  open = false,
  selectedSkinId = "ixi-101",
  onSelect = null,
  onClose = null
}) {
  const selected =
    normalizeIXIAosBoardSkinId(
      selectedSkinId
    );

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = event => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="ixi-board-skin-layer"
      role="presentation"
      onMouseDown={event => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
    >
      <section
        className="ixi-board-skin-picker"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ixi-board-skin-title"
      >
        <header>
          <div>
            <span>IXI AOS WORK</span>
            <h2 id="ixi-board-skin-title">
              BOARD SKINS
            </h2>
          </div>

          <button
            type="button"
            className="ixi-board-skin-close"
            aria-label="Close board skins"
            onClick={() => onClose?.()}
          >
            ×
          </button>
        </header>

        <div className="ixi-board-skin-list">
          {IXI_AOS_BOARD_SKINS.map(skin => {
            const active =
              skin.skinId === selected;

            return (
              <button
                key={skin.skinId}
                type="button"
                className={`ixi-board-skin-option ${active ? "is-active" : ""}`}
                aria-pressed={active}
                onClick={() => {
                  onSelect?.(skin.skinId);
                  onClose?.();
                }}
              >
                <span
                  className={`ixi-board-skin-preview preview-${skin.skinId}`}
                  aria-hidden="true"
                >
                  {skin.skinId !== "v12" ? (
                    <b>IXI</b>
                  ) : null}
                </span>

                <span className="ixi-board-skin-copy">
                  <span>
                    <strong>{skin.name}</strong>
                    <em>{skin.designation}</em>
                  </span>
                  <small>{skin.description}</small>
                </span>

                <span className="ixi-board-skin-status">
                  {active ? "ACTIVE" : "SELECT"}
                </span>
              </button>
            );
          })}
        </div>

        <footer>
          <span>LIBRARY 01</span>
          <span>
            {IXI_AOS_BOARD_SKINS.length} SKINS REGISTERED
          </span>
        </footer>
      </section>

      <style jsx>{`
        .ixi-board-skin-layer,
        .ixi-board-skin-layer * {
          box-sizing: border-box;
        }

        .ixi-board-skin-layer {
          position: fixed;
          inset: 0;
          z-index: 999990;
          display: grid;
          place-items: center;
          padding: 18px;
          background: rgba(0, 0, 0, .72);
          backdrop-filter: blur(5px);
        }

        .ixi-board-skin-picker {
          width: min(620px, 100%);
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, .12);
          border-radius: 8px;
          background: #0a0b0b;
          box-shadow: 0 28px 90px rgba(0, 0, 0, .72), inset 0 1px rgba(255, 255, 255, .035);
        }

        header {
          min-height: 72px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          padding: 16px 18px;
          border-bottom: 1px solid rgba(255, 255, 255, .075);
        }

        header span,
        footer span {
          color: rgba(255, 196, 0, .82);
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 1.35px;
        }

        h2 {
          margin: 4px 0 0;
          color: rgba(255, 255, 255, .92);
          font-size: 19px;
          line-height: 1;
          letter-spacing: .8px;
        }

        .ixi-board-skin-close {
          width: 38px;
          height: 38px;
          border: 1px solid rgba(255, 255, 255, .1);
          border-radius: 5px;
          background: rgba(255, 255, 255, .025);
          color: rgba(255, 255, 255, .58);
          font-size: 24px;
          line-height: 1;
          cursor: pointer;
        }

        .ixi-board-skin-list {
          display: grid;
          gap: 10px;
          padding: 14px;
        }

        .ixi-board-skin-option {
          width: 100%;
          min-height: 112px;
          display: grid;
          grid-template-columns: 158px minmax(0, 1fr) auto;
          align-items: center;
          gap: 15px;
          padding: 10px;
          border: 1px solid rgba(255, 255, 255, .075);
          border-radius: 6px;
          background: rgba(255, 255, 255, .015);
          color: inherit;
          text-align: left;
          cursor: pointer;
          transition: border-color .16s ease, background .16s ease;
        }

        .ixi-board-skin-option:hover,
        .ixi-board-skin-option.is-active {
          border-color: rgba(255, 196, 0, .42);
          background: rgba(255, 196, 0, .035);
        }

        .ixi-board-skin-preview {
          position: relative;
          height: 88px;
          overflow: hidden;
          display: grid;
          place-items: center;
          border: 1px solid rgba(255, 255, 255, .08);
          border-radius: 4px;
          background-color: #050606;
        }

        .preview-ixi-101 {
          background-image: url('/images/ixi-aos-board-ixi-101.webp');
          background-position: center 82%;
          background-size: 145% auto;
        }

        .preview-ixi-102 {
          background-image: url('/images/ixi-aos-board-ixi-102.webp');
          background-position: center;
          background-size: cover;
        }

        .preview-ixi-103 {
          background-image: url('/images/ixi-aos-board-ixi-103.webp');
          background-position: center;
          background-size: cover;
        }

        .preview-ixi-104 {
          background-image: url('/images/ixi-aos-board-ixi-104.webp');
          background-position: center;
          background-size: cover;
        }

        .preview-ixi-105 {
          background-image: url('/images/ixi-aos-board-ixi-105.webp');
          background-position: center;
          background-size: cover;
        }

        .preview-ixi-106 {
          background-image: url('/images/ixi-aos-board-ixi-106.webp');
          background-position: center;
          background-size: cover;
        }

        .preview-ixi-107 {
          background-image: url('/images/ixi-aos-board-ixi-107.webp');
          background-position: center;
          background-size: cover;
        }

        .preview-ixi-108 {
          background-image: url('/images/ixi-aos-board-ixi-108.webp');
          background-position: center;
          background-size: cover;
        }

        .preview-ixi-109 {
          background-image: url('/images/ixi-aos-board-ixi-109.webp');
          background-position: center;
          background-size: cover;
        }

        .preview-ixi-110 {
          background-image: url('/images/ixi-aos-board-ixi-110.webp');
          background-position: center;
          background-size: cover;
        }

        .preview-ixi-111 {
          background-image: url('/images/ixi-aos-board-ixi-111.webp');
          background-position: center;
          background-size: cover;
        }

        .preview-ixi-112 {
          background-image: url('/images/ixi-aos-board-ixi-112.webp');
          background-position: center;
          background-size: cover;
        }

        .preview-ixi-113 {
          background-image: url('/images/ixi-aos-board-ixi-113.webp');
          background-position: center;
          background-size: cover;
        }

        .preview-ixi-114 {
          background-image: url('/images/ixi-aos-board-ixi-114.webp');
          background-position: center;
          background-size: cover;
        }

        .preview-ixi-115 {
          background-image: url('/images/ixi-aos-board-ixi-115.webp');
          background-position: center;
          background-size: cover;
        }

        .preview-ixi-101 b,
        .preview-ixi-102 b,
        .preview-ixi-103 b,
        .preview-ixi-104 b,
        .preview-ixi-105 b,
        .preview-ixi-106 b,
        .preview-ixi-107 b,
        .preview-ixi-108 b,
        .preview-ixi-109 b,
        .preview-ixi-110 b,
        .preview-ixi-111 b,
        .preview-ixi-112 b,
        .preview-ixi-113 b,
        .preview-ixi-114 b,
        .preview-ixi-115 b {
          color: transparent;
          font-size: 1px;
        }

        .ixi-board-skin-copy,
        .ixi-board-skin-copy > span {
          min-width: 0;
          display: flex;
          flex-direction: column;
        }

        .ixi-board-skin-copy {
          gap: 8px;
        }

        .ixi-board-skin-copy > span {
          gap: 3px;
        }

        .ixi-board-skin-copy strong {
          color: rgba(255, 255, 255, .9);
          font-size: 14px;
          letter-spacing: .75px;
        }

        .ixi-board-skin-copy em {
          color: rgba(0, 194, 255, .72);
          font-size: 8px;
          font-style: normal;
          font-weight: 900;
          letter-spacing: 1.2px;
        }

        .ixi-board-skin-copy small {
          color: rgba(255, 255, 255, .44);
          font-size: 10px;
          font-weight: 650;
          line-height: 1.45;
        }

        .ixi-board-skin-status {
          min-width: 54px;
          color: rgba(255, 255, 255, .34);
          font-size: 8px;
          font-weight: 950;
          letter-spacing: 1px;
          text-align: right;
        }

        .is-active .ixi-board-skin-status {
          color: rgba(255, 196, 0, .9);
        }

        footer {
          min-height: 38px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 0 18px;
          border-top: 1px solid rgba(255, 255, 255, .06);
        }

        footer span:last-child {
          color: rgba(255, 255, 255, .25);
        }

        @media (max-width: 620px) {
          .ixi-board-skin-layer {
            padding: 8px;
          }

          .ixi-board-skin-option {
            grid-template-columns: 108px minmax(0, 1fr);
            min-height: 104px;
          }

          .ixi-board-skin-preview {
            height: 76px;
          }

          .ixi-board-skin-status {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

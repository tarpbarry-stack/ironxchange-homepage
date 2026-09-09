import { useState } from "react";

export default function IXIAosContainerCommandStrip({
  object = {},
  onRecall = null,
  onBoard = null,
  onReturn = null,
  disabled = false
}) {
  const [pending, setPending] = useState("");

  async function fire(event, action, handler) {
    event.preventDefault();
    event.stopPropagation();
    if (disabled || pending || typeof handler !== "function") return;
    setPending(action);
    try {
      await handler(object);
    } finally {
      setPending("");
    }
  }

  return (
    <div className="ixi-aos-container-command-strip">
      <button
        type="button"
        aria-label="Recall direct children"
        title="Recall direct children"
        disabled={disabled || Boolean(pending) || typeof onRecall !== "function"}
        onPointerDown={event => event.stopPropagation()}
        onClick={event => fire(event, "recall", onRecall)}
      >
        <span className="command-symbol">↻</span>
        <span className="command-label">{pending === "recall" ? "RECALLING" : "RECALL"}</span>
      </button>

      <button
        type="button"
        aria-label="Put direct children on Board"
        title="Put direct children on Board"
        disabled={disabled || Boolean(pending) || typeof onBoard !== "function"}
        onPointerDown={event => event.stopPropagation()}
        onClick={event => fire(event, "board", onBoard)}
      >
        <span className="command-symbol">▦</span>
        <span className="command-label">{pending === "board" ? "BOARDING" : "BOARD"}</span>
      </button>

      <button
        type="button"
        aria-label="Return previous workspace arrangement"
        title="Return previous workspace arrangement"
        disabled={disabled || Boolean(pending) || typeof onReturn !== "function"}
        onPointerDown={event => event.stopPropagation()}
        onClick={event => fire(event, "return", onReturn)}
      >
        <span className="command-symbol">↩</span>
        <span className="command-label">{pending === "return" ? "RETURNING" : "RETURN"}</span>
      </button>

      <style jsx>{`
        .ixi-aos-container-command-strip {
          position: absolute;
          left: 6px;
          right: 6px;
          bottom: 81px;
          height: 23px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: transparent;
          z-index: 260;
        }

        button {
          width: 77px;
          min-width: 77px;
          height: 19px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 0 7px;
          border: 1px solid rgba(255,255,255,.07);
          border-radius: 4px;
          background: rgba(255,255,255,.018);
          color: rgba(255,255,255,.62);
          font-size: 7px;
          font-weight: 950;
          letter-spacing: .04em;
          cursor: pointer;
          transition: color 120ms ease, border-color 120ms ease, background 120ms ease, box-shadow 120ms ease;
        }

        button:not(:disabled):hover,
        button:not(:disabled):focus-visible {
          border-color: rgba(0,194,255,.72);
          background: rgba(0,194,255,.10);
          color: #00c2ff;
          box-shadow: 0 0 0 1px rgba(0,194,255,.08);
          outline: none;
        }

        button:disabled {
          cursor: default;
          opacity: .42;
        }

        .command-symbol {
          color: #00c2ff;
          font-size: 11px;
          font-weight: 950;
        }

        .command-label {
          color: inherit;
          font-size: 6px;
          font-weight: 950;
        }
      `}</style>
    </div>
  );
}

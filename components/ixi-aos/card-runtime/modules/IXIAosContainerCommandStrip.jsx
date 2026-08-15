export default function IXIAosContainerCommandStrip({
  object = {},
  onRecall = null,
  onBoard = null,
  onReturn = null
}) {
  function fire(event, handler) {
    event.preventDefault();
    event.stopPropagation();
    handler?.(object);
  }

  return (
    <div className="ixi-aos-container-command-strip">
      <button
        type="button"
        onPointerDown={event => event.stopPropagation()}
        onClick={event => fire(event, onRecall)}
      >
        <span>↻</span>
        RECALL
      </button>

      <button
        type="button"
        onPointerDown={event => event.stopPropagation()}
        onClick={event => fire(event, onBoard)}
      >
        <span>▦</span>
        BOARD
      </button>

      <button
        type="button"
        onPointerDown={event => event.stopPropagation()}
        onClick={event => fire(event, onReturn || onRecall)}
      >
        <span>↩</span>
        RETURN
      </button>

      <style jsx>{`
        .ixi-aos-container-command-strip {
          width: 100%;
          height: 27px;
          min-height: 27px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          border-top: 1px solid rgba(255,255,255,.045);
          border-bottom: 1px solid rgba(0,194,255,.10);
          background: rgba(10,10,10,.96);
        }

        button {
          min-width: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          padding: 0 4px;
          border: 0;
          border-right: 1px solid rgba(255,255,255,.045);
          background: transparent;
          color: rgba(255,255,255,.58);
          font-size: 7px;
          font-weight: 950;
          letter-spacing: .04em;
          cursor: pointer;
        }

        button:last-child {
          border-right: 0;
        }

        button:hover {
          background: rgba(0,194,255,.045);
          color: rgba(255,255,255,.94);
        }

        span {
          color: rgba(0,194,255,.82);
          font-size: 11px;
          font-weight: 950;
        }
      `}</style>
    </div>
  );
}

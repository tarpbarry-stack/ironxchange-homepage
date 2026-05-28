import { useEffect, useMemo, useRef, useState } from "react";

export default function IXInspectLightbox({
  open,
  images = [],
  index = 0,
  title = "Machine photo",
  onClose,
  onChange,
  onInspectEvent
}) {
  const stageRef = useRef(null);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);

  const safeImages = useMemo(
    () => images.filter(Boolean),
    [images]
  );

  const activeIndex =
    safeImages.length > 0
      ? Math.min(Math.max(index, 0), safeImages.length - 1)
      : 0;

  const activeImage = safeImages[activeIndex];

  function resetView() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setDragging(false);
    setDragStart(null);
  }

  function next() {
    if (safeImages.length < 2) return;
    resetView();
    onChange?.((activeIndex + 1) % safeImages.length);
  }

  function prev() {
    if (safeImages.length < 2) return;
    resetView();
    onChange?.((activeIndex - 1 + safeImages.length) % safeImages.length);
  }

  function toggleZoom() {
    const nextZoom = zoom > 1 ? 1 : 2.35;

    setZoom(nextZoom);

    if (nextZoom === 1) {
      setPan({ x: 0, y: 0 });
    }

    onInspectEvent?.("ix_inspect_zoom_toggled", {
      zoom: nextZoom,
      index: activeIndex
    });
  }

  function handleWheel(e) {
    e.preventDefault();

    const delta = e.deltaY > 0 ? -0.25 : 0.25;
    const nextZoom = Math.min(4, Math.max(1, zoom + delta));

    setZoom(nextZoom);

    if (nextZoom === 1) {
      setPan({ x: 0, y: 0 });
    }
  }

  function startPan(e) {
    if (zoom <= 1) return;

    setDragging(true);
    setDragStart({
      x: e.clientX - pan.x,
      y: e.clientY - pan.y
    });
  }

  function movePan(e) {
    if (!dragging || !dragStart || zoom <= 1) return;

    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  }

  function stopPan() {
    setDragging(false);
    setDragStart(null);
  }

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e) {
      if (e.key === "Escape") onClose?.();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "+" || e.key === "=") {
        setZoom(current => Math.min(4, current + 0.35));
      }
      if (e.key === "-") {
        setZoom(current => {
          const nextZoom = Math.max(1, current - 0.35);
          if (nextZoom === 1) setPan({ x: 0, y: 0 });
          return nextZoom;
        });
      }
      if (e.key === "0") resetView();
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, activeIndex, zoom, pan, dragging, dragStart]);

  useEffect(() => {
    if (!open) return;

    resetView();

    onInspectEvent?.("ix_inspect_opened", {
      index: activeIndex,
      imageCount: safeImages.length
    });
  }, [open]);

  useEffect(() => {
    resetView();
  }, [activeIndex]);

  if (!open || !activeImage) return null;

  return (
    <div
      className="ix-inspect"
      role="dialog"
      aria-modal="true"
      aria-label="Machine photo inspection"
    >
      <div className="inspect-topbar">
        <div>
          <span>IX Inspect</span>
          <strong>{title}</strong>
        </div>

        <div className="inspect-tools">
          <button type="button" onClick={() => setZoom(z => Math.max(1, z - 0.35))}>
            −
          </button>

          <button type="button" onClick={toggleZoom}>
            {zoom > 1 ? "Reset" : "Zoom"}
          </button>

          <button type="button" onClick={() => setZoom(z => Math.min(4, z + 0.35))}>
            +
          </button>

          <button type="button" onClick={onClose} className="close-btn">
            ×
          </button>
        </div>
      </div>

      <button type="button" className="inspect-arrow left" onClick={prev}>
        ‹
      </button>

      <div
        ref={stageRef}
        className={`inspect-stage ${zoom > 1 ? "zoomed" : ""}`}
        onWheel={handleWheel}
        onMouseDown={startPan}
        onMouseMove={movePan}
        onMouseUp={stopPan}
        onMouseLeave={stopPan}
        onDoubleClick={toggleZoom}
      >
        <img
          src={activeImage}
          alt={title}
          draggable={false}
          className="inspect-image"
          style={{
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`
          }}
        />
      </div>

      <button type="button" className="inspect-arrow right" onClick={next}>
        ›
      </button>

      <div className="inspect-footer">
        <span>
          {activeIndex + 1}/{safeImages.length}
        </span>

        <span>
          {Math.round(zoom * 100)}%
        </span>

        <span>
          Double click to zoom • Drag to inspect • Esc to close
        </span>
      </div>

      <style jsx>{`
        .ix-inspect {
          position: fixed;
          inset: 0;
          z-index: 99999;
          background:
            radial-gradient(circle at top, rgba(255,196,0,.035), transparent 32%),
            rgba(0,0,0,.965);
          backdrop-filter: blur(6px);
          color: #f2f2f2;
        }

        .inspect-topbar {
          position: absolute;
          top: 18px;
          left: 22px;
          right: 22px;
          z-index: 5;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          pointer-events: none;
        }

        .inspect-topbar span {
          display: block;
          color: #FFC400;
          font-size: 8px;
          font-weight: 950;
          letter-spacing: .8px;
          text-transform: uppercase;
        }

        .inspect-topbar strong {
          display: block;
          max-width: 60vw;
          margin-top: 4px;
          color: rgba(255,255,255,.78);
          font-size: 12px;
          font-weight: 900;
          letter-spacing: .3px;
          text-transform: uppercase;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .inspect-tools {
          display: flex;
          align-items: center;
          gap: 7px;
          pointer-events: auto;
        }

        .inspect-tools button,
        .inspect-arrow {
          border: 1px solid rgba(255,255,255,.08);
          background:
            linear-gradient(180deg, rgba(255,255,255,.035), rgba(255,255,255,0)),
            rgba(18,18,18,.76);
          color: rgba(255,255,255,.70);
          box-shadow:
            0 1px 0 rgba(255,255,255,.04) inset,
            0 16px 38px rgba(0,0,0,.28);
          cursor: pointer;
          transition:
            transform .14s ease,
            border-color .14s ease,
            color .14s ease,
            background .14s ease;
        }

        .inspect-tools button {
          height: 32px;
          min-width: 34px;
          padding: 0 11px;
          border-radius: 999px;
          font-size: 9px;
          font-weight: 950;
          letter-spacing: .55px;
          text-transform: uppercase;
        }

        .inspect-tools button:hover,
        .inspect-arrow:hover {
          transform: translateY(-1px);
          border-color: rgba(255,196,0,.32);
          color: #FFC400;
          background:
            linear-gradient(180deg, rgba(255,196,0,.07), rgba(255,196,0,0)),
            rgba(20,20,20,.88);
        }

        .close-btn {
          color: #ffb3b3 !important;
          font-size: 18px !important;
        }

        .inspect-stage {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          cursor: zoom-in;
          user-select: none;
        }

        .inspect-stage.zoomed {
          cursor: grab;
        }

        .inspect-stage.zoomed:active {
          cursor: grabbing;
        }

        .inspect-image {
          max-width: 94vw;
          max-height: 90vh;
          object-fit: contain;
          border-radius: 12px;
          will-change: transform;
          transition: transform .08s linear;
          box-shadow:
            0 1px 0 rgba(255,255,255,.04) inset,
            0 34px 90px rgba(0,0,0,.58);
        }

        .inspect-arrow {
          position: absolute;
          top: 50%;
          z-index: 4;
          transform: translateY(-50%);
          width: 42px;
          height: 92px;
          border-radius: 12px;
          font-size: 38px;
          font-weight: 300;
        }

        .inspect-arrow.left {
          left: 24px;
        }

        .inspect-arrow.right {
          right: 24px;
        }

        .inspect-footer {
          position: absolute;
          left: 50%;
          bottom: 18px;
          z-index: 5;
          transform: translateX(-50%);
          min-height: 32px;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 13px;
          border: 1px solid rgba(255,255,255,.075);
          border-radius: 999px;
          background: rgba(18,18,18,.72);
          color: rgba(255,255,255,.46);
          font-size: 8.5px;
          font-weight: 900;
          letter-spacing: .5px;
          text-transform: uppercase;
          backdrop-filter: blur(6px);
          box-shadow:
            0 1px 0 rgba(255,255,255,.035) inset,
            0 14px 32px rgba(0,0,0,.28);
        }

        .inspect-footer span:first-child,
        .inspect-footer span:nth-child(2) {
          color: #FFC400;
        }

        @media (max-width: 850px) {
          .inspect-topbar {
            top: 12px;
            left: 12px;
            right: 12px;
            align-items: flex-start;
          }

          .inspect-topbar strong {
            max-width: 48vw;
            font-size: 10px;
          }

          .inspect-tools {
            gap: 5px;
          }

          .inspect-tools button {
            height: 30px;
            min-width: 30px;
            padding: 0 8px;
            font-size: 8px;
          }

          .inspect-arrow {
            width: 34px;
            height: 78px;
            font-size: 32px;
          }

          .inspect-arrow.left {
            left: 8px;
          }

          .inspect-arrow.right {
            right: 8px;
          }

          .inspect-image {
            max-width: 96vw;
            max-height: 84vh;
          }

          .inspect-footer {
            bottom: 12px;
            max-width: calc(100vw - 24px);
            flex-wrap: wrap;
            justify-content: center;
            border-radius: 14px;
            padding: 8px 10px;
            line-height: 1.25;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}

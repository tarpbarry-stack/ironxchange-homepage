import Head from "next/head";
import { useMemo, useState } from "react";
import Navbar from "../../components/Navbar";

import {
  buildIXPhotoVariants,
  getIXActivePhotoUrl
} from "../../lib/ixvision/pipeline/processIXPhoto";

const MODES = [
  { key: "original", label: "ORIGINAL" },
  { key: "clean", label: "CLEAN" },
  { key: "clarity", label: "CLARITY" },
  { key: "dealerPop", label: "POP" }
];

function clampZoom(value) {
  return Math.max(1, Math.min(5, value));
}

function emptyZoom() {
  return {
    zoom: 1,
    x: 0,
    y: 0,
    dragging: false,
    lastX: 0,
    lastY: 0
  };
}

function getModeUrl(photo, mode) {
  if (!photo) return "";

  if (mode === "original") return photo.originalUrl || photo.url || "";
  if (mode === "clarity") return photo.clarityUrl || photo.cleanUrl || photo.url || "";
  if (mode === "dealerPop") return photo.dealerPopUrl || photo.url || "";

  return photo.cleanUrl || photo.url || "";
}

function VisionScreen({
  title,
  url,
  zoomState,
  onZoomChange,
  synced
}) {
  function update(patch) {
    onZoomChange({
      ...zoomState,
      ...patch
    });
  }

  return (
    <div
      className={`vision-screen ${zoomState.zoom > 1 ? "zoom-active" : ""}`}
      onWheel={e => {
        e.preventDefault();

        const nextZoom = clampZoom(
          zoomState.zoom + (e.deltaY < 0 ? 0.25 : -0.25)
        );

        update({
          zoom: nextZoom,
          x: nextZoom === 1 ? 0 : zoomState.x,
          y: nextZoom === 1 ? 0 : zoomState.y
        });
      }}
      onDoubleClick={() => {
        if (zoomState.zoom > 1) {
          update(emptyZoom());
        } else {
          update({
            zoom: 2,
            x: 0,
            y: 0
          });
        }
      }}
      onMouseDown={e => {
        if (zoomState.zoom <= 1) return;

        update({
          dragging: true,
          lastX: e.clientX,
          lastY: e.clientY
        });
      }}
      onMouseMove={e => {
        if (!zoomState.dragging || zoomState.zoom <= 1) return;

        update({
          x: zoomState.x + (e.clientX - zoomState.lastX),
          y: zoomState.y + (e.clientY - zoomState.lastY),
          lastX: e.clientX,
          lastY: e.clientY
        });
      }}
      onMouseUp={() => update({ dragging: false })}
      onMouseLeave={() => update({ dragging: false })}
    >
      <div className="screen-label">
        <span>{title}</span>
        <strong>{zoomState.zoom.toFixed(2)}x</strong>
        {synced ? <em>SYNC</em> : null}
      </div>

      {url ? (
        <img
          src={url}
          alt={title}
          draggable={false}
          style={{
            transform: `translate(${zoomState.x}px, ${zoomState.y}px) scale(${zoomState.zoom})`
          }}
        />
      ) : (
        <div className="empty-screen">DROP A MACHINE PHOTO</div>
      )}
    </div>
  );
}

export default function IXVisionLab() {
  const [photoItems, setPhotoItems] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [make, setMake] = useState("CATERPILLAR");
  const [activeMode, setActiveMode] = useState("clean");
  const [processing, setProcessing] = useState(false);
  const [labRoom, setLabRoom] = useState("lab");
  const [zoomSync, setZoomSync] = useState(true);

  const [zoomStates, setZoomStates] = useState([
    emptyZoom(),
    emptyZoom()
  ]);

  const activePhoto = photoItems[activeIndex] || null;

  const originalUrl = useMemo(() => {
    return getModeUrl(activePhoto, "original");
  }, [activePhoto]);

  const activeUrl = useMemo(() => {
    return getModeUrl(activePhoto, activeMode);
  }, [activePhoto, activeMode]);

  const cleanUrl = useMemo(() => {
    return getModeUrl(activePhoto, "clean");
  }, [activePhoto]);

  const popUrl = useMemo(() => {
    return getModeUrl(activePhoto, "dealerPop");
  }, [activePhoto]);

  function updateZoom(index, nextState) {
    setZoomStates(current => {
      if (zoomSync) {
        return current.map(() => ({ ...nextState }));
      }

      const next = [...current];
      next[index] = nextState;
      return next;
    });
  }

  async function handleFiles(filesInput) {
    const files = Array.from(filesInput || []).filter(file =>
      file.type.startsWith("image/")
    );

    if (!files.length) return;

    setProcessing(true);

    try {
      const mapped = await Promise.all(
        files.slice(0, 24).map(file =>
          buildIXPhotoVariants(file, {
            make,
            companyName: "IronXchange",
            userEmail: "tarpbarry@gmail.com"
          })
        )
      );

      setPhotoItems(current => [...current, ...mapped]);
      setActiveIndex(current => current || 0);
    } catch (err) {
      console.error("IX Vision Lab failed:", err);
      alert(`IX Vision failed: ${err.message || err}`);
    } finally {
      setProcessing(false);
    }
  }

  function removeActivePhoto() {
    setPhotoItems(current => current.filter((_, index) => index !== activeIndex));
    setActiveIndex(0);
  }

  function downloadActive() {
    const url = activeUrl;
    if (!url) return;

    const link = document.createElement("a");
    link.href = url;
    link.download = `ix-vision-${activeMode}.jpg`;
    link.click();
  }

  return (
    <>
      <Head>
        <title>IX Vision Lab | IronXchange</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Navbar />

      <main>
        <section className="lab-shell">
          <header className="lab-header">
            <div>
              <span>IX Vision Engine</span>
              <h1>Vision Lab</h1>
              <p>Private photo clarity room — upload, compare, zoom, tune, repeat.</p>
            </div>

            <div className="room-tabs">
              <button
                type="button"
                className={labRoom === "lab" ? "active" : ""}
                onClick={() => setLabRoom("lab")}
              >
                LAB
              </button>

              <button
                type="button"
                className={labRoom === "compare" ? "active" : ""}
                onClick={() => setLabRoom("compare")}
              >
                COMPARE
              </button>
            </div>
          </header>

          <section className="control-bar">
            <label className="make-control">
              MAKE
              <input
                value={make}
                onChange={e => setMake(e.target.value.toUpperCase())}
                placeholder="CATERPILLAR"
              />
            </label>

            <div className="mode-buttons">
              {MODES.map(mode => (
                <button
                  key={mode.key}
                  type="button"
                  className={activeMode === mode.key ? "active" : ""}
                  onClick={() => setActiveMode(mode.key)}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            <label
              className="upload-zone"
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault();
                handleFiles(e.dataTransfer.files);
              }}
            >
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={e => {
                  handleFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              {processing ? "PROCESSING..." : "+ UPLOAD PHOTOS"}
            </label>

            <button
              type="button"
              className={zoomSync ? "sync active" : "sync"}
              onClick={() => setZoomSync(current => !current)}
            >
              SYNC ZOOM
            </button>

            <button type="button" onClick={downloadActive} disabled={!activeUrl}>
              DOWNLOAD
            </button>

            <button type="button" onClick={removeActivePhoto} disabled={!activePhoto}>
              REMOVE
            </button>
          </section>

          {labRoom === "lab" ? (
            <section className="main-lab-grid">
              <aside className="photo-rail">
                <div className="rail-head">
                  <span>Loaded Photos</span>
                  <strong>{photoItems.length}</strong>
                </div>

                <div className="thumb-list">
                  {photoItems.map((photo, index) => (
                    <button
                      key={photo.id}
                      type="button"
                      className={index === activeIndex ? "active" : ""}
                      onClick={() => setActiveIndex(index)}
                    >
                      <img src={getIXActivePhotoUrl(photo)} alt="" />
                      <span>{index + 1}</span>
                    </button>
                  ))}
                </div>
              </aside>

              <section className="working-room">
                <div className="working-screen">
                  {activeUrl ? (
                    <img src={activeUrl} alt="IX Vision working preview" />
                  ) : (
                    <div className="empty-screen">UPLOAD A PHOTO TO START</div>
                  )}

                  <div className="working-badge">
                    <span>{activeMode === "dealerPop" ? "POP" : activeMode}</span>
                  </div>
                </div>

                <div className="variant-strip">
  {MODES.map(mode => (
    <button
      key={mode.key}
      type="button"
      className={activeMode === mode.key ? "active" : ""}
      onClick={() => setActiveMode(mode.key)}
    >
      <img
        src={
          getModeUrl(activePhoto, mode.key) ||
          "/images/hero-equipment-yard.jpg"
        }
        alt=""
      />
      <span>{mode.label}</span>
    </button>
  ))}
</div>

              <aside className="tune-panel">
                <div className="panel-head">
                  <span>Current Engine</span>
                  <strong>V1 Canvas Pipeline</strong>
                </div>

                <div className="readout">
                  <div>
                    <span>Mode</span>
                    <strong>{activeMode}</strong>
                  </div>

                  <div>
                    <span>Make</span>
                    <strong>{make || "DEFAULT"}</strong>
                  </div>

                  <div>
                    <span>Original</span>
                    <strong>{activePhoto?.originalFile?.size ? `${Math.round(activePhoto.originalFile.size / 1024)} KB` : "—"}</strong>
                  </div>

                  <div>
                    <span>Lane</span>
                    <strong>{activePhoto?.uploadLane || "—"}</strong>
                  </div>
                </div>

                <div className="lab-note">
                  <strong>Next tuning room:</strong>
                  <p>
                    This page proves the room. Next pass adds live clarity sliders,
                    URL import, quality scoring, and true server-side sharp/detail recovery.
                  </p>
                </div>
              </aside>
            </section>
          ) : (
            <section className="compare-room">
              <VisionScreen
                title="ORIGINAL"
                url={originalUrl}
                zoomState={zoomStates[0]}
                synced={zoomSync}
                onZoomChange={next => updateZoom(0, next)}
              />

              <VisionScreen
                title={activeMode === "dealerPop" ? "POP" : activeMode.toUpperCase()}
                url={activeUrl}
                zoomState={zoomStates[1]}
                synced={zoomSync}
                onZoomChange={next => updateZoom(1, next)}
              />
            </section>
          )}
        </section>
      </main>

      <style jsx>{`
        :global(html),
        :global(body) {
          margin: 0;
          min-height: 100%;
          overflow-x: hidden;
          background: #070707;
          color: #d8d8d8;
          font-family: Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
          text-rendering: geometricPrecision;
        }

        * {
          box-sizing: border-box;
        }

        button,
        input {
          font-family: inherit;
        }

        main {
          min-height: calc(100vh - 72px);
          background:
            radial-gradient(circle at top center, rgba(255,196,0,.035), transparent 30%),
            radial-gradient(circle at 18% 12%, rgba(0,209,255,.025), transparent 24%),
            #070707;
        }

        .lab-shell {
          max-width: 1640px;
          margin: 0 auto;
          padding: 12px 18px 28px;
        }

        .lab-header,
        .control-bar,
        .photo-rail,
        .working-room,
        .tune-panel,
        .vision-screen {
          background:
            linear-gradient(180deg, rgba(255,255,255,.032), rgba(255,255,255,0)),
            radial-gradient(circle at top, rgba(255,255,255,.018), transparent 70%),
            #141414;

          border: 1px solid rgba(255,255,255,.065);
          outline: 1px solid rgba(255,255,255,.018);
          border-radius: 14px;

          box-shadow:
            0 1px 0 rgba(255,255,255,.045) inset,
            0 16px 38px rgba(0,0,0,.24);
        }

        .lab-header {
          min-height: 64px;
          padding: 10px 14px;
          margin-bottom: 10px;

          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
        }

        .lab-header span,
        .rail-head span,
        .panel-head span {
          display: block;
          margin-bottom: 3px;

          color: #FFC400;

          font-size: 8px;
          font-weight: 950;
          letter-spacing: .78px;
          text-transform: uppercase;
        }

        .lab-header h1 {
          margin: 0;
          color: #f2f2f2;
          font-size: 22px;
          font-weight: 950;
          letter-spacing: -.65px;
          line-height: 1;
          text-transform: uppercase;
        }

        .lab-header p {
          margin: 5px 0 0;
          color: rgba(255,255,255,.42);
          font-size: 11px;
          line-height: 1.35;
        }

        .room-tabs,
        .mode-buttons {
          display: flex;
          align-items: center;
          gap: 4px;

          padding: 3px;

          border: 1px solid rgba(255,255,255,.055);
          border-radius: 999px;

          background: #0f0f0f;
        }

        .room-tabs button,
        .mode-buttons button,
        .control-bar > button {
          height: 28px;
          padding: 0 11px;

          border: 1px solid transparent;
          border-radius: 999px;

          background: transparent;
          color: rgba(255,255,255,.42);

          font-size: 8px;
          font-weight: 950;
          letter-spacing: .65px;
          text-transform: uppercase;

          cursor: pointer;
        }

        .room-tabs button.active,
        .mode-buttons button.active,
        .control-bar > button.active {
          color: #FFC400;
          border-color: rgba(255,196,0,.24);
          background: rgba(255,196,0,.055);
          box-shadow: 0 0 12px rgba(255,196,0,.055) inset;
        }

        .control-bar {
          padding: 9px 10px;
          margin-bottom: 10px;

          display: flex;
          align-items: end;
          gap: 8px;
          flex-wrap: wrap;
        }

        .make-control {
          display: grid;
          gap: 4px;

          color: rgba(255,255,255,.42);

          font-size: 8px;
          font-weight: 950;
          letter-spacing: .62px;
          text-transform: uppercase;
        }

        .make-control input {
          width: 170px;
          height: 29px;

          border: 1px solid rgba(255,255,255,.075);
          border-radius: 9px;

          background: #0c0c0c;
          color: #f2f2f2;

          padding: 0 9px;

          font-size: 9px;
          font-weight: 900;
          outline: none;
        }

        .upload-zone {
          height: 31px;
          min-width: 148px;

          display: grid;
          place-items: center;

          border-radius: 999px;
          border: 1px dashed rgba(255,196,0,.35);

          background:
            linear-gradient(180deg, rgba(255,196,0,.06), rgba(255,196,0,0)),
            #101010;

          color: #FFC400;

          font-size: 8.5px;
          font-weight: 950;
          letter-spacing: .58px;
          text-transform: uppercase;

          cursor: pointer;
        }

        .upload-zone input {
          display: none;
        }

        .control-bar > button {
          border-color: rgba(255,255,255,.075);
          background: #101010;
        }

        .control-bar > button:disabled {
          opacity: .25;
          cursor: default;
        }

        .main-lab-grid {
          display: grid;
          grid-template-columns: 190px minmax(0, 1fr) 270px;
          gap: 10px;
          align-items: stretch;
          min-height: 680px;
        }

        .photo-rail,
        .working-room,
        .tune-panel {
          padding: 12px;
          min-height: 680px;
        }

        .rail-head,
        .panel-head {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 10px;

          padding-bottom: 9px;
          margin-bottom: 10px;

          border-bottom: 1px solid rgba(255,255,255,.052);
        }

        .rail-head strong,
        .panel-head strong {
          color: rgba(255,255,255,.54);
          font-size: 8.5px;
          font-weight: 950;
          letter-spacing: .62px;
          text-transform: uppercase;
        }

        .thumb-list {
          display: grid;
          gap: 8px;
          max-height: 615px;
          overflow-y: auto;
          padding-right: 3px;
        }

        .thumb-list button {
          position: relative;

          width: 100%;
          height: 92px;

          overflow: hidden;

          border-radius: 10px;
          border: 1px solid rgba(255,255,255,.075);

          background: #080808;
          cursor: pointer;
          opacity: .68;

          padding: 0;
        }

        .thumb-list button.active {
          opacity: 1;
          border-color: rgba(255,196,0,.55);
          box-shadow: 0 0 18px rgba(255,196,0,.07);
        }

        .thumb-list img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .thumb-list span {
          position: absolute;
          right: 7px;
          bottom: 6px;

          color: rgba(255,255,255,.72);
          font-size: 9px;
          font-weight: 950;
        }

        .working-room {
          display: grid;
          grid-template-rows: minmax(0, 1fr) 126px;
          gap: 10px;
        }

        .working-screen {
          position: relative;
          min-height: 530px;

          border-radius: 12px;
          overflow: hidden;

          background: #050505;
          border: 1px solid rgba(255,255,255,.06);
        }

        .working-screen img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: contain;
        }

        .working-badge {
          position: absolute;
          top: 10px;
          left: 10px;

          padding: 6px 8px;

          border-radius: 999px;
          border: 1px solid rgba(255,196,0,.28);

          background: rgba(0,0,0,.72);
          color: #FFC400;

          font-size: 8px;
          font-weight: 950;
          letter-spacing: .75px;
          text-transform: uppercase;
        }

       .variant-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

        .variant-strip button {
          position: relative;
          overflow: hidden;

          border-radius: 12px;
          border: 1px solid rgba(255,255,255,.07);

          background: #070707;
          cursor: pointer;

          opacity: .66;
          padding: 0;
        }

        .variant-strip button.active {
          opacity: 1;
          border-color: rgba(255,196,0,.46);
        }

        .variant-strip img {
          width: 100%;
          height: 104px;
          display: block;
          object-fit: cover;
        }

        .variant-strip span {
          position: absolute;
          left: 8px;
          bottom: 7px;

          color: rgba(255,255,255,.78);
          font-size: 8px;
          font-weight: 950;
          letter-spacing: .65px;
          text-transform: uppercase;

          background: rgba(0,0,0,.62);
          border-radius: 999px;
          padding: 4px 7px;
        }

        .readout {
          display: grid;
          gap: 8px;
        }

        .readout div {
          display: flex;
          justify-content: space-between;
          gap: 12px;

          padding: 9px 0;
          border-bottom: 1px solid rgba(255,255,255,.045);
        }

        .readout span {
          color: rgba(255,255,255,.42);
          font-size: 8px;
          font-weight: 950;
          letter-spacing: .62px;
          text-transform: uppercase;
        }

        .readout strong {
          color: rgba(255,255,255,.76);
          font-size: 9px;
          font-weight: 950;
          text-transform: uppercase;
        }

        .lab-note {
          margin-top: 18px;
          padding: 12px;

          border-radius: 12px;
          border: 1px solid rgba(0,209,255,.14);

          background:
            radial-gradient(circle at top left, rgba(0,209,255,.06), transparent 70%),
            #101010;
        }

        .lab-note strong {
          color: #7DEBFF;
          font-size: 9px;
          font-weight: 950;
          letter-spacing: .5px;
          text-transform: uppercase;
        }

        .lab-note p {
          margin: 7px 0 0;
          color: rgba(255,255,255,.46);
          font-size: 11px;
          line-height: 1.45;
        }

        .compare-room {
          height: calc(100vh - 170px);
          min-height: 640px;

          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .vision-screen {
          position: relative;
          overflow: hidden;

          display: flex;
          align-items: center;
          justify-content: center;

          background: #050505;
        }

        .vision-screen.zoom-active {
          cursor: grab;
        }

        .vision-screen.zoom-active:active {
          cursor: grabbing;
        }

        .vision-screen img {
          width: 100%;
          height: 100%;
          max-height: none;

          object-fit: contain;
          object-position: center;

          transition: transform .08s linear;
          transform-origin: center center;
          user-select: none;
        }

        .screen-label {
          position: absolute;
          top: 10px;
          left: 10px;
          z-index: 5;

          display: flex;
          align-items: center;
          gap: 7px;

          padding: 6px 8px;

          border-radius: 999px;
          border: 1px solid rgba(255,255,255,.08);

          background: rgba(0,0,0,.72);
        }

        .screen-label span {
          color: #FFC400;
          font-size: 8px;
          font-weight: 950;
          letter-spacing: .72px;
          text-transform: uppercase;
        }

        .screen-label strong,
        .screen-label em {
          color: rgba(255,255,255,.62);
          font-size: 8px;
          font-weight: 950;
          font-style: normal;
          letter-spacing: .42px;
          text-transform: uppercase;
        }

        .empty-screen {
          width: 100%;
          height: 100%;
          min-height: 240px;

          display: flex;
          align-items: center;
          justify-content: center;

          color: rgba(255,255,255,.20);
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        @media (max-width: 980px) {
          .main-lab-grid,
          .compare-room {
            grid-template-columns: 1fr;
          }

          .photo-rail,
          .working-room,
          .tune-panel {
            min-height: auto;
          }

          .compare-room {
            height: auto;
          }
        }
      `}</style>
    </>
  );
}

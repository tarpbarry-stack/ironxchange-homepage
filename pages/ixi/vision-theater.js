import Head from "next/head";
import { useState } from "react";
import Navbar from "../../components/Navbar";

import { classifyIXPhoto } from "../../lib/ixvision/classifier/classifyIXPhoto";
import { runIXAutoRecipe } from "../../lib/ixvision/auto/runIXAutoRecipe";

function emptyZoom() {
  return { zoom: 1, x: 0, y: 0, dragging: false, lastX: 0, lastY: 0 };
}

function clampZoom(value) {
  return Math.max(1, Math.min(6, value));
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = reject;
    img.src = url;
  });
}

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

async function analyzeIXPhoto(file) {
  const img = await loadImage(file);
  const sampleWidth = 420;
  const scale = Math.min(1, sampleWidth / img.width);
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { alpha: false });
  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(img, 0, 0, width, height);

  const data = ctx.getImageData(0, 0, width, height).data;
  const luminance = new Float32Array(width * height);

  let luminanceSum = 0;
  let luminanceSqSum = 0;
  let darkCount = 0;
  let brightCount = 0;
  let edgeSum = 0;
  let edgeCount = 0;
  let blockDiffSum = 0;
  let blockDiffCount = 0;
  let colorSum = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;

      luminance[y * width + x] = lum;
      luminanceSum += lum;
      luminanceSqSum += lum * lum;

      if (lum < 38) darkCount++;
      if (lum > 232) brightCount++;

      colorSum += Math.max(r, g, b) - Math.min(r, g, b);
    }
  }

  const pixelCount = width * height;
  const avgLum = luminanceSum / pixelCount;
  const variance = luminanceSqSum / pixelCount - avgLum * avgLum;
  const contrast = Math.sqrt(Math.max(0, variance));

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const center = luminance[y * width + x];

      const gx =
        -luminance[(y - 1) * width + (x - 1)] +
        luminance[(y - 1) * width + (x + 1)] -
        2 * luminance[y * width + (x - 1)] +
        2 * luminance[y * width + (x + 1)] -
        luminance[(y + 1) * width + (x - 1)] +
        luminance[(y + 1) * width + (x + 1)];

      const gy =
        -luminance[(y - 1) * width + (x - 1)] -
        2 * luminance[(y - 1) * width + x] -
        luminance[(y - 1) * width + (x + 1)] +
        luminance[(y + 1) * width + (x - 1)] +
        2 * luminance[(y + 1) * width + x] +
        luminance[(y + 1) * width + (x + 1)];

      edgeSum += Math.sqrt(gx * gx + gy * gy);
      edgeCount++;

      if (x % 8 === 0 && x + 1 < width) {
        blockDiffSum += Math.abs(center - luminance[y * width + (x + 1)]);
        blockDiffCount++;
      }

      if (y % 8 === 0 && y + 1 < height) {
        blockDiffSum += Math.abs(center - luminance[(y + 1) * width + x]);
        blockDiffCount++;
      }
    }
  }

  const megapixels = (img.width * img.height) / 1000000;
  const avgEdge = edgeSum / Math.max(1, edgeCount);
  const blockiness = blockDiffSum / Math.max(1, blockDiffCount);
  const darkRatio = darkCount / pixelCount;
  const brightRatio = brightCount / pixelCount;
  const avgColorSpread = colorSum / pixelCount;

  const resolutionScore = clampScore((megapixels / 2.2) * 100);
  const sharpnessScore = clampScore((avgEdge / 95) * 100);
  const compressionScore = clampScore(100 - blockiness * 4.2);
  const exposureScore = clampScore(
    100 - Math.abs(avgLum - 128) * 0.72 - (darkRatio + brightRatio) * 100
  );
  const contrastScore = clampScore((contrast / 62) * 100);
  const colorScore = clampScore((avgColorSpread / 58) * 100);

  const overallScore = clampScore(
    resolutionScore * 0.18 +
      sharpnessScore * 0.22 +
      compressionScore * 0.22 +
      exposureScore * 0.16 +
      contrastScore * 0.14 +
      colorScore * 0.08
  );

  return {
    fileName: file.name,
    fileSizeKb: Math.round(file.size / 1024),
    width: img.width,
    height: img.height,
    megapixels: Number(megapixels.toFixed(2)),
    resolutionScore,
    sharpnessScore,
    compressionScore,
    exposureScore,
    contrastScore,
    colorScore,
    overallScore
  };
}

function TheaterScreen({ title, url, zoomState, onZoomChange }) {
  function update(patch) {
    onZoomChange({ ...zoomState, ...patch });
  }

  return (
    <section
      className="screen"
      onWheel={e => {
        e.preventDefault();
        const nextZoom = clampZoom(zoomState.zoom + (e.deltaY < 0 ? 0.25 : -0.25));
        update({
          zoom: nextZoom,
          x: nextZoom === 1 ? 0 : zoomState.x,
          y: nextZoom === 1 ? 0 : zoomState.y
        });
      }}
      onDoubleClick={() => update(zoomState.zoom > 1 ? emptyZoom() : { ...zoomState, zoom: 2 })}
      onMouseDown={e => {
        if (zoomState.zoom <= 1) return;
        update({ dragging: true, lastX: e.clientX, lastY: e.clientY });
      }}
      onMouseMove={e => {
        if (!zoomState.dragging || zoomState.zoom <= 1) return;
        update({
          x: zoomState.x + e.clientX - zoomState.lastX,
          y: zoomState.y + e.clientY - zoomState.lastY,
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
        <div className="empty">NO PHOTO LOADED</div>
      )}
    </section>
  );
}

export default function IXVisionTheater() {
  const [sourceFile, setSourceFile] = useState(null);
  const [originalUrl, setOriginalUrl] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [autoResult, setAutoResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [syncZoom, setSyncZoom] = useState(true);
  const [zoomStates, setZoomStates] = useState([emptyZoom(), emptyZoom()]);

  function updateZoom(index, next) {
    setZoomStates(current => {
      if (syncZoom) return current.map(() => ({ ...next }));
      const copy = [...current];
      copy[index] = next;
      return copy;
    });
  }

  async function handleFile(file) {
    if (!file || !file.type?.startsWith("image/")) return;

    setBusy(true);
    setSourceFile(file);
    setAutoResult(null);
    setZoomStates([emptyZoom(), emptyZoom()]);

    const url = URL.createObjectURL(file);
    setOriginalUrl(url);

    try {
      const scores = await analyzeIXPhoto(file);
      const classification = classifyIXPhoto(scores);
      setAnalysis({ ...scores, classification });
    } catch (err) {
      console.error("Theater analyze failed:", err);
      alert(`Analyze failed: ${err.message || err}`);
    } finally {
      setBusy(false);
    }
  }

  async function runAuto() {
    if (!sourceFile || !analysis) return;

    setBusy(true);

    try {
      const result = await runIXAutoRecipe(sourceFile, analysis, {
        make: "CATERPILLAR",
        companyName: "IronXchange",
        userEmail: "tarpbarry@gmail.com"
      });

      setAutoResult(result);
      setZoomStates([emptyZoom(), emptyZoom()]);
      console.log("IX Theater Auto Result", result);
    } catch (err) {
      console.error("IX Theater Auto failed:", err);
      alert(`IX Auto failed: ${err.message || err}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Head>
        <title>IX Vision Theater | IronXchange</title>
      </Head>

      <Navbar />

      <main>
        <header className="theater-top">
          <div>
            <span>IX Vision Theater</span>
            <strong>{analysis?.classification?.photoType || "LOAD PHOTO"}</strong>
            <em>{analysis ? `${analysis.width} × ${analysis.height} / ${analysis.megapixels} MP` : "Original vs IX Auto inspection room"}</em>
          </div>

          <div className="actions">
            <label>
              <input
                type="file"
                accept="image/*"
                onChange={e => {
                  handleFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              {busy ? "WORKING..." : "UPLOAD"}
            </label>

            <button type="button" onClick={runAuto} disabled={!analysis || busy}>
              RUN IX AUTO
            </button>

            <button type="button" onClick={() => setSyncZoom(v => !v)} className={syncZoom ? "active" : ""}>
              SYNC ZOOM
            </button>

            <a href="/ixi/vision-classifier">CLASSIFIER</a>
            <a href="/ixi/vision-lab">LAB</a>
          </div>
        </header>

        <section className="brain-strip">
          <div>
            <span>Pipeline</span>
            <strong>{analysis?.classification?.pipeline?.join(" → ") || "—"}</strong>
          </div>

          <div>
            <span>Decision</span>
            <strong>{analysis?.classification?.decision || "Upload a photo, classify it, then run IX Auto."}</strong>
          </div>
        </section>

        <section className="screens">
          <TheaterScreen
            title="ORIGINAL"
            url={originalUrl}
            zoomState={zoomStates[0]}
            onZoomChange={next => updateZoom(0, next)}
          />

          <TheaterScreen
            title="IX AUTO OUTPUT"
            url={autoResult?.outputUrl}
            zoomState={zoomStates[1]}
            onZoomChange={next => updateZoom(1, next)}
          />
        </section>
      </main>

      <style jsx>{`
        :global(html),
        :global(body) {
          margin: 0;
          background: #050505;
          color: #f2f2f2;
          font-family: Arial, sans-serif;
          overflow: hidden;
          text-rendering: geometricPrecision;
        }

        main {
          height: calc(100vh - 72px);
          padding: 10px;
          display: grid;
          grid-template-rows: 56px 48px minmax(0, 1fr);
          gap: 8px;
          background:
            radial-gradient(circle at top, rgba(255,196,0,.035), transparent 35%),
            #050505;
        }

        .theater-top,
        .brain-strip {
          border: 1px solid rgba(255,255,255,.07);
          border-radius: 14px;
          background: #121212;
          box-shadow: 0 18px 40px rgba(0,0,0,.32);
        }

        .theater-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 11px;
          gap: 12px;
        }

        .theater-top span,
        .brain-strip span {
          display: block;
          color: #ffc400;
          font-size: 8px;
          font-weight: 950;
          letter-spacing: .8px;
          text-transform: uppercase;
        }

        .theater-top strong {
          display: block;
          margin-top: 2px;
          font-size: 16px;
          font-weight: 950;
          text-transform: uppercase;
        }

        .theater-top em {
          display: block;
          margin-top: 2px;
          color: rgba(255,255,255,.42);
          font-size: 10px;
          font-style: normal;
        }

        .actions {
          display: flex;
          gap: 6px;
          align-items: center;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .actions label,
        .actions button,
        .actions a {
          height: 30px;
          padding: 0 11px;
          display: grid;
          place-items: center;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,.08);
          background: #0c0c0c;
          color: rgba(255,255,255,.68);
          font-size: 8px;
          font-weight: 950;
          letter-spacing: .6px;
          text-transform: uppercase;
          text-decoration: none;
          cursor: pointer;
        }

        .actions input {
          display: none;
        }

        .actions button.active {
          color: #ffc400;
          border-color: rgba(255,196,0,.32);
        }

        .actions button:disabled {
          opacity: .3;
          cursor: default;
        }

        .brain-strip {
          display: grid;
          grid-template-columns: 360px minmax(0, 1fr);
          gap: 10px;
          padding: 8px 11px;
          overflow: hidden;
        }

        .brain-strip strong {
          display: block;
          margin-top: 3px;
          color: rgba(255,255,255,.68);
          font-size: 10px;
          line-height: 1.25;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .screens {
          min-height: 0;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
        }

        .screen {
          position: relative;
          min-width: 0;
          min-height: 0;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,.075);
          background: #030303;
          cursor: grab;
        }

        .screen img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          transition: transform .08s linear;
          transform-origin: center center;
          user-select: none;
        }

        .screen-label {
          position: absolute;
          top: 10px;
          left: 10px;
          z-index: 10;
          display: flex;
          gap: 8px;
          align-items: center;
          padding: 6px 8px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,.08);
          background: rgba(0,0,0,.74);
        }

        .screen-label span {
          color: #ffc400;
          font-size: 8px;
          font-weight: 950;
          letter-spacing: .7px;
        }

        .screen-label strong {
          color: rgba(255,255,255,.64);
          font-size: 8px;
        }

        .empty {
          color: rgba(255,255,255,.22);
          font-size: 12px;
          font-weight: 950;
          letter-spacing: 1px;
        }

        @media (max-width: 980px) {
          :global(html),
          :global(body) {
            overflow: auto;
          }

          main {
            height: auto;
            min-height: 100vh;
            grid-template-rows: auto auto auto;
          }

          .theater-top,
          .brain-strip,
          .screens {
            grid-template-columns: 1fr;
          }

          .screens {
            height: 1100px;
          }
        }
      `}</style>
    </>
  );
}

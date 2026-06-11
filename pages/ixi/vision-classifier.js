import Head from "next/head";
import { useState } from "react";
import Navbar from "../../components/Navbar";

import { classifyIXPhoto } from "../../lib/ixvision/classifier/classifyIXPhoto";
import { IX_VISION_PIPELINES } from "../../lib/ixvision/classifier/ixVisionPipelines";

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = error => {
      URL.revokeObjectURL(url);
      reject(error);
    };

    img.src = url;
  });
}

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function scoreLabel(score) {
  if (score >= 82) return "EXCELLENT";
  if (score >= 68) return "GOOD";
  if (score >= 52) return "FAIR";
  if (score >= 36) return "POOR";
  return "BAD";
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

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  let luminanceSum = 0;
  let luminanceSqSum = 0;
  let darkCount = 0;
  let brightCount = 0;
  let edgeSum = 0;
  let edgeCount = 0;
  let blockDiffSum = 0;
  let blockDiffCount = 0;
  let colorSum = 0;

  const luminance = new Float32Array(width * height);

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

      const edge = Math.sqrt(gx * gx + gy * gy);

      edgeSum += edge;
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
    overallScore,
    avgEdge: Number(avgEdge.toFixed(2)),
    blockiness: Number(blockiness.toFixed(2)),
    avgLum: Number(avgLum.toFixed(2)),
    contrast: Number(contrast.toFixed(2))
  };
}

function ScoreBar({ label, score }) {
  return (
    <div className="score-row">
      <div className="score-top">
        <span>{label}</span>
        <strong>{score} / 100</strong>
        <em>{scoreLabel(score)}</em>
      </div>

      <div className="score-track">
        <div className="score-fill" style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export default function IXVisionClassifier() {
  const [previewUrl, setPreviewUrl] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file) {
    if (!file || !file.type?.startsWith("image/")) return;

    setBusy(true);
    setAnalysis(null);

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    try {
      const result = await analyzeIXPhoto(file);
      const classification = classifyIXPhoto(result);

      const fullResult = {
        ...result,
        classification
      };

      setAnalysis(fullResult);
      console.log("IX Vision Classification", fullResult);
    } catch (err) {
      console.error("IX Vision Classifier failed:", err);
      alert(`Classifier failed: ${err.message || err}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Head>
        <title>IX Vision Classifier | IronXchange</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Navbar />

      <main>
        <section className="classifier-shell">
          <header className="classifier-header">
            <div>
              <span>IX Vision Intelligence</span>
              <h1>Classifier Lab</h1>
              <p>Identify photo damage, classify the source quality, and recommend the commercial processing pipeline.</p>
            </div>

            <label className="upload-btn">
              <input
                type="file"
                accept="image/*"
                onChange={e => {
                  handleFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              {busy ? "CLASSIFYING..." : "+ CLASSIFY PHOTO"}
            </label>
          </header>

          <section className="classifier-grid">
            <section className="photo-stage">
              {previewUrl ? (
                <img src={previewUrl} alt="Classified machine" />
              ) : (
                <div className="empty-stage">UPLOAD MACHINE PHOTO</div>
              )}
            </section>

            <aside className="analysis-panel">
              <div className="panel-head">
                <span>IX Brain Output</span>
                <strong>{analysis ? analysis.fileName : "Waiting"}</strong>
              </div>

              {analysis ? (
                <>
                  <section className="recommend-card">
                    <span>Photo Type</span>
                    <h2>{analysis.classification.photoType}</h2>
                    <p>Confidence: {analysis.classification.confidence}%</p>
                  </section>

                  <section className="pipeline-card">
                    <span>Recommended Pipeline</span>

                    {analysis.classification.pipeline.map(step => (
                      <div key={step}>
                        <strong>{IX_VISION_PIPELINES[step]?.title || step}</strong>
                        <small>{IX_VISION_PIPELINES[step]?.description || ""}</small>
                      </div>
                    ))}
                  </section>

                  <ScoreBar label="Overall" score={analysis.overallScore} />
                  <ScoreBar label="Resolution" score={analysis.resolutionScore} />
                  <ScoreBar label="Sharpness" score={analysis.sharpnessScore} />
                  <ScoreBar label="Compression" score={analysis.compressionScore} />
                  <ScoreBar label="Exposure" score={analysis.exposureScore} />
                  <ScoreBar label="Contrast" score={analysis.contrastScore} />
                  <ScoreBar label="Color" score={analysis.colorScore} />

                  <section className="raw-data">
                    <div>
                      <span>Size</span>
                      <strong>{analysis.width} × {analysis.height}</strong>
                    </div>
                    <div>
                      <span>MP</span>
                      <strong>{analysis.megapixels}</strong>
                    </div>
                    <div>
                      <span>File</span>
                      <strong>{analysis.fileSizeKb} KB</strong>
                    </div>
                    <div>
                      <span>Edge</span>
                      <strong>{analysis.avgEdge}</strong>
                    </div>
                    <div>
                      <span>Block</span>
                      <strong>{analysis.blockiness}</strong>
                    </div>
                    <div>
                      <span>Light</span>
                      <strong>{analysis.avgLum}</strong>
                    </div>
                  </section>
                    <section className="decision-card">
  <span>IX Decision</span>
   <p>{analysis.classification.decision}</p>
</section>


    <section className="damage-card">
  <span>Photo Damage Profile</span>

  <div className="damage-row">
    <strong>Resolution</strong>
    <em>
      {analysis.resolutionScore < 35
        ? "EXTREME"
        : analysis.resolutionScore < 55
        ? "HIGH"
        : analysis.resolutionScore < 75
        ? "MEDIUM"
        : "LOW"}
    </em>
  </div>

  <div className="damage-row">
    <strong>Compression</strong>
    <em>
      {analysis.compressionScore < 45
        ? "HIGH"
        : analysis.compressionScore < 70
        ? "MEDIUM"
        : "LOW"}
    </em>
  </div>

  <div className="damage-row">
    <strong>Sharpness</strong>
    <em>
      {analysis.sharpnessScore < 45
        ? "HIGH"
        : analysis.sharpnessScore < 70
        ? "MEDIUM"
        : "LOW"}
    </em>
  </div>

  <div className="damage-row">
    <strong>Exposure</strong>
    <em>
      {analysis.exposureScore < 45
        ? "HIGH"
        : analysis.exposureScore < 70
        ? "MEDIUM"
        : "LOW"}
    </em>
  </div>
</section>

                    
                </>
              ) : (
                <div className="empty-analysis">
                  Upload a web photo, auction photo, dealer-site photo, or phone photo to classify the damage.
                </div>
              )}
            </aside>
          </section>
              
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

        main {
          min-height: calc(100vh - 72px);
          background:
            radial-gradient(circle at top center, rgba(255,196,0,.035), transparent 30%),
            radial-gradient(circle at 18% 12%, rgba(0,209,255,.025), transparent 24%),
            #070707;
        }

        .classifier-shell {
          max-width: 1500px;
          margin: 0 auto;
          padding: 12px 18px 28px;
        }

        .classifier-header,
        .photo-stage,
        .analysis-panel {
          background:
            linear-gradient(180deg, rgba(255,255,255,.032), rgba(255,255,255,0)),
            radial-gradient(circle at top, rgba(255,255,255,.018), transparent 70%),
            #141414;
          border: 1px solid rgba(255,255,255,.065);
          border-radius: 14px;
          box-shadow:
            0 1px 0 rgba(255,255,255,.045) inset,
            0 16px 38px rgba(0,0,0,.24);
        }

        .classifier-header {
          min-height: 66px;
          padding: 11px 14px;
          margin-bottom: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
        }

        .classifier-header span,
        .panel-head span,
        .recommend-card span,
        .pipeline-card span {
          display: block;
          margin-bottom: 4px;
          color: #FFC400;
          font-size: 8px;
          font-weight: 950;
          letter-spacing: .78px;
          text-transform: uppercase;
        }

        .classifier-header h1 {
          margin: 0;
          color: #f2f2f2;
          font-size: 22px;
          font-weight: 950;
          letter-spacing: -.65px;
          line-height: 1;
          text-transform: uppercase;
        }

        .classifier-header p {
          margin: 5px 0 0;
          color: rgba(255,255,255,.42);
          font-size: 11px;
          line-height: 1.35;
        }

        .upload-btn {
          min-width: 168px;
          height: 34px;
          display: grid;
          place-items: center;
          border-radius: 999px;
          border: 1px dashed rgba(255,196,0,.38);
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

        .upload-btn input {
          display: none;
        }

        .classifier-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 410px;
          gap: 10px;
          align-items: stretch;
        }

        .photo-stage {
          min-height: calc(100vh - 168px);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: #050505;
        }

        .photo-stage img {
          width: 100%;
          height: 100%;
          max-height: calc(100vh - 168px);
          object-fit: contain;
          display: block;
        }

        .empty-stage,
        .empty-analysis {
          color: rgba(255,255,255,.24);
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 1px;
          text-transform: uppercase;
          text-align: center;
          line-height: 1.5;
          padding: 24px;
        }

        .analysis-panel {
          min-height: calc(100vh - 168px);
          padding: 13px;
          overflow-y: auto;
        }

        .panel-head {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: baseline;
          padding-bottom: 9px;
          margin-bottom: 11px;
          border-bottom: 1px solid rgba(255,255,255,.052);
        }

        .panel-head strong {
          color: rgba(255,255,255,.52);
          font-size: 8px;
          font-weight: 950;
          letter-spacing: .4px;
          text-transform: uppercase;
          max-width: 210px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .recommend-card,
        .pipeline-card {
          padding: 13px;
          margin-bottom: 12px;
          border-radius: 13px;
          border: 1px solid rgba(255,196,0,.18);
          background:
            radial-gradient(circle at top left, rgba(255,196,0,.08), transparent 70%),
            #101010;
        }

        .recommend-card h2 {
          margin: 0;
          color: #f2f2f2;
          font-size: 24px;
          font-weight: 950;
          letter-spacing: -.65px;
          text-transform: uppercase;
        }

        .recommend-card p {
          margin: 7px 0 0;
          color: rgba(255,255,255,.48);
          font-size: 11px;
          line-height: 1.45;
        }

        .pipeline-card div {
          display: grid;
          gap: 3px;
          padding: 9px 0;
          border-bottom: 1px solid rgba(255,255,255,.055);
        }

        .pipeline-card div:last-child {
          border-bottom: 0;
        }

        .pipeline-card strong {
          color: rgba(255,255,255,.84);
          font-size: 10px;
          font-weight: 950;
          letter-spacing: .55px;
          text-transform: uppercase;
        }

        .pipeline-card small {
          color: rgba(255,255,255,.42);
          font-size: 10px;
          line-height: 1.35;
        }

        .score-row {
          margin-bottom: 10px;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(255,255,255,.045);
        }

        .score-top {
          display: grid;
          grid-template-columns: 1fr auto auto;
          gap: 8px;
          align-items: center;
          margin-bottom: 6px;
        }

        .score-top span {
          color: rgba(255,255,255,.48);
          font-size: 8px;
          font-weight: 950;
          letter-spacing: .62px;
          text-transform: uppercase;
        }

        .score-top strong {
          color: rgba(255,255,255,.78);
          font-size: 9px;
          font-weight: 950;
        }

        .score-top em {
          color: #FFC400;
          font-size: 8px;
          font-style: normal;
          font-weight: 950;
          letter-spacing: .55px;
        }

        .score-track {
          height: 6px;
          overflow: hidden;
          border-radius: 999px;
          background: rgba(255,255,255,.075);
        }

        .score-fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #7DEBFF, #FFC400);
        }

        .raw-data {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          margin-top: 14px;
        }

        .raw-data div {
          padding: 10px;
          border-radius: 10px;
          background: rgba(255,255,255,.035);
          border: 1px solid rgba(255,255,255,.055);
        }

        .raw-data span {
          display: block;
          margin-bottom: 5px;
          color: rgba(255,255,255,.38);
          font-size: 7.5px;
          font-weight: 950;
          letter-spacing: .55px;
          text-transform: uppercase;
        }

        .raw-data strong {
          color: rgba(255,255,255,.76);
          font-size: 10px;
          font-weight: 950;
        }

.decision-card {
  padding: 13px;
  margin-bottom: 12px;
  border-radius: 13px;
  border: 1px solid rgba(0,209,255,.16);
  background:
    radial-gradient(circle at top left, rgba(0,209,255,.07), transparent 70%),
    #101010;
}

.decision-card span {
  display: block;
  margin-bottom: 6px;
  color: #7DEBFF;
  font-size: 8px;
  font-weight: 950;
  letter-spacing: .78px;
  text-transform: uppercase;
}

.decision-card p {
  margin: 0;
  color: rgba(255,255,255,.50);
  font-size: 11px;
  line-height: 1.48;
}

.damage-card {
  padding: 13px;
  margin-bottom: 12px;

  border-radius: 13px;
  border: 1px solid rgba(229,62,62,.18);

  background:
    radial-gradient(circle at top left,
      rgba(229,62,62,.08),
      transparent 70%),
    #101010;
}

.damage-card span {
  display: block;
  margin-bottom: 10px;

  color: #ffb4b4;

  font-size: 8px;
  font-weight: 950;
  letter-spacing: .78px;
  text-transform: uppercase;
}

.damage-row {
  display: flex;
  justify-content: space-between;

  padding: 8px 0;

  border-bottom: 1px solid rgba(255,255,255,.04);
}

.damage-row:last-child {
  border-bottom: 0;
}

.damage-row strong {
  color: rgba(255,255,255,.75);
  font-size: 10px;
}

.damage-row em {
  color: #FFC400;
  font-style: normal;
  font-weight: 950;
}

        @media (max-width: 980px) {
          .classifier-grid {
            grid-template-columns: 1fr;
          }

          .photo-stage,
          .analysis-panel {
            min-height: auto;
          }
        }
      `}</style>
    </>
  );
}

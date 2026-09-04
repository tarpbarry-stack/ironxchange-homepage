import {
  useEffect,
  useState
} from "react";

import IXIFacePreview
  from "./IXIFacePreview";

import IXIFaceReferenceOverlay
  from "./IXIFaceReferenceOverlay";

import IXIFaceLabScaledCard
  from "./IXIFaceLabScaledCard";

import IXIAosCardCatalogBench
  from "../ixi-aos-card-library/IXIAosCardCatalogBench";

import IXILocationObjectFace1
  from "../ixi-mos/location/IXILocationObjectFace1";

import IXICardScaleControl
  from "../ixi-chassis/IXICardScaleControl";

import {
  readSitewideCardScaleMode,
  writeSitewideCardScaleMode
} from "../ixi-chassis/IXIScaleEngine";


const FACE_TREE = [
  {
    title: "AUCTION",
    faces: [
      "AOF1",
      "AOF2",
      "AOF3",
      "AOF4"
    ]
  },
  {
    title: "MACHINE",
    faces: [
      "MOF2",
      "MOF3",
      "MOF4"
    ]
  },
  {
    title: "PRIVATE",
    faces: [
      "PMOF2"
    ]
  },
  {
    title: "ENTITY",
    faces: [
      "EOF1"
    ]
  }
];

export default function IXIFaceStudio() {
  const [
    selectedFace,
    setSelectedFace
  ] = useState("AOF2");

  const [
  studioMode,
  setStudioMode
] = useState("faces");

  const [
  previewSize,
  setPreviewSize
] = useState("both");

  const [
  referenceOverlayVisible,
  setReferenceOverlayVisible
] = useState(true);

  const [
    faceScaleMode,
    setFaceScaleMode
  ] = useState("xl");

  useEffect(() => {
    const savedMode =
      readSitewideCardScaleMode();

    if (savedMode) {
      setFaceScaleMode(savedMode);
    }
  }, []);

  function updateFaceScaleMode(nextMode) {
    setFaceScaleMode(
      writeSitewideCardScaleMode(
        nextMode
      )
    );
  }

  function cycleSelectedFace() {
    const activeGroup =
      FACE_TREE.find(group =>
        group.faces.includes(
          selectedFace
        )
      );

    if (
      !activeGroup ||
      activeGroup.faces.length < 2
    ) {
      return;
    }

    const currentIndex =
      activeGroup.faces.indexOf(
        selectedFace
      );

    const nextIndex =
      (
        currentIndex + 1
      ) %
      activeGroup.faces.length;

    setSelectedFace(
      activeGroup.faces[
        nextIndex
      ]
    );
  }

if (
  studioMode === "cards"
) {
  return (
    <div className="aos-card-lab-mode">

      <div className="aos-card-lab-header">
        <strong>
          IXI FACE LAB
        </strong>

        <div className="studio-mode-controls">
          <button
            type="button"
            onClick={() =>
              setStudioMode("faces")
            }
          >
            FACES
          </button>

          <button
            type="button"
            className="active"
          >
            AOS CARDS
          </button>
        </div>
      </div>

      <IXIAosCardCatalogBench />

      <style jsx>{`
        .aos-card-lab-mode {
          min-height:
            calc(100vh - 180px);
        }

        .aos-card-lab-header {
          height: 42px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          margin-bottom: 18px;

          padding: 0 14px;

          border:
            1px solid
            rgba(255,255,255,.08);

          border-radius: 10px;

          background:
            #121212;
        }

        .aos-card-lab-header strong {
          color: #ffc400;

          font-size: 10px;
          font-weight: 950;
          letter-spacing: .08em;
        }

        .studio-mode-controls {
          display: flex;
          gap: 6px;
        }

        .studio-mode-controls button {
          height: 22px;

          padding: 0 9px;

          border:
            1px solid
            rgba(255,255,255,.08);

          border-radius: 4px;

          background:
            rgba(255,255,255,.025);

          color:
            rgba(255,255,255,.42);

          font-size: 7px;
          font-weight: 950;

          cursor: pointer;
        }

        .studio-mode-controls button.active {
          border-color:
            rgba(255,196,0,.28);

          background:
            rgba(255,196,0,.09);

          color: #ffc400;
        }
      `}</style>

    </div>
  );
}  
  return (
    <div
      className="face-lab"
      data-selected-face={selectedFace}
      data-preview-typography={selectedFace === "AOF1" || selectedFace === "EOF1" ? "protected" : "readable"}
    >
      <aside className="face-tree">

        <div className="studio-title">
  <span>
    IXI FACE LAB
  </span>

  <div className="studio-mode-controls">
    <button
      type="button"
      className={
        studioMode === "faces"
          ? "active"
          : ""
      }
      onClick={() =>
        setStudioMode("faces")
      }
    >
      FACES
    </button>

    <button
      type="button"
      className={
        studioMode === "cards"
          ? "active"
          : ""
      }
      onClick={() =>
        setStudioMode("cards")
      }
    >
      AOS CARDS
    </button>
  </div>
</div>

        {FACE_TREE.map(group => (
          <div
            key={group.title}
            className="face-group"
          >
            <div className="face-group-title">
              {group.title}
            </div>

            {group.faces.map(face => (
              <button
                key={face}
                type="button"

                className={
                  face === selectedFace
                    ? "face-button active"
                    : "face-button"
                }

                onClick={() =>
                  setSelectedFace(face)
                }
              >
                {face}
              </button>
            ))}
          </div>
        ))}

      </aside>

     <section className="face-preview">
  <div className="preview-title">
    <span>
      {selectedFace}
    </span>

    <div className="preview-size-controls">
      <button
        type="button"
        className={
          previewSize === "both"
            ? "active"
            : ""
        }
        onClick={() =>
          setPreviewSize("both")
        }
      >
        BOTH
      </button>

      <button
        type="button"
        className={
          previewSize === "compact"
            ? "active"
            : ""
        }
        onClick={() =>
          setPreviewSize("compact")
        }
      >
        MARKETPLACE
      </button>

      <button
        type="button"
        className={
          previewSize === "tall"
            ? "active"
            : ""
        }
        onClick={() =>
          setPreviewSize("tall")
        }
      >
        OPERATING
      </button>

      <button
        type="button"
        className={
          referenceOverlayVisible
            ? "active"
            : ""
        }
        onClick={() =>
          setReferenceOverlayVisible(
            current => !current
          )
        }
      >
        GRID
      </button>
    </div>
  </div>

  <div className="preview-stage">
    <div
      className={[
        "preview-shells",

        previewSize === "both"
          ? "show-both"
          : "show-single"
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {previewSize === "both" ||
      previewSize === "compact" ? (
        <IXIFaceLabScaledCard
          objectFamily="marketplace"
          surfaceLabel="Face Lab Marketplace Faces"
          scaleMode={faceScaleMode}
          onScaleModeChange={updateFaceScaleMode}
          showScaleControl={false}
        >
          <div className="preview-shell preview-shell-marketplace">
            <IXIFacePreview
              face={selectedFace}
              previewSize="compact"
              onCycleFace={
                cycleSelectedFace
              }
            />

            {referenceOverlayVisible ? (
              <IXIFaceReferenceOverlay
                previewSize="compact"
                railHeight={19}
              />
            ) : null}
          </div>
        </IXIFaceLabScaledCard>
      ) : null}

      {previewSize === "both" ||
      previewSize === "tall" ? (
        <IXIFaceLabScaledCard
          objectFamily="private"
          surfaceLabel="Face Lab Operating Faces"
          scaleMode={faceScaleMode}
          onScaleModeChange={updateFaceScaleMode}
          showScaleControl={false}
        >
          <div className="preview-shell preview-shell-operating">
            <IXIFacePreview
              face={selectedFace}
              previewSize="tall"
              onCycleFace={
                cycleSelectedFace
              }
            />

            {referenceOverlayVisible ? (
              <IXIFaceReferenceOverlay
                previewSize="tall"
                railHeight={19}
              />
            ) : null}
          </div>
        </IXIFaceLabScaledCard>
      ) : null}
    </div>

    <IXICardScaleControl
      value={faceScaleMode}
      onChange={updateFaceScaleMode}
      surfaceLabel="Face Lab Faces"
    />
  </div>
</section>
      <aside className="face-inspector">

        <div className="inspector-title">
          INSPECTOR
        </div>

        <div className="inspector-placeholder">

          Face Properties

        </div>

      </aside>

      <style jsx>{`
        .face-lab{
          display:grid;

          grid-template-columns:
            240px
            1fr
            300px;

          gap:18px;

          height:
            calc(100vh - 180px);
        }

        .face-tree,
        .face-preview,
        .face-inspector{

          border:1px solid
            rgba(255,255,255,.08);

          border-radius:12px;

          background:
            linear-gradient(
              180deg,
              rgba(255,255,255,.02),
              rgba(255,255,255,0)
            ),
            #121212;
        }

        .studio-title,
        .preview-title,
        .inspector-title{

          height:42px;

          display:flex;
          align-items:center;

          padding:0 14px;

          border-bottom:
            1px solid
            rgba(255,255,255,.06);

          color:#FFC400;

          font-size:11px;
          font-weight:950;
          letter-spacing:.08em;
        }

        .face-group{
          padding:14px;
        }

        .face-group-title{
          margin-bottom:8px;

          color:
            rgba(255,255,255,.42);

          font-size:9px;
          font-weight:900;
          letter-spacing:.08em;
        }

        .face-button{

          width:100%;
          height:30px;

          margin-bottom:6px;

          border:0;
          border-radius:6px;

          background:
            rgba(255,255,255,.03);

          color:
            rgba(255,255,255,.72);

          cursor:pointer;

          text-align:left;

          padding:0 10px;
        }

        .face-button.active{

          background:
            rgba(255,196,0,.12);

          color:#FFC400;
        }

       .preview-stage {
  height:
    calc(100% - 42px);

  display: block;

  overflow: auto;

          color:
            rgba(255,255,255,.28);

          font-size:14px;
          font-weight:900;

          text-align:center;
        }

        .inspector-placeholder{

          padding:16px;

          color:
            rgba(255,255,255,.42);
        }

.preview-shells {
  width: 100%;

  display: flex;
  align-items: flex-start;
  justify-content: center;

  gap: 52px;

  padding: 34px 24px 60px;

  overflow: auto;
}

.preview-shells.show-single {
  justify-content: center;
}

.preview-shell{
 position: relative;

width: 300px;
  min-height: 0;
  height: auto;
  
  display:flex;
  align-items:flex-start;
  justify-content:center;

  border-radius:13px;

overflow: visible;

  background:#141414;

  box-shadow:
    0 18px 40px
    rgba(0,0,0,.42);
}

.preview-shell-marketplace {
  height: 400px;
}

.preview-shell-operating {
  height: 475px;
}

.preview-title {
  justify-content: space-between;
}

.preview-size-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.preview-size-controls button {
  height: 22px;

  padding: 0 8px;

  border: 1px solid rgba(255,255,255,.08);
  border-radius: 4px;

  background: rgba(255,255,255,.025);
  color: rgba(255,255,255,.42);

  font-size: 7px;
  font-weight: 950;
  letter-spacing: .5px;

  cursor: pointer;
}

.preview-size-controls button.active {
  border-color: rgba(255,196,0,.28);

  background: rgba(255,196,0,.09);
  color: #ffc400;
}

.studio-title {
  justify-content: space-between;
}

.studio-mode-controls {
  display: flex;
  gap: 6px;
}

.studio-mode-controls button {
  height: 22px;

  padding: 0 8px;

  border:
    1px solid
    rgba(255,255,255,.08);

  border-radius: 4px;

  background:
    rgba(255,255,255,.025);

  color:
    rgba(255,255,255,.42);

  font-size: 7px;
  font-weight: 950;

  cursor: pointer;
}

.studio-mode-controls button.active {
  border-color:
    rgba(255,196,0,.28);

  background:
    rgba(255,196,0,.09);

  color: #ffc400;
}

      `}</style>

    </div>
  );
}

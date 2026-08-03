import { useState } from "react";

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
      "MOF2"
    ]
  },
  {
    title: "PRIVATE",
    faces: [
      "PMOF2"
    ]
  }
];

export default function IXIFaceStudio() {
  const [
    selectedFace,
    setSelectedFace
  ] = useState("AOF2");

  return (
    <div className="face-lab">

      <aside className="face-tree">

        <div className="studio-title">
          IXI FACE LAB
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
          {selectedFace}
        </div>

        <div className="preview-stage">

          LIVE FACE
          <br />
          COMING NEXT

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

        .preview-stage{

          height:
            calc(100% - 42px);

          display:flex;

          align-items:center;
          justify-content:center;

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
      `}</style>

    </div>
  );
}

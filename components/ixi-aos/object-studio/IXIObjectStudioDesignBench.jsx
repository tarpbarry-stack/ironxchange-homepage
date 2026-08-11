const FACE_DESIGNS = [
  "PHOTO / ID",
  "DETAILS",
  "RELATIONSHIPS",
  "SERVICE",
  "WORK ORDERS",
  "DOCUMENTS",
  "HISTORY",
  "BLANK"
];


const MODULES = [
  "TEXT",
  "NUMBER",
  "MONEY",
  "DATE",
  "PHOTO",
  "ADDRESS",
  "RELATIONSHIP",
  "CHILD DECK"
];


export default function IXIObjectStudioDesignBench({
  studio
}) {

  function addBlankFace() {

    studio?.addFace?.({
      label:
        `FACE ${
          (
            studio
              ?.cardDefinitionDraft
              ?.faces
              ?.length ||
            0
          ) + 1
        }`,

      layout: []
    });
  }


  return (
    <aside className="design-bench">

      <section>

        <div className="bench-title">

          <strong>
            FACE BENCH
          </strong>

          <span>
            ADD A FACE
          </span>

        </div>


        <div className="face-list">

          {FACE_DESIGNS.map(
            face => (

              <button
                type="button"

                key={
                  face
                }

                onClick={
                  face ===
                  "BLANK"
                    ? addBlankFace
                    : undefined
                }
              >
                {face}
              </button>

            )
          )}

        </div>

      </section>


      <div className="divider" />


      <section>

        <div className="bench-title">

          <strong>
            MODULE BENCH
          </strong>

          <span>
            BUILD A FACE
          </span>

        </div>


        <div className="module-grid">

          {MODULES.map(
            module => (

              <button
                type="button"

                key={
                  module
                }
              >
                {module}
              </button>

            )
          )}

        </div>

      </section>


      <style jsx>{`

        .design-bench {
          min-height: 590px;

          padding:
            12px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .05
            );

          border-radius: 9px;

          background:
            rgba(
              255,
              255,
              255,
              .01
            );
        }


        .bench-title {
          display: flex;

          align-items: baseline;

          justify-content:
            space-between;

          gap: 8px;

          margin-bottom:
            9px;
        }


        .bench-title strong {
          color: #ffc400;

          font-size: 7px;
          font-weight: 950;
        }


        .bench-title span {
          color:
            rgba(
              255,
              255,
              255,
              .20
            );

          font-size: 5.5px;
          font-weight: 900;
        }


        .face-list {
          display: flex;

          flex-direction: column;

          gap: 5px;
        }


        .face-list button,
        .module-grid button {
          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .045
            );

          border-radius: 5px;

          background:
            rgba(
              255,
              255,
              255,
              .014
            );

          color:
            rgba(
              255,
              255,
              255,
              .38
            );

          font-size: 6px;
          font-weight: 950;

          cursor: pointer;
        }


        .face-list button {
          height: 31px;

          text-align: left;

          padding:
            0 9px;
        }


        .face-list button:hover,
        .module-grid button:hover {
          border-color:
            rgba(
              0,
              194,
              255,
              .30
            );

          color:
            rgba(
              0,
              194,
              255,
              .85
            );
        }


        .divider {
          height: 1px;

          margin:
            18px 0;

          background:
            rgba(
              255,
              255,
              255,
              .045
            );
        }


        .module-grid {
          display: grid;

          grid-template-columns:
            1fr 1fr;

          gap: 5px;
        }


        .module-grid button {
          height: 43px;
        }

      `}</style>

    </aside>
  );
}

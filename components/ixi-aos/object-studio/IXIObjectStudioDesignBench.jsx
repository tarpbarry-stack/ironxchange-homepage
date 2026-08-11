import {
  IXI_STUDIO_FACE_LIBRARY,
  IXI_STUDIO_MODULE_LIBRARY
} from "./libraries/IXIStudioDesignLibrary";


export default function IXIObjectStudioDesignBench({
  studio
}) {

  const selectedFace =
    studio?.selectedFace;


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

          {IXI_STUDIO_FACE_LIBRARY.map(
            design => (

              <button
                type="button"

                key={
                  design.designId
                }

                title={
                  design.description ||
                  design.name
                }

                onClick={
                  () =>
                    studio
                      ?.installFaceDesign?.(
                        design
                      )
                }
              >

                <strong>
                  {design.name}
                </strong>

                <span>
                  {
                    design.modules
                      ?.length ||
                    0
                  }
                  {" "}
                  MODULE
                  {
                    design.modules
                      ?.length === 1
                      ? ""
                      : "S"
                  }
                </span>

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
            {
              selectedFace
                ? `ADD TO ${selectedFace.label || "FACE"}`
                : "SELECT A FACE"
            }
          </span>

        </div>


        <div className="module-grid">

          {IXI_STUDIO_MODULE_LIBRARY.map(
            module => (

              <button
                type="button"

                key={
                  module.moduleId
                }

                disabled={
                  !selectedFace
                }

                onClick={
                  () =>
                    studio
                      ?.installModuleDesign?.(
                        module,
                        selectedFace
                          ?.faceId
                      )
                }
              >

                {module.label}

              </button>

            )
          )}

        </div>

      </section>


      <style jsx>{`

        .design-bench {
          min-height: 590px;

          padding: 12px;

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

          margin-bottom: 9px;
        }


        .bench-title > strong {
          color: #ffc400;

          font-size: 7px;
          font-weight: 950;
        }


        .bench-title > span {
          max-width: 110px;

          overflow: hidden;

          color:
            rgba(
              255,
              255,
              255,
              .20
            );

          font-size: 5.5px;
          font-weight: 900;

          text-overflow: ellipsis;
          white-space: nowrap;
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

          cursor: pointer;
        }


        .face-list button {
          height: 38px;

          padding: 0 9px;

          display: flex;

          flex-direction: column;

          align-items: flex-start;

          justify-content: center;

          gap: 3px;
        }


        .face-list button strong {
          color:
            rgba(
              255,
              255,
              255,
              .44
            );

          font-size: 6px;
          font-weight: 950;
        }


        .face-list button span {
          color:
            rgba(
              255,
              255,
              255,
              .16
            );

          font-size: 5px;
          font-weight: 900;
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
        }


        .face-list button:hover strong,
        .module-grid button:hover {
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

          margin: 18px 0;

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
          min-height: 37px;

          padding: 5px;

          color:
            rgba(
              255,
              255,
              255,
              .38
            );

          font-size: 5.5px;
          font-weight: 950;
        }


        .module-grid button:disabled {
          opacity: .22;

          cursor: default;
        }

      `}</style>

    </aside>
  );
}

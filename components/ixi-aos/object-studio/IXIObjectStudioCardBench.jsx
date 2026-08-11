import {
  IXI_STUDIO_CARD_LIBRARY
} from "./libraries/IXIStudioDesignLibrary";


export default function IXIObjectStudioCardBench({
  studio
}) {

  const currentSourceDesignId =
    studio
      ?.cardDefinitionDraft
      ?.metadata
      ?.sourceDesignId ||
    "";


  return (
    <section className="card-bench">

      <div className="bench-heading">

        <strong>
          CARD BENCH
        </strong>

        <span>
          STARTING DESIGNS — FORK AND CUSTOMIZE
        </span>

      </div>


      <div className="card-bench-rail">

        {IXI_STUDIO_CARD_LIBRARY.map(
          design => {

            const active =
              currentSourceDesignId ===
              design.designId;


            return (
              <button
                type="button"

                key={
                  design.designId
                }

                className={
                  active
                    ? "design-card active"
                    : "design-card"
                }

                title={
                  design.description ||
                  design.name
                }

                onClick={
                  () =>
                    studio
                      ?.installCardDesign?.(
                        design
                      )
                }
              >

                <strong>
                  {design.name}
                </strong>


                <span>
                  {
                    design.description ||
                    "STARTING DESIGN"
                  }
                </span>


                <small>
                  {
                    design.faces
                      ?.length ||
                    0
                  } FACE
                  {
                    design.faces
                      ?.length === 1
                      ? ""
                      : "S"
                  }
                </small>

              </button>
            );
          }
        )}


        <button
          type="button"

          className="
            design-card
            saved-design
          "
        >

          <strong>
            MY DESIGNS
          </strong>

          <span>
            SAVED CARDS
          </span>

          <small>
            COMING NEXT
          </small>

        </button>

      </div>


      <style jsx>{`

        .card-bench {
          margin-top: 12px;

          padding: 10px;

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


        .bench-heading {
          display: flex;

          align-items: center;

          gap: 9px;

          margin-bottom: 8px;
        }


        .bench-heading strong {
          color: #ffc400;

          font-size: 7px;
          font-weight: 950;
        }


        .bench-heading span {
          color:
            rgba(
              255,
              255,
              255,
              .20
            );

          font-size: 6px;
          font-weight: 900;
        }


        .card-bench-rail {
          display: flex;

          gap: 7px;

          overflow-x: auto;

          padding-bottom: 2px;
        }


        .design-card {
          width: 150px;
          min-width: 150px;

          height: 78px;

          padding: 9px;

          display: flex;
          flex-direction: column;

          align-items: flex-start;

          gap: 4px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .055
            );

          border-radius: 7px;

          background:
            linear-gradient(
              180deg,
              rgba(
                255,
                255,
                255,
                .022
              ),
              rgba(
                255,
                255,
                255,
                .008
              )
            );

          cursor: pointer;
        }


        .design-card:hover {
          border-color:
            rgba(
              0,
              194,
              255,
              .32
            );
        }


        .design-card.active {
          border-color:
            rgba(
              255,
              196,
              0,
              .48
            );

          background:
            rgba(
              255,
              196,
              0,
              .035
            );
        }


        .design-card strong {
          color:
            rgba(
              255,
              255,
              255,
              .74
            );

          font-size: 8px;
          font-weight: 950;
        }


        .design-card.active strong {
          color: #ffc400;
        }


        .design-card span {
          max-width: 100%;

          overflow: hidden;

          color:
            rgba(
              255,
              255,
              255,
              .27
            );

          font-size: 5.5px;
          font-weight: 850;

          text-overflow: ellipsis;
          white-space: nowrap;
        }


        .design-card small {
          margin-top: auto;

          color:
            rgba(
              0,
              194,
              255,
              .34
            );

          font-size: 5px;
          font-weight: 950;
        }


        .saved-design {
          border-style: dashed;
        }

      `}</style>

    </section>
  );
}

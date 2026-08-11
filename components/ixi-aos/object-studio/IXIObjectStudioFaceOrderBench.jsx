export default function IXIObjectStudioFaceOrderBench({
  studio
}) {

  const faces =
    studio
      ?.cardDefinitionDraft
      ?.faces ||
    [];


  const selectedFaceId =
    studio
      ?.selection
      ?.faceId ||
    "";


  return (
    <section className="face-order-bench">

      <div className="bench-heading">

        <strong>
          FACE ORDER
        </strong>

        <span>
          FIRST FACE IS FIRST — USER CONTROLS THE ORDER
        </span>

      </div>


      <div className="face-order-rail">

        {faces.map(
          (
            face,
            index
          ) => (

            <button
              type="button"

              key={
                face.faceId
              }

              className={
                face.faceId ===
                selectedFaceId
                  ? "face-tile active"
                  : "face-tile"
              }

              onClick={
                () =>
                  studio
                    ?.selectFace?.(
                      face.faceId
                    )
              }
            >

              <span>
                FACE {index + 1}
              </span>

              <strong>
                {
                  face.label ||
                  `FACE ${index + 1}`
                }
              </strong>

            </button>

          )
        )}


        <button
          type="button"

          className="
            face-tile
            add-face
          "

          onClick={
            () =>
              studio
                ?.addFace?.({
                  label:
                    `FACE ${
                      faces.length +
                      1
                    }`,

                  layout: []
                })
          }
        >
          <strong>
            +
          </strong>

          <span>
            ADD FACE
          </span>
        </button>

      </div>


      <style jsx>{`

        .face-order-bench {
          margin-top: 12px;

          padding:
            10px;

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

          gap: 10px;

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
              .18
            );

          font-size: 5.5px;
          font-weight: 900;
        }


        .face-order-rail {
          display: flex;

          gap: 6px;

          overflow-x: auto;
        }


        .face-tile {
          width: 118px;
          min-width: 118px;

          height: 56px;

          padding:
            8px;

          display: flex;

          flex-direction: column;

          align-items: flex-start;

          justify-content:
            center;

          gap: 4px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .05
            );

          border-radius: 6px;

          background:
            rgba(
              255,
              255,
              255,
              .012
            );

          cursor: pointer;
        }


        .face-tile span {
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


        .face-tile strong {
          max-width: 100%;

          overflow: hidden;

          color:
            rgba(
              255,
              255,
              255,
              .55
            );

          font-size: 7px;
          font-weight: 950;

          text-overflow:
            ellipsis;

          white-space: nowrap;
        }


        .face-tile:hover {
          border-color:
            rgba(
              0,
              194,
              255,
              .25
            );
        }


        .face-tile.active {
          border-color:
            rgba(
              255,
              196,
              0,
              .40
            );
        }


        .face-tile.active strong {
          color: #ffc400;
        }


        .add-face {
          border-style:
            dashed;

          align-items:
            center;
        }


        .add-face strong {
          color: #ffc400;

          font-size: 15px;
        }

      `}</style>

    </section>
  );
}

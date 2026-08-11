const STARTING_DESIGNS = [
  {
    id:
      "blank",

    label:
      "BLANK",

    lines: [
      "START FROM ZERO"
    ]
  },

  {
    id:
      "asset",

    label:
      "FLEET ASSET",

    lines: [
      "YEAR / MAKE / MODEL",
      "ID / VALUE",
      "LOCATION"
    ]
  },

  {
    id:
      "pickup",

    label:
      "PICKUP",

    lines: [
      "VIN",
      "MILES",
      "VALUE"
    ]
  },

  {
    id:
      "person",

    label:
      "PERSON",

    lines: [
      "PHONE",
      "POSITION",
      "ID"
    ]
  },

  {
    id:
      "location",

    label:
      "LOCATION",

    lines: [
      "ADDRESS",
      "MANAGER",
      "OBJECTS"
    ]
  },

  {
    id:
      "job",

    label:
      "JOB",

    lines: [
      "CUSTOMER",
      "VALUE",
      "STATUS"
    ]
  }
];


export default function IXIObjectStudioCardBench({
  studio
}) {

  return (
    <section className="card-bench">

      <div className="bench-heading">

        <strong>
          CARD BENCH
        </strong>

        <span>
          STARTING DESIGNS
        </span>

      </div>


      <div className="card-bench-rail">

        {STARTING_DESIGNS.map(
          design => (

            <button
              type="button"

              key={
                design.id
              }

              className="design-card"

              title={
                `Use ${design.label} starting design`
              }
            >

              <strong>
                {design.label}
              </strong>


              {design.lines.map(
                line => (
                  <span
                    key={
                      line
                    }
                  >
                    {line}
                  </span>
                )
              )}

            </button>

          )
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
        </button>

      </div>


      <style jsx>{`

        .card-bench {
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
          width: 132px;
          min-width: 132px;

          height: 76px;

          padding:
            9px;

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
              255,
              196,
              0,
              .34
            );
        }


        .design-card strong {
          margin-bottom: 2px;

          color:
            rgba(
              255,
              255,
              255,
              .72
            );

          font-size: 8px;
          font-weight: 950;
        }


        .design-card span {
          color:
            rgba(
              255,
              255,
              255,
              .25
            );

          font-size: 5.5px;
          font-weight: 850;
        }


        .saved-design {
          border-style:
            dashed;
        }

      `}</style>

    </section>
  );
}

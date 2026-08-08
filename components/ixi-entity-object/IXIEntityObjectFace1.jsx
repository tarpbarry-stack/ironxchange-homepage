import IXIFaceFrame
  from "../ixi-face-studio/IXIFaceFrame";

export default function IXIEntityObjectFace1({
  entity = {},
  relationships = [],
  faceSize = "tall",
  onRelationshipOpen = null
}) {
  const displayName =
    entity?.displayName ||
    entity?.name ||
    "IXI ENTITY";

  const officeLocation =
    entity?.officeLocation ||
    entity?.location ||
    "";

  const entityId =
    entity?.entityId ||
    entity?.id ||
    "";

  const visibleRelationships =
    Array.isArray(relationships)
      ? relationships.slice(
          0,
          faceSize === "compact"
            ? 5
            : 7
        )
      : [];

  return (
    <IXIFaceFrame
      size={faceSize}
      className="eof1"
    >
      <div className="entity-face">

        {/* =========================
            OBJECT IDENTITY
            ========================= */}

        <header className="entity-header">
          <div className="entity-kicker">
            IXI ENTITY OBJECT
          </div>

          <h2>
            {displayName}
          </h2>

          {officeLocation ? (
            <div className="entity-location">
              <i className="fa-solid fa-location-dot" />

              <span>
                {officeLocation}
              </span>
            </div>
          ) : null}
        </header>


        {/* =========================
            ENTITY DATUM
            ========================= */}

        <div className="entity-datum">
          <span>
            ENTITY
          </span>

          <strong>
            {entityId || "ACTIVE"}
          </strong>
        </div>


        {/* =========================
            RELATIONSHIP FIELD
            ========================= */}

        <section className="relationship-section">
          <div className="relationship-heading">
            <span>
              RELATIONSHIPS
            </span>

            <i>
              {visibleRelationships.length}
            </i>
          </div>

          <div className="relationship-list">
            {visibleRelationships.length ? (
              visibleRelationships.map(
                relationship => {
                  const id =
                    relationship?.id ||
                    relationship?.relationshipId ||
                    relationship?.type ||
                    relationship?.label;

                  const label =
                    relationship?.label ||
                    relationship?.name ||
                    relationship?.type ||
                    "RELATED OBJECT";

                  const value =
                    relationship?.value ??
                    relationship?.count ??
                    "";

                  return (
                    <button
                      key={String(id)}
                      type="button"
                      className="relationship-row"
                      onClick={() => {
                        if (
                          typeof onRelationshipOpen ===
                          "function"
                        ) {
                          onRelationshipOpen(
                            relationship
                          );
                        }
                      }}
                    >
                      <span>
                        {label}
                      </span>

                      <div>
                        {value !== "" ? (
                          <strong>
                            {value}
                          </strong>
                        ) : null}

                        <i className="fa-solid fa-chevron-right" />
                      </div>
                    </button>
                  );
                }
              )
            ) : (
              <div className="relationship-empty">
                NO RELATED OBJECTS YET
              </div>
            )}
          </div>
        </section>


        {/* =========================
            OBJECT MARK
            ========================= */}

        <div className="entity-mark">
          <span>
            IXI AOS
          </span>

          <i>
            ENTITY
          </i>
        </div>
      </div>


      <style jsx>{`
        .entity-face,
        .entity-face * {
          box-sizing: border-box;
        }

        .entity-face {
          width: 100%;
          height: 100%;

          display: flex;
          flex-direction: column;

          overflow: hidden;
        }


        /* =========================
           IDENTITY
           ========================= */

        .entity-header {
          padding:
            7px
            2px
            11px;

          border-bottom:
            1px solid
            rgba(255,255,255,.06);
        }

        .entity-kicker {
          margin-bottom: 8px;

          color:
            rgba(255,196,0,.70);

          font-size:
            var(--ixi-face-font-micro);

          font-weight: 950;

          letter-spacing: .13em;

          text-transform: uppercase;
        }

        h2 {
          margin: 0;

          color: #f2f2f2;

          font-size:
            var(--ixi-face-font-display);

          font-weight: 950;

          line-height: 1.02;

          letter-spacing: -.45px;

          text-transform: uppercase;
        }

        .entity-location {
          margin-top: 9px;

          display: flex;
          align-items: center;

          gap: 6px;

          color:
            rgba(255,255,255,.42);

          font-size:
            var(--ixi-face-font-value);

          font-weight: 800;

          letter-spacing: .02em;
        }

        .entity-location i {
          color:
            rgba(255,196,0,.52);

          font-size: 7px;
        }


        /* =========================
           ENTITY DATUM
           ========================= */

        .entity-datum {
          min-height: 34px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 10px;

          padding:
            0
            2px;

          border-bottom:
            1px solid
            rgba(255,255,255,.045);
        }

        .entity-datum span {
          color:
            rgba(255,255,255,.28);

          font-size:
            var(--ixi-face-font-label);

          font-weight: 950;

          letter-spacing: .10em;

          text-transform: uppercase;
        }

        .entity-datum strong {
          min-width: 0;

          overflow: hidden;

          color:
            rgba(255,255,255,.58);

          font-size:
            var(--ixi-face-font-label);

          font-weight: 900;

          letter-spacing: .05em;

          text-overflow: ellipsis;
          white-space: nowrap;
        }


        /* =========================
           RELATIONSHIPS
           ========================= */

        .relationship-section {
          min-height: 0;

          flex: 1 1 auto;

          display: flex;
          flex-direction: column;

          padding-top: 10px;

          overflow: hidden;
        }

        .relationship-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;

          margin-bottom: 7px;

          padding: 0 2px;
        }

        .relationship-heading span {
          color:
            rgba(255,255,255,.32);

          font-size:
            var(--ixi-face-font-label);

          font-weight: 950;

          letter-spacing: .10em;

          text-transform: uppercase;
        }

        .relationship-heading i {
          min-width: 17px;

          height: 14px;

          display: grid;
          place-items: center;

          border:
            1px solid
            rgba(255,255,255,.06);

          border-radius: 4px;

          background:
            rgba(255,255,255,.025);

          color:
            rgba(255,196,0,.60);

          font-size:
            var(--ixi-face-font-micro);

          font-style: normal;

          font-weight: 950;
        }

        .relationship-list {
          min-height: 0;

          display: grid;
          gap: 4px;

          overflow: hidden;
        }

        .relationship-row {
          width: 100%;
          min-height: 29px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 8px;

          padding:
            0
            9px;

          appearance: none;

          border:
            1px solid
            rgba(255,255,255,.045);

          border-radius: 5px;

          background:
            linear-gradient(
              180deg,
              rgba(255,255,255,.016),
              rgba(255,255,255,0)
            ),
            rgba(255,255,255,.012);

          color:
            rgba(255,255,255,.60);

          cursor: pointer;
        }

        .relationship-row > span {
          min-width: 0;

          overflow: hidden;

          font-size:
            var(--ixi-face-font-value);

          font-weight: 900;

          letter-spacing: .035em;

          text-align: left;

          text-overflow: ellipsis;
          white-space: nowrap;

          text-transform: uppercase;
        }

        .relationship-row > div {
          display: flex;
          align-items: center;

          gap: 8px;
        }

        .relationship-row strong {
          color:
            rgba(255,255,255,.74);

          font-size:
            var(--ixi-face-font-value);

          font-weight: 950;
        }

        .relationship-row i {
          color:
            rgba(255,196,0,.38);

          font-size: 6px;
        }

        .relationship-row:hover {
          border-color:
            rgba(255,196,0,.18);

          background:
            rgba(255,196,0,.045);

          color: #f2f2f2;
        }

        .relationship-row:hover i {
          color: #ffc400;
        }

        .relationship-empty {
          min-height: 70px;

          display: grid;
          place-items: center;

          border:
            1px dashed
            rgba(255,255,255,.055);

          border-radius: 6px;

          color:
            rgba(255,255,255,.18);

          font-size:
            var(--ixi-face-font-micro);

          font-weight: 950;

          letter-spacing: .09em;

          text-transform: uppercase;
        }


        /* =========================
           OBJECT MARK
           ========================= */

        .entity-mark {
          min-height: 22px;

          margin-top: auto;

          display: flex;
          align-items: center;
          justify-content: space-between;

          padding:
            5px
            2px
            0;

          color:
            rgba(255,255,255,.17);

          font-size:
            var(--ixi-face-font-micro);

          font-weight: 950;

          letter-spacing: .12em;

          text-transform: uppercase;
        }

        .entity-mark i {
          color:
            rgba(255,196,0,.28);

          font-style: normal;
        }
      `}</style>
    </IXIFaceFrame>
  );
}

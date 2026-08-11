import {
  useState
} from "react";


export default function IXIAosRelationshipList({
  relationships = [],

  emptyLabel =
    "NO RELATIONSHIPS",

  onOpenRelationship = null,

  onRemoveRelationship = null,

  onOpenContainer = null,

  className = ""
}) {

  const [
    openMenuId,
    setOpenMenuId
  ] =
    useState(
      ""
    );


  const safeRelationships =
    Array.isArray(
      relationships
    )
      ? relationships
      : [];


  if (
    safeRelationships.length ===
    0
  ) {

    return (
      <div className="relationship-empty">
        {emptyLabel}

        <style jsx>{`

          .relationship-empty {
            padding:
              14px 4px;

            color:
              rgba(
                255,
                255,
                255,
                .32
              );

            font-size:
              var(
                --ixi-face-font-value,
                10.5px
              );

            font-weight:
              900;
          }

        `}</style>
      </div>
    );
  }


  return (
    <div
      className={[
        "ixi-aos-relationship-list",

        className
      ]
        .filter(Boolean)
        .join(" ")}
    >

      {safeRelationships.map(
        (
          relationship,
          index
        ) => {

          const relationshipId =
            String(
              relationship
                ?.relationshipId ||
              relationship
                ?.id ||
              `relationship-${index + 1}`
            );


          const label =
            relationship
              ?.label ||
            relationship
              ?.displayName ||
            relationship
              ?.containerName ||
            relationship
              ?.name ||
            "RELATIONSHIP";


          const meta =
            relationship
              ?.relationshipType ||
            relationship
              ?.type ||
            relationship
              ?.status ||
            "";


          const menuOpen =
            openMenuId ===
            relationshipId;


          return (
            <div
              key={
                relationshipId
              }

              className="
                relationship-row
              "
            >

              <button
                type="button"

                className="
                  relationship-main
                "

                onClick={
                  event => {

                    event.preventDefault();
                    event.stopPropagation();

                    onOpenRelationship
                      ?.(relationship);
                  }
                }
              >

                <span>
                  {label}
                </span>

                {meta ? (
                  <small>
                    {meta}
                  </small>
                ) : null}

              </button>


              <div className="relationship-menu-wrap">

                <button
                  type="button"

                  className="
                    relationship-menu-button
                  "

                  aria-label={
                    `Relationship actions for ${label}`
                  }

                  title={
                    "Relationship actions"
                  }

                  onPointerDown={
                    event => {

                      event.preventDefault();
                      event.stopPropagation();
                    }
                  }

                  onClick={
                    event => {

                      event.preventDefault();
                      event.stopPropagation();

                      setOpenMenuId(
                        current =>
                          current ===
                            relationshipId
                            ? ""
                            : relationshipId
                      );
                    }
                  }
                >

                  •••

                </button>


                {menuOpen ? (
                  <div className="relationship-menu">

                    <button
                      type="button"

                      onClick={
                        event => {

                          event.preventDefault();
                          event.stopPropagation();

                          setOpenMenuId(
                            ""
                          );

                          onOpenContainer
                            ?.(relationship);
                        }
                      }
                    >
                      OPEN
                    </button>


                    <button
                      type="button"

                      className="danger"

                      onClick={
                        event => {

                          event.preventDefault();
                          event.stopPropagation();

                          setOpenMenuId(
                            ""
                          );

                          onRemoveRelationship
                            ?.(relationship);
                        }
                      }
                    >
                      REMOVE
                    </button>

                  </div>
                ) : null}

              </div>

            </div>
          );
        }
      )}


      <style jsx>{`

        .ixi-aos-relationship-list,
        .ixi-aos-relationship-list * {
          box-sizing:
            border-box;
        }


        .ixi-aos-relationship-list {
          width:
            100%;

          min-width:
            0;
        }


        .relationship-row {
          position:
            relative;

          width:
            100%;

          min-width:
            0;

          min-height:
            34px;

          display:
            grid;

          grid-template-columns:
            minmax(
              0,
              1fr
            )
            32px;

          align-items:
            center;

          gap:
            5px;

          border-bottom:
            1px solid
            rgba(
              255,
              255,
              255,
              .045
            );
        }


        .relationship-row:last-child {
          border-bottom:
            0;
        }


        .relationship-main {
          min-width:
            0;

          height:
            100%;

          padding:
            5px 3px;

          display:
            flex;

          flex-direction:
            column;

          justify-content:
            center;

          align-items:
            flex-start;

          gap:
            2px;

          border:
            0;

          background:
            transparent;

          color:
            rgba(
              255,
              255,
              255,
              .9
            );

          text-align:
            left;

          cursor:
            pointer;
        }


        .relationship-main span {
          width:
            100%;

          font-size:
            var(
              --ixi-face-font-value,
              10.5px
            );

          font-weight:
            950;

          overflow:
            hidden;

          text-overflow:
            ellipsis;

          white-space:
            nowrap;
        }


        .relationship-main small {
          color:
            rgba(
              255,
              255,
              255,
              .38
            );

          font-size:
            var(
              --ixi-face-font-micro,
              8px
            );

          font-weight:
            900;

          text-transform:
            uppercase;
        }


        .relationship-menu-wrap {
          position:
            relative;
        }


        .relationship-menu-button {
          width:
            28px;

          height:
            24px;

          padding:
            0;

          border:
            0;

          border-radius:
            4px;

          background:
            rgba(
              255,
              255,
              255,
              .025
            );

          color:
            rgba(
              255,
              255,
              255,
              .48
            );

          font-size:
            11px;

          font-weight:
            950;

          cursor:
            pointer;
        }


        .relationship-menu-button:hover {
          background:
            rgba(
              255,
              196,
              0,
              .08
            );

          color:
            #ffc400;
        }


        .relationship-menu {
          position:
            absolute;

          top:
            calc(
              100% + 4px
            );

          right:
            0;

          width:
            94px;

          padding:
            4px;

          display:
            flex;

          flex-direction:
            column;

          gap:
            3px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .1
            );

          border-radius:
            6px;

          background:
            #101010;

          box-shadow:
            0 10px 24px
            rgba(
              0,
              0,
              0,
              .45
            );

          z-index:
            500;
        }


        .relationship-menu button {
          height:
            26px;

          border:
            0;

          border-radius:
            4px;

          background:
            rgba(
              255,
              255,
              255,
              .025
            );

          color:
            rgba(
              255,
              255,
              255,
              .68
            );

          font-size:
            8px;

          font-weight:
            950;

          text-align:
            left;

          padding:
            0 7px;

          cursor:
            pointer;
        }


        .relationship-menu
          .danger {

          color:
            rgba(
              255,
              111,
              111,
              .9
            );
        }

      `}</style>

    </div>
  );
}

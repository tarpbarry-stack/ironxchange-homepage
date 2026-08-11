import {
  useMemo
} from "react";

import IXIMachineRail
  from "../../IXIMachineRail";

import {
  getIXIAosObjectId,
  getIXIAosObjectName,
  resolveIXICardDefinition,
  getIXICardFaceByIndex,
  getIXICardFaceCount,
  getIXICardCapabilities
} from "./IXICardDefinitionEngine";


/* =========================================================
   HELPERS
   ========================================================= */

function clean(
  value
) {
  return String(
    value || ""
  ).trim();
}


function safeObject(
  value
) {
  return (
    value &&
    typeof value ===
      "object" &&
    !Array.isArray(value)
  )
    ? value
    : {};
}


function getPrimaryImage(
  object = {}
) {
  const media =
    Array.isArray(
      object?.media
    )
      ? object.media
      : [];


  const firstMedia =
    media.find(item => {
      if (
        typeof item ===
        "string"
      ) {
        return Boolean(
          clean(item)
        );
      }

      return Boolean(
        item?.url ||
        item?.src ||
        item?.imageUrl
      );
    });


  if (
    typeof firstMedia ===
    "string"
  ) {
    return firstMedia;
  }


  return (
    firstMedia?.url ||
    firstMedia?.src ||
    firstMedia?.imageUrl ||

    object?.imageUrl ||

    object?.imageUrls?.[0] ||

    object?.images?.[0]?.url ||

    ""
  );
}


function getDisplayFields(
  object = {}
) {
  const fields =
    safeObject(
      object?.fields
    );


  return Object.entries(
    fields
  )
    .filter(([
      key,
      value
    ]) => {
      if (
        value === null ||
        value === undefined ||
        value === ""
      ) {
        return false;
      }

      if (
        typeof value ===
          "object"
      ) {
        return false;
      }

      return Boolean(
        clean(key)
      );
    })
    .slice(
      0,
      6
    );
}


function getNextFace(
  currentFace,
  faceCount
) {
  const count =
    Math.max(
      1,
      Number(
        faceCount || 1
      )
    );


  const current =
    Math.max(
      1,
      Number(
        currentFace || 1
      )
    );


  return current >= count
    ? 1
    : current + 1;
}


/* =========================================================
   BUILT-IN GENERIC MODULES
   ========================================================= */

function IXIObjectIdentityModule({
  object
}) {
  return (
    <div className="ixi-card-runtime-identity">
      <strong>
        {getIXIAosObjectName(
          object
        )}
      </strong>
    </div>
  );
}


function IXIPrimaryMediaModule({
  object
}) {
  const imageUrl =
    getPrimaryImage(
      object
    );


  return (
    <div className="ixi-card-runtime-media">

      {imageUrl ? (
        <img
          src={
            imageUrl
          }

          alt={
            getIXIAosObjectName(
              object
            )
          }

          draggable={
            false
          }
        />
      ) : (
        <div className="ixi-card-runtime-media-empty">
          <span>
            NO MEDIA
          </span>
        </div>
      )}

    </div>
  );
}


function IXIObjectFieldsModule({
  object
}) {
  const fields =
    getDisplayFields(
      object
    );


  if (
    !fields.length
  ) {
    return (
      <div className="ixi-card-runtime-fields-empty">
        <span>
          NO FIELDS YET
        </span>
      </div>
    );
  }


  return (
    <div className="ixi-card-runtime-fields">

      {fields.map(([
        key,
        value
      ]) => (
        <div
          key={
            key
          }

          className="ixi-card-runtime-field"
        >
          <span>
            {key}
          </span>

          <strong>
            {String(
              value
            )}
          </strong>
        </div>
      ))}

    </div>
  );
}


/* =========================================================
   CARD RUNTIME
   ========================================================= */

export default function IXIAosCardRuntime({
  object = {},

  cardDefinition = null,
  template = null,

  parentLabel = "",

  dragHandleProps = null,

  ixiState = {},

  onIxiStateChange = null,

  saved = false,

  armedDestination = "",

  onSendFront = null,
  onSendBack = null,

  onCycleColor = null,
  onCycleOutline = null,

  onSendToArmedDestination = null,

  /*
   * Face Studio / system templates
   * can override individual modules.
   */
  renderModule = null,

  /*
   * Later:
   * universal console controller
   */
  onOpenConsole = null
}) {

  const objectId =
    getIXIAosObjectId(
      object
    );


  const objectName =
    getIXIAosObjectName(
      object
    );


  /*
   * Card identity comes from the
   * Card Definition.
   *
   * NOT from where this Card is
   * currently being displayed.
   */
  const resolvedDefinition =
    useMemo(
      () =>
        cardDefinition
          ? cardDefinition
          : resolveIXICardDefinition({
              object,
              template
            }),
      [
        object,
        cardDefinition,
        template
      ]
    );


  const capabilities =
    getIXICardCapabilities(
      resolvedDefinition
    );


  const faceCount =
    Math.max(
      1,
      getIXICardFaceCount(
        resolvedDefinition
      )
    );


  const currentFaceIndex =
    Math.min(
      faceCount,
      Math.max(
        1,
        Number(
          ixiState?.face ||
          1
        )
      )
    );


  const activeFace =
    getIXICardFaceByIndex(
      resolvedDefinition,
      currentFaceIndex
    );


  const boardColor =
    ixiState?.color ||
    "none";


  const boardOutline =
    Number(
      ixiState?.outline ??
      1
    );


  const actionNotice =
    ixiState?.actionNotice ||
    null;


  const pathLabel =
    clean(
      parentLabel
    );


  function setFace(
    nextFace
  ) {
    if (
      !objectId
    ) {
      return;
    }

    onIxiStateChange?.(
      objectId,
      {
        face:
          Number(
            nextFace || 1
          )
      }
    );
  }


  function cycleFace() {
    setFace(
      getNextFace(
        currentFaceIndex,
        faceCount
      )
    );
  }


  function renderBuiltInModule(
    moduleDefinition
  ) {
    const moduleType =
      clean(
        moduleDefinition
          ?.moduleType
      )
        .toLowerCase();


    if (
      moduleType ===
      "object-identity"
    ) {
      return (
        <IXIObjectIdentityModule
          object={
            object
          }
        />
      );
    }


    if (
      moduleType ===
      "primary-media"
    ) {
      return (
        <IXIPrimaryMediaModule
          object={
            object
          }
        />
      );
    }


    if (
      moduleType ===
      "object-fields"
    ) {
      return (
        <IXIObjectFieldsModule
          object={
            object
          }
        />
      );
    }


    return null;
  }


  function renderFaceModule(
    moduleDefinition,
    index
  ) {
    /*
     * Face Studio / protected system
     * templates get first chance.
     */
    if (
      typeof renderModule ===
      "function"
    ) {
      const customResult =
        renderModule({
          object,

          cardDefinition:
            resolvedDefinition,

          face:
            activeFace,

          module:
            moduleDefinition,

          moduleIndex:
            index
        });


      if (
        customResult !==
        undefined &&
        customResult !==
        null
      ) {
        return customResult;
      }
    }


    return renderBuiltInModule(
      moduleDefinition
    );
  }


  const faceModules =
    Array.isArray(
      activeFace?.layout
    )
      ? activeFace.layout
      : [];


  return (
    <section
      className={[
        "ixi-aos-card-runtime",
        "card",

        `board-color-${
          boardColor
        }`,

        `board-outline-${
          boardOutline
        }`
      ].join(" ")}

      data-ixi-object-id={
        objectId
      }

      data-ixi-card-definition-id={
        resolvedDefinition
          ?.cardDefinitionId ||
        ""
      }

      {...(
        capabilities.draggable
          ? dragHandleProps || {}
          : {}
      )}
    >

      {/* ===================================================
          ACTION NOTICE
          =================================================== */}

      {capabilities.hasNotices &&
      actionNotice?.message ? (
        <div
          className={[
            "ixi-aos-card-notice",

            `tone-${
              actionNotice?.tone ||
              "success"
            }`
          ].join(" ")}
        >
          {actionNotice.message}
        </div>
      ) : null}


      {/* ===================================================
          FACE HEADER
          =================================================== */}

      <div className="ixi-aos-card-header">

        <div className="ixi-aos-card-heading">

          {pathLabel ? (
            <span className="ixi-aos-card-path">
              {pathLabel}
            </span>
          ) : (
            <span className="ixi-aos-card-path">
              OBJECT
            </span>
          )}


          <strong>
            {objectName}
          </strong>

        </div>


        <div className="ixi-aos-card-face-position">
          {currentFaceIndex}
          /
          {faceCount}
        </div>

      </div>


      {/* ===================================================
          ACTIVE FACE
          =================================================== */}

      <div className="ixi-aos-card-face">

        {faceModules.length ? (

          faceModules.map(
            (
              moduleDefinition,
              index
            ) => (
              <div
                key={
                  moduleDefinition
                    ?.slotId ||
                  `${activeFace?.faceId || "face"}-${index}`
                }

                className={[
                  "ixi-aos-card-module",

                  `module-${
                    clean(
                      moduleDefinition
                        ?.moduleType
                    )
                      .toLowerCase()
                      .replace(
                        /[^a-z0-9-]/g,
                        "-"
                      )
                  }`
                ].join(" ")}
              >
                {renderFaceModule(
                  moduleDefinition,
                  index
                )}
              </div>
            )
          )

        ) : (

          <div className="ixi-aos-card-face-empty">

            <strong>
              {activeFace?.label ||
              `FACE ${currentFaceIndex}`}
            </strong>

            <span>
              EMPTY FACE
            </span>

          </div>

        )}

      </div>


      {/* ===================================================
          FACE / CONSOLE STRIP
          =================================================== */}

      <div className="ixi-aos-card-runtime-strip">

        <button
          type="button"

          onPointerDown={
            event =>
              event
                .stopPropagation()
          }

          onClick={
            cycleFace
          }
        >
          FACE
        </button>


        {capabilities.hasConsole ? (
          <button
            type="button"

            onPointerDown={
              event =>
                event
                  .stopPropagation()
            }

            onClick={
              event => {
                event.preventDefault();
                event.stopPropagation();

                onOpenConsole?.(
                  object,
                  resolvedDefinition
                );
              }
            }
          >
            CONSOLE
          </button>
        ) : null}

      </div>


      {/* ===================================================
          STANDARD IXI RAIL
          =================================================== */}

      {capabilities.hasRail ? (
        <IXIMachineRail
          listing={
            object
          }

          saved={
            saved
          }

          boardColor={
            boardColor
          }

          boardOutline={
            boardOutline
          }

          machineFace={
            currentFaceIndex
          }

          onCycleMachineFace={
            cycleFace
          }

          onSendFront={
            onSendFront
          }

          onSendBack={
            onSendBack
          }

          onCycleColor={
            onCycleColor
          }

          onCycleOutline={
            onCycleOutline
          }

          armedDestination={
            armedDestination
          }

          onSendToArmedDestination={
            onSendToArmedDestination
          }
        />
      ) : null}


      {/* ===================================================
          STYLE
          =================================================== */}

      <style jsx>{`

        .ixi-aos-card-runtime,
        .ixi-aos-card-runtime * {
          box-sizing:
            border-box;
        }


        .ixi-aos-card-runtime {
          position: relative;

          width: 298px;
          min-width: 298px;
          max-width: 298px;

          height: 471px;
          min-height: 471px;
          max-height: 471px;

          overflow: hidden;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .08
            );

          outline:
            1px solid
            rgba(
              255,
              255,
              255,
              .02
            );

          outline-offset:
            0;

          border-radius:
            14px;

          background:
            linear-gradient(
              180deg,
              rgba(
                255,
                255,
                255,
                .032
              ),
              rgba(
                255,
                255,
                255,
                .005
              )
            ),
            #101010;

          box-shadow:
            inset
            0 1px 0
            rgba(
              255,
              255,
              255,
              .04
            ),

            0 18px 34px
            rgba(
              0,
              0,
              0,
              .42
            );

          cursor: grab;
        }


        /* ===============================================
           BOARD COLOR / OUTLINE
           =============================================== */

        .ixi-aos-card-runtime.board-outline-0 {
          outline-width: 0;
        }

        .ixi-aos-card-runtime.board-outline-1 {
          outline-width: 1px;
        }

        .ixi-aos-card-runtime.board-outline-3 {
          outline-width: 3px;
        }

        .ixi-aos-card-runtime.board-outline-5 {
          outline-width: 5px;
        }


        .ixi-aos-card-runtime.board-color-green {
          outline-color:
            rgba(
              56,
              161,
              105,
              .95
            );
        }

        .ixi-aos-card-runtime.board-color-yellow {
          outline-color:
            rgba(
              255,
              196,
              0,
              .95
            );
        }

        .ixi-aos-card-runtime.board-color-red {
          outline-color:
            rgba(
              229,
              62,
              62,
              .95
            );
        }

        .ixi-aos-card-runtime.board-color-cyan {
          outline-color:
            rgba(
              0,
              194,
              255,
              .95
            );
        }

        .ixi-aos-card-runtime.board-color-white {
          outline-color:
            rgba(
              255,
              255,
              255,
              .88
            );
        }

        .ixi-aos-card-runtime.board-color-blue {
          outline-color:
            rgba(
              49,
              130,
              206,
              .95
            );
        }

        .ixi-aos-card-runtime.board-color-orange {
          outline-color:
            rgba(
              249,
              133,
              18,
              .95
            );
        }


        /* ===============================================
           HEADER
           =============================================== */

        .ixi-aos-card-header {
          height: 52px;

          padding:
            11px 12px 8px;

          display: flex;

          align-items:
            flex-start;

          justify-content:
            space-between;

          gap: 8px;

          border-bottom:
            1px solid
            rgba(
              255,
              255,
              255,
              .045
            );
        }


        .ixi-aos-card-heading {
          min-width: 0;

          flex: 1;
        }


        .ixi-aos-card-path {
          display: block;

          overflow: hidden;

          color: #ffc400;

          font-size: 6.5px;
          font-weight: 950;

          letter-spacing:
            .09em;

          line-height: 1;

          text-overflow:
            ellipsis;

          text-transform:
            uppercase;

          white-space:
            nowrap;
        }


        .ixi-aos-card-heading strong {
          display: block;

          margin-top: 5px;

          overflow: hidden;

          color: #f4f4f4;

          font-size: 17px;
          font-weight: 950;

          line-height: 1;

          text-overflow:
            ellipsis;

          text-transform:
            uppercase;

          white-space:
            nowrap;
        }


        .ixi-aos-card-face-position {
          min-width: 25px;

          padding-top: 4px;

          color:
            rgba(
              255,
              255,
              255,
              .26
            );

          font-size: 6px;
          font-weight: 950;

          text-align: right;
        }


        /* ===============================================
           FACE
           =============================================== */

        .ixi-aos-card-face {
          position: absolute;

          left: 0;
          right: 0;

          top: 52px;
          bottom: 58px;

          padding:
            8px 12px;

          overflow: hidden;
        }


        .ixi-aos-card-module {
          width: 100%;
        }


        /* ===============================================
           IDENTITY MODULE
           =============================================== */

        :global(
          .ixi-card-runtime-identity
        ) {
          min-height: 27px;

          display: flex;

          align-items:
            center;

          border-bottom:
            1px solid
            rgba(
              255,
              255,
              255,
              .04
            );
        }


        :global(
          .ixi-card-runtime-identity
          strong
        ) {
          overflow: hidden;

          color:
            rgba(
              255,
              255,
              255,
              .66
            );

          font-size: 9px;
          font-weight: 950;

          text-overflow:
            ellipsis;

          white-space:
            nowrap;
        }


        /* ===============================================
           MEDIA MODULE
           =============================================== */

        :global(
          .ixi-card-runtime-media
        ) {
          width: 100%;
          height: 190px;

          margin-top: 7px;

          overflow: hidden;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .05
            );

          border-radius: 7px;

          background: #080808;
        }


        :global(
          .ixi-card-runtime-media
          img
        ) {
          width: 100%;
          height: 100%;

          display: block;

          object-fit: cover;
        }


        :global(
          .ixi-card-runtime-media-empty
        ) {
          width: 100%;
          height: 100%;

          display: flex;

          align-items:
            center;

          justify-content:
            center;

          color:
            rgba(
              255,
              255,
              255,
              .13
            );

          font-size: 8px;
          font-weight: 950;

          letter-spacing:
            .08em;
        }


        /* ===============================================
           FIELDS MODULE
           =============================================== */

        :global(
          .ixi-card-runtime-fields
        ) {
          margin-top: 7px;

          display: grid;

          grid-template-columns:
            1fr 1fr;

          gap: 5px;
        }


        :global(
          .ixi-card-runtime-field
        ) {
          min-width: 0;

          height: 36px;

          padding: 5px 6px;

          overflow: hidden;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .045
            );

          border-radius: 4px;

          background:
            rgba(
              255,
              255,
              255,
              .015
            );
        }


        :global(
          .ixi-card-runtime-field
          span
        ) {
          display: block;

          overflow: hidden;

          color:
            rgba(
              255,
              255,
              255,
              .25
            );

          font-size: 5.5px;
          font-weight: 900;

          text-overflow:
            ellipsis;

          text-transform:
            uppercase;

          white-space:
            nowrap;
        }


        :global(
          .ixi-card-runtime-field
          strong
        ) {
          display: block;

          margin-top: 3px;

          overflow: hidden;

          color:
            rgba(
              255,
              255,
              255,
              .70
            );

          font-size: 7.5px;
          font-weight: 950;

          text-overflow:
            ellipsis;

          white-space:
            nowrap;
        }


        :global(
          .ixi-card-runtime-fields-empty
        ) {
          height: 48px;

          margin-top: 7px;

          display: flex;

          align-items:
            center;

          justify-content:
            center;

          border:
            1px dashed
            rgba(
              255,
              255,
              255,
              .045
            );

          border-radius: 5px;

          color:
            rgba(
              255,
              255,
              255,
              .15
            );

          font-size: 6px;
          font-weight: 950;
        }


        /* ===============================================
           EMPTY FACE
           =============================================== */

        .ixi-aos-card-face-empty {
          width: 100%;
          height: 100%;

          display: flex;

          flex-direction:
            column;

          align-items:
            center;

          justify-content:
            center;

          gap: 7px;
        }


        .ixi-aos-card-face-empty strong {
          color:
            rgba(
              255,
              196,
              0,
              .58
            );

          font-size: 9px;
          font-weight: 950;
        }


        .ixi-aos-card-face-empty span {
          color:
            rgba(
              255,
              255,
              255,
              .16
            );

          font-size: 7px;
          font-weight: 900;
        }


        /* ===============================================
           RUNTIME STRIP
           =============================================== */

        .ixi-aos-card-runtime-strip {
          position: absolute;

          left: 12px;
          right: 12px;

          bottom: 22px;

          height: 29px;

          display: grid;

          grid-template-columns:
            1fr 1fr;

          gap: 5px;
        }


        .ixi-aos-card-runtime-strip button {
          min-width: 0;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .055
            );

          border-radius: 4px;

          background:
            rgba(
              255,
              255,
              255,
              .018
            );

          color:
            rgba(
              255,
              255,
              255,
              .34
            );

          font-size: 6px;
          font-weight: 950;

          letter-spacing:
            .05em;

          cursor: pointer;
        }


        .ixi-aos-card-runtime-strip button:hover {
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
              .82
            );
        }


        /* ===============================================
           ACTION NOTICE
           =============================================== */

        .ixi-aos-card-notice {
          position: absolute;

          left: 9px;
          right: 9px;

          top: 8px;

          min-height: 25px;

          padding: 6px 8px;

          display: flex;

          align-items:
            center;

          justify-content:
            center;

          z-index: 500;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .10
            );

          border-radius: 5px;

          background:
            rgba(
              5,
              5,
              5,
              .95
            );

          color:
            rgba(
              255,
              255,
              255,
              .84
            );

          font-size: 7px;
          font-weight: 950;

          text-align: center;
        }


        .ixi-aos-card-notice.tone-success {
          border-color:
            rgba(
              56,
              161,
              105,
              .42
            );
        }


        .ixi-aos-card-notice.tone-warning {
          border-color:
            rgba(
              255,
              196,
              0,
              .44
            );
        }


        .ixi-aos-card-notice.tone-error {
          border-color:
            rgba(
              229,
              62,
              62,
              .48
            );
        }

      `}</style>

    </section>
  );
}

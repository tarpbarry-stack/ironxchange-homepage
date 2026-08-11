import {
  useMemo
} from "react";

import IXIMachineRail
  from "../../IXIMachineRail";

import IXIObjectCardActuator
  from "../../ixi-chassis/IXIObjectCardActuator";

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

function getObjectFieldValue(
  object = {},
  fieldId = ""
) {
  const id =
    clean(
      fieldId
    );

  if (!id) {
    return "";
  }

  return object?.fields?.[id] ?? "";
}


function getObjectFieldLabel(
  object = {},
  fieldId = "",
  fallback = ""
) {
  const id =
    clean(
      fieldId
    );

  const definition =
    Array.isArray(
      object?.fieldDefinitions
    )
      ? object.fieldDefinitions.find(
          field =>
            field?.fieldId === id
        )
      : null;

  return clean(
    fallback ||
    definition?.label ||
    id
  );
}


function formatRuntimeValue(
  value,
  fieldType = ""
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  const type =
    clean(
      fieldType
    ).toLowerCase();

  const number =
    Number(
      value
    );

  if (
    type === "money" &&
    Number.isFinite(number)
  ) {
    return new Intl.NumberFormat(
      "en-US",
      {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0
      }
    ).format(number);
  }

  if (
    type === "number" &&
    Number.isFinite(number)
  ) {
    return new Intl.NumberFormat(
      "en-US",
      {
        maximumFractionDigits: 0
      }
    ).format(number);
  }

  return String(value);
}


function getObjectFieldType(
  object = {},
  fieldId = ""
) {
  const id =
    clean(
      fieldId
    );

  const definition =
    Array.isArray(
      object?.fieldDefinitions
    )
      ? object.fieldDefinitions.find(
          field =>
            field?.fieldId === id
        )
      : null;

  return clean(
    definition?.fieldType
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


function IXIObjectFieldModule({
  object,
  moduleDefinition
}) {
  const fieldId =
    clean(
      moduleDefinition?.fieldId
    );

  const value =
    getObjectFieldValue(
      object,
      fieldId
    );

  const label =
    getObjectFieldLabel(
      object,
      fieldId,
      moduleDefinition?.label
    );

  const fieldType =
    getObjectFieldType(
      object,
      fieldId
    );

  return (
    <div className="ixi-card-runtime-single-field">

      <span>
        {label}
      </span>

      <strong>
        {formatRuntimeValue(
          value,
          fieldType
        )}
      </strong>

    </div>
  );
}


function IXIObjectFieldGroupModule({
  object,
  moduleDefinition
}) {
  const fieldIds =
    Array.isArray(
      moduleDefinition
        ?.config
        ?.fields
    )
      ? moduleDefinition
          .config
          .fields
      : [];

  return (
    <div className="ixi-card-runtime-field-group">

      {fieldIds.map(
        fieldId => {

          const value =
            getObjectFieldValue(
              object,
              fieldId
            );

          const label =
            getObjectFieldLabel(
              object,
              fieldId
            );

          const fieldType =
            getObjectFieldType(
              object,
              fieldId
            );

          return (
            <div
              key={
                fieldId
              }
            >
              <span>
                {label}
              </span>

              <strong>
                {formatRuntimeValue(
                  value,
                  fieldType
                )}
              </strong>
            </div>
          );
        }
      )}

    </div>
  );
}


function IXIStatusModule({
  object,
  moduleDefinition
}) {
  const fieldId =
    clean(
      moduleDefinition?.fieldId ||
      "status"
    );

  const value =
    getObjectFieldValue(
      object,
      fieldId
    );

  return (
    <div className="ixi-card-runtime-status">

      <span>
        {moduleDefinition?.label || "STATUS"}
      </span>

      <strong>
        {value || "—"}
      </strong>

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
 * OPTIONAL STUDIO EDIT CONTRACT
 *
 * Normal Board/Card use does not need
 * these props.
 */
studioEditing = false,

selectedModuleId = "",

onSelectModule = null,

/*
 * Existing console entry point.
 * Console physics remain external.
 */
onOpenConsole = null,

onExpandConsoleLeft = null,
onExpandConsoleRight = null,

consoleLeftOpen = false,
consoleRightOpen = false,

forcedFaceIndex = null,

faceOnly = false,
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
  forcedFaceIndex !== null &&
  forcedFaceIndex !== undefined
    ? Math.min(
        faceCount,
        Math.max(
          1,
          Number(
            forcedFaceIndex ||
            1
          )
        )
      )
    : Math.min(
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


  /*
   * Identity belongs to the Card shell.
   *
   * A Face may use an identity definition
   * to configure the shell/header, but it
   * does not render a second identity block.
   */
  if (
    moduleType ===
    "object-identity"
  ) {
    return null;
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
    "object-field"
  ) {
    return (
      <IXIObjectFieldModule
        object={
          object
        }

        moduleDefinition={
          moduleDefinition
        }
      />
    );
  }


  if (
    moduleType ===
    "object-field-group"
  ) {
    return (
      <IXIObjectFieldGroupModule
        object={
          object
        }

        moduleDefinition={
          moduleDefinition
        }
      />
    );
  }


  if (
    moduleType ===
    "status"
  ) {
    return (
      <IXIStatusModule
        object={
          object
        }

        moduleDefinition={
          moduleDefinition
        }
      />
    );
  }


  /*
   * Legacy generic fallback.
   */
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

function getRuntimeModuleId(
  moduleDefinition,
  index
) {
  return clean(
    moduleDefinition
      ?.moduleId ||

    moduleDefinition
      ?.slotId ||

    `${activeFace?.faceId || "face"}-${index}`
  );
}  

const identityModule =
  faceModules.find(
    module =>
      clean(
        module?.moduleType
      ).toLowerCase() ===
      "object-identity"
  ) ||
  null;


const headerMetricField =
  clean(
    identityModule
      ?.config
      ?.metricField
  );


const headerMetricValue =
  headerMetricField
    ? getObjectFieldValue(
        object,
        headerMetricField
      )
    : "";


const headerMetricSuffix =
  clean(
    identityModule
      ?.config
      ?.metricSuffix
  );


const bodyFaceModules =
  faceModules.filter(
    module =>
      clean(
        module?.moduleType
      ).toLowerCase() !==
      "object-identity"
  );  
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
      CONSOLE ACTUATORS
      =================================================== */}

  {!faceOnly &&
typeof onExpandConsoleLeft ===
"function" ? (
    <IXIObjectCardActuator
      side="left"

      variant="tall"

      label="Open console left"

      title="Open console left"

      onClick={
        onExpandConsoleLeft
      }
    />
  ) : null}


  {!faceOnly &&
typeof onExpandConsoleRight ===
"function" ? (
    <IXIObjectCardActuator
      side="right"

      variant="tall"

      label="Open console right"

      title="Open console right"

      onClick={
        onExpandConsoleRight
      }
    />
  ) : null}


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


        {headerMetricValue !== "" ? (
  <div className="ixi-aos-card-header-metric">
    {formatRuntimeValue(
      headerMetricValue,
      getObjectFieldType(
        object,
        headerMetricField
      )
    )}

    {headerMetricSuffix ? (
      <span>
        {" "}
        {headerMetricSuffix}
      </span>
    ) : null}
  </div>
) : null}

      </div>


      {/* ===================================================
          ACTIVE FACE
          =================================================== */}

     {bodyFaceModules.length ? (

  bodyFaceModules.map(
    (
      moduleDefinition,
      index
    ) => {

      const runtimeModuleId =
        getRuntimeModuleId(
          moduleDefinition,
          index
        );


      const isSelected =
        Boolean(
          studioEditing &&
          selectedModuleId &&
          runtimeModuleId ===
            selectedModuleId
        );


      return (
        <div
          key={
            runtimeModuleId
          }

          data-ixi-module-id={
            runtimeModuleId
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
            }`,

            `role-${
              clean(
                moduleDefinition
                  ?.presentation
                  ?.role ||
                "auto"
              ).toLowerCase()
            }`,

            `width-${
              clean(
                moduleDefinition
                  ?.presentation
                  ?.width ||
                "full"
              ).toLowerCase()
            }`,

            studioEditing
              ? "studio-editable"
              : "",

            isSelected
              ? "studio-selected"
              : ""
          ]
            .filter(
              Boolean
            )
            .join(" ")}

          onPointerDown={
            studioEditing
              ? event => {
                  /*
                   * Studio is manipulating
                   * the module, not dragging
                   * the whole Card.
                   */
                  event.stopPropagation();
                }
              : undefined
          }

          onClick={
            studioEditing
              ? event => {
                  event.preventDefault();
                  event.stopPropagation();

                  onSelectModule?.({
                    faceId:
                      activeFace
                        ?.faceId ||
                      "",

                    moduleId:
                      runtimeModuleId,

                    module:
                      moduleDefinition,

                    moduleIndex:
                      index
                  });
                }
              : undefined
          }
        >

          {renderFaceModule(
            moduleDefinition,
            index
          )}

        </div>
      );
    }
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


    


      {/* ===================================================
          STANDARD IXI RAIL
          =================================================== */}

      {capabilities.hasRail &&
!faceOnly ? (
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

.ixi-aos-card-header-metric {
  flex: none;

  padding-top: 15px;

  color:
    rgba(
      255,
      255,
      255,
      .46
    );

  font-size: 8px;
  font-weight: 900;

  white-space: nowrap;
}


.ixi-aos-card-header-metric span {
  color:
    rgba(
      255,
      255,
      255,
      .28
    );

  font-size: 6px;
}


:global(
  .ixi-card-runtime-single-field
) {
  width: 100%;
  min-width: 0;

  min-height: 29px;

  padding:
    5px 6px;

  display: flex;

  flex-direction: column;

  justify-content: center;

  overflow: hidden;

  border:
    1px solid
    rgba(
      255,
      255,
      255,
      .04
    );

  border-radius: 4px;

  background:
    rgba(
      255,
      255,
      255,
      .012
    );
}


:global(
  .ixi-card-runtime-single-field
  span
),
:global(
  .ixi-card-runtime-field-group
  span
),
:global(
  .ixi-card-runtime-status
  span
) {
  overflow: hidden;

  color:
    rgba(
      255,
      255,
      255,
      .23
    );

  font-size: 5px;
  font-weight: 900;

  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}


:global(
  .ixi-card-runtime-single-field
  strong
),
:global(
  .ixi-card-runtime-field-group
  strong
),
:global(
  .ixi-card-runtime-status
  strong
) {
  margin-top: 2px;

  overflow: hidden;

  color:
    rgba(
      255,
      255,
      255,
      .72
    );

  font-size: 7px;
  font-weight: 950;

  text-overflow: ellipsis;
  white-space: nowrap;
}


:global(
  .ixi-card-runtime-field-group
) {
  width: 100%;

  display: grid;

  grid-template-columns:
    1fr 1fr;

  gap: 5px;
}


:global(
  .ixi-card-runtime-field-group
  > div
) {
  min-width: 0;

  min-height: 29px;

  padding:
    5px 6px;

  border:
    1px solid
    rgba(
      255,
      255,
      255,
      .04
    );

  border-radius: 4px;

  background:
    rgba(
      255,
      255,
      255,
      .012
    );
}


:global(
  .ixi-card-runtime-status
) {
  min-height: 29px;

  padding:
    5px 6px;

  display: flex;

  flex-direction: column;

  justify-content: center;

  border:
    1px solid
    rgba(
      255,
      196,
      0,
      .12
    );

  border-radius: 4px;

  background:
    rgba(
      255,
      196,
      0,
      .018
    );
}


/*
 * PRESENTATION ROLES
 */

.ixi-aos-card-module.role-hero {
  grid-column:
    span 6;
}


.ixi-aos-card-module.role-compact,
.ixi-aos-card-module.role-inline {
  align-self: start;
}


.ixi-aos-card-module.role-summary {
  align-self: start;
}


        /* ===============================================
           FACE
           =============================================== */

       .ixi-aos-card-face {
  position: absolute;

  left: 0;
  right: 0;

  top: 52px;
  bottom: 22px;

  padding:
    8px 12px;

  overflow: hidden;

  display: grid;

  grid-template-columns:
    repeat(
      6,
      minmax(
        0,
        1fr
      )
    );

  grid-auto-rows:
    min-content;

  gap: 5px;

  align-content:
    start;
}

       .ixi-aos-card-module {
  min-width: 0;

  grid-column:
    span 6;
}


.ixi-aos-card-module.width-full {
  grid-column:
    span 6;
}


.ixi-aos-card-module.width-half {
  grid-column:
    span 3;
}


.ixi-aos-card-module.width-third {
  grid-column:
    span 2;
}


.ixi-aos-card-module.width-auto {
  grid-column:
    span 6;
}

/*
 * OBJECT STUDIO EDIT STATE
 *
 * These styles only appear when the
 * runtime is explicitly placed in
 * Studio editing mode.
 */

.ixi-aos-card-module.studio-editable {
  position: relative;

  cursor: pointer;
}


.ixi-aos-card-module.studio-editable:hover {
  outline:
    1px solid
    rgba(
      0,
      194,
      255,
      .34
    );

  outline-offset:
    1px;
}


.ixi-aos-card-module.studio-selected {
  outline:
    1px solid
    rgba(
      255,
      196,
      0,
      .82
    );

  outline-offset:
    1px;

  z-index: 20;
}


.ixi-aos-card-module.studio-selected::after {
  content:
    "EDIT";

  position: absolute;

  top: 3px;
  right: 4px;

  z-index: 30;

  padding:
    2px 4px;

  border-radius:
    3px;

  background:
    rgba(
      5,
      5,
      5,
      .88
    );

  color:
    rgba(
      255,
      196,
      0,
      .78
    );

  font-size:
    4.5px;

  font-weight:
    950;

  pointer-events:
    none;
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
          height: 205px;

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

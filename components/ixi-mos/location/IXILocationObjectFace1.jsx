import {
  useEffect,
  useRef,
  useState
} from "react";


function clean(
  value
) {
  return String(
    value || ""
  ).trim();
}


function getLocationImage(
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


function formatMoney(
  value,
  currency = "USD"
) {
  const amount =
    Number(value || 0);

  if (
    !Number.isFinite(
      amount
    )
  ) {
    return "$0";
  }

  return amount.toLocaleString(
    "en-US",
    {
      style:
        "currency",

      currency:
        currency || "USD",

      maximumFractionDigits:
        0
    }
  );
}


export default function IXILocationObjectFace1({
  object = {},

  parentLabel = "LOCATIONS",

  projection = null,

  directItems = [],

  onAddChild = null,

  onSaveLocation = null,

  onAddMedia = null,

  onExposeContents = null,

  onGatherContents = null,

  onReturnContents = null,

  onOpenConsole = null,

  onOpenMenu = null
}) {
  const objectId =
    clean(
      object?.objectId ||
      object?.id
    );


  const creationState =
    clean(
      object?.metadata
        ?.creationState
    );


  const initialEditing =
    creationState ===
    "naming" ||
    creationState ===
    "editing";


  const [
    isEditing,
    setIsEditing
  ] =
    useState(
      initialEditing
    );


  const [
    saving,
    setSaving
  ] =
    useState(false);


  const [
    saveError,
    setSaveError
  ] =
    useState("");


  const nameInputRef =
    useRef(null);


  const fields =
    object?.fields || {};


  const [
    draftName,
    setDraftName
  ] =
    useState(
      clean(
        object?.displayName ||
        object?.name ||
        object?.title
      )
    );


  const [
    draftAddress1,
    setDraftAddress1
  ] =
    useState(
      clean(
        fields?.address1
      )
    );


  const [
    draftAddress2,
    setDraftAddress2
  ] =
    useState(
      clean(
        fields?.address2
      )
    );


  const [
    draftCity,
    setDraftCity
  ] =
    useState(
      clean(
        fields?.city
      )
    );


  const [
    draftState,
    setDraftState
  ] =
    useState(
      clean(
        fields?.state
      )
    );


  const [
    draftPostalCode,
    setDraftPostalCode
  ] =
    useState(
      clean(
        fields?.postalCode
      )
    );


  useEffect(() => {
    if (
      isEditing &&
      nameInputRef.current
    ) {
      nameInputRef.current
        .focus();
    }
  }, [
    isEditing,
    objectId
  ]);


  useEffect(() => {
    if (
      isEditing
    ) {
      return;
    }

    setDraftName(
      clean(
        object?.displayName ||
        object?.name ||
        object?.title
      )
    );

    setDraftAddress1(
      clean(
        object?.fields
          ?.address1
      )
    );

    setDraftAddress2(
      clean(
        object?.fields
          ?.address2
      )
    );

    setDraftCity(
      clean(
        object?.fields
          ?.city
      )
    );

    setDraftState(
      clean(
        object?.fields
          ?.state
      )
    );

    setDraftPostalCode(
      clean(
        object?.fields
          ?.postalCode
      )
    );
  }, [
    isEditing,
    object
  ]);


  const displayName =
    clean(
      object?.displayName ||
      object?.name ||
      object?.title
    ) ||
    "NEW LOCATION";


  const addressLine1 =
    clean(
      fields?.address1
    );


  const addressLine2 =
    clean(
      fields?.address2
    );


  const cityStateZip =
    [
      clean(
        fields?.city
      ),

      clean(
        fields?.state
      )
    ]
      .filter(Boolean)
      .join(", ") +
    (
      clean(
        fields?.postalCode
      )
        ? ` ${
            clean(
              fields?.postalCode
            )
          }`
        : ""
    );


  const imageUrl =
    getLocationImage(
      object
    );


  const safeDirectItems =
    Array.isArray(
      directItems
    )
      ? directItems
      : [];


  const assetCount =
    Number(
      projection?.assetCount ??
      projection?.assets ??
      safeDirectItems.length ??
      0
    ) || 0;


  const employeeCount =
    Number(
      projection?.employeeCount ??
      projection?.employees ??
      0
    ) || 0;


  const childCount =
    Number(
      projection?.childLocationCount ??
      projection?.childCount ??
      safeDirectItems.length ??
      0
    ) || 0;


  const totalValue =
    Number(
      projection?.totalAssetValue ??
      projection?.value ??
      object?.value ??
      object?.estimatedValue ??
      object?.marketValue ??
      0
    ) || 0;


  function beginEdit(
    event
  ) {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    if (
      saving
    ) {
      return;
    }

    setSaveError("");
    setIsEditing(true);
  }


  function cancelEdit(
    event
  ) {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    if (
      saving
    ) {
      return;
    }

    setDraftName(
      displayName
    );

    setDraftAddress1(
      addressLine1
    );

    setDraftAddress2(
      addressLine2
    );

    setDraftCity(
      clean(
        fields?.city
      )
    );

    setDraftState(
      clean(
        fields?.state
      )
    );

    setDraftPostalCode(
      clean(
        fields?.postalCode
      )
    );

    setSaveError("");
    setIsEditing(false);
  }


  async function saveLocation(
    event
  ) {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    if (
      saving
    ) {
      return;
    }

    const nextName =
      clean(
        draftName
      );

    if (
      !nextName
    ) {
      setSaveError(
        "Name is required."
      );

      nameInputRef.current
        ?.focus();

      return;
    }

    setSaving(true);
    setSaveError("");

    try {
      await onSaveLocation?.({
        objectId,

        displayName:
          nextName,

        fields: {
          address1:
            clean(
              draftAddress1
            ),

          address2:
            clean(
              draftAddress2
            ),

          city:
            clean(
              draftCity
            ),

          state:
            clean(
              draftState
            ),

          postalCode:
            clean(
              draftPostalCode
            )
        }
      });

      setIsEditing(false);
    } catch (error) {
      console.error(
        "AOS LOCATION SAVE FAILED:",
        error
      );

      setSaveError(
        error?.message ||
        "Could not save Location."
      );
    } finally {
      setSaving(false);
    }
  }


  return (
    <div className="location-face1">

      <div className="location-face1-header">

        <div className="location-face1-heading">

          <span>
            {
              clean(
                parentLabel
              ) ||
              "LOCATIONS"
            }
          </span>

          {isEditing ? (
            <input
              ref={
                nameInputRef
              }

              value={
                draftName
              }

              disabled={
                saving
              }

              placeholder="LOCATION NAME"

              onPointerDown={
                event =>
                  event
                    .stopPropagation()
              }

              onChange={
                event =>
                  setDraftName(
                    event
                      .target
                      .value
                  )
              }
            />
          ) : (
            <h3>
              {displayName}
            </h3>
          )}

        </div>


        <div className="location-face1-actions">

          {typeof onAddChild ===
          "function" ? (
            <button
              type="button"
              className="location-add"
              title="Add object"
              onPointerDown={
                event =>
                  event
                    .stopPropagation()
              }
              onClick={
                event => {
                  event
                    .preventDefault();

                  event
                    .stopPropagation();

                  onAddChild?.(
                    object
                  );
                }
              }
            >
              +
            </button>
          ) : null}


          {!isEditing ? (
            <button
              type="button"
              className="location-edit"
              title="Edit Location"
              onPointerDown={
                event =>
                  event
                    .stopPropagation()
              }
              onClick={
                beginEdit
              }
            >
              EDIT
            </button>
          ) : null}


          <button
            type="button"
            className="location-menu"
            title="Location options"
            onPointerDown={
              event =>
                event
                  .stopPropagation()
            }
            onClick={
              event => {
                event
                  .preventDefault();

                event
                  .stopPropagation();

                if (
                  typeof onOpenMenu ===
                  "function"
                ) {
                  onOpenMenu(
                    object
                  );

                  return;
                }

                onOpenConsole?.(
                  event
                );
              }
            }
          >
            ⋮
          </button>

        </div>

      </div>


      {saveError ? (
        <div className="location-save-error">
          {saveError}
        </div>
      ) : null}


      <div className="location-photo">

        {imageUrl ? (
          <img
            src={
              imageUrl
            }

            alt={
              displayName
            }

            draggable={
              false
            }
          />
        ) : (
          <div className="location-photo-empty">
            <span>
              LOCATION
            </span>

            <strong>
              ADD PHOTO
            </strong>
          </div>
        )}


        {typeof onAddMedia ===
        "function" ? (
          <button
            type="button"
            className="location-photo-button"
            title={
              imageUrl
                ? "Change Location photo"
                : "Add Location photo"
            }
            onPointerDown={
              event =>
                event
                  .stopPropagation()
            }
            onClick={
              event => {
                event
                  .preventDefault();

                event
                  .stopPropagation();

                onAddMedia?.(
                  object
                );
              }
            }
          >
            {
              imageUrl
                ? "CHANGE PHOTO"
                : "+ PHOTO"
            }
          </button>
        ) : null}

      </div>


      <div className="location-address">

        {isEditing ? (
          <div className="location-address-editor">

            <input
              value={
                draftAddress1
              }

              disabled={
                saving
              }

              placeholder="ADDRESS"

              onPointerDown={
                event =>
                  event
                    .stopPropagation()
              }

              onChange={
                event =>
                  setDraftAddress1(
                    event
                      .target
                      .value
                  )
              }
            />


            <input
              value={
                draftAddress2
              }

              disabled={
                saving
              }

              placeholder="ADDRESS 2"

              onPointerDown={
                event =>
                  event
                    .stopPropagation()
              }

              onChange={
                event =>
                  setDraftAddress2(
                    event
                      .target
                      .value
                  )
              }
            />


            <div className="location-address-row">

              <input
                value={
                  draftCity
                }

                disabled={
                  saving
                }

                placeholder="CITY"

                onPointerDown={
                  event =>
                    event
                      .stopPropagation()
                }

                onChange={
                  event =>
                    setDraftCity(
                      event
                        .target
                        .value
                    )
                }
              />


              <input
                className="state"
                value={
                  draftState
                }

                disabled={
                  saving
                }

                placeholder="ST"

                maxLength={
                  3
                }

                onPointerDown={
                  event =>
                    event
                      .stopPropagation()
                }

                onChange={
                  event =>
                    setDraftState(
                      event
                        .target
                        .value
                    )
                }
              />


              <input
                className="zip"
                value={
                  draftPostalCode
                }

                disabled={
                  saving
                }

                placeholder="ZIP"

                onPointerDown={
                  event =>
                    event
                      .stopPropagation()
                }

                onChange={
                  event =>
                    setDraftPostalCode(
                      event
                        .target
                        .value
                    )
                }
              />

            </div>

          </div>
        ) : (
          <div className="location-address-view">

            <span>
              ADDRESS
            </span>

            <strong>
              {
                addressLine1 ||
                "ADD ADDRESS"
              }
            </strong>

            {addressLine2 ? (
              <small>
                {addressLine2}
              </small>
            ) : null}

            <small>
              {
                cityStateZip ||
                "CITY, STATE ZIP"
              }
            </small>

          </div>
        )}

      </div>


      <div className="location-stats">

        <div>
          <span>
            ASSETS
          </span>

          <strong>
            {assetCount}
          </strong>
        </div>


        <div>
          <span>
            VALUE
          </span>

          <strong>
            {formatMoney(
              totalValue,
              object?.currency ||
              "USD"
            )}
          </strong>
        </div>


        <div>
          <span>
            EMPLOYEES
          </span>

          <strong>
            {employeeCount}
          </strong>
        </div>


        <div>
          <span>
            CHILDREN
          </span>

          <strong>
            {childCount}
          </strong>
        </div>

      </div>


      {isEditing ? (
        <div className="location-edit-actions">

          <button
            type="button"
            className="save"
            disabled={
              saving
            }
            onPointerDown={
              event =>
                event
                  .stopPropagation()
            }
            onClick={
              saveLocation
            }
          >
            {
              saving
                ? "SAVING..."
                : "SAVE"
            }
          </button>


          <button
            type="button"
            className="cancel"
            disabled={
              saving
            }
            onPointerDown={
              event =>
                event
                  .stopPropagation()
            }
            onClick={
              cancelEdit
            }
          >
            CANCEL
          </button>

        </div>
      ) : (
        <div className="location-container-actions">

          <button
            type="button"
            onPointerDown={
              event =>
                event
                  .stopPropagation()
            }
            onClick={
              event => {
                event
                  .preventDefault();

                event
                  .stopPropagation();

                onGatherContents?.(
                  object
                );
              }
            }
          >
            RECALL
          </button>


          <button
            type="button"
            onPointerDown={
              event =>
                event
                  .stopPropagation()
            }
            onClick={
              event => {
                event
                  .preventDefault();

                event
                  .stopPropagation();

                onExposeContents?.(
                  object
                );
              }
            }
          >
            BOARD
          </button>


          <button
            type="button"
            onPointerDown={
              event =>
                event
                  .stopPropagation()
            }
            onClick={
              event => {
                event
                  .preventDefault();

                event
                  .stopPropagation();

                onReturnContents?.(
                  object
                );
              }
            }
          >
            RETURN
          </button>

        </div>
      )}


      <style jsx>{`

        .location-face1,
        .location-face1 * {
          box-sizing:
            border-box;
        }


        .location-face1 {
          width:
            298px;

          height:
            407px;

          padding:
            12px 12px 10px;

          position:
            relative;

          display:
            flex;

          flex-direction:
            column;

          overflow:
            hidden;

          background:
            #101010;
        }


        .location-face1-header {
          height:
            40px;

          min-height:
            40px;

          display:
            flex;

          align-items:
            flex-start;

          justify-content:
            space-between;

          gap:
            8px;

          border-bottom:
            1px solid
            rgba(
              255,
              255,
              255,
              .05
            );
        }


        .location-face1-heading {
          min-width:
            0;

          flex:
            1;
        }


        .location-face1-heading span {
          display:
            block;

          overflow:
            hidden;

          color:
            #ffc400;

          font-size:
            6.5px;

          font-weight:
            950;

          letter-spacing:
            .09em;

          text-overflow:
            ellipsis;

          text-transform:
            uppercase;

          white-space:
            nowrap;
        }


        .location-face1-heading h3 {
          margin:
            4px 0 0;

          overflow:
            hidden;

          color:
            #f4f4f4;

          font-size:
            17px;

          font-weight:
            950;

          line-height:
            1;

          text-overflow:
            ellipsis;

          text-transform:
            uppercase;

          white-space:
            nowrap;
        }


        .location-face1-heading input {
          width:
            100%;

          height:
            22px;

          margin-top:
            3px;

          padding:
            0 6px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .13
            );

          border-radius:
            4px;

          outline:
            none;

          background:
            rgba(
              0,
              0,
              0,
              .34
            );

          color:
            #f4f4f4;

          font-size:
            10px;

          font-weight:
            950;
        }


        .location-face1-actions {
          display:
            flex;

          align-items:
            center;

          gap:
            5px;

          flex:
            0 0 auto;
        }


        .location-face1-actions button {
          height:
            20px;

          padding:
            0 6px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .10
            );

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
              .54
            );

          font-size:
            6px;

          font-weight:
            950;

          cursor:
            pointer;
        }


        .location-face1-actions
        .location-add {
          width:
            20px;

          padding:
            0;

          color:
            #ffc400;

          font-size:
            15px;
        }


        .location-face1-actions
        .location-menu {
          width:
            20px;

          padding:
            0;

          font-size:
            15px;
        }


        .location-save-error {
          position:
            absolute;

          left:
            12px;

          right:
            12px;

          top:
            50px;

          z-index:
            30;

          color:
            rgba(
              255,
              90,
              90,
              .92
            );

          font-size:
            7px;

          font-weight:
            950;
        }


        .location-photo {
          height:
            150px;

          min-height:
            150px;

          margin-top:
            8px;

          position:
            relative;

          overflow:
            hidden;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .055
            );

          border-radius:
            8px;

          background:
            #090909;
        }


        .location-photo img {
          width:
            100%;

          height:
            100%;

          display:
            block;

          object-fit:
            cover;
        }


        .location-photo-empty {
          width:
            100%;

          height:
            100%;

          display:
            flex;

          flex-direction:
            column;

          align-items:
            center;

          justify-content:
            center;

          gap:
            6px;

          color:
            rgba(
              255,
              255,
              255,
              .18
            );
        }


        .location-photo-empty span {
          font-size:
            7px;

          font-weight:
            950;

          letter-spacing:
            .08em;
        }


        .location-photo-empty strong {
          color:
            rgba(
              0,
              194,
              255,
              .62
            );

          font-size:
            10px;

          font-weight:
            950;
        }


        .location-photo-button {
          position:
            absolute;

          right:
            7px;

          bottom:
            7px;

          height:
            21px;

          padding:
            0 7px;

          border:
            1px solid
            rgba(
              0,
              194,
              255,
              .22
            );

          border-radius:
            4px;

          background:
            rgba(
              0,
              0,
              0,
              .68
            );

          color:
            rgba(
              0,
              194,
              255,
              .82
            );

          font-size:
            6px;

          font-weight:
            950;

          cursor:
            pointer;
        }


        .location-address {
          min-height:
            61px;

          margin-top:
            7px;

          padding:
            7px 8px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .05
            );

          border-radius:
            6px;

          background:
            rgba(
              255,
              255,
              255,
              .015
            );
        }


        .location-address-view span {
          display:
            block;

          color:
            rgba(
              255,
              255,
              255,
              .28
            );

          font-size:
            6px;

          font-weight:
            950;

          letter-spacing:
            .08em;
        }


        .location-address-view strong {
          display:
            block;

          margin-top:
            4px;

          overflow:
            hidden;

          color:
            rgba(
              255,
              255,
              255,
              .82
            );

          font-size:
            9px;

          font-weight:
            950;

          text-overflow:
            ellipsis;

          white-space:
            nowrap;
        }


        .location-address-view small {
          display:
            block;

          margin-top:
            2px;

          overflow:
            hidden;

          color:
            rgba(
              255,
              255,
              255,
              .42
            );

          font-size:
            7px;

          font-weight:
            850;

          text-overflow:
            ellipsis;

          white-space:
            nowrap;
        }


        .location-address-editor {
          display:
            flex;

          flex-direction:
            column;

          gap:
            4px;
        }


        .location-address-editor input {
          width:
            100%;

          height:
            20px;

          padding:
            0 5px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .11
            );

          border-radius:
            3px;

          outline:
            none;

          background:
            rgba(
              0,
              0,
              0,
              .30
            );

          color:
            rgba(
              255,
              255,
              255,
              .86
            );

          font-size:
            7px;

          font-weight:
            900;
        }


        .location-address-row {
          display:
            grid;

          grid-template-columns:
            minmax(0, 1fr)
            40px
            58px;

          gap:
            4px;
        }


        .location-stats {
          display:
            grid;

          grid-template-columns:
            1fr 1fr;

          gap:
            5px;

          margin-top:
            7px;
        }


        .location-stats > div {
          height:
            34px;

          padding:
            5px 7px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .05
            );

          border-radius:
            5px;

          background:
            rgba(
              255,
              255,
              255,
              .016
            );
        }


        .location-stats span {
          display:
            block;

          color:
            rgba(
              255,
              255,
              255,
              .28
            );

          font-size:
            6px;

          font-weight:
            900;

          letter-spacing:
            .05em;
        }


        .location-stats strong {
          display:
            block;

          margin-top:
            3px;

          overflow:
            hidden;

          color:
            rgba(
              255,
              255,
              255,
              .80
            );

          font-size:
            10px;

          font-weight:
            950;

          text-overflow:
            ellipsis;

          white-space:
            nowrap;
        }


        .location-container-actions,
        .location-edit-actions {
          display:
            grid;

          gap:
            5px;

          margin-top:
            7px;
        }


        .location-container-actions {
          grid-template-columns:
            1fr 1fr 1fr;
        }


        .location-edit-actions {
          grid-template-columns:
            1fr 1fr;
        }


        .location-container-actions button,
        .location-edit-actions button {
          height:
            28px;

          border:
            1px solid
            rgba(
              0,
              194,
              255,
              .12
            );

          border-radius:
            5px;

          background:
            rgba(
              0,
              194,
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
            6px;

          font-weight:
            950;

          cursor:
            pointer;
        }


        .location-edit-actions
        .save {
          border-color:
            rgba(
              56,
              161,
              105,
              .28
            );

          color:
            rgba(
              56,
              161,
              105,
              .94
            );
        }


        .location-edit-actions
        .cancel {
          border-color:
            rgba(
              255,
              255,
              255,
              .08
            );
        }

      `}</style>

    </div>
  );
}

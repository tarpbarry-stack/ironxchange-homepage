import {
  useEffect,
  useRef,
  useState
} from "react";


function clean(value) {
  return String(
    value || ""
  ).trim();
}


export default function IXILocationObjectCard({
  object = {},

  dragHandleProps = null,

  onAddChild = null,

  onSaveName = null
}) {
  const inputRef =
    useRef(null);

  const creationState =
    clean(
      object?.metadata
        ?.creationState
    );

  const isNaming =
    creationState ===
    "naming";

  const [name, setName] =
    useState(
      isNaming
        ? ""
        : clean(
            object?.displayName
          )
    );

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");


  useEffect(() => {
    if (
      isNaming &&
      inputRef.current
    ) {
      inputRef.current.focus();
    }
  }, [
    isNaming,
    object?.objectId
  ]);


  useEffect(() => {
    if (!isNaming) {
      setName(
        clean(
          object?.displayName
        )
      );
    }
  }, [
    isNaming,
    object?.displayName
  ]);


  async function saveName() {
    const nextName =
      clean(name);

    if (!nextName) {
      setError(
        "Location name is required."
      );

      inputRef.current?.focus();

      return;
    }

    if (!object?.objectId) {
      setError(
        "Location object ID is missing."
      );

      return;
    }

    if (saving) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      await onSaveName?.({
        objectId:
          object.objectId,

        displayName:
          nextName
      });
    } catch (saveError) {
      console.error(
        "LOCATION NAME SAVE FAILED:",
        saveError
      );

      setError(
        saveError?.message ||
        "Could not save Location."
      );
    } finally {
      setSaving(false);
    }
  }


  function handleKeyDown(
    event
  ) {
    if (
      event.key === "Enter"
    ) {
      event.preventDefault();
      event.stopPropagation();

      saveName();
    }
  }


  function handleAddChild(
    event
  ) {
    event.preventDefault();
    event.stopPropagation();

    if (
      typeof onAddChild !==
      "function"
    ) {
      return;
    }

    onAddChild(
      object
    );
  }


  return (
    <article
      className="ixi-location-card"

      data-object-id={
        object?.objectId || ""
      }
    >
      <div
        className="ixi-location-card-top"
        {...(
          dragHandleProps || {}
        )}
      >
        <span className="ixi-location-type">
          LOCATION
        </span>

        <button
          type="button"
          className="ixi-location-add"
          onClick={
            handleAddChild
          }
          title="Add Location"
        >
          +
        </button>
      </div>


      <div className="ixi-location-card-body">
        <div className="ixi-location-parent">
          {clean(
            object?.metadata
              ?.parentName
          ) ||
            clean(
              object?.metadata
                ?.createdInsideContainerId
            ) ||
            "LOCATION"}
        </div>


        <input
          ref={
            inputRef
          }

          className="ixi-location-name-input"

          value={
            name
          }

          placeholder="Name this Location"

          onChange={
            event => {
              setName(
                event.target.value
              );

              if (error) {
                setError("");
              }
            }
          }

          onKeyDown={
            handleKeyDown
          }

          disabled={
            saving
          }

          spellCheck={
            false
          }
        />


        <div className="ixi-location-status">
          {saving
            ? "SAVING..."
            : isNaming
              ? "ENTER TO SAVE"
              : "LOCATION SAVED"}
        </div>


        {error ? (
          <div className="ixi-location-error">
            {error}
          </div>
        ) : null}
      </div>


      <style jsx>{`
        .ixi-location-card {
          width: 298px;
          min-height: 471px;

          position: relative;

          display: flex;
          flex-direction: column;

          overflow: hidden;

          border:
            1px solid
            rgba(255,255,255,.10);

          border-radius: 8px;

          background:
            linear-gradient(
              180deg,
              rgba(255,255,255,.018),
              rgba(255,255,255,0)
            ),
            #0f0f0f;

          box-shadow:
            0 12px 34px
            rgba(0,0,0,.30);
        }


        .ixi-location-card-top {
          min-height: 42px;

          padding: 0 12px;

          display: flex;
          align-items: center;
          justify-content:
            space-between;

          border-bottom:
            1px solid
            rgba(255,255,255,.06);

          cursor: grab;
        }


        .ixi-location-card-top:active {
          cursor: grabbing;
        }


        .ixi-location-type {
          color:
            rgba(255,196,0,.92);

          font-size: 10px;
          font-weight: 950;

          letter-spacing:
            1.15px;

          text-transform:
            uppercase;
        }


        .ixi-location-add {
          width: 24px;
          height: 24px;

          display: flex;
          align-items: center;
          justify-content: center;

          border:
            1px solid
            rgba(255,196,0,.34);

          border-radius: 5px;

          background:
            rgba(255,196,0,.06);

          color:
            rgba(255,196,0,.92);

          font-size: 17px;
          font-weight: 900;
          line-height: 1;

          cursor: pointer;
        }


        .ixi-location-add:hover {
          background:
            rgba(255,196,0,.14);

          border-color:
            rgba(255,196,0,.62);
        }


        .ixi-location-card-body {
          flex: 1;

          padding:
            18px 14px;

          display: flex;
          flex-direction: column;
        }


        .ixi-location-parent {
          min-height: 16px;

          margin-bottom: 8px;

          color:
            rgba(255,196,0,.58);

          font-size: 8px;
          font-weight: 900;

          letter-spacing:
            .8px;

          text-transform:
            uppercase;

          overflow: hidden;
          text-overflow:
            ellipsis;
          white-space: nowrap;
        }


        .ixi-location-name-input {
          width: 100%;

          padding:
            9px 10px;

          border:
            1px solid
            rgba(255,255,255,.12);

          border-radius: 5px;

          outline: none;

          background:
            rgba(0,0,0,.28);

          color:
            rgba(255,255,255,.92);

          font-size: 13px;
          font-weight: 850;

          letter-spacing:
            .15px;
        }


        .ixi-location-name-input:focus {
          border-color:
            rgba(0,194,255,.62);

          box-shadow:
            0 0 0 1px
            rgba(0,194,255,.12);
        }


        .ixi-location-name-input::placeholder {
          color:
            rgba(255,255,255,.22);
        }


        .ixi-location-status {
          margin-top: 8px;

          color:
            rgba(0,194,255,.68);

          font-size: 7px;
          font-weight: 950;

          letter-spacing:
            .8px;

          text-transform:
            uppercase;
        }


        .ixi-location-error {
          margin-top: 8px;

          color:
            rgba(255,100,100,.82);

          font-size: 8px;
          font-weight: 800;
        }
      `}</style>
    </article>
  );
}

import {
  useEffect,
  useState
} from "react";


export default function IXIAosFaceNotes({
  value = "",

  onSave,

  placeholder =
    "ADD NOTES...",

  label =
    "PRIVATE NOTES",

  saveLabel =
    "SAVE",

  maxLength =
    4000,

  disabled =
    false,

  className =
    ""
}) {

  const [
    draft,
    setDraft
  ] =
    useState(
      String(
        value || ""
      )
    );


  const [
    saveState,
    setSaveState
  ] =
    useState(
      "idle"
    );


  useEffect(
    () => {

      setDraft(
        String(
          value || ""
        )
      );

    },
    [
      value
    ]
  );


  const hasChanges =
    draft !==
    String(
      value || ""
    );


  async function saveNotes() {

    if (
      disabled ||
      !hasChanges ||
      saveState ===
        "saving"
    ) {
      return;
    }


    try {

      setSaveState(
        "saving"
      );


      await onSave?.(
        draft
      );


      setSaveState(
        "saved"
      );


      window.setTimeout(
        () => {
          setSaveState(
            "idle"
          );
        },
        1200
      );

    } catch (
      error
    ) {

      console.error(
        "IXI AOS FACE NOTES SAVE FAILED",
        error
      );


      setSaveState(
        "error"
      );
    }
  }


  function handleKeyDown(
    event
  ) {

    event.stopPropagation();


    if (
      event.key ===
        "Enter" &&
      (
        event.metaKey ||
        event.ctrlKey
      )
    ) {

      event.preventDefault();

      saveNotes();
    }
  }


  const resolvedSaveLabel =
    saveState ===
      "saving"
      ? "SAVING..."
      : saveState ===
          "saved"
        ? "SAVED"
        : saveState ===
            "error"
          ? "FAILED"
          : saveLabel;


  return (
    <div
      className={[
        "ixi-aos-face-notes",

        disabled
          ? "is-disabled"
          : "",

        className
      ]
        .filter(Boolean)
        .join(" ")}
    >

      <div className="notes-head">

        <span>
          {label}
        </span>

        <strong>
          {draft.length}
          /
          {maxLength}
        </strong>

      </div>


      <textarea
        value={
          draft
        }

        placeholder={
          placeholder
        }

        maxLength={
          maxLength
        }

        disabled={
          disabled
        }

        onChange={
          event =>
            setDraft(
              event.target.value
            )
        }

        onClick={
          event =>
            event.stopPropagation()
        }

        onPointerDown={
          event =>
            event.stopPropagation()
        }

        onKeyDown={
          handleKeyDown
        }
      />


      <div className="notes-footer">

        <span>
          CTRL / CMD + ENTER
        </span>


        <button
          type="button"

          disabled={
            disabled ||
            !hasChanges ||
            saveState ===
              "saving"
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

              saveNotes();
            }
          }
        >

          {resolvedSaveLabel}

        </button>

      </div>


      <style jsx>{`

        .ixi-aos-face-notes,
        .ixi-aos-face-notes * {
          box-sizing:
            border-box;
        }


        .ixi-aos-face-notes {
          width:
            100%;

          min-width:
            0;

          min-height:
            120px;

          display:
            flex;

          flex-direction:
            column;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .08
            );

          border-radius:
            7px;

          background:
            rgba(
              7,
              7,
              7,
              .52
            );

          overflow:
            hidden;
        }


        .notes-head {
          min-height:
            30px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap:
            var(
              --ixi-face-gap-sm,
              6px
            );

          padding:
            0
            var(
              --ixi-face-module-pad,
              7px
            );

          border-bottom:
            1px solid
            rgba(
              255,
              255,
              255,
              .05
            );
        }


        .notes-head span {
          color:
            rgba(
              255,
              255,
              255,
              .52
            );

          font-size:
            var(
              --ixi-face-font-section,
              10px
            );

          font-weight:
            950;
        }


        .notes-head strong {
          color:
            rgba(
              255,
              255,
              255,
              .34
            );

          font-size:
            var(
              --ixi-face-font-micro,
              8px
            );

          font-weight:
            900;
        }


        textarea {
          width:
            100%;

          min-width:
            0;

          min-height:
            70px;

          flex:
            1 1 auto;

          resize:
            none;

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

          padding:
            var(
              --ixi-face-module-pad,
              7px
            );

          font-family:
            "Inter",
            sans-serif;

          font-size:
            var(
              --ixi-face-font-value,
              10.5px
            );

          font-weight:
            700;

          line-height:
            1.45;

          outline:
            none;
        }


        .notes-footer {
          min-height:
            32px;

          padding:
            4px
            6px
            4px
            var(
              --ixi-face-module-pad,
              7px
            );

          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap:
            var(
              --ixi-face-gap-sm,
              6px
            );

          border-top:
            1px solid
            rgba(
              255,
              255,
              255,
              .05
            );
        }


        .notes-footer span {
          color:
            rgba(
              255,
              255,
              255,
              .28
            );

          font-size:
            var(
              --ixi-face-font-micro,
              8px
            );

          font-weight:
            900;
        }


        button {
          height:
            25px;

          min-width:
            64px;

          padding:
            0 9px;

          border:
            1px solid
            rgba(
              255,
              196,
              0,
              .24
            );

          border-radius:
            5px;

          background:
            rgba(
              255,
              196,
              0,
              .07
            );

          color:
            #ffc400;

          font-size:
            var(
              --ixi-face-font-label,
              9px
            );

          font-weight:
            950;

          cursor:
            pointer;
        }


        button:disabled {
          opacity:
            .34;

          cursor:
            default;
        }


        .is-disabled {
          opacity:
            .62;
        }

      `}</style>

    </div>
  );
}

import {
  useEffect,
  useState
} from "react";

export default function IXIFaceNotes({
  value = "",
  onSave,

  placeholder =
    "ADD NOTES...",

  label =
    "PRIVATE NOTES",

  saveLabel =
    "SAVE NOTES",

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
  ] = useState(
    String(
      value || ""
    )
  );

  const [
    saveState,
    setSaveState
  ] = useState(
    "idle"
  );

  useEffect(() => {
    setDraft(
      String(
        value || ""
      )
    );
  }, [
    value
  ]);

  const hasChanges =
    draft !==
    String(
      value || ""
    );

  async function saveNotes() {
    if (
      disabled ||
      !hasChanges ||
      saveState === "saving"
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
    } catch (error) {
      console.error(
        "IXI FACE NOTES SAVE FAILED",
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
      event.key === "Enter" &&
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
    saveState === "saving"
      ? "SAVING..."
      : saveState === "saved"
        ? "SAVED"
        : saveState === "error"
          ? "SAVE FAILED"
          : saveLabel;

  return (
    <div
      className={[
        "ixi-face-notes",
        disabled
          ? "ixi-face-notes-disabled"
          : "",
        className
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="ixi-face-notes-head">
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
          event => {
            event.stopPropagation();
          }
        }

        onPointerDown={
          event => {
            event.stopPropagation();
          }
        }

        onKeyDown={
          handleKeyDown
        }
      />

      <div className="ixi-face-notes-footer">
        <span>
          CTRL / CMD + ENTER TO SAVE
        </span>

        <button
          type="button"

          disabled={
            disabled ||
            !hasChanges ||
            saveState === "saving"
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
        .ixi-face-notes,
        .ixi-face-notes * {
          box-sizing: border-box;
        }

        .ixi-face-notes {
          width: 100%;
          min-width: 0;
          min-height: 0;
          height: 100%;

          display: flex;
          flex-direction: column;

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
                0
              )
            ),
            rgba(
              7,
              7,
              7,
              .52
            );

          overflow:
            hidden;
        }

        .ixi-face-notes-head {
          width: 100%;
          min-height: 28px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 10px;

          padding:
            0 9px;

          border-bottom:
            1px solid
            rgba(
              255,
              255,
              255,
              .05
            );
        }

        .ixi-face-notes-head span {
          color:
            rgba(
              255,
              255,
              255,
              .48
            );

          font-size:
            var(
              --ixi-face-font-section,
              9px
            );

          font-weight:
            950;

          letter-spacing:
            .46px;

          text-transform:
            uppercase;
        }

        .ixi-face-notes-head strong {
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
              6.5px
            );

          font-weight:
            900;

          letter-spacing:
            .24px;
        }

        textarea {
          width: 100%;
          min-width: 0;
          min-height: 0;

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
              .84
            );

          padding:
            10px;

          font-family:
            "Inter",
            sans-serif;

          font-size:
            var(
              --ixi-face-font-value,
              9px
            );

          font-weight:
            700;

          line-height:
            1.45;

          outline:
            none;
        }

        textarea::placeholder {
          color:
            rgba(
              255,
              255,
              255,
              .22
            );

          font-weight:
            850;

          letter-spacing:
            .28px;
        }

        textarea:focus {
          background:
            rgba(
              255,
              196,
              0,
              .018
            );

          box-shadow:
            inset 0 0 0 1px
            rgba(
              255,
              196,
              0,
              .08
            );
        }

        .ixi-face-notes-footer {
          width: 100%;
          min-height: 30px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 10px;

          padding:
            4px 6px
            4px 9px;

          border-top:
            1px solid
            rgba(
              255,
              255,
              255,
              .05
            );
        }

        .ixi-face-notes-footer span {
          color:
            rgba(
              255,
              255,
              255,
              .22
            );

          font-size:
            var(
              --ixi-face-font-micro,
              6.5px
            );

          font-weight:
            900;

          letter-spacing:
            .28px;

          white-space:
            nowrap;
        }

        button {
          min-width:
            72px;

          height:
            22px;

          padding:
            0 9px;

          border:
            1px solid
            rgba(
              255,
              196,
              0,
              .22
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
            7px;

          font-weight:
            950;

          letter-spacing:
            .42px;

          cursor:
            pointer;

          text-transform:
            uppercase;
        }

        button:hover:not(:disabled) {
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
              .12
            );
        }

        button:disabled {
          opacity:
            .36;

          cursor:
            default;
        }

        .ixi-face-notes-disabled {
          opacity:
            .62;
        }
      `}</style>
    </div>
  );
}

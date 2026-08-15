export default function IXIAosEditSessionActions({
  editing = false,
  saving = false,
  onSave = null,
  onCancel = null
}) {
  if (!editing) {
    return null;
  }

  function stop(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
  }

  return (
    <div
      className="ixi-aos-edit-session-actions"
      onPointerDown={event =>
        event.stopPropagation()
      }
    >
      <button
        type="button"
        className="save"
        disabled={saving}
        onClick={event => {
          stop(event);
          onSave?.();
        }}
      >
        {saving ? "SAVING" : "SAVE"}
      </button>

      <button
        type="button"
        className="cancel"
        disabled={saving}
        onClick={event => {
          stop(event);
          onCancel?.();
        }}
      >
        CANCEL
      </button>

      <style jsx>{`
        .ixi-aos-edit-session-actions {
          position: absolute;

          top: 9px;
          right: 84px;

          display: flex;
          align-items: center;

          gap: 5px;

          z-index: 190;
        }

        button {
          height: 22px;

          padding: 0 7px;

          border-radius: 4px;

          font-size: 7px;
          font-weight: 950;
          letter-spacing: .04em;

          cursor: pointer;
        }

        button:disabled {
          cursor: default;
          opacity: .55;
        }

        .save {
          border: 1px solid rgba(255,196,0,.34);
          background: rgba(8,8,8,.94);
          color: #ffc400;
        }

        .save:hover:not(:disabled) {
          background: rgba(255,196,0,.10);
        }

        .cancel {
          border: 1px solid rgba(255,255,255,.08);
          background: rgba(8,8,8,.94);
          color: rgba(255,255,255,.58);
        }

        .cancel:hover:not(:disabled) {
          border-color: rgba(255,255,255,.16);
          color: rgba(255,255,255,.82);
        }
      `}</style>
    </div>
  );
}

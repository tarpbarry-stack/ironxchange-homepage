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
          width: 100%;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 7px;
        }

        button {
          height: 27px;
          border-radius: 5px;
          font-size: 7px;
          font-weight: 950;
          letter-spacing: .05em;
          cursor: pointer;
        }

        button:disabled {
          cursor: default;
          opacity: .55;
        }

        .save {
          border: 1px solid rgba(255,196,0,.30);
          background: rgba(255,196,0,.07);
          color: #ffc400;
        }

        .save:hover:not(:disabled) {
          background: rgba(255,196,0,.12);
        }

        .cancel {
          border: 1px solid rgba(255,255,255,.08);
          background: rgba(255,255,255,.025);
          color: rgba(255,255,255,.54);
        }

        .cancel:hover:not(:disabled) {
          border-color: rgba(255,255,255,.16);
          color: rgba(255,255,255,.82);
        }
      `}</style>
    </div>
  );
}

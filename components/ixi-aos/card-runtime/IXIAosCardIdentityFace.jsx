import { useState } from "react";

import IXIObjectRail from "../../ixi-object-system/IXIObjectRail";

function formatCardNumber(cardNumber) {
  return String(Math.min(19, Math.max(1, Number(cardNumber) || 1))).padStart(3, "0");
}

export default function IXIAosCardIdentityFace({
  cardNumber,
  object = {},
  ixiState = {},
  onCycleFace = null,
  onSendFront = null,
  onSendBack = null,
  onCycleColor = null,
  onCycleOutline = null,
  onRailSend = null,
  armedDestination = "",
  onSendToArmedDestination = null,
  onDeleteObject = null
}) {
  const number = formatCardNumber(cardNumber);
  const [deleteArmed, setDeleteArmed] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function deleteForever(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    if (!deleteArmed) {
      setDeleteError("");
      setDeleteArmed(true);
      return;
    }

    if (deleting || typeof onDeleteObject !== "function") return;

    setDeleting(true);
    setDeleteError("");

    try {
      await onDeleteObject(object);
    } catch (error) {
      setDeleting(false);
      setDeleteError(error?.message || "DELETE FAILED");
    }
  }

  return (
    <section
      className="ixi-aos-card-identity-face"
      data-aos-card-identity-face={number}
      aria-label={`AOS card ${number}, face 2`}
    >
      <div className="identity-kicker">IXI AOS · FACE 2</div>
      <div className="identity-rule" />
      <div className="identity-label">CARD</div>
      <strong>{number}</strong>
      <div className="identity-foot">AOS CARD IDENTIFICATION</div>

      {typeof onDeleteObject === "function" ? (
        <div className="delete-zone" onPointerDown={event => event.stopPropagation()}>
          {deleteArmed ? <span>PERMANENT · NO RECOVERY</span> : null}
          <div className="delete-actions">
            {deleteArmed && !deleting ? (
              <button type="button" className="cancel-delete" onClick={event => { event.stopPropagation(); setDeleteArmed(false); setDeleteError(""); }}>
                CANCEL
              </button>
            ) : null}
            <button type="button" className={deleteArmed ? "delete-forever armed" : "delete-forever"} disabled={deleting} onClick={deleteForever}>
              {deleting ? "DELETING…" : deleteArmed ? "DELETE FOREVER" : "DELETE CARD"}
            </button>
          </div>
          {deleteError ? <em role="alert">{deleteError}</em> : null}
        </div>
      ) : null}

      <IXIObjectRail
        object={object}
        saved={false}
        color={ixiState?.color || "none"}
        outline={Number(ixiState?.outline ?? 1)}
        face={2}
        onSendFront={onSendFront}
        onSendBack={onSendBack}
        onCycleColor={onCycleColor}
        onCycleOutline={onCycleOutline}
        onCycleFace={onCycleFace}
        onRailSend={onRailSend}
        armedDestination={armedDestination}
        onSendToArmedDestination={onSendToArmedDestination}
      />

      <style jsx>{`
        .ixi-aos-card-identity-face {
          position: relative;
          width: 298px;
          height: 471px;
          overflow: hidden;
          border: 1px solid #343936;
          border-radius: 13px;
          box-sizing: border-box;
          background:
            linear-gradient(180deg, rgba(255,255,255,.025), transparent 28%),
            radial-gradient(circle at 50% 43%, rgba(255,196,0,.055), transparent 42%),
            #090b0a;
          color: #f4f4f2;
          font-family: Arial, Helvetica, sans-serif;
          box-shadow: inset 0 1px rgba(255,255,255,.045), 0 18px 42px rgba(0,0,0,.46);
        }

        .identity-kicker {
          position: absolute;
          top: 22px;
          left: 22px;
          color: rgba(255,255,255,.43);
          font-size: 7px;
          font-weight: 950;
          letter-spacing: .18em;
        }

        .identity-rule {
          position: absolute;
          top: 43px;
          left: 22px;
          right: 22px;
          height: 1px;
          background: linear-gradient(90deg, #ffc400, rgba(255,196,0,.08));
        }

        .identity-label {
          position: absolute;
          top: 157px;
          left: 0;
          right: 0;
          color: rgba(255,255,255,.44);
          font-size: 10px;
          font-weight: 950;
          letter-spacing: .34em;
          text-align: center;
          text-indent: .34em;
        }

        strong {
          position: absolute;
          top: 181px;
          left: 0;
          right: 0;
          color: #ffc400;
          font-size: 82px;
          font-weight: 1000;
          line-height: 1;
          letter-spacing: -.045em;
          text-align: center;
          text-shadow: 0 0 24px rgba(255,196,0,.12);
        }

        .identity-foot {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 97px;
          color: rgba(255,255,255,.28);
          font-size: 6px;
          font-weight: 950;
          letter-spacing: .18em;
          text-align: center;
        }

        .delete-zone {
          position: absolute;
          left: 22px;
          right: 22px;
          bottom: 31px;
          z-index: 60;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .delete-zone > span,
        .delete-zone > em {
          color: #ff7777;
          font-size: 6px;
          font-style: normal;
          font-weight: 950;
          letter-spacing: .12em;
          text-transform: uppercase;
        }

        .delete-actions { width: 100%; display: flex; gap: 5px; }
        .delete-actions button { height: 27px; border-radius: 4px; font-size: 6px; font-weight: 950; letter-spacing: .08em; cursor: pointer; }
        .delete-forever { flex: 1; border: 1px solid rgba(255,90,90,.25); background: rgba(255,70,70,.035); color: rgba(255,135,135,.72); }
        .delete-forever.armed { border-color: rgba(255,70,70,.75); background: rgba(140,0,0,.32); color: #ff8d8d; }
        .delete-forever:disabled { cursor: wait; opacity: .6; }
        .cancel-delete { width: 72px; border: 1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.025); color: rgba(255,255,255,.55); }

        .ixi-aos-card-identity-face :global(.board-command-rail) {
          bottom: 0;
        }
      `}</style>
    </section>
  );
}

import IXIObjectRail from "../../ixi-object-system/IXIObjectRail";

function formatCardNumber(cardNumber) {
  return String(Math.min(17, Math.max(1, Number(cardNumber) || 1))).padStart(3, "0");
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
  onSendToArmedDestination = null
}) {
  const number = formatCardNumber(cardNumber);

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
          bottom: 45px;
          color: rgba(255,255,255,.28);
          font-size: 6px;
          font-weight: 950;
          letter-spacing: .18em;
          text-align: center;
        }

        .ixi-aos-card-identity-face :global(.board-command-rail) {
          bottom: 0;
        }
      `}</style>
    </section>
  );
}

import {
  createBusinessIdentifierDefinition,
  getBusinessIdentifierDefinition,
  getBusinessIdentifierValue
} from "../IXIAosObjectDataContract";

export default function IXIAosBusinessIdentifierSlot({
  object = {},
  className = "",
  compact = false
}) {
  const definition =
    getBusinessIdentifierDefinition(object) ||
    createBusinessIdentifierDefinition(object, 0);

  const label = String(definition?.label || "ID").trim() || "ID";
  const value = getBusinessIdentifierValue(object) || "—";

  return (
    <div
      className={`ixi-aos-business-id-slot ${compact ? "compact" : ""} ${className}`.trim()}
      data-aos-business-identifier
      title={`${label}: ${value}`}
    >
      <span>{label}</span>
      <strong>{value}</strong>

      <style jsx>{`
        .ixi-aos-business-id-slot {
          min-width: 0;
          height: 30px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 4px 7px;
          border: 1px solid rgba(255,255,255,.10);
          border-radius: 5px;
          background: linear-gradient(180deg, rgba(255,255,255,.025), rgba(255,255,255,.008)), #0f120f;
          box-shadow: inset 0 1px rgba(255,255,255,.025);
          overflow: hidden;
        }
        .ixi-aos-business-id-slot span {
          display: block;
          overflow: hidden;
          color: rgba(255,196,0,.78);
          font-size: 4.7px;
          font-weight: 950;
          letter-spacing: .055em;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .ixi-aos-business-id-slot strong {
          display: block;
          margin-top: 3px;
          overflow: hidden;
          color: rgba(255,255,255,.92);
          font-size: 7.2px;
          font-weight: 950;
          line-height: 1;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .ixi-aos-business-id-slot.compact {
          height: 24px;
          padding: 3px 6px;
        }
        .ixi-aos-business-id-slot.compact span { font-size: 4.2px; }
        .ixi-aos-business-id-slot.compact strong { margin-top: 2px; font-size: 6.5px; }
      `}</style>
    </div>
  );
}

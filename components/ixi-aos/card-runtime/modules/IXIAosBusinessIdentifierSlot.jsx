import {
  createBusinessIdentifierDefinition,
  getBusinessIdentifierDefinition,
  getBusinessIdentifierValue
} from "../IXIAosObjectDataContract";

/*
 * Customer business identifier presentation.
 *
 * This is operational identity owned by the customer: UNIT #, ASSET #, JOB #,
 * EMPLOYEE #, PROPERTY #, etc. It is intentionally NOT a badge, pill or status
 * chip. The underlying identifier contract remains unchanged and searchable.
 */
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
          min-height: 18px;
          display: flex;
          align-items: baseline;
          justify-content: flex-end;
          gap: 5px;
          padding: 0;
          border: 0;
          border-radius: 0;
          background: transparent;
          box-shadow: none;
          overflow: hidden;
          text-align: right;
          white-space: nowrap;
        }
        .ixi-aos-business-id-slot span {
          min-width: 0;
          overflow: hidden;
          color: rgba(255,255,255,.48);
          font-size: 5.4px;
          font-weight: 900;
          letter-spacing: .055em;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .ixi-aos-business-id-slot strong {
          min-width: 0;
          overflow: hidden;
          color: rgba(255,255,255,.94);
          font-size: 8.2px;
          font-weight: 950;
          line-height: 1;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .ixi-aos-business-id-slot.compact {
          min-height: 15px;
        }
        .ixi-aos-business-id-slot.compact span {
          font-size: 5px;
        }
        .ixi-aos-business-id-slot.compact strong {
          font-size: 7.5px;
        }
      `}</style>
    </div>
  );
}

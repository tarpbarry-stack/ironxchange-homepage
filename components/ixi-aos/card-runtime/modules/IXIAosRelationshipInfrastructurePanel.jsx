function clean(value) {
  return String(value || "").trim();
}


function normalizeItem(item, index) {
  if (!item || typeof item !== "object") {
    return null;
  }

  const label = clean(
    item.label ||
    item.name ||
    item.title ||
    item.relationshipType ||
    item.type ||
    item.objectType
  );

  if (!label) {
    return null;
  }

  return {
    id: clean(
      item.relationshipId ||
      item.objectId ||
      item.id
    ) || `relationship-${index}`,

    label,

    value: clean(
      item.value ||
      item.summary ||
      item.status ||
      item.count ||
      item.detail
    ),

    status: clean(
      item.status
    )
  };
}


export default function IXIAosRelationshipInfrastructurePanel({
  object = {},
  moduleDefinition = {}
}) {
  const config =
    moduleDefinition?.config &&
    typeof moduleDefinition.config === "object"
      ? moduleDefinition.config
      : {};

  const sources = [
    ...(Array.isArray(object?.relationships)
      ? object.relationships
      : []),

    ...(Array.isArray(object?.infrastructure)
      ? object.infrastructure
      : []),

    ...(Array.isArray(object?.metadata?.relationships)
      ? object.metadata.relationships
      : []),

    ...(Array.isArray(object?.metadata?.infrastructure)
      ? object.metadata.infrastructure
      : [])
  ];

  const items =
    sources
      .map(normalizeItem)
      .filter(Boolean);

  const title =
    clean(config.title) ||
    "RELATIONSHIPS & INFRASTRUCTURE";

  return (
    <div className="ixi-aos-relationship-panel">
      <div className="panel-title">
        {title}
      </div>

      <div className="panel-scroll">
        {items.length ? (
          items.map(item => (
            <div
              key={item.id}
              className="relationship-row"
            >
              <strong>
                {item.label}
              </strong>

              <span>
                {item.value || "CONNECTED"}
              </span>

              <b aria-hidden="true">
                ›
              </b>
            </div>
          ))
        ) : (
          <div className="panel-empty">
            NO RELATIONSHIPS OR INFRASTRUCTURE
          </div>
        )}
      </div>

      <style jsx>{`
        .ixi-aos-relationship-panel,
        .ixi-aos-relationship-panel * {
          box-sizing: border-box;
        }

        .ixi-aos-relationship-panel {
          width: 100%;
          min-width: 0;
          height: 92px;
          min-height: 92px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,.055);
          border-radius: 6px;
          background: rgba(255,255,255,.012);
        }

        .panel-title {
          height: 20px;
          display: flex;
          align-items: center;
          padding: 0 7px;
          border-bottom: 1px solid rgba(255,255,255,.045);
          color: #ffc400;
          font-size: 6.5px;
          font-weight: 950;
          letter-spacing: .055em;
          text-transform: uppercase;
        }

        .panel-scroll {
          height: 71px;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 4px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4px;
          align-content: start;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,.22) transparent;
        }

        .relationship-row {
          min-width: 0;
          height: 28px;
          display: grid;
          grid-template-columns: minmax(0,1fr) auto 10px;
          align-items: center;
          gap: 4px;
          padding: 0 6px;
          border: 1px solid rgba(255,255,255,.045);
          border-radius: 4px;
          background: rgba(255,255,255,.012);
        }

        .relationship-row strong,
        .relationship-row span {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .relationship-row strong {
          color: rgba(255,255,255,.76);
          font-size: 7px;
          font-weight: 950;
          text-transform: uppercase;
        }

        .relationship-row span {
          color: rgba(255,255,255,.32);
          font-size: 6px;
          font-weight: 850;
        }

        .relationship-row b {
          color: rgba(0,194,255,.70);
          font-size: 12px;
          font-weight: 700;
          text-align: right;
        }

        .panel-empty {
          grid-column: 1 / -1;
          height: 46px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255,255,255,.16);
          font-size: 6px;
          font-weight: 900;
          letter-spacing: .04em;
        }
      `}</style>
    </div>
  );
}

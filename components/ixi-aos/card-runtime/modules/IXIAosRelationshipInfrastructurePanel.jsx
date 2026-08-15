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
    status: clean(item.status)
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

  const height =
    Math.max(
      62,
      Math.min(
        126,
        Number(config.height || 88)
      )
    );

  return (
    <div
      className="ixi-aos-relationship-panel"
      style={{
        height,
        minHeight: height
      }}
    >
      <div className="panel-title">
        {title}
      </div>

      <div
        className="panel-scroll"
        style={{
          height: Math.max(43, height - 19)
        }}
      >
        {items.length ? (
          items.map(item => (
            <div
              key={item.id}
              className="relationship-row"
            >
              <strong>{item.label}</strong>
              <span>{item.value || "CONNECTED"}</span>
              <b aria-hidden="true">›</b>
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
          overflow: hidden;
          border: 1px solid rgba(255,255,255,.055);
          border-radius: 6px;
          background:
            linear-gradient(
              180deg,
              rgba(255,255,255,.016),
              rgba(255,255,255,.006)
            );
        }

        .panel-title {
          height: 18px;
          display: flex;
          align-items: center;
          padding: 0 7px;
          border-bottom: 1px solid rgba(255,255,255,.045);
          color: #ffc400;
          font-size: 6px;
          font-weight: 950;
          letter-spacing: .055em;
          text-transform: uppercase;
        }

        .panel-scroll {
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
          height: 22px;
          display: grid;
          grid-template-columns: minmax(0,1fr) auto 8px;
          align-items: center;
          gap: 3px;
          padding: 0 6px;
          border: 1px solid rgba(255,255,255,.055);
          border-radius: 4px;
          background: rgba(255,255,255,.014);
        }

        .relationship-row strong,
        .relationship-row span {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .relationship-row strong {
          color: rgba(255,255,255,.80);
          font-size: 6.2px;
          font-weight: 950;
          text-transform: uppercase;
        }

        .relationship-row span {
          color: rgba(255,255,255,.34);
          font-size: 5.1px;
          font-weight: 850;
        }

        .relationship-row b {
          color: rgba(0,194,255,.78);
          font-size: 11px;
          font-weight: 700;
          text-align: right;
        }

        .relationship-row:hover {
          border-color: rgba(0,194,255,.14);
          background: rgba(0,194,255,.025);
        }

        .panel-empty {
          grid-column: 1 / -1;
          min-height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255,255,255,.16);
          font-size: 5.5px;
          font-weight: 900;
          letter-spacing: .04em;
        }
      `}</style>
    </div>
  );
}

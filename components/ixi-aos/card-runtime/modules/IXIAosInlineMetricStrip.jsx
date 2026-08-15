function clean(value) {
  return String(value ?? "").trim();
}

function formatValue(value, type = "") {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const normalizedType = clean(type).toLowerCase();
  const number = Number(value);

  if (normalizedType === "money" && Number.isFinite(number)) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }).format(number);
  }

  if (normalizedType === "number" && Number.isFinite(number)) {
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 0
    }).format(number);
  }

  return String(value);
}

function getValue({ object = {}, projection = null, metric = {} }) {
  const source = clean(metric?.source).toLowerCase();
  const key = clean(metric?.key);

  if (!key) {
    return null;
  }

  if (source === "projection") {
    return projection?.[key] ?? null;
  }

  if (source === "object") {
    return object?.[key] ?? null;
  }

  if (source === "metadata") {
    return object?.metadata?.[key] ?? null;
  }

  return object?.fields?.[key] ?? null;
}

export default function IXIAosInlineMetricStrip({
  object = {},
  projection = null,
  moduleDefinition = {}
}) {
  const metrics = Array.isArray(moduleDefinition?.config?.metrics)
    ? moduleDefinition.config.metrics
    : [];

  if (!metrics.length) {
    return null;
  }

  return (
    <div className="ixi-aos-inline-metrics">
      {metrics.map((metric, index) => {
        const label = clean(metric?.label) || `METRIC ${index + 1}`;
        const value = getValue({ object, projection, metric });

        return (
          <div
            key={metric?.metricId || `${clean(metric?.source)}:${clean(metric?.key)}:${index}`}
            className="ixi-aos-inline-metric"
          >
            <span>{label}</span>
            <strong>{formatValue(value, metric?.type)}</strong>
          </div>
        );
      })}

      <style jsx>{`
        .ixi-aos-inline-metrics {
          width: 100%;
          min-height: 24px;

          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 12px;

          padding: 3px 1px;
        }

        .ixi-aos-inline-metric {
          min-width: 0;

          display: inline-flex;
          align-items: baseline;
          gap: 5px;

          white-space: nowrap;
        }

        .ixi-aos-inline-metric span {
          color: rgba(255,255,255,.38);
          font-size: 7px;
          font-weight: 900;
          letter-spacing: .04em;
          text-transform: uppercase;
        }

        .ixi-aos-inline-metric strong {
          color: rgba(255,255,255,.88);
          font-size: 10px;
          font-weight: 950;
          line-height: 1;
        }
      `}</style>
    </div>
  );
}

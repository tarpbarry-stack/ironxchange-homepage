import { useMemo } from "react";

function clean(value) {
  return String(value ?? "").trim();
}

function safeObject(value) {
  return (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  )
    ? value
    : {};
}

function normalizeKey(value) {
  return clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function IXIObjectStudioDefinitionBench({
  studio
}) {
  const object =
    studio?.objectDraft || {};

  const metadata =
    safeObject(object.metadata);

  const resolution =
    safeObject(metadata.definitionResolution);

  const explicitDraft =
    safeObject(metadata.definitionDraft);

  const definitionId =
    clean(
      object.definitionId ||
      metadata.definitionId ||
      resolution.definitionId ||
      explicitDraft.definitionId
    );

  const enabled =
    explicitDraft.enabled === true ||
    Boolean(definitionId);

  const label =
    clean(explicitDraft.label);

  const definitionKey =
    clean(
      explicitDraft.definitionKey ||
      object.definitionKey ||
      metadata.definitionKey ||
      resolution.definitionKey
    );

  const syncFieldSchema =
    explicitDraft.syncFieldSchema !== false;

  const fieldCount =
    Array.isArray(object.fieldDefinitions)
      ? object.fieldDefinitions.length
      : 0;

  const status = useMemo(
    () => {
      if (definitionId) return "EXISTING";
      if (enabled) return "NEW";
      return "OBJECT ONLY";
    },
    [definitionId, enabled]
  );

  function writeDefinitionDraft(patch) {
    const snapshot =
      studio?.getSnapshot?.();

    if (!snapshot) return;

    const currentObject =
      safeObject(snapshot.objectDraft);

    const currentMetadata =
      safeObject(currentObject.metadata);

    const currentDraft =
      safeObject(currentMetadata.definitionDraft);

    const nextDraft = {
      ...currentDraft,
      ...patch
    };

    if (definitionId) {
      nextDraft.definitionId = definitionId;
    }

    const next = {
      ...snapshot,
      dirty: true,
      revision:
        Number(snapshot.revision || 0) + 1,
      updatedAt:
        new Date().toISOString(),
      objectDraft: {
        ...currentObject,
        metadata: {
          ...currentMetadata,
          definitionDraft: nextDraft
        }
      }
    };

    studio?.replaceDraft?.(next);
  }

  function handleEnabled(value) {
    if (definitionId && !value) {
      return;
    }

    writeDefinitionDraft({
      enabled: value,
      syncFieldSchema:
        value
          ? syncFieldSchema
          : false
    });
  }

  return (
    <section className="definition-bench">
      <div className="bench-head">
        <div>
          <span className="eyebrow">
            OBJECT DEFINITION
          </span>
          <strong>
            REUSABLE SCHEMA
          </strong>
        </div>

        <span
          className={
            enabled
              ? "status active"
              : "status"
          }
        >
          {status}
        </span>
      </div>

      <div className="definition-row">
        <label className="switch-row">
          <input
            type="checkbox"
            checked={enabled}
            disabled={Boolean(definitionId)}
            onChange={
              event =>
                handleEnabled(
                  event.target.checked
                )
            }
          />
          <span>
            {definitionId
              ? "REUSABLE DEFINITION ATTACHED"
              : "MAKE THIS A REUSABLE DEFINITION"}
          </span>
        </label>

        <div className="field-count">
          {fieldCount} FIELD{fieldCount === 1 ? "" : "S"}
        </div>
      </div>

      {enabled ? (
        <div className="definition-grid">
          <label>
            <span>DEFINITION LABEL</span>
            <input
              value={label}
              placeholder={
                definitionId
                  ? "CURRENT LABEL"
                  : "NAME THIS REUSABLE DEFINITION"
              }
              onChange={
                event => {
                  const nextLabel =
                    event.target.value;

                  writeDefinitionDraft({
                    enabled: true,
                    label: nextLabel,
                    definitionKey:
                      definitionKey ||
                      normalizeKey(nextLabel)
                  });
                }
              }
            />
          </label>

          <label>
            <span>STABLE KEY</span>
            <input
              value={definitionKey}
              placeholder="stable-definition-key"
              onChange={
                event =>
                  writeDefinitionDraft({
                    enabled: true,
                    definitionKey:
                      normalizeKey(
                        event.target.value
                      )
                  })
              }
            />
          </label>

          <label className="sync-row">
            <input
              type="checkbox"
              checked={syncFieldSchema}
              onChange={
                event =>
                  writeDefinitionDraft({
                    enabled: true,
                    syncFieldSchema:
                      event.target.checked
                  })
              }
            />
            <span>
              SYNC OBJECT STUDIO FIELDS INTO DEFINITION SCHEMA
            </span>
          </label>
        </div>
      ) : (
        <p className="doctrine">
          This Object can be saved permanently without creating a reusable type. Naming an Object never defines what the customer calls its business category.
        </p>
      )}

      {definitionId ? (
        <div className="definition-id">
          {definitionId}
        </div>
      ) : null}

      <style jsx>{`
        .definition-bench {
          height: 100%;
          padding: 12px 14px;
          border: 1px solid rgba(255,255,255,.055);
          border-radius: 9px;
          background: rgba(255,255,255,.012);
          overflow: hidden;
        }

        .bench-head,
        .definition-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .bench-head > div {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .eyebrow {
          color: #ffc400;
          font-size: 7px;
          font-weight: 950;
          letter-spacing: .08em;
        }

        strong {
          color: rgba(255,255,255,.72);
          font-size: 10px;
          font-weight: 950;
        }

        .status,
        .field-count,
        .definition-id {
          color: rgba(255,255,255,.28);
          font-size: 6px;
          font-weight: 900;
          letter-spacing: .05em;
        }

        .status.active {
          color: rgba(112,255,166,.78);
        }

        .definition-row {
          margin-top: 10px;
        }

        .switch-row,
        .sync-row {
          display: flex;
          align-items: center;
          gap: 7px;
          color: rgba(255,255,255,.48);
          font-size: 7px;
          font-weight: 900;
        }

        .definition-grid {
          margin-top: 10px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .definition-grid label > span {
          display: block;
          margin-bottom: 4px;
          color: rgba(255,255,255,.25);
          font-size: 6px;
          font-weight: 900;
        }

        input[type="text"],
        .definition-grid input:not([type]) {
          width: 100%;
        }

        .definition-grid input {
          box-sizing: border-box;
        }

        .definition-grid label:not(.sync-row) input {
          width: 100%;
          height: 28px;
          padding: 0 8px;
          border: 1px solid rgba(255,255,255,.07);
          border-radius: 4px;
          outline: none;
          background: rgba(255,255,255,.018);
          color: rgba(255,255,255,.72);
          font-size: 7px;
          font-weight: 850;
        }

        .sync-row {
          grid-column: 1 / -1;
        }

        .doctrine {
          margin: 9px 0 0;
          color: rgba(255,255,255,.25);
          font-size: 6.5px;
          line-height: 1.5;
        }

        .definition-id {
          margin-top: 7px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      `}</style>
    </section>
  );
}

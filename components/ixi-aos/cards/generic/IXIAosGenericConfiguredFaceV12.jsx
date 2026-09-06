import { useEffect, useMemo, useState } from "react";

import IXIObjectRail from "../../../ixi-object-system/IXIObjectRail";
import IXIAosCardHeaderControls from "../../card-runtime/modules/IXIAosCardHeaderControls";
import {
  asArray,
  clean,
  getFieldDefinitions,
  getFieldValue,
  getObjectActionCapabilities,
  getObjectDisplayName,
  getObjectFields,
  getObjectId,
  getObjectLabel,
  getObjectPresentation,
  getObjectRelationships,
  safeObject
} from "../../card-runtime/IXIAosSemanticObjectPresentation";

function getFaceConfig(object = {}, faceNumber = 2) {
  const presentation = getObjectPresentation(object);
  const faces = presentation?.faces;

  if (Array.isArray(faces)) {
    return safeObject(
      faces.find(item =>
        Number(item?.face || item?.faceNumber || item?.index) === Number(faceNumber)
      )
    );
  }

  if (faces && typeof faces === "object") {
    return safeObject(
      faces[String(faceNumber)] ||
      faces[faceNumber]
    );
  }

  return safeObject(
    presentation?.[`face${faceNumber}`]
  );
}

function getRawFieldDefinitions(object = {}) {
  const definition = safeObject(
    object?.definition ||
    object?.fields?.definition ||
    object?.metadata?.definition
  );

  const metadata = safeObject(object?.metadata);

  const sources = [
    object?.fieldDefinitions,
    object?.fieldSchema,
    definition?.fieldDefinitions,
    definition?.fieldSchema,
    metadata?.fieldDefinitions,
    metadata?.fieldSchema
  ];

  return sources.find(source => Array.isArray(source) && source.length) || [];
}

function getFaceDefinitions(object = {}, faceNumber = 2) {
  return getFieldDefinitions(object).filter(definition => {
    const nested = safeObject(definition?.presentation);
    const configuredFace = Number(
      definition?.face ||
      definition?.faceNumber ||
      definition?.presentationFace ||
      nested?.face ||
      0
    );

    return configuredFace === Number(faceNumber);
  });
}

function normalizeItem(object = {}, rawItem = {}) {
  const item = typeof rawItem === "string"
    ? { fieldId: rawItem }
    : safeObject(rawItem);

  const fieldId = clean(
    item?.fieldId ||
    item?.field ||
    item?.key ||
    item?.id
  );

  if (!fieldId) return null;

  const source = clean(item?.source || "fields").toLowerCase();
  const visibleDefinitions = getFieldDefinitions(object);
  const definition = visibleDefinitions.find(entry => entry.fieldId === fieldId) || null;

  /*
   * If the object declared a schema and this field disappeared from the
   * permission-filtered schema, the face is not allowed to resurrect it
   * just because a presentation section still names the fieldId.
   */
  if (source === "fields") {
    const rawDefinitions = getRawFieldDefinitions(object);
    const wasDeclared = rawDefinitions.some(entry =>
      clean(entry?.fieldId || entry?.field || entry?.key || entry?.slug) === fieldId
    );

    if (wasDeclared && !definition) {
      return null;
    }
  }

  return {
    ...(definition || {}),
    ...item,
    fieldId,
    label: clean(item?.label || definition?.label || fieldId) || "FIELD",
    fieldType: clean(item?.fieldType || item?.type || definition?.fieldType || "text"),
    source
  };
}

function resolveValue(object = {}, item = {}, runtimeData = {}) {
  const key = clean(item?.key || item?.fieldId);
  if (!key) return null;

  if (item.source === "object") {
    return object?.[key] ?? null;
  }

  if (item.source === "metadata") {
    return object?.metadata?.[key] ?? null;
  }

  if (item.source === "runtime" || item.source === "projection") {
    return runtimeData?.[key] ?? null;
  }

  return getFieldValue(object, key) ?? null;
}

function formatValue(value, type = "", currency = "USD") {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (Array.isArray(value)) {
    return value
      .map(item =>
        typeof item === "string"
          ? clean(item)
          : clean(item?.label || item?.name || item?.value)
      )
      .filter(Boolean)
      .join(" · ") || "—";
  }

  if (value && typeof value === "object") {
    return clean(
      value?.displayName ||
      value?.label ||
      value?.name ||
      value?.value
    ) || "—";
  }

  const normalizedType = clean(type).toLowerCase();
  const numeric = Number(value);

  if (["money", "currency"].includes(normalizedType) && Number.isFinite(numeric)) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: clean(currency) || "USD",
      maximumFractionDigits: 0
    }).format(numeric);
  }

  if (["number", "integer"].includes(normalizedType) && Number.isFinite(numeric)) {
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 2
    }).format(numeric);
  }

  return String(value);
}

function FaceEditor({
  object,
  definitions,
  saving,
  onCancel,
  onSave
}) {
  const [draft, setDraft] = useState({});

  useEffect(() => {
    const next = {};

    definitions.forEach(definition => {
      const value = getFieldValue(object, definition.fieldId);

      next[definition.fieldId] = Array.isArray(value)
        ? value.join(", ")
        : String(value ?? "");
    });

    setDraft(next);
  }, [object, definitions]);

  async function save() {
    const fields = { ...getObjectFields(object) };

    definitions.forEach(definition => {
      const raw = draft[definition.fieldId];
      const type = clean(definition?.fieldType).toLowerCase();

      if (["number", "integer", "money", "currency"].includes(type)) {
        const numeric = Number(raw);
        fields[definition.fieldId] = Number.isFinite(numeric) ? numeric : null;
        return;
      }

      if (["tags", "array", "list", "multi-select", "multiselect"].includes(type)) {
        fields[definition.fieldId] = String(raw || "")
          .split(",")
          .map(clean)
          .filter(Boolean);
        return;
      }

      fields[definition.fieldId] = raw;
    });

    await onSave?.({
      ...object,
      fields
    });
  }

  return (
    <div
      className="gfv12-editor"
      onPointerDown={event => event.stopPropagation()}
    >
      <div className="gfv12-editor-head">
        <div>
          <small>{getObjectLabel(object)}</small>
          <strong>EDIT FACE</strong>
        </div>

        <nav>
          <button type="button" disabled={saving} onClick={save}>SAVE</button>
          <button type="button" disabled={saving} onClick={onCancel}>CANCEL</button>
        </nav>
      </div>

      <div className="gfv12-editor-scroll">
        {definitions.map(definition => (
          <label key={definition.fieldId}>
            <span>{definition.label}</span>
            <input
              value={draft[definition.fieldId] ?? ""}
              onChange={event =>
                setDraft(current => ({
                  ...current,
                  [definition.fieldId]: event.target.value
                }))
              }
            />
          </label>
        ))}

        {!definitions.length ? (
          <div className="gfv12-empty">
            NO EDITABLE FIELDS DECLARED FOR THIS FACE
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function IXIAosGenericConfiguredFaceV12({
  faceNumber = 2,
  object = {},
  runtimeData = {},
  ixiState = {},
  onIxiStateChange = null,
  onSaveObject = null,
  onAddObject = null,
  onHideObject = null,
  onDeleteObject = null,
  onOpenConsole = null,
  onOpenTransact = null,
  skinId = "v12",
  onSkinChange = null,
  onSendFront = null,
  onSendBack = null,
  onCycleColor = null,
  onCycleOutline = null,
  onCycleFace = null,
  onRailSend = null,
  onRecall = null,
  onBoard = null,
  onReturn = null,
  armedDestination = "",
  onSendToArmedDestination = null
}) {
  const [runtimeObject, setRuntimeObject] = useState(object);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setRuntimeObject(object);
  }, [object]);

  const config = useMemo(
    () => getFaceConfig(runtimeObject, faceNumber),
    [runtimeObject, faceNumber]
  );

  const faceDefinitions = useMemo(
    () => getFaceDefinitions(runtimeObject, faceNumber),
    [runtimeObject, faceNumber]
  );

  const actions = getObjectActionCapabilities(runtimeObject);
  const relationships = getObjectRelationships(runtimeObject);
  const currency = clean(
    runtimeObject?.currency ||
    runtimeObject?.fields?.currency ||
    "USD"
  ) || "USD";

  const sections = asArray(config?.sections);

  const resolvedSections = sections.length
    ? sections
    : faceDefinitions.length
      ? [{
          title: clean(config?.defaultSectionTitle) || "DETAILS",
          layout: "rows",
          fields: faceDefinitions
        }]
      : [];

  const editableDefinitions = faceDefinitions.filter(
    definition => definition.editable !== false
  );

  const eyebrow = clean(
    config?.eyebrow ||
    config?.categoryLabel
  ) || getObjectLabel(runtimeObject);

  const title = clean(
    config?.title ||
    config?.label
  ) || `FACE ${faceNumber}`;

  async function save(nextObject) {
    setSaving(true);

    try {
      await onSaveObject?.({
        objectId: getObjectId(nextObject),
        object: nextObject,
        fields: { ...getObjectFields(nextObject) },
        face: faceNumber
      });

      setRuntimeObject(nextObject);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function runCommand(event, callback) {
    event.preventDefault();
    event.stopPropagation();
    callback?.(runtimeObject);
  }

  return (
    <article
      className={`ixi-generic-face-v12 skin-${skinId}`}
      data-face-number={faceNumber}
    >
      <header className="gfv12-head">
        <div className="gfv12-ident">
          <span>{eyebrow}</span>
          <strong>{getObjectDisplayName(runtimeObject)}</strong>
        </div>

        {!editing ? (
          <IXIAosCardHeaderControls
            canAdd={actions.canCreate && typeof onAddObject === "function"}
            canEdit={actions.canEdit && editableDefinitions.length > 0}
            canTransact={actions.canTransact && typeof onOpenTransact === "function"}
            onAdd={() => onAddObject?.(runtimeObject)}
            onToggleEdit={() => setEditing(true)}
            onTransact={() => onOpenTransact?.(runtimeObject)}
            onHide={onHideObject}
            onDelete={onDeleteObject}
            onOpenConsole={actions.canOpenConsole ? onOpenConsole : null}
            skinId={skinId}
            onSkinChange={onSkinChange}
          />
        ) : null}
      </header>

      <main className="gfv12-scroll">
        <div className="gfv12-banner">
          <b>F{faceNumber}</b>
          <span>{title}</span>
        </div>

        {resolvedSections.map((section, sectionIndex) => {
          const layout = clean(
            section?.layout ||
            section?.type ||
            "rows"
          ).toLowerCase();

          const sectionTitle = clean(
            section?.title ||
            section?.label
          ) || `SECTION ${sectionIndex + 1}`;

          if (layout === "relationships") {
            return (
              <section
                className="gfv12-section"
                key={`${sectionTitle}-${sectionIndex}`}
              >
                <h3>{sectionTitle}</h3>

                <div className="gfv12-relations">
                  {relationships.map(relationship => (
                    <button type="button" key={relationship.id}>
                      <span>
                        <small>{relationship.label}</small>
                        <strong>{relationship.value}</strong>
                        {relationship.secondary ? (
                          <em>{relationship.secondary}</em>
                        ) : null}
                      </span>
                      <b>›</b>
                    </button>
                  ))}

                  {!relationships.length ? (
                    <div className="gfv12-empty">NO RELATIONSHIPS</div>
                  ) : null}
                </div>
              </section>
            );
          }

          const configuredItems = asArray(
            section?.fields ||
            section?.items ||
            section?.metrics
          );

          const items = (
            configuredItems.length
              ? configuredItems
              : sectionIndex === 0
                ? faceDefinitions
                : []
          )
            .map(item => normalizeItem(runtimeObject, item))
            .filter(Boolean);

          return (
            <section
              className="gfv12-section"
              key={`${sectionTitle}-${sectionIndex}`}
            >
              <h3>{sectionTitle}</h3>

              <div
                className={
                  layout === "grid" || layout === "metrics"
                    ? "gfv12-grid"
                    : "gfv12-rows"
                }
              >
                {items.map((item, index) => (
                  <div
                    className="gfv12-value"
                    key={`${item.fieldId}-${index}`}
                  >
                    <small>{item.label}</small>
                    <strong>
                      {formatValue(
                        resolveValue(runtimeObject, item, runtimeData),
                        item.fieldType,
                        currency
                      )}
                    </strong>

                    {clean(item?.secondary) ? (
                      <em>{clean(item.secondary)}</em>
                    ) : null}
                  </div>
                ))}

                {!items.length ? (
                  <div className="gfv12-empty">NO VISIBLE FIELDS</div>
                ) : null}
              </div>
            </section>
          );
        })}

        {!resolvedSections.length ? (
          <div className="gfv12-unconfigured">
            <b>F{faceNumber}</b>
            <strong>FACE NOT CONFIGURED</strong>
            <span>
              This layout renders only schema fields explicitly assigned to this face.
            </span>
          </div>
        ) : null}
      </main>

      <nav className="gfv12-commands" aria-label={`Face ${faceNumber} card actions`}>
        <button type="button" onClick={event => runCommand(event, onRecall)} aria-label="Recall object">
          ↻ <b>RECALL</b>
        </button>
        <button type="button" onClick={event => runCommand(event, onBoard)} aria-label="Open board">
          ▦ <b>BOARD</b>
        </button>
        <button type="button" onClick={event => runCommand(event, onReturn)} aria-label="Return object">
          ↩ <b>RETURN</b>
        </button>
      </nav>

      <IXIObjectRail
        object={runtimeObject}
        saved={false}
        color={ixiState?.color || "none"}
        outline={Number(ixiState?.outline ?? 1)}
        face={faceNumber}
        onSendFront={onSendFront}
        onSendBack={onSendBack}
        onCycleColor={onCycleColor}
        onCycleOutline={onCycleOutline}
        onCycleFace={onCycleFace}
        onRailSend={onRailSend}
        armedDestination={armedDestination}
        onSendToArmedDestination={onSendToArmedDestination}
      />

      {editing ? (
        <FaceEditor
          object={runtimeObject}
          definitions={editableDefinitions}
          saving={saving}
          onCancel={() => setEditing(false)}
          onSave={save}
        />
      ) : null}

      <style jsx global>{`
        .ixi-generic-face-v12,.ixi-generic-face-v12 *{box-sizing:border-box}.ixi-generic-face-v12{--y:#ffc400;--line:#343a36;--panel:#111512;position:relative;width:298px;height:471px;overflow:hidden;border:1px solid #484f4a;border-radius:13px;background:radial-gradient(circle at 82% 10%,#255d7420,transparent 27%),linear-gradient(180deg,#111513,#080b09);color:#f1f4f2;font-family:"Inter Variable",Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;box-shadow:inset 0 1px #ffffff12,0 18px 40px #0008}.gfv12-head{position:absolute;inset:0 0 auto;height:43px;padding:7px 10px;border-bottom:1px solid #303532;background:linear-gradient(180deg,#171b18,#101311);z-index:20}.gfv12-ident{max-width:190px}.gfv12-ident span{display:block;color:var(--y);font-size:7px;font-weight:850;letter-spacing:.07em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.gfv12-ident strong{display:block;margin-top:3px;font-size:14px;line-height:1.05;font-weight:850;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.gfv12-scroll{position:absolute;top:43px;left:7px;right:7px;bottom:51px;display:flex;flex-direction:column;gap:6px;padding:6px 0;overflow-y:auto;scrollbar-width:thin;scrollbar-color:#59605b #090b0a}.gfv12-banner{flex:0 0 31px;display:flex;align-items:center;gap:9px;padding:0 9px;border:1px solid #3b423d;border-radius:5px;background:linear-gradient(180deg,#171b18,#101310)}.gfv12-banner b{display:grid;place-items:center;width:23px;height:18px;border:1px solid #ffc40055;border-radius:3px;color:var(--y);font-size:8px}.gfv12-banner span{font-size:9px;font-weight:850;letter-spacing:.03em}.gfv12-section{flex:0 0 auto;overflow:hidden;border:1px solid var(--line);border-radius:6px;background:var(--panel)}.gfv12-section h3{height:23px;margin:0;display:flex;align-items:center;padding:0 8px;border-bottom:1px solid #292e2a;background:#151916;color:var(--y);font-size:8px;font-weight:850;letter-spacing:.05em}.gfv12-rows{display:flex;flex-direction:column}.gfv12-grid{display:grid;grid-template-columns:1fr 1fr}.gfv12-value{min-height:43px;display:flex;flex-direction:column;justify-content:center;padding:7px 8px;border-bottom:1px solid #242925}.gfv12-grid .gfv12-value{border-right:1px solid #242925}.gfv12-value small{color:#9aa29d;font-size:7px;font-weight:750;letter-spacing:.025em}.gfv12-value strong{margin-top:3px;color:#f1f3f2;font-size:9px;font-weight:800;line-height:1.2;word-break:break-word}.gfv12-value em{margin-top:2px;color:#858e88;font-size:7px;font-style:normal}.gfv12-relations{display:flex;flex-direction:column}.gfv12-relations button{min-height:43px;display:grid;grid-template-columns:1fr 18px;align-items:center;padding:6px 6px 6px 8px;border:0;border-bottom:1px solid #252a26;background:transparent;color:#fff;text-align:left}.gfv12-relations button>span{min-width:0}.gfv12-relations small{display:block;color:#929b95;font-size:7px;font-weight:750}.gfv12-relations strong{display:block;margin-top:2px;font-size:9px;font-weight:800;line-height:1.2;overflow-wrap:anywhere}.gfv12-relations em{display:block;margin-top:2px;color:#7f8882;font-size:7px;font-style:normal}.gfv12-relations button>b{color:var(--y);font-size:13px;text-align:center}.gfv12-empty{padding:14px;color:#818a84;font-size:7px;font-weight:800;text-align:center}.gfv12-unconfigured{min-height:150px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;border:1px dashed #3b413d;border-radius:6px;color:#8e9791;text-align:center}.gfv12-unconfigured>b{color:var(--y);font-size:16px}.gfv12-unconfigured strong{color:#c9cecb;font-size:9px}.gfv12-unconfigured span{max-width:190px;font-size:7px;line-height:1.4}.gfv12-commands{position:absolute;left:7px;right:7px;bottom:20px;height:31px;display:grid;grid-template-columns:repeat(3,1fr);gap:5px;padding:3px 0;z-index:30}.gfv12-commands button{border:1px solid #303632;border-radius:4px;background:linear-gradient(180deg,#131714,#0d100e);color:#d9ddda;font-family:inherit;font-size:9px;font-weight:800;cursor:pointer}.gfv12-commands button:hover,.gfv12-commands button:focus-visible{border-color:#75631b;color:var(--y);outline:none}.gfv12-commands b{margin-left:3px;font-size:7px;letter-spacing:.025em}.gfv12-editor{position:absolute;inset:0 0 16px;background:#0b0e0c;z-index:100}.gfv12-editor-head{height:43px;display:flex;align-items:center;justify-content:space-between;padding:7px 9px;border-bottom:1px solid #303532;background:#151916}.gfv12-editor-head small{display:block;color:#8c958f;font-size:7px;font-weight:750}.gfv12-editor-head strong{display:block;margin-top:3px;font-size:10px}.gfv12-editor-head nav{display:flex}.gfv12-editor-head button{height:24px;padding:0 8px;border:1px solid #3b423d;background:#101310;color:#dfe3e0;font-size:8px;font-weight:850}.gfv12-editor-head button:first-child{color:var(--y)}.gfv12-editor-scroll{position:absolute;top:43px;left:0;right:0;bottom:0;padding:9px;overflow-y:auto}.gfv12-editor-scroll label{display:block;margin-bottom:8px}.gfv12-editor-scroll label span{display:block;margin-bottom:4px;color:#929b95;font-size:7px;font-weight:800}.gfv12-editor-scroll input{width:100%;height:30px;padding:0 8px;border:1px solid #363d38;border-radius:4px;background:#111512;color:#fff;font-size:9px;font-weight:750;outline:none}.gfv12-editor-scroll input:focus{border-color:#ffc40077}
      `}</style>
    </article>
  );
}

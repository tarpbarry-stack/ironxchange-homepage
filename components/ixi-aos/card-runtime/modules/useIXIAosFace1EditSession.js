import { useEffect, useMemo, useState } from "react";

import {
  asArray,
  clean,
  getObjectDisplayName,
  getObjectFields,
  getObjectId
} from "../IXIAosSemanticObjectPresentation";

function inputValue(value) {
  if (Array.isArray(value)) return value.join(", ");
  if (value && typeof value === "object") {
    return clean(value?.displayName || value?.label || value?.name || value?.value);
  }
  return String(value ?? "");
}

function parseValue(definition = {}, rawValue) {
  const type = clean(definition?.fieldType || definition?.type).toLowerCase();
  if (["number", "integer", "money", "currency", "percent", "percentage"].includes(type)) {
    const number = Number(rawValue);
    return Number.isFinite(number) ? number : null;
  }
  if (["tags", "array", "list", "multi-select", "multiselect"].includes(type)) {
    return String(rawValue || "").split(",").map(clean).filter(Boolean);
  }
  if (type === "boolean") {
    const normalized = clean(rawValue).toLowerCase();
    if (["true", "yes", "1", "on"].includes(normalized)) return true;
    if (["false", "no", "0", "off"].includes(normalized)) return false;
  }
  return rawValue;
}

export default function useIXIAosFace1EditSession({
  object = {},
  definitions = [],
  onSaveObject = null,
  mediaEnabled = false
} = {}) {
  const editableDefinitions = useMemo(
    () => asArray(definitions).filter(definition => definition?.editable !== false && clean(definition?.fieldId)),
    [definitions]
  );

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(getObjectDisplayName(object));
  const [draft, setDraft] = useState({});
  const [media, setMedia] = useState(asArray(object?.media));

  function reset(source = object) {
    const fields = getObjectFields(source);
    const nextDraft = {};
    editableDefinitions.forEach(definition => {
      nextDraft[definition.fieldId] = inputValue(fields?.[definition.fieldId]);
    });
    setName(getObjectDisplayName(source));
    setDraft(nextDraft);
    setMedia(asArray(source?.media));
  }

  useEffect(() => {
    if (!editing) reset(object);
  }, [object, editableDefinitions, editing]);

  function begin() {
    reset(object);
    setEditing(true);
  }

  function cancel() {
    reset(object);
    setEditing(false);
  }

  function setField(fieldId, value) {
    setDraft(current => ({ ...current, [fieldId]: value }));
  }

  async function save() {
    const nextFields = { ...getObjectFields(object) };
    editableDefinitions.forEach(definition => {
      nextFields[definition.fieldId] = parseValue(definition, draft[definition.fieldId]);
    });

    const nextObject = {
      ...object,
      displayName: clean(name) || getObjectDisplayName(object),
      fields: nextFields,
      media: mediaEnabled ? asArray(media) : asArray(object?.media)
    };

    setSaving(true);
    try {
      await onSaveObject?.({
        objectId: getObjectId(nextObject),
        object: nextObject,
        displayName: nextObject.displayName,
        fields: nextFields,
        fieldDefinitions: asArray(nextObject?.fieldDefinitions),
        metadata: { ...(nextObject?.metadata || {}) },
        media: asArray(nextObject.media)
      });
      setEditing(false);
      return nextObject;
    } finally {
      setSaving(false);
    }
  }

  return {
    editing,
    saving,
    name,
    draft,
    media,
    begin,
    cancel,
    save,
    setName,
    setField,
    setMedia
  };
}

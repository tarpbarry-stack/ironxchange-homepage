import {
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import {
  createIXIPhotoDraft,
  validateIXIPhoto
} from "./IXIPhotoContract";

import {
  validateIXITransactFile
} from "../../IXITransactFilePolicy";

import IXIPhotoStyles from "./IXIPhotoStyles";

const clean = value => String(value ?? "").trim();
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const PHOTO_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

const COPY = {
  en: {
    title: "ADD PHOTO",
    machine: "Machine",
    wo: "Work Order",
    location: "Location",
    employee: "Employee",
    details: "PHOTO DETAILS",
    type: "PHOTO TYPE",
    work: "WORK PHOTO",
    damage: "DAMAGE",
    before: "BEFORE / AFTER",
    reference: "REFERENCE",
    titleLabel: "PHOTO TITLE (OPTIONAL)",
    description: "DESCRIPTION (OPTIONAL)",
    date: "PHOTO DATE",
    time: "TIME",
    link: "LINK TO",
    photo: "PHOTO",
    take: "TAKE PHOTO / CHOOSE FROM GALLERY",
    takeSub: "JPG, PNG, WEBP · MAX 10MB EACH",
    tags: "ADDITIONAL TAGS (OPTIONAL)",
    visibility: "VISIBILITY",
    team: "Work Order Team",
    cancel: "CANCEL",
    cancelSub: "Discard changes",
    save: "SAVE PHOTO",
    saving: "SAVING…",
    saveSub: "Return to Work Order",
    required: "Add at least one valid photo before saving.",
    foot: "Photos are linked to this Work Order and inherited AOS context, then surfaced in Activity and Documents.",
    saveFailed: "The photo entry could not be saved. Nothing was added. Try again."
  },
  es: {
    title: "AGREGAR FOTO",
    machine: "Máquina",
    wo: "Orden de Trabajo",
    location: "Ubicación",
    employee: "Empleado",
    details: "DETALLES DE FOTO",
    type: "TIPO DE FOTO",
    work: "FOTO DE TRABAJO",
    damage: "DAÑO",
    before: "ANTES / DESPUÉS",
    reference: "REFERENCIA",
    titleLabel: "TÍTULO DE FOTO (OPCIONAL)",
    description: "DESCRIPCIÓN (OPCIONAL)",
    date: "FECHA",
    time: "HORA",
    link: "VINCULAR A",
    photo: "FOTO",
    take: "TOMAR FOTO / ELEGIR DE GALERÍA",
    takeSub: "JPG, PNG, WEBP · MÁX. 10MB CADA UNA",
    tags: "ETIQUETAS ADICIONALES (OPCIONAL)",
    visibility: "VISIBILIDAD",
    team: "Equipo de Orden de Trabajo",
    cancel: "CANCELAR",
    cancelSub: "Descartar cambios",
    save: "GUARDAR FOTO",
    saving: "GUARDANDO…",
    saveSub: "Regresar a la Orden",
    required: "Agrega por lo menos una foto válida antes de guardar.",
    foot: "Las fotos se vinculan a esta Orden y al contexto AOS heredado, y aparecen en Actividad y Documentos.",
    saveFailed: "No se pudo guardar la foto. No se agregó nada. Intenta de nuevo."
  }
};

function createClientRequestId() {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.randomUUID) {
    return `PHOTO-${globalThis.crypto.randomUUID()}`;
  }

  return `PHOTO-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function localDateTime() {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date - offset).toISOString().slice(0, 16);
}

function toIsoTimestamp(localValue) {
  const candidate = clean(localValue);
  if (!candidate) return "";
  const date = new Date(candidate);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

export default function IXIPhotoApp({
  context = {},
  workOrder = {},
  language = "en",
  onLanguageChange = null,
  onCancel = null,
  onSave = null
}) {
  const [lang, setLang] = useState(language === "es" ? "es" : "en");
  const [photoType, setPhotoType] = useState("work-photo");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [occurredAtLocal, setOccurredAtLocal] = useState(localDateTime());
  const [tags, setTags] = useState("");
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [fileError, setFileError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);

  const inputRef = useRef(null);
  const requestIdRef = useRef(createClientRequestId());
  const objectUrlsRef = useRef(new Set());

  const t = COPY[lang];
  const primary = context.primary || {};
  const location = context.location || {};
  const actor = context.actor || {};
  const workOrderNumber = clean(
    workOrder.identity?.number ||
      workOrder.workOrderNumber ||
      workOrder.number
  ) || "WORK ORDER";

  const occurredAt = toIsoTimestamp(occurredAtLocal);

  const media = useMemo(
    () => files.map((entry, index) => ({
      mediaId: `${requestIdRef.current}-MEDIA-${index + 1}`,
      fileName: entry.file.name,
      mimeType: entry.file.type,
      size: entry.file.size,
      previewUrl: entry.previewUrl,
      status: "local-pending-upload"
    })),
    [files]
  );

  const input = useMemo(
    () => ({
      clientRequestId: requestIdRef.current,
      photoType,
      title,
      description,
      occurredAt,
      tags,
      visibility: "work-order-team",
      media
    }),
    [photoType, title, description, occurredAt, tags, media]
  );

  useEffect(() => {
    return () => {
      for (const url of objectUrlsRef.current) {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // Ignore browser cleanup errors.
        }
      }
      objectUrlsRef.current.clear();
    };
  }, []);

  function choose(nextFiles) {
    const incoming = Array.from(nextFiles || []);
    if (!incoming.length) return;

    const accepted = [];
    const rejected = [];

    for (const file of incoming) {
      const validation = validateIXITransactFile(file, {
        maxBytes: MAX_PHOTO_BYTES,
        allowedMimeTypes: PHOTO_MIME_TYPES,
        allowedExtensions: [".jpg", ".jpeg", ".png", ".webp"]
      });

      if (!validation.valid) {
        rejected.push(`${file.name}: ${validation.message}`);
        continue;
      }

      const previewUrl = URL.createObjectURL(file);
      objectUrlsRef.current.add(previewUrl);
      accepted.push({ file, previewUrl });
    }

    if (accepted.length) {
      setFiles(current => [...current, ...accepted]);
      setErrors(current => {
        const next = { ...current };
        delete next.media;
        delete next.mediaFile;
        return next;
      });
    }

    setFileError(rejected.join(" "));
  }

  function remove(index) {
    setFiles(current => {
      const target = current[index];
      if (target?.previewUrl) {
        try {
          URL.revokeObjectURL(target.previewUrl);
        } catch {
          // Ignore browser cleanup errors.
        }
        objectUrlsRef.current.delete(target.previewUrl);
      }

      return current.filter((_, itemIndex) => itemIndex !== index);
    });
  }

  async function save() {
    if (saving) return;

    const next = createIXIPhotoDraft({
      context,
      workOrder,
      input
    });
    const validation = validateIXIPhoto(next);

    setErrors(validation.errors);
    setSaveError("");

    if (!validation.valid || fileError) return;

    setSaving(true);

    try {
      await onSave?.(
        {
          ...next,
          status: "posted"
        },
        {
          ...input,
          files: files.map(entry => entry.file)
        },
        null
      );
    } catch (error) {
      setSaveError(clean(error?.message) || t.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  const dateValue = occurredAtLocal.slice(0, 10);
  const timeValue = occurredAtLocal.slice(11, 16);

  return (
    <div className="tx-photo">
      <div className="ph-lang">
        <button className={lang === "en" ? "on" : ""} onClick={() => { setLang("en"); onLanguageChange?.("en"); }} disabled={saving}>ENG</button>
        <i>/</i>
        <button className={lang === "es" ? "on" : ""} onClick={() => { setLang("es"); onLanguageChange?.("es"); }} disabled={saving}>ESP</button>
      </div>

      <div className="ph-head">
        <div className="ph-icon">▣</div>
        <div className="ph-title">
          <strong>{t.title}</strong>
          <div className="ph-context">
            <div><b>{primary.label || "—"}</b><small>{t.machine}</small></div>
            <div><b>{workOrderNumber}</b><small>{t.wo}</small></div>
            <div><b>{location.label || "—"}</b><small>{t.location}</small></div>
            <div><b>{actor.displayName || actor.name || actor.label || "—"}</b><small>{t.employee}</small></div>
          </div>
        </div>
      </div>

      <div className="ph-section">{t.details}</div>

      <label>{t.type} <em>*</em></label>
      <div className="ph-types">
        <button className={photoType === "work-photo" ? "on" : ""} onClick={() => setPhotoType("work-photo")} disabled={saving}>{t.work}</button>
        <button className={photoType === "damage" ? "on" : ""} onClick={() => setPhotoType("damage")} disabled={saving}>{t.damage}</button>
        <button className={photoType === "before-after" ? "on" : ""} onClick={() => setPhotoType("before-after")} disabled={saving}>{t.before}</button>
        <button className={photoType === "reference" ? "on" : ""} onClick={() => setPhotoType("reference")} disabled={saving}>{t.reference}</button>
      </div>

      <label>{t.titleLabel}</label>
      <div className="ph-field">
        <span>▤</span>
        <input value={title} onChange={event => setTitle(event.target.value)} maxLength={120} disabled={saving} />
      </div>

      <label>{t.description}</label>
      <textarea className="ph-notes" value={description} onChange={event => setDescription(event.target.value)} maxLength={500} disabled={saving} />

      <div className="ph-two">
        <div>
          <label>{t.date}</label>
          <div className={`ph-field locked ${errors.occurredAt ? "bad" : ""}`}>
            <input type="date" value={dateValue} onChange={event => setOccurredAtLocal(`${event.target.value}T${timeValue || "00:00"}`)} disabled={saving} />
          </div>
        </div>
        <div>
          <label>{t.time}</label>
          <div className={`ph-field locked ${errors.occurredAt ? "bad" : ""}`}>
            <input type="time" value={timeValue} onChange={event => setOccurredAtLocal(`${dateValue}T${event.target.value}`)} disabled={saving} />
          </div>
        </div>
      </div>

      <label>{t.link}</label>
      <div className="ph-field locked">
        <span>▤</span>
        <input readOnly value={workOrderNumber} />
      </div>

      <label>{t.photo} <em>*</em></label>
      <div className={`ph-upload ${errors.media || errors.mediaFile ? "bad" : ""}`}>
        {files.length ? (
          <div className="ph-previews">
            {files.map((entry, index) => (
              <div className="ph-preview" key={`${entry.file.name}-${entry.file.size}-${index}`}>
                <img src={entry.previewUrl} alt="" />
                <button type="button" onClick={() => remove(index)} disabled={saving}>×</button>
              </div>
            ))}
          </div>
        ) : null}

        <button className="ph-pick" type="button" onClick={() => inputRef.current?.click()} disabled={saving}>
          ▣ {t.take}
          <small>{t.takeSub}</small>
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          multiple
          disabled={saving}
          onChange={event => {
            choose(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      {fileError ? <div className="ph-errors">{fileError}</div> : null}

      <label>{t.tags}</label>
      <div className="ph-field">
        <span>◇</span>
        <input value={tags} onChange={event => setTags(event.target.value)} placeholder="hydraulic, leak, inspection" disabled={saving} />
      </div>

      <label>{t.visibility}</label>
      <div className="ph-policy"><span>◉</span><b>{t.team}</b></div>

      {Object.keys(errors).length ? <div className="ph-errors">{t.required}</div> : null}
      {saveError ? <div className="ph-errors">{saveError}</div> : null}

      <div className="ph-actions">
        <button type="button" onClick={() => onCancel?.()} disabled={saving}>{t.cancel}<small>{t.cancelSub}</small></button>
        <button type="button" className="save" onClick={save} disabled={saving}>{saving ? t.saving : t.save}<small>{t.saveSub}</small></button>
      </div>

      <div className="ph-foot">ⓘ {t.foot}</div>
      <IXIPhotoStyles />
    </div>
  );
}

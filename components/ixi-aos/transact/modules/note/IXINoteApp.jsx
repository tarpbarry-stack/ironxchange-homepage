import {
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import {
  createIXINoteDraft,
  validateIXINote
} from "./IXINoteContract";

import {
  createIXIPendingAttachment,
  validateIXITransactFile
} from "../../IXITransactFilePolicy";

import IXINoteStyles from "./IXINoteStyles";

const clean = value => String(value ?? "").trim();
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
const NOTE_ATTACHMENT_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf"
];

const COPY = {
  en: {
    title: "ADD NOTE",
    machine: "Machine",
    wo: "Work Order",
    location: "Location",
    employee: "Employee",
    details: "NOTE DETAILS",
    type: "NOTE TYPE",
    work: "WORK NOTE",
    issue: "ISSUE",
    recommendation: "RECOMMENDATION",
    noteTitle: "NOTE TITLE (OPTIONAL)",
    note: "NOTE",
    voice: "VOICE TO TEXT (OPTIONAL)",
    record: "TAP TO RECORD VOICE NOTE",
    recording: "LISTENING… TAP TO STOP",
    unsupported: "VOICE INPUT NOT AVAILABLE IN THIS BROWSER",
    date: "NOTE DATE",
    visibility: "VISIBLE TO",
    visibilityValue: "Work Order Team",
    attachment: "ATTACHMENT (OPTIONAL)",
    addFile: "ADD PHOTO / FILE",
    fileHelp: "JPG, PNG, PDF (Max 10MB)",
    tags: "ADDITIONAL TAGS (OPTIONAL)",
    tagPlaceholder: "Add tags (e.g. hydraulic, leak, inspection)",
    cancel: "CANCEL",
    cancelSub: "Discard changes",
    save: "SAVE NOTE",
    saving: "SAVING…",
    saveSub: "Return to Work Order",
    required: "The note text is required.",
    policy: "Visibility follows company / Work Order policy. Technicians do not need to choose it for every note.",
    foot: "This note will be related to the Work Order and surfaced in Activity.",
    closeout: "Issues and recommendations are flagged for Work Order closeout.",
    saveFailed: "The note could not be saved. Nothing was added. Try again."
  },
  es: {
    title: "AGREGAR NOTA",
    machine: "Máquina",
    wo: "Orden de Trabajo",
    location: "Ubicación",
    employee: "Empleado",
    details: "DETALLES DE LA NOTA",
    type: "TIPO DE NOTA",
    work: "NOTA DE TRABAJO",
    issue: "PROBLEMA",
    recommendation: "RECOMENDACIÓN",
    noteTitle: "TÍTULO DE NOTA (OPCIONAL)",
    note: "NOTA",
    voice: "VOZ A TEXTO (OPCIONAL)",
    record: "TOCA PARA GRABAR NOTA DE VOZ",
    recording: "ESCUCHANDO… TOCA PARA DETENER",
    unsupported: "ENTRADA DE VOZ NO DISPONIBLE EN ESTE NAVEGADOR",
    date: "FECHA DE NOTA",
    visibility: "VISIBLE PARA",
    visibilityValue: "Equipo de la Orden",
    attachment: "ARCHIVO ADJUNTO (OPCIONAL)",
    addFile: "AGREGAR FOTO / ARCHIVO",
    fileHelp: "JPG, PNG, PDF (Máx. 10MB)",
    tags: "ETIQUETAS ADICIONALES (OPCIONAL)",
    tagPlaceholder: "Agrega etiquetas (ej. hidráulico, fuga, inspección)",
    cancel: "CANCELAR",
    cancelSub: "Descartar cambios",
    save: "GUARDAR NOTA",
    saving: "GUARDANDO…",
    saveSub: "Regresar a la Orden",
    required: "El texto de la nota es obligatorio.",
    policy: "La visibilidad sigue la política de la empresa / Orden. El técnico no necesita elegirla en cada nota.",
    foot: "Esta nota se relacionará con la Orden y aparecerá en Actividad.",
    closeout: "Los problemas y recomendaciones se marcan para el cierre de la Orden.",
    saveFailed: "No se pudo guardar la nota. No se agregó nada. Intenta de nuevo."
  }
};

function createClientRequestId() {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.randomUUID) {
    return `NOTE-${globalThis.crypto.randomUUID()}`;
  }

  return `NOTE-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function IXINoteApp({
  context = {},
  workOrder = {},
  language = "en",
  onLanguageChange = null,
  onCancel = null,
  onSave = null
}) {
  const [lang, setLangLocal] = useState(language === "es" ? "es" : "en");
  const [type, setType] = useState("work-note");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [noteDate, setNoteDate] = useState(new Date().toISOString().slice(0, 10));
  const [attachment, setAttachment] = useState(null);
  const [tagsText, setTagsText] = useState("");
  const [errors, setErrors] = useState({});
  const [fileError, setFileError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [recording, setRecording] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("");
  const [saving, setSaving] = useState(false);

  const requestIdRef = useRef(createClientRequestId());
  const recognitionRef = useRef(null);
  const t = COPY[lang];
  const primary = context.primary || {};
  const location = context.location || {};
  const actor = context.actor || {};
  const workOrderNumber = clean(
    workOrder.identity?.number ||
      workOrder.workOrderNumber ||
      workOrder.number
  ) || "WORK ORDER";

  const tags = useMemo(
    () => [...new Set(tagsText.split(",").map(clean).filter(Boolean))],
    [tagsText]
  );

  const pendingAttachment = useMemo(
    () => attachment
      ? createIXIPendingAttachment(attachment, { type: "note-attachment" })
      : null,
    [attachment]
  );

  const input = useMemo(
    () => ({
      clientRequestId: requestIdRef.current,
      type,
      title,
      body,
      noteDate,
      visibility: "work-order-team",
      tags,
      voiceTranscript,
      attachment: pendingAttachment
    }),
    [
      type,
      title,
      body,
      noteDate,
      tags,
      voiceTranscript,
      pendingAttachment
    ]
  );

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop?.();
      } catch {
        // Browser recognition implementations can throw when already stopped.
      }
      recognitionRef.current = null;
    };
  }, []);

  function setLanguage(nextLanguage) {
    setLangLocal(nextLanguage);
    onLanguageChange?.(nextLanguage);
  }

  function stopRecognition() {
    try {
      recognitionRef.current?.stop?.();
    } catch {
      // Ignore already-stopped browser recognition instances.
    }
    recognitionRef.current = null;
    setRecording(false);
  }

  function toggleVoice() {
    if (recording) {
      stopRecognition();
      return;
    }

    if (typeof window === "undefined") return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceStatus(t.unsupported);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang === "es" ? "es-US" : "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = event => {
      let finalText = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        if (event.results[index].isFinal) {
          finalText += `${event.results[index][0].transcript} `;
        }
      }

      const transcript = clean(finalText);
      if (!transcript) return;

      setVoiceTranscript(current => clean(`${current} ${transcript}`));
      setBody(current => clean(`${current} ${transcript}`).slice(0, 1000));
    };

    recognition.onerror = () => {
      recognitionRef.current = null;
      setRecording(false);
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setRecording(false);
    };

    recognitionRef.current = recognition;
    setVoiceStatus("");
    setRecording(true);
    recognition.start();
  }

  function selectAttachment(file) {
    if (!file) {
      setAttachment(null);
      setFileError("");
      return;
    }

    const validation = validateIXITransactFile(file, {
      maxBytes: MAX_ATTACHMENT_BYTES,
      allowedMimeTypes: NOTE_ATTACHMENT_MIME_TYPES,
      allowedExtensions: [".jpg", ".jpeg", ".png", ".pdf"]
    });

    if (!validation.valid) {
      setAttachment(null);
      setFileError(validation.message);
      return;
    }

    setAttachment(file);
    setFileError("");
  }

  async function save() {
    if (saving) return;

    stopRecognition();

    const draft = createIXINoteDraft({
      context,
      workOrder,
      input
    });
    const validation = validateIXINote(draft);

    setErrors(validation.errors);
    setSaveError("");

    if (!validation.valid || fileError) return;

    const noteId =
      clean(draft.identity.noteId) ||
      clean(draft.identity.clientRequestId) ||
      `NOTE-${Date.now()}`;

    setSaving(true);

    try {
      await onSave?.(
        {
          ...draft,
          identity: {
            ...draft.identity,
            noteId
          },
          status: "posted"
        },
        input,
        null
      );
    } catch (error) {
      setSaveError(clean(error?.message) || t.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="tx-note">
      <div className="note-lang">
        <button className={lang === "en" ? "on" : ""} onClick={() => setLanguage("en")} disabled={saving}>ENG</button>
        <i>/</i>
        <button className={lang === "es" ? "on" : ""} onClick={() => setLanguage("es")} disabled={saving}>ESP</button>
      </div>

      <header className="note-head">
        <div className="note-head-icon">✎</div>
        <div className="note-head-copy">
          <strong>{t.title}</strong>
          <div className="note-context">
            <div><b>{primary.label || "—"}</b><small>{t.machine}</small></div>
            <div><b>{workOrderNumber}</b><small>{t.wo}</small></div>
            <div><b>{location.label || "—"}</b><small>{t.location}</small></div>
            <div><b>{actor.displayName || actor.name || actor.label || "—"}</b><small>{t.employee}</small></div>
          </div>
        </div>
      </header>

      <div className="note-section">{t.details}</div>

      <label>{t.type} <em>*</em></label>
      <div className="note-types">
        <button className={type === "work-note" ? "on" : ""} onClick={() => setType("work-note")} disabled={saving}>▣ {t.work}</button>
        <button className={type === "issue" ? "on" : ""} onClick={() => setType("issue")} disabled={saving}>△ {t.issue}</button>
        <button className={type === "recommendation" ? "on" : ""} onClick={() => setType("recommendation")} disabled={saving}>♢ {t.recommendation}</button>
      </div>

      <label>{t.noteTitle}</label>
      <div className="note-field">
        <span>▤</span>
        <input value={title} onChange={event => setTitle(event.target.value)} maxLength={120} disabled={saving} />
      </div>

      <label>{t.note} <em>*</em></label>
      <div className={`note-body ${errors.body ? "invalid" : ""}`}>
        <textarea value={body} onChange={event => setBody(event.target.value.slice(0, 1000))} disabled={saving} />
        <span className="note-count">{body.length} / 1000</span>
      </div>

      <label>{t.voice}</label>
      <div className="note-voice">
        <span>♩</span>
        <div>
          <b>{recording ? t.recording : t.record}</b>
          <small>{voiceStatus || (voiceTranscript ? voiceTranscript.slice(-90) : "")}</small>
        </div>
        <button className={recording ? "on" : ""} onClick={toggleVoice} disabled={saving}>{recording ? "STOP" : "MIC"}</button>
      </div>

      <div className="note-two">
        <div>
          <label>{t.date} <em>*</em></label>
          <div className={`note-field ${errors.noteDate ? "invalid" : ""}`}>
            <span>▦</span>
            <input type="date" value={noteDate} onChange={event => setNoteDate(event.target.value)} disabled={saving} />
          </div>
        </div>
        <div>
          <label>{t.visibility}</label>
          <div className="note-field">
            <span>◉</span>
            <input readOnly value={t.visibilityValue} />
          </div>
        </div>
      </div>

      <div className="note-policy">ⓘ {t.policy}</div>

      <label>{t.attachment}</label>
      <div className={`note-attach ${fileError ? "invalid" : ""}`}>
        <div className="note-preview">
          {attachment?.type?.startsWith("image/") ? "IMAGE READY" : attachment ? "FILE READY" : "NO FILE"}
        </div>
        <div className="note-file">
          <label>
            ▣ {t.addFile}
            <input
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              disabled={saving}
              onChange={event => {
                selectAttachment(event.target.files?.[0] || null);
                event.target.value = "";
              }}
            />
          </label>
          <small>{attachment ? attachment.name : t.fileHelp}</small>
        </div>
      </div>

      {fileError ? <div className="note-errors">{fileError}</div> : null}

      <label>{t.tags}</label>
      <div className="note-tags">
        <input value={tagsText} onChange={event => setTagsText(event.target.value)} placeholder={t.tagPlaceholder} disabled={saving} />
      </div>

      {Object.keys(errors).length ? <div className="note-errors">{t.required}</div> : null}
      {saveError ? <div className="note-errors">{saveError}</div> : null}
      {["issue", "recommendation"].includes(type) ? <div className="note-policy">★ {t.closeout}</div> : null}

      <div className="note-actions">
        <button onClick={() => onCancel?.()} disabled={saving}>{t.cancel}<small>{t.cancelSub}</small></button>
        <button className="save" onClick={save} disabled={saving}>{saving ? t.saving : t.save}<small>{t.saveSub}</small></button>
      </div>

      <div className="note-foot">ⓘ {t.foot}</div>
      <IXINoteStyles />
    </div>
  );
}

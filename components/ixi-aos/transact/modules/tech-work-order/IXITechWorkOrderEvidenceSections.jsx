import { CameraIcon, MicIcon } from "../../IXITransactIcons";

const clean = value => String(value ?? "").trim();

function getNotePreview(note = {}) {
  return clean(
    note?.note?.title ||
    note?.note?.body ||
    note?.title ||
    note?.body
  );
}

function getPhotoMedia(record = {}) {
  const photoRecords = Array.isArray(record?.photoProjection)
    ? record.photoProjection
    : [];

  return photoRecords.flatMap(photo =>
    Array.isArray(photo?.photo?.media) ? photo.photo.media : []
  );
}

export default function IXITechWorkOrderEvidenceSections({
  record = {},
  language = "en",
  onAddNote = null,
  onAddPhoto = null,
  onViewNotes = null,
  onViewPhotos = null
}) {
  const spanish = language === "es";
  const notes = Array.isArray(record?.noteProjection)
    ? record.noteProjection
    : [];
  const photoMedia = getPhotoMedia(record);
  const latestNote = notes.length ? getNotePreview(notes[notes.length - 1]) : "";

  return (
    <>
      <section className="wo-note-card techwo-evidence-card">
        <div className="head">
          <span>{spanish ? "NOTAS" : "NOTES"}</span>
          <button type="button" onClick={() => onViewNotes?.()}>
            {spanish ? "VER TODO" : "VIEW ALL"}
          </button>
        </div>

        <div className={`empty-note ${latestNote ? "has-note" : ""}`}>
          {latestNote || "—"}
        </div>

        <button className="wide" type="button" onClick={() => onAddNote?.()}>
          <MicIcon size={13} />
          {spanish ? "+ AGREGAR NOTA" : "+ ADD NOTE"}
        </button>
      </section>

      <section className="wo-photos-card techwo-evidence-card">
        <div className="head">
          <span>
            {spanish ? "FOTOS" : "PHOTOS"} ({photoMedia.length})
          </span>
          <button type="button" onClick={() => onViewPhotos?.()}>
            {spanish ? "VER TODO" : "VIEW ALL"}
          </button>
        </div>

        <div className="thumb-row">
          {photoMedia.slice(0, 3).map((item, index) => (
            <i
              key={item?.mediaId || `${item?.fileName || "photo"}-${index}`}
              title={clean(item?.fileName) || `Photo ${index + 1}`}
              style={item?.previewUrl ? {
                backgroundImage: `url(${item.previewUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center"
              } : undefined}
            />
          ))}

          {Array.from({
            length: Math.max(0, 3 - Math.min(photoMedia.length, 3))
          }).map((_, index) => (
            <i key={`empty-techwo-photo-${index}`} />
          ))}
        </div>

        <button className="wide" type="button" onClick={() => onAddPhoto?.()}>
          <CameraIcon size={13} />
          {spanish ? "+ AGREGAR FOTO" : "+ ADD PHOTO"}
        </button>
      </section>
    </>
  );
}

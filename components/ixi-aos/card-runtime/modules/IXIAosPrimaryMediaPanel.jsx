function clean(value) {
  return String(value || "").trim();
}

function getPrimaryImage(object = {}) {
  const media = Array.isArray(object?.media) ? object.media : [];
  const first = media.find(item => {
    if (typeof item === "string") return Boolean(clean(item));
    return Boolean(item?.url || item?.src || item?.imageUrl);
  });

  if (typeof first === "string") return first;

  return (
    first?.url ||
    first?.src ||
    first?.imageUrl ||
    object?.imageUrl ||
    object?.imageUrls?.[0] ||
    object?.images?.[0]?.url ||
    ""
  );
}

export default function IXIAosPrimaryMediaPanel({
  object = {},
  moduleDefinition = {},
  editing = false,
  onAddPhoto = null
}) {
  const height = Math.max(
    54,
    Math.min(220, Number(moduleDefinition?.config?.height || 108))
  );

  const imageUrl = getPrimaryImage(object);

  function handleFile(event) {
    const file = event?.target?.files?.[0];
    if (!file || !file.type?.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = () => {
      onAddPhoto?.({
        file,
        url: String(reader.result || ""),
        name: file.name,
        type: file.type,
        size: file.size
      });
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  return (
    <div className="ixi-aos-primary-media-panel" style={{ height }}>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={clean(object?.displayName || object?.name || object?.title) || "Object"}
          draggable={false}
        />
      ) : (
        <div className="no-media">NO MEDIA</div>
      )}

      {editing ? (
        <label
          className="media-add"
          title="Add photo"
          onPointerDown={event => event.stopPropagation()}
        >
          + PHOTO
          <input type="file" accept="image/*" onChange={handleFile} />
        </label>
      ) : null}

      <style jsx>{`
        .ixi-aos-primary-media-panel {
          position: relative;
          width: 100%;
          min-width: 0;
          margin-top: -10px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,.05);
          border-radius: 7px;
          background: var(--ixi-skin-media-surface, #080808);
        }

        img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }

        .no-media {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255,255,255,.13);
          font-size: 8px;
          font-weight: 950;
          letter-spacing: .08em;
        }

        .media-add {
          position: absolute;
          right: 7px;
          bottom: 7px;
          height: 22px;
          padding: 0 7px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255,196,0,.34);
          border-radius: 4px;
          background: rgba(7,7,7,.90);
          color: #ffc400;
          font-size: 7px;
          font-weight: 950;
          cursor: pointer;
          z-index: 4;
        }

        .media-add:hover {
          border-color: rgba(255,196,0,.72);
          background: rgba(255,196,0,.06);
        }

        .media-add input {
          position: absolute;
          width: 1px;
          height: 1px;
          opacity: 0;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}

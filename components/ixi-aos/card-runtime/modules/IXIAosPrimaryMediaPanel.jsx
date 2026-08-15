import { useEffect, useMemo, useState } from "react";

function clean(value) {
  return String(value || "").trim();
}

function getMediaUrls(object = {}) {
  const media = Array.isArray(object?.media) ? object.media : [];
  const mediaUrls = media
    .map(item => {
      if (typeof item === "string") return clean(item);
      return clean(item?.url || item?.src || item?.imageUrl);
    })
    .filter(Boolean);

  if (mediaUrls.length) return mediaUrls;

  const fallback = [
    object?.imageUrl,
    ...(Array.isArray(object?.imageUrls) ? object.imageUrls : []),
    ...(Array.isArray(object?.images)
      ? object.images.map(item =>
          typeof item === "string"
            ? item
            : item?.url || item?.src || item?.imageUrl
        )
      : [])
  ]
    .map(clean)
    .filter(Boolean);

  return [...new Set(fallback)];
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

  const images = useMemo(() => getMediaUrls(object), [object]);
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    setPhotoIndex(current =>
      images.length ? Math.min(current, images.length - 1) : 0
    );
  }, [images.length]);

  const imageUrl = images[photoIndex] || "";

  function changePhoto(event, direction) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    if (images.length < 2) return;

    setPhotoIndex(current =>
      (current + direction + images.length) % images.length
    );
  }

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
      setPhotoIndex(0);
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

      {images.length > 1 ? (
        <>
          <button
            type="button"
            className="card-photo-nav left"
            onPointerDown={event => event.stopPropagation()}
            onClick={event => changePhoto(event, -1)}
            aria-label="Previous photo"
          >
            ‹
          </button>

          <button
            type="button"
            className="card-photo-nav right"
            onPointerDown={event => event.stopPropagation()}
            onClick={event => changePhoto(event, 1)}
            aria-label="Next photo"
          >
            ›
          </button>

          <span className="photo-count">
            {photoIndex + 1}/{images.length}
          </span>
        </>
      ) : null}

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

        .card-photo-nav {
          position: absolute;
          top: 92%;
          transform: translateY(-50%);
          width: 22px;
          height: 92px;
          border: none;
          background: rgba(0,0,0,.06);
          color: rgba(255,255,255,.42);
          font-size: 28px;
          font-weight: 300;
          cursor: pointer;
          z-index: 5;
          opacity: 0;
          transition: opacity .18s ease, background .18s ease, color .18s ease;
        }

        .ixi-aos-primary-media-panel:hover .card-photo-nav {
          opacity: 1;
        }

        .card-photo-nav.left {
          left: 0;
          border-radius: 0 10px 10px 0;
        }

        .card-photo-nav.right {
          right: 0;
          border-radius: 10px 0 0 10px;
        }

        .card-photo-nav:hover {
          background: rgba(0,0,0,.14);
          color: rgba(255,255,255,.68);
        }

        .photo-count {
          position: absolute;
          top: 8px;
          right: 8px;
          z-index: 5;
          padding: 3px 6px;
          border-radius: 999px;
          background: rgba(0,0,0,.18);
          color: rgba(255,255,255,.44);
          backdrop-filter: blur(2px);
          font-size: 7px;
          font-weight: 850;
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
          z-index: 6;
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

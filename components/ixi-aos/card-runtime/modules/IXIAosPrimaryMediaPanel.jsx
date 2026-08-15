function clean(value) {
  return String(value || "").trim();
}


function getPrimaryImage(object = {}) {
  const media =
    Array.isArray(object?.media)
      ? object.media
      : [];

  const first =
    media.find(item => {
      if (typeof item === "string") {
        return Boolean(clean(item));
      }

      return Boolean(
        item?.url ||
        item?.src ||
        item?.imageUrl
      );
    });

  if (typeof first === "string") {
    return first;
  }

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
  moduleDefinition = {}
}) {
  const height =
    Math.max(
      54,
      Math.min(
        220,
        Number(
          moduleDefinition?.config?.height ||
          108
        )
      )
    );

  const imageUrl =
    getPrimaryImage(object);

  return (
    <div
      className="ixi-aos-primary-media-panel"
      style={{ height }}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={
            clean(
              object?.displayName ||
              object?.name ||
              object?.title
            ) || "Object"
          }
          draggable={false}
        />
      ) : (
        <div className="no-media">
          NO MEDIA
        </div>
      )}

      <style jsx>{`
        .ixi-aos-primary-media-panel {
          width: 100%;
          min-width: 0;
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
      `}</style>
    </div>
  );
}

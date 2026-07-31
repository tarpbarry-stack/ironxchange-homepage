import { useMemo, useState } from "react";

function clean(value) {
  return String(value || "").trim();
}

function formatMoney(value, currency = "USD") {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "—";
  }

  return amount.toLocaleString("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  });
}

function getObjectLabel(object = {}) {
  return (
    clean(object.customerCategory) ||
    clean(object.objectType) ||
    "OBJECT"
  ).toUpperCase();
}

function getPrimaryImage(object = {}) {
  const media = Array.isArray(object.media)
    ? object.media
    : [];

  const firstImage = media.find(item => {
    if (typeof item === "string") {
      return Boolean(item);
    }

    return (
      item?.type === "image" ||
      item?.url ||
      item?.src
    );
  });

  if (typeof firstImage === "string") {
    return firstImage;
  }

  return (
    firstImage?.url ||
    firstImage?.src ||
    ""
  );
}

export default function IXIMosObjectCard({
  object = {},
  projection = null,
  dragHandleProps = null,
  onOpen = null,
  onAddMedia = null,
  onCreateWorkOrder = null,
  onAddExpense = null,
  onScanQr = null
}) {
  const [face, setFace] = useState(1);

  const imageUrl = useMemo(
    () => getPrimaryImage(object),
    [object]
  );

  const isContainer =
    Boolean(
      object?.capabilities?.canContain
    );

  const objectCount =
    Number(
      projection?.descendantObjectCount
    ) || 0;

  const containerCount =
    Number(
      projection?.descendantContainerCount
    ) || 0;

  const branchValue =
    projection?.branchValue ??
    object?.value ??
    null;

  const effectiveLocation =
    clean(
      object?.fields?.effectiveLocation
    ) ||
    clean(
      object?.fields?.location
    ) ||
    "";

  const factualTitle =
    clean(object.factualTitle);

  const customerAssetId =
    clean(object.customerAssetId);

  function stop(event) {
    event.preventDefault();
    event.stopPropagation();
  }

  function cycleFace(event) {
    stop(event);

    setFace(current =>
      current >= 3
        ? 1
        : current + 1
    );
  }

  function openObject(event) {
    stop(event);
    onOpen?.(object);
  }

  return (
    <article
      className={`mos-object-card ${
        isContainer
          ? "mos-container-card"
          : ""
      }`}
      data-mos-object-id={object.objectId}
    >
      {face === 1 ? (
        <>
          <div
            className="mos-photo"
            onClick={openObject}
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={
                  object.displayName ||
                  "IXI Object"
                }
                draggable={false}
              />
            ) : (
              <div className="mos-photo-empty">
                <span>
                  {getObjectLabel(object)}
                </span>
              </div>
            )}

            <div className="mos-type-pill">
              {getObjectLabel(object)}
            </div>

            {isContainer ? (
              <div className="mos-container-pill">
                CONTAINER
              </div>
            ) : null}
          </div>

          <div
            className="mos-body"
            {...(dragHandleProps || {})}
          >
            <div className="mos-name-row">
              <h3>
                {object.displayName ||
                  "Unnamed Object"}
              </h3>

              <span className="mos-status">
                {clean(object.status) ||
                  "active"}
              </span>
            </div>

            {factualTitle ? (
              <div className="mos-factual-title">
                {factualTitle}
              </div>
            ) : null}

            <div className="mos-identity-row">
              {customerAssetId ? (
                <span>
                  ASSET {customerAssetId}
                </span>
              ) : null}

              <span>
                {clean(object.objectType)
                  .replace(/-/g, " ")
                  .toUpperCase()}
              </span>
            </div>

            <div className="mos-operating-row">
              <strong>
                {formatMoney(
                  branchValue,
                  object.currency || "USD"
                )}
              </strong>

              <span>
                {effectiveLocation ||
                  "NO LOCATION"}
              </span>
            </div>

            {isContainer ? (
              <div className="mos-count-row">
                <span>
                  {objectCount} OBJECTS
                </span>

                <span>
                  {containerCount} CONTAINERS
                </span>
              </div>
            ) : null}
          </div>
        </>
      ) : null}

      {face === 2 ? (
        <div className="mos-face mos-detail-face">
          <div className="mos-face-header">
            <span>OBJECT DETAILS</span>
            <strong>
              {object.displayName}
            </strong>
          </div>

          <dl>
            <div>
              <dt>Object ID</dt>
              <dd>{object.objectId}</dd>
            </div>

            <div>
              <dt>Entity ID</dt>
              <dd>{object.entityId}</dd>
            </div>

            <div>
              <dt>Category</dt>
              <dd>
                {object.customerCategory ||
                  "—"}
              </dd>
            </div>

            <div>
              <dt>Asset ID</dt>
              <dd>
                {object.customerAssetId ||
                  "—"}
              </dd>
            </div>

            <div>
              <dt>Direct Container</dt>
              <dd>
                {object.directContainerId ||
                  "ROOT"}
              </dd>
            </div>
          </dl>
        </div>
      ) : null}

      {face === 3 ? (
        <div className="mos-face mos-action-face">
          <div className="mos-face-header">
            <span>OBJECT ACTIONS</span>
            <strong>
              {object.displayName}
            </strong>
          </div>

          <button
            type="button"
            onClick={event => {
              stop(event);
              onAddMedia?.(object);
            }}
          >
            ADD PHOTO / DOCUMENT
          </button>

          <button
            type="button"
            onClick={event => {
              stop(event);
              onCreateWorkOrder?.(object);
            }}
          >
            CREATE WORK ORDER
          </button>

          <button
            type="button"
            onClick={event => {
              stop(event);
              onAddExpense?.(object);
            }}
          >
            ADD EXPENSE
          </button>

          <button
            type="button"
            onClick={event => {
              stop(event);
              onScanQr?.(object);
            }}
          >
            OPEN QR
          </button>
        </div>
      ) : null}

      <footer className="mos-card-rail">
        <button
          type="button"
          onClick={cycleFace}
          aria-label="Cycle object face"
        />

        <button
          type="button"
          onClick={openObject}
          aria-label="Open object"
        />

        <span>
          FACE {face}
        </span>
      </footer>

      <style jsx>{`
        .mos-object-card {
          width: 300px;
          height: 430px;

          position: relative;
          overflow: hidden;

          border: 1px solid rgba(255,255,255,.07);
          border-radius: 13px;

          background:
            linear-gradient(
              180deg,
              rgba(255,255,255,.028),
              rgba(255,255,255,0)
            ),
            #141414;

          color: #d6d6d6;

          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.04),
            0 18px 44px rgba(0,0,0,.24);
        }

        .mos-container-card {
          border-color:
            rgba(255,196,0,.16);
        }

        .mos-photo {
          height: 220px;
          position: relative;
          overflow: hidden;
          cursor: pointer;

          border-bottom:
            1px solid rgba(255,255,255,.06);

          background:
            radial-gradient(
              circle at center,
              rgba(255,255,255,.04),
              transparent 60%
            ),
            #090909;
        }

        .mos-photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .mos-photo-empty {
          width: 100%;
          height: 100%;

          display: flex;
          align-items: center;
          justify-content: center;

          background:
            linear-gradient(
              135deg,
              rgba(255,196,0,.04),
              transparent 45%
            ),
            #0d0d0d;
        }

        .mos-photo-empty span {
          color: rgba(255,255,255,.16);
          font-size: 20px;
          font-weight: 950;
          letter-spacing: 1px;
        }

        .mos-type-pill,
        .mos-container-pill {
          position: absolute;
          top: 10px;

          height: 23px;
          padding: 0 9px;

          display: flex;
          align-items: center;

          border-radius: 999px;

          font-size: 8px;
          font-weight: 950;
          letter-spacing: .5px;
        }

        .mos-type-pill {
          left: 10px;

          color: rgba(255,255,255,.72);
          background: rgba(0,0,0,.54);
          border:
            1px solid rgba(255,255,255,.14);
        }

        .mos-container-pill {
          right: 10px;

          color: #ffc400;
          background:
            rgba(255,196,0,.10);
          border:
            1px solid rgba(255,196,0,.34);
        }

        .mos-body {
          height: 170px;
          padding: 14px;

          cursor: grab;
        }

        .mos-name-row {
          display: flex;
          justify-content: space-between;
          gap: 10px;
        }

        .mos-name-row h3 {
          margin: 0;

          color: #f2f2f2;
          font-size: 16px;
          font-weight: 950;
          line-height: 1.08;
        }

        .mos-status {
          color: rgba(56,161,105,.86);
          font-size: 8px;
          font-weight: 950;
          text-transform: uppercase;
        }

        .mos-factual-title {
          margin-top: 7px;

          color: rgba(255,255,255,.54);
          font-size: 11px;
          font-weight: 800;
        }

        .mos-identity-row,
        .mos-count-row {
          display: flex;
          justify-content: space-between;
          gap: 8px;

          margin-top: 10px;

          color: rgba(255,255,255,.38);
          font-size: 8px;
          font-weight: 950;
          letter-spacing: .38px;
        }

        .mos-operating-row {
          display: flex;
          justify-content: space-between;
          align-items: center;

          margin-top: 18px;
          padding-top: 10px;

          border-top:
            1px solid rgba(255,255,255,.05);
        }

        .mos-operating-row strong {
          color: #f2f2f2;
          font-size: 16px;
          font-weight: 950;
        }

        .mos-operating-row span {
          color: rgba(255,255,255,.44);
          font-size: 9px;
          font-weight: 900;
          text-transform: uppercase;
        }

        .mos-face {
          height: 390px;
          padding: 18px;
        }

        .mos-face-header {
          margin-bottom: 18px;
        }

        .mos-face-header span {
          display: block;

          color: #ffc400;
          font-size: 8px;
          font-weight: 950;
          letter-spacing: .7px;
        }

        .mos-face-header strong {
          display: block;
          margin-top: 6px;

          color: #f2f2f2;
          font-size: 17px;
        }

        dl {
          margin: 0;
        }

        dl div {
          padding: 10px 0;

          border-bottom:
            1px solid rgba(255,255,255,.05);
        }

        dt {
          color: rgba(255,255,255,.30);
          font-size: 8px;
          font-weight: 950;
          text-transform: uppercase;
        }

        dd {
          margin: 4px 0 0;

          color: rgba(255,255,255,.72);
          font-size: 10px;
          overflow-wrap: anywhere;
        }

        .mos-action-face {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .mos-action-face button {
          height: 42px;

          border:
            1px solid rgba(255,255,255,.08);
          border-radius: 8px;

          background: #101010;
          color: rgba(255,255,255,.72);

          font-size: 9px;
          font-weight: 950;
          letter-spacing: .4px;

          cursor: pointer;
        }

        .mos-action-face button:hover {
          border-color:
            rgba(255,196,0,.42);
          color: #ffc400;
        }

        .mos-card-rail {
          height: 40px;

          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;

          display: flex;
          align-items: center;
          gap: 10px;

          padding: 0 12px;

          border-top:
            1px solid rgba(255,255,255,.05);

          background: #0d0d0d;
        }

        .mos-card-rail button {
          width: 34px;
          height: 5px;

          border: 0;
          border-radius: 3px;

          background:
            rgba(255,255,255,.18);

          cursor: pointer;
        }

        .mos-card-rail button:hover {
          background: #ffc400;
          box-shadow:
            0 0 8px rgba(255,196,0,.28);
        }

        .mos-card-rail span {
          margin-left: auto;

          color: rgba(255,255,255,.24);
          font-size: 7px;
          font-weight: 950;
          letter-spacing: .55px;
        }
      `}</style>
    </article>
  );
}

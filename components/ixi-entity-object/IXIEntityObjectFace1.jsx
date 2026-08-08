import IXIFaceFrame
  from "../ixi-face-studio/IXIFaceFrame";

function formatSnapshotValue(
  value,
  format = ""
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  if (format === "currency") {
    const amount = Number(value);

    if (!Number.isFinite(amount)) {
      return String(value);
    }

    return new Intl.NumberFormat(
      "en-US",
      {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0
      }
    ).format(amount);
  }

  if (format === "percent") {
    const amount = Number(value);

    if (!Number.isFinite(amount)) {
      return String(value);
    }

    return `${amount.toLocaleString(
      "en-US",
      {
        maximumFractionDigits: 1
      }
    )}%`;
  }

  if (typeof value === "number") {
    return value.toLocaleString();
  }

  return String(value);
}


export default function IXIEntityObjectFace1({
  entity = {},

  snapshotItems = [],

  faceSize = "tall",

  onAddSnapshot = null,

  onRemoveSnapshot = null,

  onSnapshotOpen = null
}) {
  const displayName =
    entity?.displayName ||
    entity?.name ||
    "IXI ENTITY";

  const officeLocation =
    entity?.officeLocation ||
    entity?.location ||
    "";

  const entityId =
    entity?.entityId ||
    entity?.id ||
    "";

  const logoUrl =
    entity?.logoUrl ||
    entity?.imageUrl ||
    "";

  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(word => word[0])
      .join("")
      .toUpperCase();

  const items =
    Array.isArray(snapshotItems)
      ? snapshotItems
      : [];

  return (
    <IXIFaceFrame
      size={faceSize}
      className="eof1"
    >
      <div className="entity-face">

        {/* =========================
            FIXED ENTITY IDENTITY
            ========================= */}

        <header className="entity-header">
          <div className="entity-logo">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt=""
              />
            ) : (
              <span>
                {initials || "IXI"}
              </span>
            )}
          </div>

          <div className="entity-identity">
            <div className="entity-type">
              ENTITY
            </div>

            <div className="entity-name">
              {displayName}
            </div>

            {officeLocation ? (
              <div className="entity-location">
                <i className="fa-solid fa-location-dot" />

                <span>
                  {officeLocation}
                </span>
              </div>
            ) : null}

            {entityId ? (
              <div className="entity-id">
                {entityId}
              </div>
            ) : null}
          </div>
        </header>


        {/* =========================
            FIXED SNAPSHOT HEADER
            ========================= */}

        <div className="snapshot-header">
          <span>
            SNAPSHOT
          </span>

          <button
            type="button"
            className="snapshot-add"
            aria-label="Add snapshot item"
            title="Add snapshot item"
            onClick={() => {
              if (
                typeof onAddSnapshot ===
                "function"
              ) {
                onAddSnapshot();
              }
            }}
          >
            <i className="fa-solid fa-plus" />
          </button>
        </div>


        {/* =========================
            SCROLLING SNAPSHOT BODY
            ========================= */}

        <div className="snapshot-scroll">
          {items.length ? (
            items.map(
              (
                item,
                index
              ) => {
                const key =
                  item?.id ||
                  item?.key ||
                  `${item?.label || "snapshot"}-${index}`;

                const label =
                  item?.label ||
                  item?.name ||
                  item?.key ||
                  "SNAPSHOT";

                const value =
                  formatSnapshotValue(
                    item?.value ??
                    item?.count,
                    item?.format
                  );

                const canOpen =
                  item?.clickable !== false &&
                  typeof onSnapshotOpen ===
                    "function";

                return (
                  <div
                    key={String(key)}
                    className="snapshot-row"
                  >
                    <button
                      type="button"
                      className="snapshot-main"
                      disabled={!canOpen}
                      onClick={() => {
                        if (canOpen) {
                          onSnapshotOpen(
                            item
                          );
                        }
                      }}
                    >
                      <span className="snapshot-label">
                        {label}
                      </span>

                      <strong className="snapshot-value">
                        {value}
                      </strong>
                    </button>

                    <button
                      type="button"
                      className="snapshot-remove"
                      aria-label={`Remove ${label} from snapshot`}
                      title="Remove from snapshot"
                      onClick={() => {
                        if (
                          typeof onRemoveSnapshot ===
                          "function"
                        ) {
                          onRemoveSnapshot(
                            item
                          );
                        }
                      }}
                    />
                  </div>
                );
              }
            )
          ) : (
            <button
              type="button"
              className="snapshot-empty"
              onClick={() => {
                if (
                  typeof onAddSnapshot ===
                  "function"
                ) {
                  onAddSnapshot();
                }
              }}
            >
              <i className="fa-solid fa-plus" />

              <span>
                ADD TO SNAPSHOT
              </span>
            </button>
          )}
        </div>


        {/* =========================
            SMALL FIXED OBJECT MARK
            ========================= */}

        <div className="entity-mark">
          <span>
            IXI AOS
          </span>

          <span>
            ENTITY
          </span>
        </div>
      </div>


      <style jsx>{`
        .entity-face,
        .entity-face * {
          box-sizing: border-box;
        }

        .entity-face {
          width: 100%;
          height: 100%;
          min-height: 0;

          display: flex;
          flex-direction: column;

          overflow: hidden;
        }


        /* =========================
           ENTITY IDENTITY
           ========================= */

        .entity-header {
          flex: 0 0 auto;

          min-height: 76px;

          display: grid;

          grid-template-columns:
            58px
            minmax(0, 1fr);

          gap: 10px;

          align-items: center;

          padding:
            3px
            1px
            10px;

          border-bottom:
            1px solid
            rgba(255,255,255,.06);
        }

        .entity-logo {
          width: 58px;
          height: 58px;

          display: grid;
          place-items: center;

          overflow: hidden;

          border:
            1px solid
            rgba(255,255,255,.08);

          border-radius: 7px;

          background:
            linear-gradient(
              180deg,
              rgba(255,255,255,.025),
              rgba(255,255,255,0)
            ),
            #101010;

          color:
            rgba(255,196,0,.72);

          font-size: 11px;
          font-weight: 950;

          letter-spacing: .08em;
        }

        .entity-logo img {
          width: 100%;
          height: 100%;

          display: block;

          object-fit: contain;
          object-position: center;
        }

        .entity-identity {
          min-width: 0;

          display: flex;
          flex-direction: column;

          align-items: flex-start;
        }

        .entity-type {
          margin-bottom: 5px;

          color:
            rgba(255,196,0,.62);

          font-size:
            var(--ixi-face-font-micro);

          font-weight: 950;

          letter-spacing: .12em;

          text-transform: uppercase;
        }

        .entity-name {
          width: 100%;

          overflow: hidden;

          color:
            rgba(255,255,255,.88);

          font-size: 12px;
          font-weight: 950;

          line-height: 1.08;

          letter-spacing: -.12px;

          text-transform: uppercase;

          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .entity-location {
          max-width: 100%;

          margin-top: 5px;

          display: flex;
          align-items: center;

          gap: 5px;

          color:
            rgba(255,255,255,.38);

          font-size: 7px;
          font-weight: 850;

          letter-spacing: .025em;

          text-transform: uppercase;
        }

        .entity-location i {
          color:
            rgba(255,196,0,.48);

          font-size: 6px;
        }

        .entity-location span {
          overflow: hidden;

          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .entity-id {
          max-width: 100%;

          margin-top: 4px;

          overflow: hidden;

          color:
            rgba(255,255,255,.18);

          font-size: 6px;
          font-weight: 900;

          letter-spacing: .055em;

          text-overflow: ellipsis;
          white-space: nowrap;

          text-transform: uppercase;
        }


        /* =========================
           SNAPSHOT HEADER
           ========================= */

        .snapshot-header {
          flex: 0 0 28px;

          height: 28px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          padding:
            0
            2px;

          border-bottom:
            1px solid
            rgba(255,255,255,.045);
        }

        .snapshot-header > span {
          color:
            rgba(255,255,255,.31);

          font-size: 6.5px;
          font-weight: 950;

          letter-spacing: .12em;

          text-transform: uppercase;
        }

        .snapshot-add {
          width: 18px;
          height: 18px;

          display: grid;
          place-items: center;

          padding: 0;

          border:
            1px solid
            rgba(255,255,255,.06);

          border-radius: 3px;

          background:
            rgba(255,255,255,.018);

          color:
            rgba(255,196,0,.64);

          font-size: 6px;

          cursor: pointer;
        }

        .snapshot-add:hover {
          border-color:
            rgba(255,196,0,.25);

          background:
            rgba(255,196,0,.06);

          color: #ffc400;
        }


        /* =========================
           SNAPSHOT SCROLLER
           ========================= */

        .snapshot-scroll {
          min-height: 0;

          flex: 1 1 auto;

          padding:
            6px
            1px
            5px;

          display: flex;
          flex-direction: column;

          gap: 3px;

          overflow-x: hidden;
          overflow-y: auto;

          scrollbar-width: thin;

          scrollbar-color:
            rgba(255,255,255,.10)
            transparent;
        }

        .snapshot-scroll::-webkit-scrollbar {
          width: 4px;
        }

        .snapshot-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .snapshot-scroll::-webkit-scrollbar-thumb {
          border-radius: 999px;

          background:
            rgba(255,255,255,.10);
        }

        .snapshot-scroll::-webkit-scrollbar-thumb:hover {
          background:
            rgba(255,196,0,.22);
        }


        /* =========================
           SNAPSHOT ROW
           ========================= */

        .snapshot-row {
          flex: 0 0 23px;

          height: 23px;

          display: grid;

          grid-template-columns:
            minmax(0, 1fr)
            8px;

          gap: 4px;

          align-items: center;
        }

        .snapshot-main {
          width: 100%;
          height: 23px;

          min-width: 0;

          display: grid;

          grid-template-columns:
            minmax(0, 1fr)
            auto;

          gap: 8px;

          align-items: center;

          padding:
            0
            7px;

          border:
            1px solid
            rgba(255,255,255,.04);

          border-radius: 4px;

          background:
            linear-gradient(
              180deg,
              rgba(255,255,255,.014),
              rgba(255,255,255,0)
            ),
            rgba(255,255,255,.01);

          color:
            rgba(255,255,255,.58);

          cursor: pointer;
        }

        .snapshot-main:disabled {
          cursor: default;
        }

        .snapshot-main:not(:disabled):hover {
          border-color:
            rgba(255,196,0,.17);

          background:
            rgba(255,196,0,.035);
        }

        .snapshot-label {
          min-width: 0;

          overflow: hidden;

          color:
            rgba(255,255,255,.48);

          font-size: 7px;
          font-weight: 900;

          letter-spacing: .035em;

          text-align: left;

          text-overflow: ellipsis;
          white-space: nowrap;

          text-transform: uppercase;
        }

        .snapshot-value {
          color:
            rgba(255,255,255,.78);

          font-size: 7.5px;
          font-weight: 950;

          line-height: 1;

          white-space: nowrap;
        }


        /* =========================
           REMOVE SQUARE
           ========================= */

        .snapshot-remove {
          width: 6px;
          height: 6px;

          justify-self: center;

          padding: 0;

          border: 0;
          border-radius: 1px;

          background:
            rgba(229,62,62,.34);

          cursor: pointer;

          box-shadow:
            0 0 0 1px
            rgba(229,62,62,.08);
        }

        .snapshot-remove:hover {
          background:
            rgba(229,62,62,.92);

          box-shadow:
            0 0 7px
            rgba(229,62,62,.28);
        }


        /* =========================
           EMPTY SNAPSHOT
           ========================= */

        .snapshot-empty {
          width: 100%;
          min-height: 48px;

          display: flex;
          align-items: center;
          justify-content: center;

          gap: 7px;

          border:
            1px dashed
            rgba(255,255,255,.055);

          border-radius: 5px;

          background: transparent;

          color:
            rgba(255,255,255,.20);

          font-size: 6.5px;
          font-weight: 950;

          letter-spacing: .08em;

          cursor: pointer;

          text-transform: uppercase;
        }

        .snapshot-empty i {
          color:
            rgba(255,196,0,.46);

          font-size: 6px;
        }

        .snapshot-empty:hover {
          border-color:
            rgba(255,196,0,.18);

          color:
            rgba(255,255,255,.46);
        }


        /* =========================
           OBJECT MARK
           ========================= */

        .entity-mark {
          flex: 0 0 20px;

          height: 20px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          padding:
            0
            2px;

          border-top:
            1px solid
            rgba(255,255,255,.035);

          color:
            rgba(255,255,255,.14);

          font-size:
            5.8px;
          font-weight: 950;

          letter-spacing: .12em;

          text-transform: uppercase;
        }

        .entity-mark span:last-child {
          color:
            rgba(255,196,0,.24);
        }


        /* =========================
           COMPACT
           ========================= */

        :global(.ixi-face-frame-compact)
          .entity-header {
          min-height: 68px;

          grid-template-columns:
            50px
            minmax(0, 1fr);
        }

        :global(.ixi-face-frame-compact)
          .entity-logo {
          width: 50px;
          height: 50px;
        }

        :global(.ixi-face-frame-compact)
          .entity-name {
          font-size: 11px;
        }

        :global(.ixi-face-frame-compact)
          .snapshot-row {
          flex-basis: 22px;
          height: 22px;
        }

        :global(.ixi-face-frame-compact)
          .snapshot-main {
          height: 22px;
        }
      `}</style>
    </IXIFaceFrame>
  );
}

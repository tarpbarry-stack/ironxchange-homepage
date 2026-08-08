import {
  useMemo,
  useRef,
  useState
} from "react";

import {
  getListingId
} from "../../lib/listingFormatters";

function clean(value) {
  return String(value || "").trim();
}

function getListingTitle(item = {}) {
  return (
    clean(item.title) ||
    clean(
      item.attributes?.title
    ) ||
    [
      item.year,
      item.make,
      item.model
    ]
      .filter(Boolean)
      .join(" ") ||
    "UNTITLED"
  );
}

function getListingImage(item = {}) {
  return (
    item.imageUrls?.[0] ||
    item.images?.[0]?.url ||
    item.images?.[0]
      ?.attributes
      ?.variants
      ?.default
      ?.url ||
    item.imageObjects?.[0]?.url ||
    ""
  );
}

function formatMoney(value) {
  const amount =
    Number(value);

  if (!Number.isFinite(amount)) {
    return "$0";
  }

  return amount.toLocaleString(
    "en-US",
    {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }
  );
}

export default function IXISystemIndexCard({
  index = {},
  dragHandleProps = null,

  onOpenConsole = null,
  onExposeMember = null,

  armed = false
}) {
  const memberRailRef =
    useRef(null);

  const [memberIndex, setMemberIndex] =
    useState(0);

  const members =
    useMemo(
      () =>
        Array.isArray(index.items)
          ? index.items
          : [],
      [index.items]
    );

  const activeMember =
    members[memberIndex] || null;

  function stop(event) {
    event.preventDefault();
    event.stopPropagation();
  }

  function moveMember(
    direction,
    event
  ) {
    stop(event);

    if (!members.length) {
      return;
    }

    setMemberIndex(current => {
      const next =
        current + direction;

      if (next < 0) {
        return (
          members.length - 1
        );
      }

      if (
        next >= members.length
      ) {
        return 0;
      }

      return next;
    });
  }

  function openConsole(event) {
    stop(event);

    onOpenConsole?.(index);
  }

  function exposeMember(event) {
    stop(event);

    if (!activeMember) {
      return;
    }

    onExposeMember?.(
      activeMember,
      index
    );
  }

  return (
    <article
      className={[
        "ixi-system-index-card",
        armed
          ? "destination-armed"
          : ""
      ]
        .filter(Boolean)
        .join(" ")}

      data-system-index-id={
        index.indexId || ""
      }
    >
      {/* ---------- HEADER ---------- */}

      <header
        className="index-header"
        {...(dragHandleProps || {})}
      >
        <div className="index-kicker">
          SYSTEM INDEX
        </div>

        <div className="index-title">
          {index.displayName ||
            index.label ||
            "INDEX"}
        </div>

        <div className="index-count">
          {members.length}
        </div>
      </header>

      {/* ---------- SNAPSHOT ---------- */}

      <section className="index-snapshot">
        <div>
          <span>OBJECTS</span>
          <strong>
            {members.length}
          </strong>
        </div>

        <div>
          <span>VALUE</span>
          <strong>
            {formatMoney(
              index.value
            )}
          </strong>
        </div>
      </section>

      {/* ---------- ACTIVE MEMBER ---------- */}

      <section className="member-stage">
        {activeMember ? (
          <>
            <div className="member-image">
              {getListingImage(
                activeMember
              ) ? (
                <img
                  src={getListingImage(
                    activeMember
                  )}
                  alt={
                    getListingTitle(
                      activeMember
                    )
                  }
                  draggable={false}
                />
              ) : (
                <div className="member-image-empty">
                  EQUIPMENT
                </div>
              )}
            </div>

            <div className="member-copy">
              <div className="member-position">
                {memberIndex + 1}
                {" / "}
                {members.length}
              </div>

              <div className="member-title">
                {getListingTitle(
                  activeMember
                )}
              </div>

              <button
                type="button"
                className="member-expose"
                onPointerDown={stop}
                onClick={exposeMember}
              >
                PULL TO BOARD
              </button>
            </div>
          </>
        ) : (
          <div className="member-empty">
            EMPTY
          </div>
        )}
      </section>

      {/* ---------- MEMBER STRIP ---------- */}

      <section
        ref={memberRailRef}
        className="member-strip"
      >
        {members.map(
          (member, indexNumber) => {
            const memberId =
              String(
                getListingId(member) ||
                indexNumber
              );

            const active =
              indexNumber ===
              memberIndex;

            return (
              <button
                key={memberId}
                type="button"
                className={[
                  "member-thumb",
                  active
                    ? "active"
                    : ""
                ]
                  .filter(Boolean)
                  .join(" ")}
                onPointerDown={
                  stop
                }
                onClick={event => {
                  stop(event);

                  setMemberIndex(
                    indexNumber
                  );
                }}
              >
                {getListingImage(
                  member
                ) ? (
                  <img
                    src={getListingImage(
                      member
                    )}
                    alt=""
                    draggable={
                      false
                    }
                  />
                ) : (
                  <span>
                    {indexNumber + 1}
                  </span>
                )}
              </button>
            );
          }
        )}
      </section>

      {/* ---------- STANDARD CARD RAIL ---------- */}

      <footer className="index-card-rail">
        <button
          type="button"
          className="rail-action"
          data-label="PREVIOUS"
          onPointerDown={stop}
          onClick={event =>
            moveMember(
              -1,
              event
            )
          }
        />

        <button
          type="button"
          className="rail-action rail-open"
          data-label="OPEN CONSOLE"
          onPointerDown={stop}
          onClick={openConsole}
        />

        <button
          type="button"
          className="rail-action"
          data-label="NEXT"
          onPointerDown={stop}
          onClick={event =>
            moveMember(
              1,
              event
            )
          }
        />

        <span className="rail-status">
          {members.length
            ? `${memberIndex + 1}/${members.length}`
            : "0/0"}
        </span>
      </footer>

      <style jsx>{`
        .ixi-system-index-card,
        .ixi-system-index-card * {
          box-sizing: border-box;
        }

        .ixi-system-index-card {
          position: relative;

          width: 298px;
          min-width: 298px;
          max-width: 298px;

          height: 470px;
          min-height: 470px;
          max-height: 470px;

          display: flex;
          flex-direction: column;

          overflow: hidden;

          border:
            1px solid
            rgba(255,255,255,.08);

          border-radius: 13px;

          background:
            radial-gradient(
              circle at top,
              rgba(255,196,0,.055),
              transparent 42%
            ),
            linear-gradient(
              180deg,
              rgba(255,255,255,.025),
              rgba(255,255,255,0)
            ),
            #141414;

          box-shadow:
            0 18px 40px
            rgba(0,0,0,.32);

          color: #f2f2f2;
        }

        .ixi-system-index-card
          .index-header {
          min-height: 82px;

          padding:
            12px 13px 10px;

          position: relative;

          cursor: grab;

          border-bottom:
            1px solid
            rgba(255,255,255,.055);
        }

        .index-kicker {
          color:
            rgba(255,196,0,.68);

          font-size: 7px;
          font-weight: 950;
          letter-spacing: .72px;
        }

        .index-title {
          margin-top: 7px;

          color: #f3f3f3;

          font-size: 24px;
          font-weight: 950;
          line-height: 1;
          letter-spacing: -.55px;

          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .index-count {
          position: absolute;

          right: 13px;
          top: 11px;

          color:
            rgba(255,255,255,.24);

          font-size: 10px;
          font-weight: 950;
        }

        .index-snapshot {
          height: 62px;

          padding: 9px 13px;

          display: grid;
          grid-template-columns:
            1fr 1fr;

          gap: 8px;

          border-bottom:
            1px solid
            rgba(255,255,255,.045);
        }

        .index-snapshot div {
          min-width: 0;

          padding: 7px 8px;

          border:
            1px solid
            rgba(255,255,255,.05);

          border-radius: 6px;

          background:
            rgba(255,255,255,.018);
        }

        .index-snapshot span {
          display: block;

          color:
            rgba(255,255,255,.28);

          font-size: 6.5px;
          font-weight: 950;
          letter-spacing: .55px;
        }

        .index-snapshot strong {
          display: block;

          margin-top: 4px;

          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;

          color:
            rgba(255,255,255,.78);

          font-size: 11px;
          font-weight: 950;
        }

        .member-stage {
          height: 216px;

          margin: 10px 11px 0;

          position: relative;

          overflow: hidden;

          border:
            1px solid
            rgba(255,255,255,.055);

          border-radius: 9px;

          background:
            rgba(8,8,8,.78);
        }

        .member-image {
          width: 100%;
          height: 138px;

          overflow: hidden;

          background: #0b0b0b;
        }

        .member-image img {
          width: 100%;
          height: 100%;

          display: block;

          object-fit: cover;
        }

        .member-image-empty {
          width: 100%;
          height: 100%;

          display: flex;
          align-items: center;
          justify-content: center;

          color:
            rgba(255,255,255,.12);

          font-size: 10px;
          font-weight: 950;
          letter-spacing: .8px;
        }

        .member-copy {
          height: 76px;

          padding: 8px 9px;

          position: relative;
        }

        .member-position {
          color:
            rgba(255,196,0,.50);

          font-size: 6.5px;
          font-weight: 950;
          letter-spacing: .5px;
        }

        .member-title {
          width: calc(100% - 78px);

          margin-top: 5px;

          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;

          color:
            rgba(255,255,255,.78);

          font-size: 9px;
          font-weight: 950;
        }

        .member-expose {
          position: absolute;

          right: 8px;
          bottom: 10px;

          height: 22px;

          padding: 0 8px;

          border:
            1px solid
            rgba(255,255,255,.08);

          border-radius: 4px;

          background:
            rgba(255,255,255,.025);

          color:
            rgba(255,255,255,.42);

          font-size: 6px;
          font-weight: 950;
          letter-spacing: .42px;

          cursor: pointer;
        }

        .member-expose:hover {
          border-color:
            rgba(255,196,0,.34);

          color: #ffc400;
        }

        .member-empty {
          height: 100%;

          display: flex;
          align-items: center;
          justify-content: center;

          color:
            rgba(255,255,255,.18);

          font-size: 9px;
          font-weight: 950;
          letter-spacing: .7px;
        }

        .member-strip {
          height: 48px;

          margin:
            8px 11px 0;

          padding:
            4px 2px;

          display: flex;
          align-items: center;

          gap: 5px;

          overflow-x: auto;
          overflow-y: hidden;

          scrollbar-width: none;
        }

        .member-strip::-webkit-scrollbar {
          display: none;
        }

        .member-thumb {
          width: 50px;
          min-width: 50px;
          height: 36px;

          padding: 0;

          overflow: hidden;

          border:
            1px solid
            rgba(255,255,255,.07);

          border-radius: 4px;

          background:
            rgba(255,255,255,.025);

          cursor: pointer;
        }

        .member-thumb.active {
          border-color:
            rgba(255,196,0,.58);

          box-shadow:
            0 0 8px
            rgba(255,196,0,.11);
        }

        .member-thumb img {
          width: 100%;
          height: 100%;

          display: block;
          object-fit: cover;
        }

        .member-thumb span {
          color:
            rgba(255,255,255,.28);

          font-size: 7px;
          font-weight: 950;
        }

        .index-card-rail {
          height: 19px;
          min-height: 19px;

          margin-top: auto;

          padding: 0 10px;

          display: flex;
          align-items: center;

          gap: 10px;

          border-top:
            1px solid
            rgba(255,255,255,.065);

          background: #0d0d0d;
        }

        .rail-action {
          position: relative;

          width: 32px;
          height: 4px;

          padding: 0;

          border: 0;
          border-radius: 2px;

          background:
            rgba(255,255,255,.16);

          cursor: pointer;
        }

        .rail-action:hover,
        .rail-open:hover {
          background: #ffc400;

          box-shadow:
            0 0 8px
            rgba(255,196,0,.26);
        }

        .rail-open {
          background:
            rgba(255,196,0,.32);
        }

        .rail-action:hover::after {
          content:
            attr(data-label);

          position: absolute;

          left: 50%;
          bottom: 11px;

          transform:
            translateX(-50%);

          white-space: nowrap;

          color:
            rgba(255,255,255,.72);

          font-size: 6px;
          font-weight: 950;
          letter-spacing: .48px;

          pointer-events: none;
        }

        .rail-status {
          margin-left: auto;

          color:
            rgba(255,255,255,.25);

          font-size: 6.5px;
          font-weight: 950;
          letter-spacing: .45px;
        }

        .destination-armed {
          border-color:
            rgba(0,194,255,.72);

          box-shadow:
            0 0 18px
            rgba(0,194,255,.18);
        }
      `}</style>
    </article>
  );
}

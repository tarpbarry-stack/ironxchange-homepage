import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import { getListingId } from "../lib/listingFormatters";

function getImage(machine = {}) {
  const image =
    machine.image ||
    machine.imageUrl ||
    machine.images?.[0] ||
    machine.images?.[0]?.url ||
    machine.publicData?.image ||
    machine.publicData?.imageUrl ||
    machine.publicData?.images?.[0] ||
    machine.attributes?.publicData?.image ||
    machine.attributes?.publicData?.imageUrl ||
    machine.attributes?.publicData?.images?.[0];

  return typeof image === "string" ? image : image?.url || "";
}

function getMachineImages(machine = {}) {
  const rawImages =
    machine.images ||
    machine.publicData?.images ||
    machine.attributes?.publicData?.images ||
    [];

  const images = rawImages
    .map(img => (typeof img === "string" ? img : img?.url))
    .filter(Boolean);

  const hero = getImage(machine);

  if (hero && !images.includes(hero)) return [hero, ...images];

  return images.length ? images : hero ? [hero] : [];
}

function getYear(machine = {}) {
  return machine.year || machine.publicData?.year || machine.attributes?.publicData?.year || "";
}

function getMake(machine = {}) {
  return machine.make || machine.publicData?.make || machine.attributes?.publicData?.make || "";
}

function getModel(machine = {}) {
  return machine.model || machine.publicData?.model || machine.attributes?.publicData?.model || "";
}

function getPrice(machine = {}) {
  return machine.price || machine.publicData?.price || machine.attributes?.publicData?.price || "";
}

function TheaterMiniCard({ machine, badge, active, selected, onClick, onDragStart, onDragOver, onDrop }) {
  const image = getImage(machine);

  return (
    <div
      className={`theater-mini-card ${active ? "active" : ""} ${selected ? "selected" : ""}`}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={onClick}
    >
      {badge && <div className="mini-screen-badge">{badge}</div>}

      <div className="mini-photo">
        {image ? <img src={image} alt="" /> : <span>NO PHOTO</span>}
      </div>

      <div className="mini-meta">
        <strong>
          {getYear(machine)} {getMake(machine)} {getModel(machine)}
        </strong>
        <span>{getPrice(machine) || "PRICE ON REQUEST"}</span>
      </div>
    </div>
  );
}

function FactStrip({ machine, side = "left", visible }) {
  if (!machine || !visible) return <div className={`fact-strip ${side} off`} />;

  return (
    <aside className={`fact-strip ${side}`}>
      <span>{getYear(machine) || "—"}</span>
      <span>{getMake(machine) || "—"}</span>
      <span>{getModel(machine) || "—"}</span>
      <strong>{getPrice(machine) || "—"}</strong>
    </aside>
  );
}

export default function IXITheater() {
  const [listings, setListings] = useState([]);
  const [entered, setEntered] = useState(false);

  const [viewCount, setViewCount] = useState(2);
  const [screenSlots, setScreenSlots] = useState([0, 1, 2, 3]);
  const [selectedSlot, setSelectedSlot] = useState(0);
  const [dragIndex, setDragIndex] = useState(null);

  const [slotPhotoIndexes, setSlotPhotoIndexes] = useState({});
  const [factsOn, setFactsOn] = useState(false);

  useEffect(() => {
    async function loadTheater() {
      try {
        const res = await fetch("/api/listings");
        const data = await res.json();

        if (!Array.isArray(data)) return;

        const active = data
          .filter(item => {
            const status =
              item.listingStatus ||
              item.publicData?.listingStatus ||
              item.attributes?.publicData?.listingStatus;

            return status !== "archived";
          })
          .slice(0, 8);

        setListings(active);
      } catch (err) {
        console.error("IXI Theater load failed", err);
      }
    }

    loadTheater();
  }, []);

  const screenMachines = useMemo(() => {
    return screenSlots
      .slice(0, viewCount)
      .map(slotIndex => listings[slotIndex])
      .filter(Boolean);
  }, [screenSlots, listings, viewCount]);

  function assignCardToSelectedSlot(index) {
    setScreenSlots(current => {
      const next = [...current];
      next[selectedSlot] = index;
      return next;
    });
  }

  function moveCard(from, to) {
    if (from === null || to === null || from === to) return;

    setListings(current => {
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });

    setScreenSlots(current =>
      current.map(slotIndex => {
        if (slotIndex === from) return to;
        if (from < to && slotIndex > from && slotIndex <= to) return slotIndex - 1;
        if (from > to && slotIndex >= to && slotIndex < from) return slotIndex + 1;
        return slotIndex;
      })
    );
  }

  function nextPhotoForMachine(machine) {
    const id = String(getListingId(machine));
    const images = getMachineImages(machine);

    setSlotPhotoIndexes(current => ({
      ...current,
      [id]: images.length ? ((current[id] || 0) + 1) % images.length : 0
    }));
  }

  function prevPhotoForMachine(machine) {
    const id = String(getListingId(machine));
    const images = getMachineImages(machine);

    setSlotPhotoIndexes(current => ({
      ...current,
      [id]: images.length ? ((current[id] || 0) - 1 + images.length) % images.length : 0
    }));
  }

  function renderScreen(machine, slotPosition) {
    const id = String(getListingId(machine));
    const images = getMachineImages(machine);
    const currentPhotoIndex = slotPhotoIndexes[id] || 0;
    const image = images[currentPhotoIndex] || getImage(machine);

    return (
      <div key={`${id}-${slotPosition}`} className="screen-slot">
        <button
          type="button"
          className="photo-hit-zone photo-hit-left"
          onClick={() => prevPhotoForMachine(machine)}
          aria-label="Previous photo"
        />

        <button
          type="button"
          className="photo-hit-zone photo-hit-right"
          onClick={() => nextPhotoForMachine(machine)}
          aria-label="Next photo"
        />

        {image ? <img src={image} alt="" /> : <div className="no-photo">NO PHOTO</div>}
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>IXI Theater | IronXchange</title>
      </Head>

      <Navbar />

      <main>
        {!entered && (
          <section className="theater-lobby">
            <div className="lobby-card">
              <span>IXI THEATER</span>
              <p>{listings.length || 8} machines loaded for inspection.</p>
              <button type="button" onClick={() => setEntered(true)}>
                ENTER THEATER
              </button>
            </div>
          </section>
        )}

        {entered && (
          <section className={`theater-room view-${viewCount}`}>
            <div className="theater-brand">ironxchange</div>

            <section className="theater-screen">
              {viewCount === 1 && (
                <div className="one-up-stage">
                  <FactStrip machine={screenMachines[0]} side="left" visible={factsOn} />
                  {screenMachines[0] && renderScreen(screenMachines[0], 0)}
                </div>
              )}

              {viewCount === 2 && (
                <div className="two-up-stage">
                  <FactStrip machine={screenMachines[0]} side="left" visible={factsOn} />
                  {screenMachines[0] && renderScreen(screenMachines[0], 0)}
                  {screenMachines[1] ? (
                    renderScreen(screenMachines[1], 1)
                  ) : (
                    <div className="screen-slot empty-slot">DROP MACHINE</div>
                  )}
                  <FactStrip machine={screenMachines[1]} side="right" visible={factsOn} />
                </div>
              )}

              {viewCount === 4 && (
                <div className="four-up-stage">
                  {[0, 1, 2, 3].map(position =>
                    screenMachines[position] ? (
                      renderScreen(screenMachines[position], position)
                    ) : (
                      <div key={`empty-${position}`} className="screen-slot empty-slot">
                        DROP MACHINE
                      </div>
                    )
                  )}
                </div>
              )}
            </section>

            <section className="theater-card-rail">
              <div className="theater-controls">
                <div className="theater-mode-dashes">
                  {[1, 2, 4].map(count => (
                    <button
                      key={count}
                      type="button"
                      className={viewCount === count ? "active" : ""}
                      onClick={() => {
                        setViewCount(count);
                        if (selectedSlot >= count) setSelectedSlot(0);
                      }}
                    >
                      {count}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className={`facts-dash ${factsOn ? "active" : ""}`}
                  onClick={() => setFactsOn(current => !current)}
                  aria-label="Toggle quick facts"
                />
              </div>

              <div className="screen-slot-loader">
                {[0, 1, 2, 3].map(slotIndex => (
                  <button
                    key={slotIndex}
                    type="button"
                    className={`${slotIndex < viewCount ? "active" : ""} ${
                      selectedSlot === slotIndex ? "selected" : ""
                    }`}
                    onClick={() => setSelectedSlot(slotIndex)}
                  >
                    {slotIndex + 1}
                  </button>
                ))}
              </div>

              <div className="loaded-cards">
                {listings.map((machine, index) => {
                  const slotBadge =
                    screenSlots.includes(index) ? screenSlots.indexOf(index) + 1 : "";

                  return (
                    <TheaterMiniCard
                      key={String(getListingId(machine))}
                      machine={machine}
                      badge={slotBadge}
                      active={Boolean(slotBadge)}
                      selected={screenSlots[selectedSlot] === index}
                      onDragStart={() => setDragIndex(index)}
                      onDragOver={e => e.preventDefault()}
                      onDrop={() => {
                        moveCard(dragIndex, index);
                        setDragIndex(null);
                      }}
                      onClick={() => assignCardToSelectedSlot(index)}
                    />
                  );
                })}
              </div>
            </section>
          </section>
        )}
      </main>

      <style jsx>{`
        :global(body) {
          margin: 0;
          background: #030303;
          color: #d8d8d8;
          font-family: Arial, sans-serif;
        }

        main {
          min-height: 84vh;
          padding: 0;
          background: #030303;
        }

        .theater-lobby {
          min-height: 78vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .lobby-card {
          width: min(520px, 92vw);
          padding: 46px 34px;
          text-align: center;
          border: 1px solid rgba(255,255,255,.045);
          border-radius: 18px;
          background:
            radial-gradient(circle at 50% 0%, rgba(255,255,255,.035), transparent 42%),
            rgba(6,6,6,.92);
          box-shadow: 0 30px 90px rgba(0,0,0,.55);
        }

        .lobby-card span {
          display: block;
          margin-bottom: 14px;
          color: rgba(190,190,190,.48);
          font-size: 9px;
          font-weight: 950;
          letter-spacing: 1.2px;
        }

        .lobby-card p {
          margin: 0 0 26px;
          color: rgba(255,255,255,.56);
          font-size: 13px;
          font-weight: 800;
          letter-spacing: .25px;
        }

        .lobby-card button {
          height: 34px;
          padding: 0 24px;
          border: 1px solid rgba(255,255,255,.10);
          border-radius: 999px;
          background: rgba(255,255,255,.035);
          color: rgba(235,235,235,.72);
          font-size: 9px;
          font-weight: 950;
          letter-spacing: .9px;
          cursor: pointer;
        }

        .theater-room {
          min-height: calc(100vh - 72px);
          padding: 14px 20px 20px;
          display: grid;
          grid-template-rows:
            18px
            clamp(300px, 44vh, 500px)
            auto;
          gap: 14px;
        }

        .theater-brand {
          color: rgba(180,180,180,.13);
          font-size: 15px;
          font-weight: 950;
          letter-spacing: -.45px;
          text-shadow: 0 0 18px rgba(180,180,180,.06);
        }

        .theater-screen {
          width: 100%;
          min-height: 0;
        }

        .one-up-stage,
        .two-up-stage,
        .four-up-stage {
          width: 100%;
          height: 100%;
          display: grid;
          gap: 10px;
        }

        .one-up-stage {
          grid-template-columns: 70px minmax(0, 1fr);
        }

        .two-up-stage {
          grid-template-columns: 64px minmax(0, 1fr) minmax(0, 1fr) 64px;
        }

        .four-up-stage {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          grid-template-rows: repeat(2, minmax(0, 1fr));
        }

        .screen-slot {
          min-width: 0;
          min-height: 0;
          position: relative;
          display: flex;
          align-items: stretch;
          justify-content: stretch;
          background: #050505;
          overflow: hidden;
        }

        .screen-slot img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
          object-position: center;
        }

        .empty-slot,
        .no-photo {
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255,255,255,.18);
          font-size: 10px;
          font-weight: 950;
          letter-spacing: 1px;
          background: #111;
        }

        .photo-hit-zone {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 24%;
          border: 0;
          background: transparent;
          z-index: 5;
          cursor: pointer;
        }

        .photo-hit-left {
          left: 0;
        }

        .photo-hit-right {
          right: 0;
        }

        .photo-hit-zone:hover {
          background: rgba(255,255,255,.025);
        }

        .fact-strip {
          min-width: 0;
          height: 100%;
          padding: 12px 7px;
          display: grid;
          align-content: center;
          gap: 10px;
          border: 1px solid rgba(255,255,255,.055);
          background: rgba(255,255,255,.018);
          color: rgba(235,235,235,.72);
          font-size: 9px;
          font-weight: 950;
          letter-spacing: .45px;
          text-transform: uppercase;
          overflow: hidden;
        }

        .fact-strip.right {
          text-align: right;
        }

        .fact-strip strong {
          color: rgba(255,255,255,.88);
          font-size: 10px;
        }

        .fact-strip.off {
          border-color: transparent;
          background: transparent;
        }

        .theater-card-rail {
          padding: 6px 0 18px;
          opacity: .22;
          transition: opacity .18s ease;
        }

        .theater-card-rail:hover {
          opacity: 1;
        }

        .theater-controls {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 14px;
          margin-bottom: 8px;
        }

        .theater-mode-dashes {
          display: flex;
          justify-content: center;
          gap: 8px;
        }

        .theater-mode-dashes button,
        .facts-dash {
          width: 28px;
          height: 8px;
          border: 0;
          border-radius: 2px;
          background: rgba(255,255,255,.18);
          color: transparent;
          cursor: pointer;
        }

        .theater-mode-dashes button.active,
        .facts-dash.active {
          background: rgba(180,180,180,.72);
          box-shadow: 0 0 12px rgba(255,255,255,.08);
        }

        .screen-slot-loader {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin: 0 0 8px;
        }

        .screen-slot-loader button {
          width: 22px;
          height: 18px;
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 999px;
          background: rgba(255,255,255,.025);
          color: rgba(255,255,255,.38);
          font-size: 8px;
          font-weight: 950;
          cursor: pointer;
        }

        .screen-slot-loader button.active {
          color: rgba(255,255,255,.62);
          border-color: rgba(255,255,255,.16);
        }

        .screen-slot-loader button.selected {
          color: rgba(235,235,235,.92);
          border-color: rgba(180,180,180,.42);
          background: rgba(255,255,255,.075);
          box-shadow: 0 0 12px rgba(255,255,255,.08);
        }

        .loaded-cards {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          overflow-x: auto;
          overflow-y: hidden;
          padding: 0 8px 16px;
          scrollbar-width: thin;
        }

        .theater-mini-card {
          flex: 0 0 210px;
          width: 210px;
          height: 142px;
          position: relative;
          display: grid;
          grid-template-rows: 92px 1fr;
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 10px;
          background: rgba(10,10,10,.88);
          overflow: hidden;
          opacity: .74;
          cursor: grab;
          transition:
            opacity .16s ease,
            transform .16s ease,
            border-color .16s ease,
            box-shadow .16s ease;
        }

        .theater-mini-card:hover,
        .theater-mini-card.active {
          opacity: 1;
          transform: translateY(-2px);
          border-color: rgba(180,180,180,.22);
          box-shadow: 0 0 18px rgba(255,255,255,.055);
        }

        .theater-mini-card.selected {
          border-color: rgba(255,255,255,.34);
        }

        .mini-screen-badge {
          position: absolute;
          top: 5px;
          left: 5px;
          z-index: 5;
          width: 17px;
          height: 17px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(180,180,180,.38);
          border-radius: 50%;
          background: rgba(0,0,0,.72);
          color: rgba(235,235,235,.88);
          font-size: 8px;
          font-weight: 950;
        }

        .mini-photo {
          min-width: 0;
          min-height: 0;
          background: #111;
          overflow: hidden;
        }

        .mini-photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .mini-photo span {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255,255,255,.22);
          font-size: 8px;
          font-weight: 950;
        }

        .mini-meta {
          min-width: 0;
          padding: 7px 8px;
          display: grid;
          gap: 3px;
          background: rgba(0,0,0,.62);
        }

        .mini-meta strong {
          color: rgba(245,245,245,.86);
          font-size: 10px;
          font-weight: 950;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .mini-meta span {
          color: rgba(255,255,255,.48);
          font-size: 9px;
          font-weight: 950;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        @media (max-width: 850px) {
          .theater-room {
            min-height: calc(100vh - 58px);
            padding: 10px 0 16px;
            grid-template-rows:
              14px
              clamp(360px, 58vh, 520px)
              auto;
            gap: 10px;
          }

          .theater-brand {
            padding-left: 12px;
            font-size: 12px;
          }

          .one-up-stage,
          .two-up-stage,
          .four-up-stage {
            grid-template-columns: 1fr;
            grid-template-rows: 1fr;
          }

          .fact-strip,
          .view-2 .screen-slot:not(:first-of-type),
          .view-4 .screen-slot:not(:first-of-type) {
            display: none;
          }

          .loaded-cards {
            padding: 0 10px 16px;
          }

          .theater-mini-card {
            flex-basis: 196px;
            width: 196px;
            height: 134px;
            grid-template-rows: 86px 1fr;
          }
        }
      `}</style>
    </>
  );
}

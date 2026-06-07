import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import ListingCard from "../components/ListingCard";
import { getListingId } from "../lib/listingFormatters";

import IXIEnvironmentRail from "../components/IXIEnvironmentRail";

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

export default function IXITheater() {
  const [listings, setListings] = useState([]);
  const [viewCount, setViewCount] = useState(2);
  const [entered, setEntered] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);

const [slotPhotoIndexes, setSlotPhotoIndexes] = useState({});
const [screenSlots, setScreenSlots] = useState([0, 1, 2, 3]);
const [selectedSlot, setSelectedSlot] = useState(0);
  
  useEffect(() => {
    async function loadTheater() {
      try {
        const res = await fetch("/api/listings");
        const data = await res.json();

        if (Array.isArray(data)) {
          setListings(
            data
              .filter(item => {
                const status =
                  item.listingStatus ||
                  item.publicData?.listingStatus ||
                  item.attributes?.publicData?.listingStatus;

                return status !== "archived";
              })
              .slice(0, 8)
          );
        }
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

  function moveCard(from, to) {
    if (from === null || to === null || from === to) return;

    setListings(current => {
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });

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

  if (hero && !images.includes(hero)) {
    return [hero, ...images];
  }

  return images.length ? images : hero ? [hero] : [];
}

function nextPhotoForMachine(machine) {
  const id = String(getListingId(machine));
  const images = getMachineImages(machine);

  setSlotPhotoIndexes(current => ({
    ...current,
    [id]: images.length
      ? ((current[id] || 0) + 1) % images.length
      : 0
  }));
}

function prevPhotoForMachine(machine) {
  const id = String(getListingId(machine));
  const images = getMachineImages(machine);

  setSlotPhotoIndexes(current => ({
    ...current,
    [id]: images.length
      ? ((current[id] || 0) - 1 + images.length) % images.length
      : 0
  }));
}
  
  return (
    <>
      <Head>
  <title>IXI Theater | IronXchange</title>

  <link
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
    rel="stylesheet"
  />
</Head>

      <Navbar />

      <main>
        {!entered && (
          <section className="theater-lobby">
            <div className="lobby-card">
              <span>IXI THEATER</span>

              <p>
                {listings.length || 8} machines loaded for inspection.
              </p>

              <button type="button" onClick={() => setEntered(true)}>
                ENTER THEATER
              </button>
            </div>
          </section>
        )}

        {entered && (
          <section className={`theater-room view-${viewCount}`}>
            <div className="theater-env-shell">
  <IXIEnvironmentRail
    activeEnvironment="IXI THEATER"
    hasAccount
    hasRelationship
    hasInventory
  />
</div>

            <section className="theater-screen">
             {screenMachines.map(machine => {
  const id = String(getListingId(machine));
const images = getMachineImages(machine);
const currentPhotoIndex = slotPhotoIndexes[id] || 0;
const image = images[currentPhotoIndex] || getImage(machine);

  return (
    <div key={getListingId(machine)} className="screen-slot">

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

{image ? (
  <img src={image} alt="" />
) : (
  <div className="no-photo">NO PHOTO</div>
)}
                  </div>
                );
              })}
            </section>

            <section className="theater-card-rail">
              <div className="theater-mode-dashes">
                {[1, 2, 4].map(count => (
                  <button
                    key={count}
                    type="button"
                    className={viewCount === count ? "active" : ""}
                    onClick={() => setViewCount(count)}
                  >
                    {count}
                  </button>
                ))}
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
      SCREEN {slotIndex + 1}
    </button>
  ))}
</div>
                
              <div className="loaded-cards">
                {listings.map((machine, index) => {
                  const id = String(getListingId(machine));

                  return (
                    <div
                      key={id}
                     className={`loaded-card ${
  screenSlots.includes(index) ? "on-screen" : ""
}`}
                      draggable
                      onDragStart={() => setDragIndex(index)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        moveCard(dragIndex, index);
                        setDragIndex(null);
                      }}
                   onClick={() => {
  setScreenSlots(current => {
    const next = [...current];
    next[selectedSlot] = index;
    return next;
  });
}}
                                       >
                     {screenSlots.includes(index) && (
  <div className="loaded-card-screen-label">
    {screenSlots.indexOf(index) + 1}
  </div>
)}

<div className="loaded-card-scale">
  <ListingCard
    listing={machine}
                        saved={false}
                        onToggleSaved={() => {}}
                        from="saved"
                        ixiState={{
                          color: "none",
                          outline: 1
                        }}
                        onIxiStateChange={() => {}}
                        onSendFront={() => {}}
                        onSendBack={() => {}}
                        isBoardDraggingCard={false}
                        isGhostTarget={false}
                        onBoardDragStart={() => {}}
  onBoardDragOver={() => {}}
  onBoardDragEnd={() => {}}
/>
</div>
</div>
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
  overflow-x: hidden;
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

  color: rgba(0,194,255,.92);

  font-size: 10px;
  font-weight: 950;
  letter-spacing: 1.35px;

  text-shadow:
    0 0 10px rgba(0,194,255,.22),
    0 0 22px rgba(0,194,255,.12);
}

        .lobby-card p {
          margin: 0 0 26px;

          color: rgba(225,225,225,.48);

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
          min-height: 84vh;
          position: relative;
          padding: 18px 20px 0;

          display: grid;
          grid-template-rows: 18px 1fr auto;
          gap: 12px;
        }

        .theater-brand {
          color: rgba(180,180,180,.13);

          font-size: 15px;
          font-weight: 950;
          letter-spacing: -.45px;

          text-shadow: 0 0 18px rgba(180,180,180,.06);
        }

        .theater-env-shell {
  width: 100%;
  height: 22px;

  opacity: 0;
  transition: opacity .18s ease;
}

.theater-env-shell:hover,
.theater-env-shell:focus-within {
  opacity: 1;
}

       .theater-screen {
  height: 54vh;

  display: grid;
  gap: 10px;

 margin: -12px auto 0;
}

        .view-1 .theater-screen {
          grid-template-columns: 1fr;
        }

        .view-2 .theater-screen {
          grid-template-columns: repeat(2, 1fr);
        }

        .view-4 .theater-screen {
          grid-template-columns: repeat(2, 1fr);
          grid-template-rows: repeat(2, minmax(0, 1fr));
        }

     .screen-slot {
  min-width: 0;
  min-height: 0;

  position: relative;

  display: flex;
  align-items: center;
  justify-content: center;

  background: #050505;
  overflow: hidden;
}

.screen-slot img {
  width: 100%;
  height: 100%;
  max-height: none;
  object-fit: cover;
  object-position: center;
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

        .view-4 .screen-slot img {
          max-height: 31vh;
        }

        .no-photo {
          width: 100%;
          height: 100%;
          min-height: 240px;

          display: flex;
          align-items: center;
          justify-content: center;

          color: rgba(255,255,255,.18);
          font-size: 10px;
          font-weight: 950;
          letter-spacing: 1px;

          background: #111;
        }

        .theater-card-rail {
  width: 100%;
  max-width: 100%;
  min-width: 0;

position: relative;

  padding: 0 0 10px;
margin-top: -55px;

  opacity: .12;
  transition: opacity .18s ease;

  overflow: hidden;
}

        .theater-card-rail:hover {
          opacity: 1;
        }

     .theater-mode-dashes {
  position: absolute;
  top: 64px;
  left: 50%;
  transform: translateX(-50%);

  display: flex;
  justify-content: center;
  gap: 8px;

  z-index: 20;
}

        .theater-mode-dashes button {
          width: 28px;
          height: 8px;

          border: 0;
          border-radius: 2px;

          background: rgba(255,255,255,.18);
          color: transparent;

          cursor: pointer;
        }

        .theater-mode-dashes button.active {
          background: rgba(180,180,180,.72);
          box-shadow: 0 0 12px rgba(255,255,255,.08);
        }

.screen-slot-loader {
  display: none;
  justify-content: center;
  gap: 8px;

  margin: 0 0 4px;
}

.screen-slot-loader button {
  height: 18px;
  padding: 0 10px;

  border: 1px solid rgba(255,255,255,.08);
  border-radius: 999px;

  background: rgba(255,255,255,.025);
  color: rgba(255,255,255,.38);

  font-size: 8px;
  font-weight: 950;
  letter-spacing: .65px;

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
  width: 100%;
  max-width: 100%;
  min-width: 0;

  display: flex;
  gap: 30px;

  margin-top: 93px;

  overflow-x: auto;
  overflow-y: hidden;

  padding: 0 4px 8px;


  scrollbar-width: thin;
}

    .loaded-card {
  flex: 0 0 165px;
  width: 165px;
  height: 255px;

  position: relative;

  opacity: .72;
  cursor: grab;

          cursor: grab;

          transition:
            opacity .16s ease,
            transform .16s ease,
            box-shadow .16s ease;
        }

.loaded-card-scale {
  width: 285px;

  transform: scale(.60);
  transform-origin: top left;
}

       .loaded-card-screen-label {
  position: absolute;
  top: 3px;
  left: 3px;

  width: 18px;
  height: 18px;

  display: flex;
  align-items: center;
  justify-content: center;

  z-index: 20;

  border: 1px solid rgba(180,180,180,.38);
  border-radius: 2;

  background: rgba(0,0,0,.72);
  color: rgba(235,235,235,.86);

  font-size: 8px;
  font-weight: 950;
  letter-spacing: 0;

  box-shadow: 0 0 10px rgba(255,255,255,.08);
}

        .loaded-card.on-screen {
  opacity: 1;
}

        .loaded-card:hover {
  opacity: 1;
}

    .loaded-cards {
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,.18) rgba(0,0,0,.72);
}

.loaded-cards::-webkit-scrollbar {
  height: 6px;
}

.loaded-cards::-webkit-scrollbar-track {
  background: rgba(0,0,0,.72);
  border-radius: 999px;
}

.loaded-cards::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,.16);
  border-radius: 999px;
}

.loaded-cards::-webkit-scrollbar-thumb:hover {
  background: rgba(255,255,255,.28);
}

        .theater-room,
.theater-screen {
  max-width: 100%;
  min-width: 0;
}
        @media (max-width: 850px) {
          .theater-room {
            min-height: 88vh;
            padding: 10px 0 0;
            grid-template-rows: 14px 1fr auto;
            gap: 8px;
          }

          .theater-brand {
            padding-left: 12px;
            font-size: 12px;
          }

          .view-1 .theater-screen,
          .view-2 .theater-screen,
          .view-4 .theater-screen {
            grid-template-columns: 1fr;
            grid-template-rows: none;
          }

          .screen-slot img {
            width: 100vw;
            max-height: 68vh;
          }

          .view-2 .screen-slot:not(:first-child),
          .view-4 .screen-slot:not(:first-child) {
            display: none;
          }

          .loaded-card {
            flex-basis: 220px;
            width: 220px;
            transform: scale(.78);
          }

          .loaded-card.on-screen {
            transform: scale(.84);
          }
        }
      `}</style>
    </>
  );
}

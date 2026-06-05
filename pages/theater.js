import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
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

function getTitle(machine = {}) {
  return (
    machine.title ||
    `${machine.year || machine.publicData?.year || ""} ${
      machine.make || machine.publicData?.make || ""
    } ${machine.model || machine.publicData?.model || ""}`
  ).trim();
}

export default function IXITheater() {
  const [listings, setListings] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewMode, setViewMode] = useState("single");
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    async function loadTheater() {
      try {
        const res = await fetch("/api/listings");
        const data = await res.json();

        if (Array.isArray(data)) {
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
        }
      } catch (err) {
        console.error("IXI Theater load failed", err);
      }
    }

    loadTheater();
  }, []);

  const activeMachine = listings[activeIndex] || {};
  const activeImage = getImage(activeMachine);

  const compareMachines = useMemo(() => {
    if (viewMode === "two") return listings.slice(activeIndex, activeIndex + 2);
    if (viewMode === "four") return listings.slice(activeIndex, activeIndex + 4);
    return [activeMachine];
  }, [viewMode, listings, activeIndex, activeMachine]);

  function nextMachine() {
    setActiveIndex(current =>
      listings.length ? (current + 1) % listings.length : 0
    );
  }

  function prevMachine() {
    setActiveIndex(current =>
      listings.length ? (current - 1 + listings.length) % listings.length : 0
    );
  }

  return (
    <>
      <Head>
        <title>IXI Theater | IronXchange</title>
      </Head>

      <Navbar />

      <main className={entered ? "lights-out" : ""}>
        {!entered && (
          <section className="theater-lobby">
            <div className="lobby-card">
              <span className="eyebrow">IXI THEATER</span>
              <h1>Current Showing</h1>

              <p>
                {listings.length
                  ? `${listings.length} machines loaded for inspection.`
                  : "Loading machines..."}
              </p>

              <button type="button" onClick={() => setEntered(true)}>
                ENTER THEATER
              </button>
            </div>
          </section>
        )}

        {entered && (
          <section className={`theater-room mode-${viewMode}`}>
            <div className="theater-top">
              <span>ironxchange</span>

              <div className="view-controls">
                <button onClick={() => setViewMode("single")}>1</button>
                <button onClick={() => setViewMode("two")}>2</button>
                <button onClick={() => setViewMode("four")}>4</button>
              </div>
            </div>

            {viewMode === "single" && (
              <div className="single-stage">
                {activeImage ? (
                  <img src={activeImage} alt={getTitle(activeMachine)} />
                ) : (
                  <div className="no-photo">NO PHOTO</div>
                )}
              </div>
            )}

            {viewMode !== "single" && (
              <div className="compare-stage">
                {compareMachines.map(machine => {
                  const id = getListingId(machine);
                  const image = getImage(machine);

                  return (
                    <div key={id} className="compare-panel">
                      {image ? (
                        <img src={image} alt={getTitle(machine)} />
                      ) : (
                        <div className="no-photo">NO PHOTO</div>
                      )}

                      <div className="compare-meta">
                        <strong>{getTitle(machine)}</strong>
                        <span>
                          {machine.hours || machine.publicData?.hours || "—"} hrs
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="theater-bottom">
              <button type="button" onClick={prevMachine}>
                PREV
              </button>

              <div className="machine-meta">
                <h2>{getTitle(activeMachine)}</h2>
                <p>
                  {activeMachine.year || activeMachine.publicData?.year || "—"} ·{" "}
                  {activeMachine.hours || activeMachine.publicData?.hours || "—"} HRS ·{" "}
                  {activeMachine.location || activeMachine.publicData?.location || "—"}
                </p>
                <span>
                  MACHINE {activeIndex + 1} OF {listings.length}
                </span>
              </div>

              <button type="button" onClick={nextMachine}>
                NEXT
              </button>
            </div>

            <div className="filmstrip">
              {listings.map((machine, index) => {
                const image = getImage(machine);

                return (
                  <button
                    key={getListingId(machine)}
                    className={index === activeIndex ? "active" : ""}
                    onClick={() => setActiveIndex(index)}
                  >
                    {image ? <img src={image} alt="" /> : <span />}
                  </button>
                );
              })}
            </div>
          </section>
        )}
      </main>

      <Footer />

      <style jsx>{`
        :global(body) {
          margin: 0;
          background: #050505;
          color: #d8d8d8;
          font-family: Arial, sans-serif;
        }

        main {
          min-height: 82vh;
          background:
            radial-gradient(circle at 50% 0%, rgba(255,255,255,.035), transparent 30%),
            #050505;
          padding: 24px 4% 48px;
        }

        .theater-lobby {
          min-height: 70vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .lobby-card {
          width: min(520px, 92vw);
          padding: 42px 34px;
          text-align: center;
          border: 1px solid rgba(255,255,255,.055);
          border-radius: 18px;
          background:
            linear-gradient(180deg, rgba(255,255,255,.035), rgba(255,255,255,0)),
            rgba(10,10,10,.88);
          box-shadow: 0 24px 70px rgba(0,0,0,.42);
        }

        .eyebrow {
          color: rgba(180,180,180,.62);
          font-size: 9px;
          font-weight: 950;
          letter-spacing: 1.2px;
        }

        .lobby-card h1 {
          margin: 14px 0 8px;
          color: rgba(245,245,245,.92);
          font-size: 34px;
          font-weight: 950;
          letter-spacing: -.8px;
        }

        .lobby-card p {
          margin: 0 0 24px;
          color: rgba(255,255,255,.42);
          font-size: 13px;
        }

        button {
          cursor: pointer;
        }

        .lobby-card button,
        .theater-bottom button,
        .view-controls button {
          border: 1px solid rgba(255,255,255,.10);
          background: rgba(255,255,255,.035);
          color: rgba(230,230,230,.72);
          font-size: 9px;
          font-weight: 950;
          letter-spacing: .8px;
        }

        .lobby-card button {
          height: 34px;
          padding: 0 22px;
          border-radius: 999px;
        }

        .theater-room {
          min-height: 76vh;
          display: grid;
          grid-template-rows: 28px 1fr auto 54px;
          gap: 14px;
        }

        .theater-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .theater-top span {
          color: rgba(190,190,190,.18);
          font-size: 16px;
          font-weight: 950;
          letter-spacing: -.5px;
          text-shadow: 0 0 18px rgba(180,180,180,.08);
        }

        .view-controls {
          display: flex;
          gap: 8px;
        }

        .view-controls button {
          width: 28px;
          height: 18px;
          border-radius: 999px;
        }

        .single-stage,
        .compare-stage {
          min-height: 0;
        }

        .single-stage {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .single-stage img {
          max-width: 100%;
          max-height: 62vh;
          object-fit: contain;
          border-radius: 10px;
          box-shadow: 0 28px 90px rgba(0,0,0,.54);
        }

        .compare-stage {
          display: grid;
          gap: 14px;
        }

        .mode-two .compare-stage {
          grid-template-columns: repeat(2, 1fr);
        }

        .mode-four .compare-stage {
          grid-template-columns: repeat(4, 1fr);
        }

        .compare-panel {
          min-width: 0;
          display: grid;
          grid-template-rows: 1fr auto;
          border: 1px solid rgba(255,255,255,.055);
          border-radius: 12px;
          overflow: hidden;
          background: rgba(255,255,255,.025);
        }

        .compare-panel img {
          width: 100%;
          height: 54vh;
          object-fit: cover;
        }

        .compare-meta {
          padding: 10px;
          display: grid;
          gap: 4px;
          background: rgba(0,0,0,.62);
        }

        .compare-meta strong {
          color: rgba(245,245,245,.82);
          font-size: 11px;
          font-weight: 950;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .compare-meta span {
          color: rgba(255,255,255,.42);
          font-size: 9px;
          font-weight: 900;
        }

        .no-photo {
          min-height: 48vh;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255,255,255,.22);
          font-size: 10px;
          font-weight: 950;
          letter-spacing: 1px;
          background: #111;
        }

        .theater-bottom {
          display: grid;
          grid-template-columns: 80px 1fr 80px;
          align-items: center;
          gap: 16px;
        }

        .theater-bottom button {
          height: 28px;
          border-radius: 999px;
        }

        .machine-meta {
          text-align: center;
        }

        .machine-meta h2 {
          margin: 0;
          color: rgba(245,245,245,.88);
          font-size: 18px;
          font-weight: 950;
        }

        .machine-meta p {
          margin: 5px 0 3px;
          color: rgba(255,255,255,.44);
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .4px;
        }

        .machine-meta span {
          color: rgba(255,255,255,.25);
          font-size: 8px;
          font-weight: 950;
          letter-spacing: .8px;
        }

        .filmstrip {
          display: flex;
          justify-content: center;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 4px;
        }

        .filmstrip button {
          flex: 0 0 62px;
          height: 42px;
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 7px;
          overflow: hidden;
          padding: 0;
          background: rgba(255,255,255,.035);
          opacity: .44;
        }

        .filmstrip button.active {
          opacity: 1;
          border-color: rgba(180,180,180,.52);
          box-shadow: 0 0 16px rgba(255,255,255,.08);
        }

        .filmstrip img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        @media (max-width: 850px) {
          main {
            padding: 10px 0 28px;
          }

          .theater-room {
            min-height: 86vh;
            grid-template-rows: 18px 1fr auto 46px;
            gap: 8px;
          }

          .theater-top {
            padding: 0 12px;
          }

          .theater-top span {
            font-size: 12px;
            opacity: .5;
          }

          .view-controls {
            display: none;
          }

          .single-stage img {
            width: 100vw;
            max-height: 68vh;
            border-radius: 0;
          }

          .compare-stage {
            grid-template-columns: 1fr !important;
            overflow-y: auto;
            padding: 0 10px;
          }

          .compare-panel img {
            height: 54vh;
          }

          .theater-bottom {
            grid-template-columns: 62px 1fr 62px;
            gap: 8px;
            padding: 0 10px;
          }

          .theater-bottom button {
            height: 25px;
            font-size: 8px;
          }

          .machine-meta h2 {
            font-size: 14px;
          }

          .machine-meta p {
            font-size: 9px;
          }

          .filmstrip {
            justify-content: flex-start;
            padding: 0 10px 4px;
          }

          .filmstrip button {
            flex-basis: 54px;
            height: 36px;
          }
        }
      `}</style>
    </>
  );
}

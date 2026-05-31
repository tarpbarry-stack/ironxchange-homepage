import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import ListingCard from "../components/ListingCard";
import { getListingId } from "../lib/listingFormatters";

const LARGE_TYPES = [
  "DOZERS",
  "EXCAVATORS",
  "WHEEL LOADERS",
  "MOTOR GRADERS",
  "SCRAPERS",
  "ARTICULATED TRUCKS",
  "OFF HIGHWAY TRUCKS"
];

function normalizeCategory(item = {}) {
  return String(item.type || item.category || "").trim().toUpperCase();
}

function splitRings(listings = []) {
  const large = [];
  const small = [];

  listings.forEach(item => {
    const category = normalizeCategory(item);

    if (LARGE_TYPES.includes(category)) {
      large.push(item);
    } else {
      small.push(item);
    }
  });

  return {
    ringOne: large.length ? large : listings,
    ringTwo: small.length ? small : listings
  };
}

function getSafeIndex(index, length) {
  if (!length) return 0;
  return ((index % length) + length) % length;
}

export default function IXITheater() {
  const [listings, setListings] = useState([]);
  const [ringOneIndex, setRingOneIndex] = useState(0);
  const [ringTwoIndex, setRingTwoIndex] = useState(0);

  const [ringOnePaused, setRingOnePaused] = useState(false);
  const [ringTwoPaused, setRingTwoPaused] = useState(false);

  const [speed, setSpeed] = useState(5000);
  const [ixiCardState, setIxiCardState] = useState({});

  useEffect(() => {
    fetch("/api/listings")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setListings(data);
        }
      })
      .catch(() => setListings([]));
  }, []);

  const { ringOne, ringTwo } = useMemo(
    () => splitRings(listings),
    [listings]
  );

  useEffect(() => {
    if (!ringOne.length || ringOnePaused) return;

    const timer = setInterval(() => {
      setRingOneIndex(current =>
        getSafeIndex(current + 1, ringOne.length)
      );
    }, speed);

    return () => clearInterval(timer);
  }, [ringOne.length, ringOnePaused, speed]);

  useEffect(() => {
    if (!ringTwo.length || ringTwoPaused) return;

    const timer = setInterval(() => {
      setRingTwoIndex(current =>
        getSafeIndex(current - 1, ringTwo.length)
      );
    }, speed);

    return () => clearInterval(timer);
  }, [ringTwo.length, ringTwoPaused, speed]);

  function updateIxiCardState(listingId, patch) {
    setIxiCardState(current => ({
      ...current,
      [String(listingId)]: {
        color: "none",
        outline: 1,
        ...(current[String(listingId)] || {}),
        ...patch
      }
    }));
  }

  function getCardState(item) {
    const id = String(getListingId(item));

    return (
      ixiCardState[id] || {
        color: "none",
        outline: 1
      }
    );
  }

  function renderTheaterCard(item, variant = "current") {
    if (!item) return null;

    const id = String(getListingId(item));

    return (
      <div className={`theater-card-frame ${variant}`}>
        <ListingCard
          key={`${variant}-${id}`}
          listing={item}
          from="theater"
          saved={false}
          showSave={true}
          ixiState={getCardState(item)}
          onIxiStateChange={updateIxiCardState}
        />
      </div>
    );
  }

  function renderRing({
    label,
    direction,
    machines,
    index,
    paused,
    setPaused
  }) {
    if (!machines.length) {
      return (
        <section className="theater-ring empty-ring">
          <h2>{label}</h2>
          <p>No machines loaded.</p>
        </section>
      );
    }

    const prev = machines[getSafeIndex(index - 1, machines.length)];
    const current = machines[getSafeIndex(index, machines.length)];
    const next = machines[getSafeIndex(index + 1, machines.length)];

    return (
      <section className={`theater-ring ${direction}`}>
        <div className="ring-head">
          <div>
            <span>{label}</span>
            <strong>{direction === "right" ? "MOVING RIGHT" : "MOVING LEFT"}</strong>
          </div>

          <div className="ring-controls">
            <button
              type="button"
              className={speed === 3000 ? "active" : ""}
              onClick={() => setSpeed(3000)}
              aria-label="Fast"
            >
              —
            </button>

            <button
              type="button"
              className={speed === 5000 ? "active" : ""}
              onClick={() => setSpeed(5000)}
              aria-label="Medium"
            >
              ––
            </button>

            <button
              type="button"
              className={speed === 7000 ? "active" : ""}
              onClick={() => setSpeed(7000)}
              aria-label="Slow"
            >
              –––
            </button>

            <button
              type="button"
              className={paused ? "pause active" : "pause"}
              onClick={() => setPaused(current => !current)}
            >
              {paused ? "PLAY" : "PAUSE"}
            </button>
          </div>
        </div>

        <div className="theater-stage">
          <div className="side-card played-card">
            <div className="side-label">JUST PLAYED</div>
            {renderTheaterCard(prev, "side played")}
          </div>

          <div className="main-card">
            {renderTheaterCard(current, "current")}
          </div>

          <div className="side-card next-card">
            <div className="side-label">NEXT</div>
            {renderTheaterCard(next, "side next")}
          </div>
        </div>
      </section>
    );
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

      <main className="theater-page">
        <section className="theater-hero">
          <div>
            <h1>IXI THEATER</h1>
            <p>Iron is always moving.</p>
          </div>

          <span>{listings.length} MACHINES LIVE</span>
        </section>

        {renderRing({
          label: "RING 1",
          direction: "right",
          machines: ringOne,
          index: ringOneIndex,
          paused: ringOnePaused,
          setPaused: setRingOnePaused
        })}

        {renderRing({
          label: "RING 2",
          direction: "left",
          machines: ringTwo,
          index: ringTwoIndex,
          paused: ringTwoPaused,
          setPaused: setRingTwoPaused
        })}
      </main>

      <style jsx>{`
        :global(body) {
          margin: 0;
          background: #070707;
          color: #d6d6d6;
          font-family: Arial, sans-serif;
          overflow-x: hidden;
        }

        .theater-page {
          min-height: 100vh;
          padding: 20px 4% 40px;
          background:
            radial-gradient(circle at 50% 0%, rgba(0,194,255,.055), transparent 34%),
            linear-gradient(180deg, rgba(255,255,255,.018), rgba(255,255,255,0)),
            #070707;
        }

        .theater-hero {
          max-width: 1240px;
          margin: 0 auto 16px;

          display: flex;
          align-items: flex-end;
          justify-content: space-between;

          padding: 12px 2px 16px;
          border-bottom: 1px solid rgba(255,255,255,.05);
        }

        .theater-hero h1 {
          margin: 0;
          color: rgba(255,255,255,.88);
          font-size: 18px;
          font-weight: 950;
          letter-spacing: .8px;
        }

        .theater-hero p {
          margin: 5px 0 0;
          color: rgba(0,194,255,.72);
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .65px;
          text-transform: uppercase;
        }

        .theater-hero span {
          color: rgba(255,255,255,.36);
          font-size: 9px;
          font-weight: 950;
          letter-spacing: .7px;
        }

        .theater-ring {
          max-width: 1240px;
          margin: 0 auto 22px;
          padding: 12px;

          border: 1px solid rgba(255,255,255,.055);
          border-radius: 18px;

          background:
            linear-gradient(180deg, rgba(255,255,255,.018), rgba(255,255,255,0)),
            rgba(10,10,10,.72);

          box-shadow:
            0 1px 0 rgba(255,255,255,.025) inset,
            0 22px 54px rgba(0,0,0,.28);
        }

        .ring-head {
          height: 30px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          margin-bottom: 10px;
        }

        .ring-head span {
          display: block;
          color: #FFC400;
          font-size: 9px;
          font-weight: 950;
          letter-spacing: .7px;
        }

        .ring-head strong {
          display: block;
          margin-top: 2px;
          color: rgba(255,255,255,.34);
          font-size: 7.5px;
          font-weight: 950;
          letter-spacing: .7px;
        }

        .ring-controls {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .ring-controls button {
          height: 20px;
          min-width: 24px;

          border: 1px solid rgba(255,255,255,.055);
          border-radius: 999px;

          background: rgba(255,255,255,.018);
          color: rgba(255,255,255,.32);

          font-size: 8px;
          font-weight: 950;
          cursor: pointer;
        }

        .ring-controls button:hover,
        .ring-controls button.active {
          color: rgba(0,194,255,.92);
          border-color: rgba(0,194,255,.32);
          box-shadow:
            0 0 0 1px rgba(0,194,255,.04),
            0 0 12px rgba(0,194,255,.10);
        }

        .ring-controls .pause {
          padding: 0 9px;
          min-width: 48px;
          color: rgba(255,196,0,.62);
        }

        .theater-stage {
           display: grid;
  grid-template-columns: 235px 330px 235px;
          justify-content: center;
          align-items: center;
          gap: 24px;

          min-height: 500px;
          overflow: hidden;
        }

       .theater-card-frame {
  width: 300px;
  min-width: 300px;
  max-width: 300px;

  flex: 0 0 300px;
  transform-origin: center;
}

.theater-card-frame :global(.card) {
  width: 300px;
  min-width: 300px;
  max-width: 300px;
}

        .theater-card-frame.current {
          transform: scale(1.08);
          filter: none;
          z-index: 5;
        }

        .theater-card-frame.side {
          transform: scale(.74);
          opacity: .62;
        }

        .played-card .theater-card-frame {
          filter: grayscale(.45) brightness(.64);
        }

        .next-card .theater-card-frame {
          filter: brightness(.82);
        }

        .side-card {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;

          min-height: 430px;
          overflow: hidden;

          border: 1px solid rgba(255,255,255,.035);
          border-radius: 15px;

          background:
            linear-gradient(180deg, rgba(255,255,255,.012), rgba(255,255,255,0)),
            rgba(0,0,0,.18);
        }

        .side-card::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            linear-gradient(90deg, rgba(0,0,0,.32), transparent, rgba(0,0,0,.32));
          z-index: 9;
        }

        .side-label {
          position: absolute;
          top: 10px;
          left: 12px;
          z-index: 12;

          color: rgba(255,255,255,.28);
          font-size: 7px;
          font-weight: 950;
          letter-spacing: .65px;
        }

        .main-card {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 500px;
        }

        .right .main-card {
          animation: slideRight .55s ease both;
        }

        .left .main-card {
          animation: slideLeft .55s ease both;
        }

        @keyframes slideRight {
          from {
            transform: translateX(-24px);
            opacity: .6;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slideLeft {
          from {
            transform: translateX(24px);
            opacity: .6;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .empty-ring {
          min-height: 180px;
          display: grid;
          place-items: center;
          text-align: center;
        }

        .empty-ring h2 {
          margin: 0;
          color: rgba(255,255,255,.72);
        }

        .empty-ring p {
          color: rgba(255,255,255,.36);
        }

        @media (max-width: 950px) {
          .theater-stage {
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .side-card {
            display: none;
          }

          .theater-card-frame.current {
            transform: scale(1);
          }
        }
      `}</style>
    </>
  );
}

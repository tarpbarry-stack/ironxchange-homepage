import { useState } from "react";
import Head from "next/head";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const RAIL_ITEMS = [
  { label: "IXI MKTPLACE", href: "/browse" },
  { label: "IXI WORKSPACE", href: "/saved", active: true },
  { label: "IXI THEATER", href: "/theater" },
  { label: "DASHBOARD", href: "/account" },
  { label: "INVENTORY", href: "/account/my-listings" },
  { label: "LAUNCH", href: "/launch" },
  { label: "POST FREE", href: "/post", postFree: true }
];

export default function IXILab() {
  const [railMode, setRailMode] = useState("off");

  function cycleRailMode() {
    setRailMode(current => {
      if (current === "off") return "dim";
      if (current === "dim") return "bright";
      return "off";
    });
  }

  return (
    <>
      <Head>
        <title>IXI Lab | IronXchange</title>
      </Head>

      <Navbar />

      <main>
        <section className="lab-shell">
          <section className={`ixi-page-indicator mode-${railMode}`}>
            {RAIL_ITEMS.map(item => (
              <a
                key={item.label}
                href={item.href}
                className={`ixi-page-indicator-link ${
                  item.active ? "active" : ""
                } ${item.postFree ? "post-free" : ""}`}
              >
                {item.label}
              </a>
            ))}

            <button
              type="button"
              className="ixi-indicator-power"
              onClick={cycleRailMode}
              aria-label="Toggle indicator lights"
              title={`Indicator mode: ${railMode}`}
            />
          </section>

          <section className="lab-panel">
            <p>Header replacement test.</p>
            <p>OFF = ghost indicators. DIM/BRIGHT = panel lights. POST FREE stays special.</p>
          </section>
        </section>
      </main>

      <Footer />

      <style jsx>{`
        :global(body) {
          margin: 0;
          background: #0b0b0b;
          color: #d6d6d6;
          font-family: Arial, sans-serif;
        }

        main {
          min-height: 72vh;
          padding: 14px 5% 58px;
          background:
            radial-gradient(circle at 50% 0%, rgba(255,196,0,.045), transparent 34%),
            linear-gradient(180deg, rgba(255,255,255,.012), rgba(255,255,255,0)),
            #0b0b0b;
        }

        .lab-shell {
          max-width: 1320px;
          margin: 0 auto;
        }

        .ixi-page-indicator {
          width: 100%;
          min-height: 22px;

          margin: 0 auto 22px;

          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;

          position: relative;
        }

        .ixi-page-indicator-link {
          color: rgba(255,255,255,.075);
          text-decoration: none;

          font-size: 9px;
          font-weight: 950;
          letter-spacing: .9px;
          text-transform: uppercase;

          white-space: nowrap;

          transition:
            color .14s ease,
            text-shadow .14s ease,
            opacity .14s ease;
        }

        .ixi-page-indicator-link:hover {
          color: rgba(0,194,255,.48);
          text-shadow: 0 0 8px rgba(0,194,255,.10);
        }

        .ixi-page-indicator-link.active {
          color: rgba(255,196,0,.42);
          text-shadow: 0 0 8px rgba(255,196,0,.08);
        }

        .ixi-page-indicator.mode-dim .ixi-page-indicator-link {
          color: rgba(255,255,255,.22);
        }

        .ixi-page-indicator.mode-dim .ixi-page-indicator-link.active {
          color: rgba(255,196,0,.62);
        }

        .ixi-page-indicator.mode-bright .ixi-page-indicator-link {
          color: rgba(0,194,255,.64);
          text-shadow: 0 0 8px rgba(0,194,255,.12);
        }

        .ixi-page-indicator.mode-bright .ixi-page-indicator-link.active {
          color: rgba(255,196,0,.86);
          text-shadow: 0 0 10px rgba(255,196,0,.20);
        }

        .ixi-page-indicator-link.post-free {
          color: rgba(255,196,0,.36);
        }

        .ixi-page-indicator.mode-dim .ixi-page-indicator-link.post-free {
          color: rgba(255,196,0,.54);
        }

        .ixi-page-indicator.mode-bright .ixi-page-indicator-link.post-free,
        .ixi-page-indicator-link.post-free:hover {
          color: rgba(255,196,0,.90);
          text-shadow: 0 0 10px rgba(255,196,0,.22);
        }

        .ixi-indicator-power {
          width: 24px;
          height: 5px;

          position: absolute;
          right: 0;
          bottom: -10px;

          border: 0;
          border-radius: 2px;

          background: rgba(255,196,0,.20);

          padding: 0;
          cursor: pointer;
        }

        .ixi-page-indicator.mode-dim .ixi-indicator-power,
        .ixi-page-indicator.mode-bright .ixi-indicator-power {
          background: rgba(255,196,0,.86);
          box-shadow: 0 0 10px rgba(255,196,0,.24);
        }

        .lab-panel {
          margin: 34px auto 0;
          padding: 28px;

          border: 1px solid rgba(255,255,255,.06);
          border-radius: 14px;

          background:
            linear-gradient(180deg, rgba(255,255,255,.018), rgba(255,255,255,0)),
            #111;

          box-shadow:
            0 14px 34px rgba(0,0,0,.18);
        }

        .lab-panel p {
          margin: 0 0 10px;
          color: rgba(255,255,255,.48);
          font-size: 12px;
          font-weight: 800;
        }

        .lab-panel p:last-child {
          margin-bottom: 0;
        }

        @media (max-width: 850px) {
          main {
            padding: 18px 4% 48px;
          }

          .ixi-page-indicator {
            overflow-x: auto;
            overflow-y: hidden;

            justify-content: flex-start;
            gap: 22px;

            padding-bottom: 6px;

            scrollbar-width: none;
            -ms-overflow-style: none;
          }

          .ixi-page-indicator::-webkit-scrollbar {
            display: none;
          }

          .ixi-indicator-power {
            position: sticky;
            right: 0;
            bottom: auto;
            flex: 0 0 24px;
          }
        }
      `}</style>
    </>
  );
}

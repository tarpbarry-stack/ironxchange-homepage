import { useState } from "react";
import Head from "next/head";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const RAIL_ITEMS = [
  { label: "DASHBOARD", href: "/account" },
  { label: "LISTINGS", href: "/account/my-listings" },
  { label: "MKTPLACE", href: "/browse" },
  { label: "WORKSPACE", href: "/saved", active: true },
  { label: "THEATER", href: "/theater" },
  { label: "LAUNCH", href: "/launch" }
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
        <title>IXI Rail Lab | IronXchange</title>
      </Head>

      <Navbar />

      <main>
        <section className="lab-shell">
          <section className="workspace-head">
            <div>
              <span className="eyebrow">IXI WORKSPACE</span>
              <h1>IXI Rail Lab</h1>
            </div>

            <div className="count-pill">
              7 / 7
            </div>
          </section>

          <section className={`ixi-top-rail mode-${railMode}`}>
            <button
              type="button"
              className="ixi-rail-power"
              onClick={cycleRailMode}
              aria-label="Toggle rail lights"
              title={`Rail mode: ${railMode}`}
            />

            {RAIL_ITEMS.map(item => (
              <a
                key={item.label}
                href={item.href}
                className={`ixi-rail-item ${item.active ? "active" : ""}`}
                aria-label={item.label}
              >
                <span>{item.label}</span>
              </a>
            ))}

            <a
              href="/post"
              className="ixi-post-free"
            >
              <span>POST FREE</span>
            </a>
          </section>

          <section className="lab-panel">
            <p>
              Click the yellow dash to cycle OFF → DIM → BRIGHT.
            </p>

            <p>
              OFF shows word-length dashes. DIM/BRIGHT reveals labels and removes the dash under each label.
            </p>
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
            radial-gradient(circle at 50% 0%, rgba(255,196,0,.05), transparent 34%),
            linear-gradient(180deg, rgba(255,255,255,.014), rgba(255,255,255,0)),
            #0b0b0b;
        }

        .lab-shell {
          max-width: 1320px;
          margin: 0 auto;
        }

        .workspace-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 18px;
          margin: 0 auto 14px;
        }

        .eyebrow {
          display: inline-block;
          margin-bottom: 8px;
          color: rgba(255,196,0,.72);
          font-size: 9px;
          font-weight: 950;
          letter-spacing: .9px;
        }

        h1 {
          margin: 0;
          color: #f2f2f2;
          font-size: 30px;
          font-weight: 950;
          letter-spacing: -.55px;
        }

        .count-pill {
          min-width: 112px;
          height: 30px;
          padding: 0 12px;

          display: flex;
          align-items: center;
          justify-content: center;

          border: 1px solid rgba(255,196,0,.14);
          border-radius: 999px;

          background:
            linear-gradient(180deg, rgba(255,196,0,.045), rgba(255,196,0,0)),
            rgba(10,10,10,.86);

          color: rgba(255,255,255,.52);

          font-size: 10px;
          font-weight: 950;
          letter-spacing: .45px;
        }

        .ixi-top-rail {
          width: 100%;
          min-height: 18px;

          display: flex;
          align-items: center;
          gap: 18px;

          margin: 0 auto 26px;

          opacity: 1;
        }

        .ixi-rail-power {
          width: 24px;
          height: 5px;

          border: 0;
          border-radius: 2px;

          background: rgba(255,196,0,.28);

          padding: 0;
          cursor: pointer;

          flex: 0 0 auto;
        }

        .ixi-top-rail.mode-dim .ixi-rail-power,
        .ixi-top-rail.mode-bright .ixi-rail-power {
          background: rgba(255,196,0,.88);
          box-shadow: 0 0 10px rgba(255,196,0,.24);
        }

        .ixi-rail-item,
        .ixi-post-free {
          height: 13px;

          display: inline-flex;
          align-items: flex-start;

          color: transparent;
          text-decoration: none;

          font-size: 7.5px;
          font-weight: 950;
          letter-spacing: .72px;
          text-transform: uppercase;

          white-space: nowrap;

          border-bottom: 5px solid rgba(255,255,255,.075);

          transition:
            color .14s ease,
            border-bottom-color .14s ease,
            text-shadow .14s ease,
            opacity .14s ease;
        }

        .ixi-rail-item span,
        .ixi-post-free span {
          line-height: 8px;
        }

        .ixi-top-rail.mode-off .ixi-rail-item,
        .ixi-top-rail.mode-off .ixi-post-free {
          color: transparent;
          border-bottom-color: rgba(255,255,255,.075);
        }

        .ixi-top-rail.mode-dim .ixi-rail-item,
        .ixi-top-rail.mode-dim .ixi-post-free {
          color: rgba(0,194,255,.34);
          border-bottom-color: transparent;
        }

        .ixi-top-rail.mode-bright .ixi-rail-item,
        .ixi-top-rail.mode-bright .ixi-post-free {
          color: rgba(0,194,255,.84);
          border-bottom-color: transparent;
          text-shadow: 0 0 8px rgba(0,194,255,.18);
        }

        .ixi-top-rail.mode-dim .ixi-rail-item.active {
          color: rgba(255,196,0,.52);
        }

        .ixi-top-rail.mode-bright .ixi-rail-item.active {
          color: rgba(255,196,0,.82);
          text-shadow: 0 0 8px rgba(255,196,0,.18);
        }

        .ixi-rail-item:hover,
        .ixi-post-free:hover {
          color: rgba(0,194,255,.95);
          border-bottom-color: transparent;
          text-shadow: 0 0 8px rgba(0,194,255,.22);
        }

        .ixi-post-free {
          margin-left: auto;
        }

        .ixi-top-rail.mode-off .ixi-post-free {
          color: rgba(255,255,255,.12);
          border-bottom-color: transparent;
        }

        .ixi-top-rail.mode-dim .ixi-post-free {
          color: rgba(255,196,0,.38);
        }

        .ixi-top-rail.mode-bright .ixi-post-free,
        .ixi-post-free:hover {
          color: rgba(255,196,0,.82);
          text-shadow: 0 0 8px rgba(255,196,0,.18);
        }

        .lab-panel {
          margin: 26px auto 0;
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

          .workspace-head {
            align-items: center;
          }

          h1 {
            font-size: 24px;
          }

          .ixi-top-rail {
            gap: 12px;
            overflow-x: auto;
            overflow-y: hidden;
            padding-bottom: 4px;

            scrollbar-width: none;
            -ms-overflow-style: none;
          }

          .ixi-top-rail::-webkit-scrollbar {
            display: none;
          }

          .ixi-post-free {
            margin-left: 0;
          }
        }
      `}</style>
    </>
  );
}

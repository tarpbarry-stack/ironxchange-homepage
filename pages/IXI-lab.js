import { useState } from "react";
import Head from "next/head";

import IXSearchSurface from "../components/IXSearchSurface";
import IXIRelationshipControls from "../components/IXIRelationshipControls";
import IXIControlSurface from "../components/IXIControlSurface";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const RAIL_ITEMS = [
  {
    label: "IXI MARKETPLACE",
    href: "/browse",
    access: "always"
  },
  {
    label: "AUCTION",
    href: "#",
    access: "always"
  },
  {
    label: "IXI WORKSPACE",
    href: "/saved",
    access: "relationship",
    active: true
  },
  {
    label: "IXI THEATER",
    href: "/theater",
    access: "relationship"
  },
  {
    label: "DASHBOARD",
    href: "/account",
    access: "account"
  },
  {
    label: "INVENTORY",
    href: "/account/my-listings",
    access: "seller"
  },
  {
    label: "LAUNCH",
    href: "/launch",
    access: "seller"
  },
  {
    label: "POST FREE",
    href: "/post",
    access: "always",
    postFree: true
  }
];
export default function IXILab() {
 const [railMode, setRailMode] = useState("ghost");

  const hasAccount = true;
const hasRelationship = true;
const hasInventory = false;

  function cycleRailMode() {
  setRailMode(current => {
    if (current === "ghost") return "discover";
    if (current === "discover") return "locked";
    return "ghost";
  });
}

  function canAccess(item) {
  if (item.access === "always") return true;

  if (item.access === "account") {
    return hasAccount;
  }

  if (item.access === "relationship") {
    return hasRelationship;
  }

  if (item.access === "seller") {
    return hasInventory;
  }

  return false;
}

  function isUnlockedEnvironment(item) {
  return (
    hasRelationship &&
    (
      item.label === "IXI WORKSPACE" ||
      item.label === "IXI THEATER"
    )
  );
}

function getRailItemState(item) {

  if (item.active) {
    return "active";
  }

  if (isUnlockedEnvironment(item)) {
    return "unlocked";
  }

  if (canAccess(item)) {
    return "available";
  }

  return "locked";
}

function getDashWidth(label) {
  const widths = {
    "IXI WORKSPACE": 78,
    "IXI THEATER": 68,
    "DASHBOARD": 58,
    "INVENTORY": 58,
    "LAUNCH": 42
  };

  return widths[label] || 60;
}

function renderRailLabel(item) {
  const available = canAccess(item);

  if (railMode === "ghost" && item.access !== "always") {
    return null;
  }

  if (!available) {
    return null;
  }

  return item.label;
}


const [searchQuery, setSearchQuery] = useState("");

const [filters, setFilters] = useState({
  yearMin: "",
  yearMax: "",
  priceMin: "",
  priceMax: "",
  hoursMin: "",
  hoursMax: ""
});

const [sortMode, setSortMode] = useState("custom");

const [ixiColorFilters, setIxiColorFilters] = useState([]);
const [ixiOutlineFilter, setIxiOutlineFilter] = useState("all");

const demoIxiCardState = {};

function toggleColorFilter(color) {
  setIxiColorFilters(current =>
    current.includes(color)
      ? current.filter(item => item !== color)
      : [...current, color]
  );
}

function toggleOutlineFilter(outline) {
  setIxiOutlineFilter(current =>
    String(current) === String(outline)
      ? "all"
      : String(outline)
  );
}  
  return (
    <>
      <Head>
        <title>IXI Lab | IronXchange</title>
      </Head>

      <Navbar />

      <main>
        <section className="lab-shell">
         <section
  className={`ixi-page-indicator mode-${railMode}`}
  onMouseEnter={() => {
  if (railMode === "ghost") {
    setTimeout(() => {
      setRailMode(current =>
        current === "ghost" ? "discover" : current
      );
    }, 120);
  }
}}
onMouseLeave={() => {
  if (railMode === "discover") {
    setTimeout(() => {
      setRailMode(current =>
        current === "discover" ? "ghost" : current
      );
    }, 220);
  }
}}
>
         {RAIL_ITEMS.map(item => (
<a
  key={item.label}
  href={item.href}
  className={`ixi-page-indicator-link state-${getRailItemState(item)} ${
    item.postFree ? "post-free" : ""
  }`}
>
    {renderRailLabel(item) ? (
  renderRailLabel(item)
) : (
  <span
    className="ixi-env-dash"
    style={{
      width: `${getDashWidth(item.label)}px`
    }}
  />
)}
  </a>
))}

          <button
  type="button"
  className={`ixi-power-switch ${
    railMode !== "ghost" ? "active" : ""
  }`}
  onClick={cycleRailMode}
  aria-label="Toggle environment rail"
  title="IXI Environment Rail"
/>
          </section>

     <IXIControlSurface>
  <IXSearchSurface
    searchQuery={searchQuery}
    setSearchQuery={setSearchQuery}
    filters={filters}
    setFilters={setFilters}
    sortMode={sortMode}
    setSortMode={setSortMode}
  />

  <IXIRelationshipControls
    ixiCardState={demoIxiCardState}
    activeColors={ixiColorFilters}
    onToggleColor={toggleColorFilter}
    activeOutline={ixiOutlineFilter}
    onToggleOutline={toggleOutlineFilter}
  />
</IXIControlSurface>
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

        .ixi-env-dash {
  display: block;

  height: 4px;

  border-radius: 2px;

  background: rgba(255,255,255,.10);
}
        .lab-shell {
          max-width: 1920px;
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
  color .28s ease,
  opacity .28s ease,
  text-shadow .28s ease,
  filter .28s ease;
        }

      .ixi-page-indicator-link:hover {
  color: rgba(255,255,255,.32);
  text-shadow: none;
}

.ixi-page-indicator-link.state-available {
  color: rgba(255,255,255,.20);
}

.ixi-page-indicator-link.state-unlocked {
  color: rgba(0,194,255,.62);
}

.ixi-page-indicator-link.state-active {
  color: rgba(255,196,0,.86);
}

.ixi-page-indicator-link.state-locked {
  color: rgba(255,255,255,.08);
}

.ixi-page-indicator.mode-discover .ixi-page-indicator-link {
  color: rgba(255,255,255,.22);
}

.ixi-page-indicator.mode-discover .ixi-page-indicator-link.active {
  color: rgba(255,196,0,.62);
}

.ixi-page-indicator.mode-locked .ixi-page-indicator-link {
  color: rgba(255,255,255,.42);
}

.ixi-page-indicator.mode-locked .ixi-page-indicator-link.active {
  color: rgba(255,196,0,.86);
}

.ixi-page-indicator-link.post-free {
  color: rgba(255,196,0,.36);
}

.ixi-page-indicator.mode-discover .ixi-page-indicator-link.post-free {
  color: rgba(255,196,0,.54);
}

.ixi-page-indicator.mode-locked .ixi-page-indicator-link.post-free,
.ixi-page-indicator-link.post-free:hover {
  color: rgba(255,196,0,.72);
  text-shadow: none;
}

.ixi-power-switch {
  width: 18px;
  height: 4px;

  border: 0;
  border-radius: 2px;

  background: rgba(255,255,255,.18);

  padding: 0;
  cursor: pointer;

  position: absolute;
  right: 0;
  bottom: -10px;

  z-index: 10;
}

.ixi-power-switch::before {
  content: "";

  position: absolute;

  left: -10px;
  right: -10px;
  top: -8px;
  bottom: -8px;
}

.ixi-power-switch.active {
  background: rgba(255,196,0,.95);

  box-shadow:
    0 0 8px rgba(255,196,0,.42);
}

.lab-panel {
  margin: 0 auto;
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

         .ixi-power-switch {
  position: sticky;
  right: 0;
  bottom: auto;
  flex: 0 0 18px;
}
        }
      `}</style>
    </>
  );
}

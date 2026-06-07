import { useState } from "react";

const RAIL_ITEMS = [
  { label: "IXI MARKETPLACE", href: "/browse", access: "always" },
 { label: "IXI AUCTION MKT", href: "#", access: "demo" },
  { label: "IXI WORKSPACE", href: "/saved", access: "relationship" },
  { label: "IXI THEATER", href: "/theater", access: "relationship" },
  { label: "DASHBOARD", href: "/account", access: "account" },
  { label: "INVENTORY", href: "/account/my-listings", access: "seller" },
  { label: "LAUNCH", href: "/launch", access: "seller" },
  { label: "POST FREE", href: "/post", access: "always", postFree: true }
];

function getDashWidth(label) {
  const widths = {
  "IXI AUCTION MKT": 82,
  "IXI WORKSPACE": 78,
  "IXI THEATER": 68,
    DASHBOARD: 58,
    INVENTORY: 58,
    LAUNCH: 42
  };

  return widths[label] || 60;
}

export default function IXIEnvironmentRail({
  activeEnvironment = "IXI MARKETPLACE",
  hasAccount = false,
  hasRelationship = false,
  hasInventory = false,
  className = ""
}) {
  const [railMode, setRailMode] = useState("dead");

  const effectiveMode = railMode;

  function cycleRailMode() {
    setRailMode(current => {
      if (current === "dead") return "med";
      if (current === "med") return "high";
      return "dead";
    });
  }

function canAccess(item) {
  if (item.access === "demo") return effectiveMode !== "dead";

  if (item.access === "always") return true;
  if (item.access === "account") return hasAccount;
  if (item.access === "relationship") return hasRelationship;
  if (item.access === "seller") return hasInventory;

  return false;
}

  function getRailItemState(item) {
    if (item.label === activeEnvironment) return "active";

    if (
      hasRelationship &&
      (item.label === "IXI WORKSPACE" || item.label === "IXI THEATER")
    ) {
      return "unlocked";
    }

    if (canAccess(item)) return "available";

    return "locked";
  }

  function shouldShowLabel(item) {
    if (item.access === "always") return true;

    if (
      hasRelationship &&
      (item.label === "IXI WORKSPACE" || item.label === "IXI THEATER")
    ) {
      return true;
    }

    if (effectiveMode === "dead") return false;

    return canAccess(item);
  }

  return (
    <section
      className={`ixi-environment-rail mode-${effectiveMode} raw-mode-${railMode} ${className}`}
    >
      {RAIL_ITEMS.map(item => (
       <a
  key={item.label}
  href={item.access === "demo" ? "#" : item.href}
  onClick={
    item.access === "demo"
      ? (e) => e.preventDefault()
      : undefined
  }
  className={`ixi-environment-link state-${getRailItemState(item)} ${
    item.postFree ? "post-free" : ""
  }`}
>
          {shouldShowLabel(item) ? (
            item.label
          ) : (
            <span
              className="ixi-env-dash"
              style={{ width: `${getDashWidth(item.label)}px` }}
            />
          )}
        </a>
      ))}

      <button
        type="button"
        className={`ixi-power-switch ${railMode !== "dead" ? "active" : ""}`}
        onClick={cycleRailMode}
        aria-label="Toggle environment rail"
        title="IXI Environment Rail"
      />

      <style jsx>{`
        .ixi-environment-rail {
          width: 100%;
          min-height: 22px;
          margin: -14px auto 22px;
          
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;

          position: relative;
        }

        .ixi-environment-link {
          color: rgba(255,255,255,.075);
          text-decoration: none;
          font-size: 9px;
          font-weight: 950;
          letter-spacing: .9px;
          text-transform: uppercase;
          white-space: nowrap;

          transition:
            color .24s ease,
            opacity .24s ease,
            text-shadow .24s ease,
            filter .24s ease;
        }

        .ixi-environment-link:hover {
          color: rgba(255,255,255,.34);
        }

        .ixi-environment-link.state-active {
          color: rgba(255,196,0,.86);
        }

        .ixi-environment-link.state-unlocked {
          color: rgba(0,194,255,.70);
          text-shadow: 0 0 9px rgba(0,194,255,.18);
        }

        .ixi-environment-link.state-available {
          color: rgba(255,255,255,.24);
        }

        .ixi-environment-link.state-locked {
          color: rgba(255,255,255,.08);
        }

        .ixi-environment-rail.mode-med .ixi-environment-link {
          color: rgba(255,255,255,.24);
        }

        .ixi-environment-rail.mode-high .ixi-environment-link {
          color: rgba(255,255,255,.46);
        }

        .ixi-environment-rail.mode-med .ixi-environment-link.state-active,
        .ixi-environment-rail.mode-high .ixi-environment-link.state-active {
          color: rgba(255,196,0,.86);
        }

        .ixi-environment-rail.mode-med .ixi-environment-link.state-unlocked,
        .ixi-environment-rail.mode-high .ixi-environment-link.state-unlocked {
          color: rgba(0,194,255,.78);
          text-shadow: 0 0 10px rgba(0,194,255,.22);
        }

        .ixi-environment-link.post-free {
  color: rgba(255,196,0,.86);
}
        .ixi-environment-rail.mode-med .ixi-environment-link.post-free,
.ixi-environment-rail.mode-high .ixi-environment-link.post-free,
.ixi-environment-link.post-free:hover {
  color: rgba(255,196,0,.86);
}

        .ixi-env-dash {
          display: block;
          height: 4px;
          border-radius: 2px;
          background: rgba(255,255,255,.10);
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
          box-shadow: 0 0 8px rgba(255,196,0,.42);
        }

        @media (max-width: 850px) {
          .ixi-environment-rail {
            overflow-x: auto;
            overflow-y: hidden;
            justify-content: flex-start;
            gap: 22px;
            padding-bottom: 6px;
            scrollbar-width: none;
            -ms-overflow-style: none;
          }

          .ixi-environment-rail::-webkit-scrollbar {
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
    </section>
  );
}

import { useState } from "react";

const RAIL_ITEMS = [
  { label: "IXI MARKETPLACE", href: "/browse", access: "always" },
  { label: "IXI WORKSPACE", href: "/saved", access: "relationship" },
  { label: "IXI THEATER", href: "/theater", access: "relationship" },
  { label: "DASHBOARD", href: "/account", access: "account" },
  { label: "INVENTORY", href: "/account/my-listings", access: "seller" },
  { label: "LAUNCH", href: "/launch", access: "seller" },
  { label: "POST FREE", href: "/post", access: "always", postFree: true }
];

function getDashWidth(label) {
  const widths = {
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
  const [railMode, setRailMode] = useState("ghost");

  function cycleRailMode() {
    setRailMode(current => {
      if (current === "ghost") return "discover";
      if (current === "discover") return "locked";
      return "ghost";
    });
  }

  function canAccess(item) {
    if (item.access === "always") return true;
    if (item.access === "account") return hasAccount;
    if (item.access === "relationship") return hasRelationship;
    if (item.access === "seller") return hasInventory;
    return false;
  }

  function isUnlockedEnvironment(item) {
    return (
      hasRelationship &&
      (item.label === "IXI WORKSPACE" || item.label === "IXI THEATER")
    );
  }

  function getRailItemState(item) {
    if (item.label === activeEnvironment) return "active";
    if (isUnlockedEnvironment(item)) return "unlocked";
    if (canAccess(item)) return "available";
    return "locked";
  }

  function renderRailLabel(item) {
    const available = canAccess(item);

    if (railMode === "ghost" && item.access !== "always") {
      return null;
    }

    if (!available && railMode !== "

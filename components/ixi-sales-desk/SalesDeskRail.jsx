import { useState } from "react";
import DashboardMachineRail from "../ixi-dashboard/DashboardMachineRail";
import { dashboardKey } from "../ixi-dashboard/dashboardContract.mjs";

export default function SalesDeskRail({ workspace: w, onClose }) {
  const [query, setQuery] = useState("");
  return <DashboardMachineRail className="sales-machine-rail" title="MACHINES" side="left"
    items={w.leftRailItems.filter(item => w.ownedKeys.has(dashboardKey(item)) || w.railPlacement[dashboardKey(item)] === "left")}
    badgeOf={item => w.ownedKeys.has(dashboardKey(item)) ? "" : "RELATIONSHIP"}
    loading={w.ownedStatus.loading} error={w.ownedStatus.error}
    query={query} onQuery={setQuery} selectedKey={w.selectedKey}
    onSelect={w.setSelectedKey} onOpen={w.openMachine}
    armed={w.armedRail === "left"}
    onArm={() => w.setArmedRail(current => current === "left" ? "" : "left")}
    onRetry={w.refresh} onHide={onClose} />;
}

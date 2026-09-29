import { useState } from "react";
import DashboardMachineRail from "../ixi-dashboard/DashboardMachineRail";

export default function SalesDeskRail({ workspace: w, onClose }) {
  const [query, setQuery] = useState("");
  return <DashboardMachineRail className="sales-machine-rail" title="LEFT RAIL" side="left" items={w.leftRailItems}
    loading={w.ownedStatus.loading} error={w.ownedStatus.error}
    query={query} onQuery={setQuery} selectedKey={w.selectedKey}
    onSelect={w.setSelectedKey} onOpen={w.openMachine}
    armed={w.armedRail === "left"}
    onArm={() => w.setArmedRail(current => current === "left" ? "" : "left")}
    onRetry={w.refresh} onHide={onClose} />;
}

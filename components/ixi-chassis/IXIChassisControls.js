import { useState } from "react";
import IXIControlSurface from "../IXIControlSurface";
import IXSearchSurface from "../IXSearchSurface";
import IXSearchSurfaceMobile from "../IXSearchSurfaceMobile";
import IXIRelationshipControls from "../IXIRelationshipControls";

export default function IXIChassisControls({
  listings = [],
  workspaceToolbars = false,
  searchQuery,
  setSearchQuery,
  workspaceFilters,
  setWorkspaceFilters,
  savedBoardMode,
  setSavedBoardMode,
  pocketThumbSize,
  setPocketThumbSize,
  ixiCardState,
  ixiColorFilters,
  toggleColorFilter,
  ixiOutlineFilter,
  toggleOutlineFilter,
  armedDestination,
  toggleArmedDestination,
  railRevealed = false,
  toggleRailRevealed = () => {},
  searchSurfaceRevealed = false,
  toggleSearchSurfaceRevealed = () => {},
  searchCollapsed = false,
  onToggleSearchCollapsed = () => {},
  workspaceFilterErrors = {},
  workspaceFilterErrorMessage = "",
  parkBrakeOn = false,
  toggleParkBrake = () => {},
  cycleActiveStackTarget
}) {
  const [mobileBoardSearchOpen, setMobileBoardSearchOpen] = useState(false);
  const boardSearchActive = Boolean(searchQuery?.trim()) ||
    Object.entries(workspaceFilters || {}).some(([key, value]) => value &&
      !(["category", "make", "model"].includes(key) && String(value).startsWith("ALL ")));
  return (
    <section className="workspace-controls">
      <button type="button" className="search-fold-actuator"
        aria-label={searchCollapsed ? "Open search surface and pockets" : "Close search surface and pockets"}
        aria-expanded={!searchCollapsed} aria-controls="ixi-workspace-search-controls"
        onClick={onToggleSearchCollapsed} />
      <IXIControlSurface>
        <div id="ixi-workspace-search-controls" hidden={searchCollapsed}>
        <div className="desktop-search-surface">
         <IXSearchSurface
  listings={listings}
  searchQuery={searchQuery}
  setSearchQuery={setSearchQuery}
  filters={workspaceFilters}
  setFilters={setWorkspaceFilters}
  filterErrors={workspaceFilterErrors}
  filterErrorMessage={workspaceFilterErrorMessage}
  sortMode={savedBoardMode}
  setSortMode={setSavedBoardMode}
  pocketThumbSize={pocketThumbSize}
  setPocketThumbSize={setPocketThumbSize}
  searchSurfaceRevealed={searchSurfaceRevealed}
  onToggleSearchSurfaceRevealed={
    toggleSearchSurfaceRevealed
  }
/>
        </div>

        <div className="mobile-search-surface">
          <div className="aos-board-search-actions"><button type="button" className="aos-board-search-toggle"
            aria-label={`${mobileBoardSearchOpen ? "Close" : "Open"} search and filters`} aria-expanded={mobileBoardSearchOpen}
            onClick={() => setMobileBoardSearchOpen(open => !open)}>
            <span>SEARCH & FILTER{boardSearchActive ? " · ACTIVE" : ""}</span><strong aria-hidden="true">{mobileBoardSearchOpen ? "−" : "+"}</strong>
          </button></div>
          {mobileBoardSearchOpen && <IXSearchSurfaceMobile
            listings={listings}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filters={workspaceFilters}
            setFilters={setWorkspaceFilters}
            sortMode={savedBoardMode}
            setSortMode={setSavedBoardMode}
          />}
        </div>
        </div>

       <IXIRelationshipControls
  workspaceToolbars={workspaceToolbars}
  ixiCardState={ixiCardState}
  activeColors={ixiColorFilters}
  onToggleColor={toggleColorFilter}
  activeOutline={ixiOutlineFilter}
  onToggleOutline={toggleOutlineFilter}
  pocketThumbSize={pocketThumbSize}
  setPocketThumbSize={setPocketThumbSize}
  armedDestination={armedDestination}
  onToggleArmedDestination={toggleArmedDestination}
  railRevealed={railRevealed}
  onToggleRailRevealed={toggleRailRevealed}
  onCycleActiveStackTarget={cycleActiveStackTarget}
  parkBrakeOn={parkBrakeOn}
  onToggleParkBrake={toggleParkBrake}
/>
      </IXIControlSurface>

      <style jsx>{`
        .workspace-controls {
          position: relative;
          margin: 0 auto;
          padding: 0;
          background: transparent;
          border: 0;
          border-radius: 0;
          box-shadow: none;
        }

        .search-fold-actuator {
          position: absolute;
          top: 2px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 6;
          display: grid;
          place-items: center;
          width: 44px;
          height: 44px;
          padding: 0;
          border: 0;
          background: transparent;
          cursor: pointer;
        }
        .search-fold-actuator::before {
          content: "";
          display: block;
          width: 17px;
          height: 5px;
          border-radius: 2px;
          background: #bababa;
          box-shadow: 0 0 0 1px #3d3d3d, 0 0 8px #000;
        }
        .search-fold-actuator[aria-expanded="false"]::before,
        .search-fold-actuator:hover::before { background: #ffcf34; }
        .search-fold-actuator:focus-visible { outline: 2px solid #ffcf34; outline-offset: 2px; }
        [hidden] { display: none !important; }

        .mobile-search-surface {
          display: none;
        }

        .desktop-search-surface {
          display: block;
        }

        @media (max-width: 850px) {
          .search-fold-actuator { top: -14px; }
          .aos-board-search-actions { display: flex; justify-content: flex-start; margin: 0 0 6px; }
          .aos-board-search-toggle { display: inline-flex; align-items: center; justify-content: center; gap: 8px; width: auto; min-height: 44px; padding: 0 10px; border: 1px solid #343c30; border-radius: 3px; background: #101411; color: #e2e8dd; font: inherit; font-size: 10px; font-weight: 800; letter-spacing: .04em; white-space: nowrap; cursor: pointer; }
          .aos-board-search-toggle strong { color: #ffc400; font-size: 17px; line-height: 1; }
          .aos-board-search-toggle:focus-visible { outline: 2px solid #ffc400; outline-offset: -2px; }
          .desktop-search-surface {
            display: none;
          }

          .mobile-search-surface {
            display: block;
          }

          .workspace-controls {
            width: 100%;
            max-width: 100%;
            margin: 0 auto 8px;
          }
        }
      `}</style>
    </section>
  );
}

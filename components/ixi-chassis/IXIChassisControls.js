import { useState } from "react";
import IXIControlSurface from "../IXIControlSurface";
import IXSearchSurface from "../IXSearchSurface";
import IXSearchSurfaceMobile from "../IXSearchSurfaceMobile";
import IXIRelationshipControls from "../IXIRelationshipControls";

export default function IXIChassisControls({
  listings = [],
  workspaceToolbars = false,
  mobileObjectRow = null,
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
      <IXIControlSurface>
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
          {workspaceToolbars && <button type="button" className="aos-board-search-toggle"
            aria-expanded={mobileBoardSearchOpen} onClick={() => setMobileBoardSearchOpen(open => !open)}>
            <span>BOARD SEARCH {boardSearchActive ? "· ACTIVE" : ""}</span><strong>{mobileBoardSearchOpen ? "CLOSE −" : "OPEN +"}</strong>
          </button>}
          {(!workspaceToolbars || mobileBoardSearchOpen) && <IXSearchSurfaceMobile
            listings={listings}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filters={workspaceFilters}
            setFilters={setWorkspaceFilters}
            sortMode={savedBoardMode}
            setSortMode={setSavedBoardMode}
          />}
        </div>

        {mobileObjectRow}

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
          margin: 0 auto;
          padding: 0;
          background: transparent;
          border: 0;
          border-radius: 0;
          box-shadow: none;
        }

        .mobile-search-surface {
          display: none;
        }

        .desktop-search-surface {
          display: block;
        }

        @media (max-width: 850px) {
          .aos-board-search-toggle { display: flex; align-items: center; justify-content: space-between; width: 100%; min-height: 44px; padding: 0 12px; border: 1px solid #343c30; background: #101411; color: #e2e8dd; font: inherit; font-size: 11px; font-weight: 800; letter-spacing: .04em; cursor: pointer; }
          .aos-board-search-toggle strong { color: #ffc400; font-size: 10px; }
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
            margin: 0 auto 18px;
          }
        }
      `}</style>
    </section>
  );
}

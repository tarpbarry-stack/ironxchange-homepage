import IXIControlSurface from "../IXIControlSurface";
import IXSearchSurface from "../IXSearchSurface";
import IXSearchSurfaceMobile from "../IXSearchSurfaceMobile";
import IXIRelationshipControls from "../IXIRelationshipControls";

export default function IXIChassisControls({
  listings = [],
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
parkBrakeOn = false,
toggleParkBrake = () => {},
cycleActiveStackTarget = () => {}
}) {
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
    sortMode={savedBoardMode}
    setSortMode={setSavedBoardMode}
    pocketThumbSize={pocketThumbSize}
    setPocketThumbSize={setPocketThumbSize}
  />
</div>

        <div className="mobile-search-surface">
          <IXSearchSurfaceMobile
            listings={listings}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filters={workspaceFilters}
            setFilters={setWorkspaceFilters}
            sortMode={savedBoardMode}
            setSortMode={setSavedBoardMode}
          />
        </div>

        <IXIRelationshipControls
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

          parkBrakeOn={parkBrakeOn}
          onToggleParkBrake={toggleParkBrake}

          onCycleActiveStackTarget={
              cycleActiveStackTarget
          }
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

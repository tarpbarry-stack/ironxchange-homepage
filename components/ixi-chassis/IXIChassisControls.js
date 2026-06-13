import IXIControlSurface from "../IXIControlSurface";
import IXSearchSurface from "../IXSearchSurface";
import IXSearchSurfaceMobile from "../IXSearchSurfaceMobile";
import IXIRelationshipControls from "../IXIRelationshipControls";

export default function IXIChassisControls({
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
  toggleArmedDestination
}) {
  return (
    <section className="workspace-controls">
      <IXIControlSurface>

        <div className="desktop-search-surface">
          <IXSearchSurface
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
        />

      </IXIControlSurface>
    </section>
  );
}

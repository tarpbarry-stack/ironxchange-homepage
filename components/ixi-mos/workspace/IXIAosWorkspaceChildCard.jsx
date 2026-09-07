import IXIMachineCard
  from "../../ixi-machine-card/IXIMachineCard";

import IXIMosObjectCard
  from "../IXIMosObjectCard";


function clean(value) {
  return String(value ?? "").trim();
}


function isDurableMosObject(object = {}) {
  return Boolean(
    clean(object?.objectId) &&
    clean(object?.entityId)
  );
}


/*
 * UNIVERSAL AOS WORKSPACE CHILD CARD RESOLVER
 *
 * This is deliberately technical, not semantic.
 *
 * Durable MOS/AOS Object:
 *   persisted entityId + objectId -> MOS/AOS card runtime.
 *
 * IronXchange listing/machine:
 *   everything else -> IXIMachineCard, whose current family router
 *   selects Private / Marketplace / Auction presentation.
 *
 * No customer-facing word, object name, parent name, definition label
 * or business noun participates in this decision.
 */
export default function IXIAosWorkspaceChildCard({
  object = {},
  parentLabel = "",
  ixiState = {},
  ixiCardState = {},
  onIxiStateChange = null,
  forceMachineCard = false
}) {
  if (
    !forceMachineCard &&
    isDurableMosObject(
      object
    )
  ) {
    const directItems =
      Array.isArray(object?.items)
        ? object.items
        : Array.isArray(object?.children)
          ? object.children
          : [];

    return (
      <IXIMosObjectCard
        object={object}
        items={directItems}
        parentLabel={parentLabel}
        dragHandleProps={{}}
        ixiState={ixiState}
        ixiCardState={ixiCardState}
        onIxiStateChange={onIxiStateChange}
        saved={false}
        armedDestination=""
        onSendFront={() => {}}
        onSendBack={() => {}}
        onSendToArmedDestination={() => {}}
        onExposeObject={() => {}}
        onExposeContents={() => {}}
        onGatherContents={() => {}}
        onAddChild={null}
        onSaveName={null}
        onDelete={null}
        workspaceDropPolicy={{
          enabled: false,
          acceptedObjectTypes: []
        }}
        workspaceDropSurface=""
      />
    );
  }

  return (
    <IXIMachineCard
      listing={object}
      cardContext="inventory"
      saved={false}
      showSave={false}
      machineFace={1}
      showMachineRail={false}
      useDndDrag={false}
      dragHandleProps={{}}
      ixiState={ixiState}
      onIxiStateChange={onIxiStateChange}
    />
  );
}

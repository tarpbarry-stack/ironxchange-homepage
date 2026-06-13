import {
  SortableContext,
  horizontalListSortingStrategy
} from "@dnd-kit/sortable";

import { rectSortingStrategy } from "@dnd-kit/sortable";

import ListingCard from "../ListingCard";

export default function IXIActiveStack({
  stackKey,
  machineIds = [],
  getListingById,
  getListingId,
  savedIds = [],
  ixiCardState = {},
  activeStackLayouts = {},
  IXISortableMachineCard,
  toggleSave,
  updateIxiCardState,
  sendListingToFront,
  sendListingToBack,
  armedDestination,
  sendMachineToArmedDestination
}) {
  const containerId = stackKey === "top" ? "stackTop" : "stackBottom";

  const strategy =
    activeStackLayouts[stackKey] === "vertical"
      ? rectSortingStrategy
      : horizontalListSortingStrategy;

  return (
    <SortableContext
      id={containerId}
      items={machineIds}
      strategy={strategy}
    >
      {machineIds.map(machineId => {
        const machine = getListingById(machineId);

        if (!machine) return null;

        const id = String(getListingId(machine));

        return (
          <IXISortableMachineCard
            key={`stack-card-${id}`}
            id={id}
            containerId={containerId}
            className="active-stack-card"
          >
            {({ dragHandleProps }) => (
              <ListingCard
                listing={machine}
                saved={savedIds.includes(id)}
                onToggleSaved={() => toggleSave(machine)}
                from="saved"
                ixiState={
                  ixiCardState[id] || {
                    color: "none",
                    outline: 1
                  }
                }
                onIxiStateChange={updateIxiCardState}
                onSendFront={sendListingToFront}
                onSendBack={sendListingToBack}
                armedDestination={armedDestination}
                onSendToArmedDestination={sendMachineToArmedDestination}
                isBoardDraggingCard={false}
                isGhostTarget={false}
                useDndDrag={false}
                dragHandleProps={dragHandleProps}
              />
            )}
          </IXISortableMachineCard>
        );
      })}
    </SortableContext>
  );
}

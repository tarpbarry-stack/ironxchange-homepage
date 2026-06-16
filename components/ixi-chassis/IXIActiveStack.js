import {
  SortableContext,
  horizontalListSortingStrategy
} from "@dnd-kit/sortable";

import { rectSortingStrategy } from "@dnd-kit/sortable";

import ListingCard from "../ListingCard";

import IXIScaledCardShell from "../ixi-machine-object/IXIScaledCardShell";

import { getIXICardScalePreset } from "../../lib/ixiCardScalePresets";

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
  cycleMachineFace,
  sendListingToFront,
  sendListingToBack,
  armedDestination,
  sendMachineToArmedDestination,
  enableCardScaling = false,
  cardScaleMode = "xl"
}) {
  const containerId = stackKey === "top" ? "stackTop" : "stackBottom";

  const cardScaleMetrics = getIXICardScalePreset(cardScaleMode);

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
  style={
    enableCardScaling
      ? {
          width: `${cardScaleMetrics.width}px`,
          maxWidth: `${cardScaleMetrics.width}px`,
          minWidth: `${cardScaleMetrics.width}px`
        }
      : undefined
  }
>
          {({ dragHandleProps }) => (
  enableCardScaling ? (
    <IXIScaledCardShell size={cardScaleMode}>
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
                machineFace={ixiCardState[id]?.face || 1}
                onCycleMachineFace={() => cycleMachineFace?.(id)}
                onSendFront={sendListingToFront}
                onSendBack={sendListingToBack}
                armedDestination={armedDestination}
                onSendToArmedDestination={sendMachineToArmedDestination}
                isBoardDraggingCard={false}
                isGhostTarget={false}
                useDndDrag={false}
                dragHandleProps={dragHandleProps}
                   />
    </IXIScaledCardShell>
  ) : (
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
  )
)}
          </IXISortableMachineCard>
        );
      })}
    </SortableContext>
  );
}

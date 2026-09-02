import IXIMachineCard from "../ixi-machine-card/IXIMachineCard";
import {
  SortableContext,
  horizontalListSortingStrategy
} from "@dnd-kit/sortable";

import { rectSortingStrategy } from "@dnd-kit/sortable";


import IXIScaledCardShell from "../ixi-machine-object/IXIScaledCardShell";

import {
  getIXIObjectFootprint
} from "../../lib/ixiObjectGeometry";

import {
  getMachineCardGeometryFamily
} from "../ixi-machine-card/getMachineCardFamily";

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
  cardScaleMode = "xl",
  cardContext = "workspace"
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

        const objectFamily =
          getMachineCardGeometryFamily(
            machine,
            cardContext
          );

        const cardFootprint =
          getIXIObjectFootprint({
            scaleMode: cardScaleMode,
            objectFamily
          });

        return (
          <IXISortableMachineCard
  key={`stack-card-${id}`}
  id={id}
  containerId={containerId}
  className="active-stack-card"
  style={
    enableCardScaling
      ? {
          width: `${cardFootprint.renderedWidth}px`,
          maxWidth: `${cardFootprint.renderedWidth}px`,
          minWidth: `${cardFootprint.renderedWidth}px`
        }
      : undefined
  }
>
          {({ dragHandleProps }) => (
  enableCardScaling ? (
    <IXIScaledCardShell
      size={cardScaleMode}
      objectFamily={objectFamily}
    >
      <IXIMachineCard
                listing={machine}
                cardContext={cardContext}
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
    <IXIMachineCard
      listing={machine}
      cardContext={cardContext}
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

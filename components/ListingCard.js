import IXIMachineCard
  from "./ixi-machine-card/IXIMachineCard";

import IXIMosObjectCard
  from "./ixi-mos/IXIMosObjectCard";

/*
 * LEGACY ENTRY-POINT COMPATIBILITY ONLY
 *
 * The former monolithic ListingCard implementation has been removed.
 *
 * Machine presentation is owned by IXIMachineCard, which resolves the
 * current Private / Marketplace / Auction card family.
 *
 * Durable MOS/AOS Objects are owned by the MOS/AOS card runtime.
 *
 * This file contains no card implementation, no business taxonomy,
 * no face logic and no presentation policy. It remains temporarily as
 * an import-path bridge while old callers are eliminated from the repo.
 */

function clean(value) {
  return String(value ?? "").trim();
}

function isDurableMosObject(object = {}) {
  return Boolean(
    clean(object?.objectId) &&
    clean(object?.entityId)
  );
}

export default function ListingCardCompatibilityBridge({
  listing = null,
  object = null,
  items = null,
  projection = null,
  parentLabel = "",
  dragHandleProps = null,
  ixiState = {},
  ixiCardState = {},
  onIxiStateChange = null,
  saved = false,
  armedDestination = "",
  onSendFront = null,
  onSendBack = null,
  onCycleColor = null,
  onCycleOutline = null,
  onSendToArmedDestination = null,
  onExposeObject = null,
  onExposeContents = null,
  onGatherContents = null,
  onAddChild = null,
  onSaveName = null,
  onDelete = null,
  workspaceDropPolicy = null,
  workspaceDropSurface = "",
  onOpenConsole = null,
  ...machineProps
}) {
  const candidate =
    object ||
    listing ||
    {};

  if (
    isDurableMosObject(
      candidate
    )
  ) {
    const directItems =
      Array.isArray(items)
        ? items
        : Array.isArray(candidate?.items)
          ? candidate.items
          : Array.isArray(candidate?.children)
            ? candidate.children
            : [];

    return (
      <IXIMosObjectCard
        object={candidate}
        items={directItems}
        projection={projection}
        parentLabel={parentLabel}
        dragHandleProps={dragHandleProps}
        ixiState={ixiState}
        ixiCardState={ixiCardState}
        onIxiStateChange={onIxiStateChange}
        saved={saved}
        armedDestination={armedDestination}
        onSendFront={onSendFront}
        onSendBack={onSendBack}
        onCycleColor={onCycleColor}
        onCycleOutline={onCycleOutline}
        onSendToArmedDestination={onSendToArmedDestination}
        onExposeObject={onExposeObject}
        onExposeContents={onExposeContents}
        onGatherContents={onGatherContents}
        onAddChild={onAddChild}
        onSaveName={onSaveName}
        onDelete={onDelete}
        workspaceDropPolicy={workspaceDropPolicy}
        workspaceDropSurface={workspaceDropSurface}
        onOpenConsole={onOpenConsole}
      />
    );
  }

  return (
    <IXIMachineCard
      {...machineProps}
      listing={candidate}
      cardContext={
        machineProps?.cardContext ||
        "workspace"
      }
      dragHandleProps={dragHandleProps}
      ixiState={ixiState}
      onIxiStateChange={onIxiStateChange}
      saved={saved}
      armedDestination={armedDestination}
      onSendFront={onSendFront}
      onSendBack={onSendBack}
      onCycleColor={onCycleColor}
      onCycleOutline={onCycleOutline}
      onSendToArmedDestination={onSendToArmedDestination}
    />
  );
}

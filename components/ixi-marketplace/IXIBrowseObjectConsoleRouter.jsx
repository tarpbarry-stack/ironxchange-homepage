import dynamic from "next/dynamic";

import {
  IXI_CONSOLE_SLOT_TYPES,
  createConsoleSlot,
  createConsoleSlotsPatch,
  insertConsoleSlot,
  normalizeConsoleSlots
} from "../ixi-chassis/IXIObjectConsoleEngine";

const IXIMarketplaceObjectConsole = dynamic(
  () => import(
    "../ixi-machine-object/IXIMarketplaceObjectConsole"
  ),
  {
    ssr: false
  }
);

function getClosedConsoleSlots() {
  return [
    createConsoleSlot({
      type:
        IXI_CONSOLE_SLOT_TYPES.LISTING
    })
  ];
}

function hasOpenConsole(
  objectState = {}
) {
  const slots = Array.isArray(
    objectState.consoleSlots
  )
    ? normalizeConsoleSlots(
        objectState.consoleSlots
      )
    : [];

  return (
    slots.length > 1 ||
    objectState.consoleLeftOpen === true ||
    objectState.consoleRightOpen === true
  );
}

export default function IXIBrowseObjectConsoleRouter({
  objectId,
  ixiCardState = {},
  updateIxiCardState,
  renderParentCard,
  ...props
}) {
  const id = String(objectId || "");

  const objectState =
    ixiCardState?.[id] || {};

  if (hasOpenConsole(objectState)) {
    return (
      <IXIMarketplaceObjectConsole
        objectId={objectId}
        ixiCardState={ixiCardState}
        updateIxiCardState={
          updateIxiCardState
        }
        renderParentCard={
          renderParentCard
        }
        {...props}
      />
    );
  }

  if (
    typeof renderParentCard !==
      "function"
  ) {
    return null;
  }

  function openConsole(
    side,
    event
  ) {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    if (!id) {
      return;
    }

    const savedSlots =
      ixiCardState?.[id]
        ?.consoleSlots;

    const slots =
      Array.isArray(savedSlots) &&
      savedSlots.length
        ? normalizeConsoleSlots(
            savedSlots
          )
        : getClosedConsoleSlots();

    const nextSlots =
      insertConsoleSlot({
        slots,
        side
      });

    updateIxiCardState?.(
      id,
      {
        ...createConsoleSlotsPatch(
          nextSlots
        ),
        consoleUpdatedAt:
          Date.now()
      }
    );
  }

  return renderParentCard({
    consoleDepth: 1,
    consoleLeftOpen: false,
    consoleRightOpen: false,
    onExpandConsoleLeft: event =>
      openConsole("left", event),
    onExpandConsoleRight: event =>
      openConsole("right", event)
  });
}

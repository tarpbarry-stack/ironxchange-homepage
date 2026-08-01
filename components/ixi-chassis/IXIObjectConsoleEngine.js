export const IXI_CONSOLE_MIN_DEPTH = 1;
export const IXI_CONSOLE_MAX_DEPTH = 4;

export function normalizeConsoleDepth(
  value,
  {
    min = IXI_CONSOLE_MIN_DEPTH,
    max = IXI_CONSOLE_MAX_DEPTH
  } = {}
) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return min;
  }

  return Math.max(
    min,
    Math.min(
      max,
      Math.floor(number)
    )
  );
}

export function getConsoleDepth(
  ixiCardState = {},
  objectId,
  options = {}
) {
  const id = String(
    objectId || ""
  );

  if (!id) {
    return normalizeConsoleDepth(
      1,
      options
    );
  }

  return normalizeConsoleDepth(
    ixiCardState?.[id]
      ?.consoleDepth,
    options
  );
}

export function getNextConsoleDepth({
  currentDepth,
  direction,
  min = IXI_CONSOLE_MIN_DEPTH,
  max = IXI_CONSOLE_MAX_DEPTH
}) {
  const current =
    normalizeConsoleDepth(
      currentDepth,
      {
        min,
        max
      }
    );

  if (direction === "left") {
    return Math.max(
      min,
      current - 1
    );
  }

  if (direction === "right") {
    return Math.min(
      max,
      current + 1
    );
  }

  return current;
}

export function expandConsoleRight({
  ixiCardState = {},
  objectId,
  max = IXI_CONSOLE_MAX_DEPTH
}) {
  const id = String(
    objectId || ""
  );

  if (!id) {
    return null;
  }

  const currentDepth =
    getConsoleDepth(
      ixiCardState,
      id,
      {
        max
      }
    );

  const nextDepth =
    getNextConsoleDepth({
      currentDepth,
      direction: "right",
      max
    });

  return {
    objectId: id,

    nextDepth,

    patch: {
      consoleDepth:
        nextDepth,

      consoleOpen:
        nextDepth > 1,

      consoleUpdatedAt:
        Date.now()
    }
  };
}

export function collapseConsoleLeft({
  ixiCardState = {},
  objectId,
  min = IXI_CONSOLE_MIN_DEPTH
}) {
  const id = String(
    objectId || ""
  );

  if (!id) {
    return null;
  }

  const currentDepth =
    getConsoleDepth(
      ixiCardState,
      id
    );

  const nextDepth =
    getNextConsoleDepth({
      currentDepth,
      direction: "left",
      min
    });

  return {
    objectId: id,

    nextDepth,

    patch: {
      consoleDepth:
        nextDepth,

      consoleOpen:
        nextDepth > 1,

      consoleUpdatedAt:
        Date.now()
    }
  };
}

export function closeConsole({
  objectId
}) {
  const id = String(
    objectId || ""
  );

  if (!id) {
    return null;
  }

  return {
    objectId: id,

    nextDepth: 1,

    patch: {
      consoleDepth: 1,
      consoleOpen: false,
      consoleUpdatedAt:
        Date.now()
    }
  };
}

export function getConsoleGridSpan(
  depth,
  {
    min = IXI_CONSOLE_MIN_DEPTH,
    max = IXI_CONSOLE_MAX_DEPTH
  } = {}
) {
  return normalizeConsoleDepth(
    depth,
    {
      min,
      max
    }
  );

  export const IXI_CONSOLE_DEFAULT_FACE = 1;

export function createConsoleSlot({
  slotId,
  face = IXI_CONSOLE_DEFAULT_FACE
} = {}) {
  return {
    slotId:
      String(
        slotId ||
        `slot-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`
      ),

    face:
      Math.max(
        1,
        Number(face) || 1
      )
  };
}

export function normalizeConsoleSlots(
  slots = [],
  {
    maxSlots = IXI_CONSOLE_MAX_DEPTH,
    defaultFace =
      IXI_CONSOLE_DEFAULT_FACE
  } = {}
) {
  const normalized =
    Array.isArray(slots)
      ? slots
          .slice(0, maxSlots)
          .map((slot, index) => {
            if (
              slot &&
              typeof slot === "object"
            ) {
              return createConsoleSlot({
                slotId:
                  slot.slotId ||
                  `slot-${index + 1}`,

                face:
                  slot.face ||
                  defaultFace
              });
            }

            return createConsoleSlot({
              slotId:
                `slot-${index + 1}`,

              face:
                Number(slot) ||
                defaultFace
            });
          })
      : [];

  if (normalized.length) {
    return normalized;
  }

  return [
    createConsoleSlot({
      slotId: "slot-1",
      face: defaultFace
    })
  ];
}

export function getConsoleSlots(
  ixiCardState = {},
  objectId,
  options = {}
) {
  const id =
    String(objectId || "");

  const savedSlots =
    ixiCardState?.[id]
      ?.consoleSlots;

  return normalizeConsoleSlots(
    savedSlots,
    options
  );
}

export function insertConsoleSlot({
  slots = [],
  afterSlotId,
  face = IXI_CONSOLE_DEFAULT_FACE,
  maxSlots =
    IXI_CONSOLE_MAX_DEPTH
}) {
  const current =
    normalizeConsoleSlots(
      slots,
      {
        maxSlots
      }
    );

  if (
    current.length >= maxSlots
  ) {
    return current;
  }

  const index =
    current.findIndex(
      slot =>
        String(slot.slotId) ===
        String(afterSlotId)
    );

  const insertIndex =
    index === -1
      ? current.length
      : index + 1;

  const next = [
    ...current
  ];

  next.splice(
    insertIndex,
    0,
    createConsoleSlot({
      face
    })
  );

  return next;
}

export function removeConsoleSlot({
  slots = [],
  slotId
}) {
  const current =
    normalizeConsoleSlots(
      slots
    );

  if (
    current.length <= 1
  ) {
    return current;
  }

  const next =
    current.filter(
      slot =>
        String(slot.slotId) !==
        String(slotId)
    );

  return next.length
    ? next
    : current;
}

export function cycleConsoleSlotFace({
  slots = [],
  slotId,
  maxFace = 4
}) {
  const current =
    normalizeConsoleSlots(
      slots
    );

  return current.map(slot => {
    if (
      String(slot.slotId) !==
      String(slotId)
    ) {
      return slot;
    }

    const currentFace =
      Math.max(
        1,
        Number(slot.face) || 1
      );

    const nextFace =
      currentFace >= maxFace
        ? 1
        : currentFace + 1;

    return {
      ...slot,
      face: nextFace
    };
  });
}

export function createConsoleSlotsPatch(
  slots = []
) {
  const normalized =
    normalizeConsoleSlots(
      slots
    );

  return {
    consoleSlots:
      normalized,

    consoleDepth:
      normalized.length,

    consoleOpen:
      normalized.length > 1,

    consoleUpdatedAt:
      Date.now()
  };
}
}

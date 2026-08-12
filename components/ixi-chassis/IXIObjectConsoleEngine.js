export const IXI_CONSOLE_MIN_DEPTH =
  1;

export const IXI_CONSOLE_MAX_DEPTH =
  5;

export const IXI_CONSOLE_DEFAULT_FACE =
  2;

export const IXI_CONSOLE_SLOT_TYPES = {
  LISTING: "listing",
  MODULE: "module",
  EMPTY: "empty"
};

export const IXI_CONSOLE_LISTING_SLOT_ID =
  "listing";

export const IXI_CONSOLE_MODULE_FACES = [
  2,
  3,
  4
];

/* ===================================== */
/* LEGACY DEPTH COMPATIBILITY            */
/* ===================================== */

export function normalizeConsoleDepth(
  value,
  {
    min = IXI_CONSOLE_MIN_DEPTH,
    max = IXI_CONSOLE_MAX_DEPTH
  } = {}
) {
  const number =
    Number(value);

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
  const id =
    String(objectId || "");

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
  const id =
    String(objectId || "");

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
  const id =
    String(objectId || "");

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
  const id =
    String(objectId || "");

  if (!id) {
    return null;
  }

  const slots = [
    createConsoleSlot({
      type:
        IXI_CONSOLE_SLOT_TYPES
          .LISTING
    })
  ];

  return {
    objectId: id,

    nextDepth: 1,

    patch: {
      ...createConsoleSlotsPatch(
        slots
      ),

      consoleOpen: false
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
}

/* ===================================== */
/* SLOT IDENTITY                         */
/* ===================================== */

function createModuleSlotId() {
  return [
    "module",
    Date.now(),
    Math.random()
      .toString(36)
      .slice(2, 9)
  ].join("-");
}

function normalizeModuleFace(
  value,
  fallback =
    IXI_CONSOLE_DEFAULT_FACE
) {
  const face =
    Number(value);

  return IXI_CONSOLE_MODULE_FACES
    .includes(face)
      ? face
      : fallback;
}

export function createConsoleSlot({
  slotId,

  type =
    IXI_CONSOLE_SLOT_TYPES.MODULE,

  face =
    IXI_CONSOLE_DEFAULT_FACE
} = {}) {

  const normalizedType =
    type ===
    IXI_CONSOLE_SLOT_TYPES.LISTING
      ? IXI_CONSOLE_SLOT_TYPES.LISTING
      : type ===
        IXI_CONSOLE_SLOT_TYPES.EMPTY
        ? IXI_CONSOLE_SLOT_TYPES.EMPTY
        : IXI_CONSOLE_SLOT_TYPES.MODULE;


  if (
    normalizedType ===
    IXI_CONSOLE_SLOT_TYPES.LISTING
  ) {
    return {
      slotId:
        IXI_CONSOLE_LISTING_SLOT_ID,

      type:
        IXI_CONSOLE_SLOT_TYPES.LISTING,

      face: 1
    };
  }


  if (
    normalizedType ===
    IXI_CONSOLE_SLOT_TYPES.EMPTY
  ) {
    return {
      slotId:
        String(
          slotId ||
          createModuleSlotId()
        ),

      type:
        IXI_CONSOLE_SLOT_TYPES.EMPTY,

      face: null
    };
  }


  return {
    slotId:
      String(
        slotId ||
        createModuleSlotId()
      ),

    type:
      IXI_CONSOLE_SLOT_TYPES.MODULE,

    face:
      normalizeModuleFace(
        face
      )
  };
}
/* ===================================== */
/* SLOT NORMALIZATION + LEGACY MIGRATION */
/* ===================================== */

export function normalizeConsoleSlots(
  slots = [],
  {
    maxSlots =
      IXI_CONSOLE_MAX_DEPTH,
    defaultFace =
      IXI_CONSOLE_DEFAULT_FACE
  } = {}
) {
  const normalizedMaxSlots =
    Math.max(
      1,
      Math.floor(
        Number(maxSlots) ||
        IXI_CONSOLE_MAX_DEPTH
      )
    );

  const source =
    Array.isArray(slots)
      ? slots.slice(
          0,
          normalizedMaxSlots
        )
      : [];

  const normalized = [];

  let hasListingSlot =
    false;

  source.forEach(
    (
      slot,
      index
    ) => {
      if (
        slot === null ||
        slot === undefined
      ) {
        return;
      }

      const rawSlot =
        typeof slot === "object"
          ? slot
          : {
              face:
                Number(slot)
            };

      /*
       * Legacy slot data did not contain
       * a type. A face-1 slot represented
       * the Listing Card.
       */
      const isListingSlot =
        rawSlot.type ===
          IXI_CONSOLE_SLOT_TYPES
            .LISTING ||
        String(
          rawSlot.slotId || ""
        ) ===
          IXI_CONSOLE_LISTING_SLOT_ID ||
        (
          !rawSlot.type &&
          Number(rawSlot.face) === 1 &&
          !hasListingSlot
        );

      if (
        isListingSlot &&
        !hasListingSlot
      ) {
        normalized.push(
          createConsoleSlot({
            type:
              IXI_CONSOLE_SLOT_TYPES
                .LISTING
          })
        );

        hasListingSlot =
          true;

        return;
      }

      const isEmptySlot =
  rawSlot.type ===
  IXI_CONSOLE_SLOT_TYPES
    .EMPTY;


normalized.push(
  createConsoleSlot({
    slotId:
      rawSlot.slotId ||
      `module-${index + 1}`,

    type:
      isEmptySlot
        ? IXI_CONSOLE_SLOT_TYPES.EMPTY
        : IXI_CONSOLE_SLOT_TYPES.MODULE,

    face:
      isEmptySlot
        ? null
        : normalizeModuleFace(
            rawSlot.face,
            defaultFace
          )
  })
);
    }
  );

  if (!hasListingSlot) {
    normalized.unshift(
      createConsoleSlot({
        type:
          IXI_CONSOLE_SLOT_TYPES
            .LISTING
      })
    );
  }

  /*
   * Defensive guarantee:
   * one Listing Card only.
   */
  let listingSeen =
    false;

  const uniqueSlots =
    normalized.filter(slot => {
      if (
        slot.type !==
        IXI_CONSOLE_SLOT_TYPES
          .LISTING
      ) {
        return true;
      }

      if (listingSeen) {
        return false;
      }

      listingSeen = true;

      return true;
    });

  return uniqueSlots.slice(
    0,
    normalizedMaxSlots
  );
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

/* ===================================== */
/* DEFAULT FACE SEQUENCE                 */
/* ===================================== */

export function getNextConsoleDefaultFace(
  slots = [],
  {
    faces =
      IXI_CONSOLE_MODULE_FACES
  } = {}
) {
  const validFaces =
    Array.isArray(faces) &&
    faces.length
      ? faces
      : IXI_CONSOLE_MODULE_FACES;

  const current =
    normalizeConsoleSlots(
      slots
    );

  const moduleCount =
    current.filter(
      slot =>
        slot.type ===
        IXI_CONSOLE_SLOT_TYPES
          .MODULE
    ).length;

  return normalizeModuleFace(
    validFaces[
      moduleCount %
      validFaces.length
    ]
  );
}

/* ===================================== */
/* SLOT INSERTION                        */
/* ===================================== */

export function insertConsoleSlot({
  slots = [],

  side,

  afterSlotId,

  face,

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
    current.length >=
    maxSlots
  ) {
    return current;
  }

  const resolvedFace =
    normalizeModuleFace(
      face,
      getNextConsoleDefaultFace(
        current
      )
    );

  const nextSlot =
    createConsoleSlot({
      type:
        IXI_CONSOLE_SLOT_TYPES
          .MODULE,

      face:
        resolvedFace
    });

  /*
   * New outside-edge API.
   */
  if (side === "left") {
    return [
      nextSlot,
      ...current
    ];
  }

  if (side === "right") {
    return [
      ...current,
      nextSlot
    ];
  }

  /*
   * Compatibility with the previous
   * afterSlotId insertion API.
   */
  if (afterSlotId) {
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
      nextSlot
    );

    return next;
  }

  return [
    ...current,
    nextSlot
  ];
}

/* ===================================== */
/* SLOT REMOVAL                          */
/* ===================================== */

export function removeConsoleSlot({
  slots = [],
  slotId
}) {
  const current =
    normalizeConsoleSlots(
      slots
    );

  const target =
    current.find(
      slot =>
        String(slot.slotId) ===
        String(slotId)
    );

  if (!target) {
    return current;
  }

  /*
   * The Listing Card is permanent.
   */
  if (
    target.type ===
    IXI_CONSOLE_SLOT_TYPES.LISTING
  ) {
    return current;
  }

  return current.filter(
    slot =>
      String(slot.slotId) !==
      String(slotId)
  );
}

/* ===================================== */
/* MODULE FACE CYCLING                   */
/* ===================================== */

export function cycleConsoleSlotFace({
  slots = [],
  slotId,
  faces =
    IXI_CONSOLE_MODULE_FACES
}) {
  const current =
    normalizeConsoleSlots(
      slots
    );

  const validFaces =
    Array.isArray(faces) &&
    faces.length
      ? faces
      : IXI_CONSOLE_MODULE_FACES;

  return current.map(slot => {
    if (
      String(slot.slotId) !==
      String(slotId)
    ) {
      return slot;
    }

    /*
     * The Listing Card does not cycle
     * through module faces here.
     */
    if (
      slot.type ===
      IXI_CONSOLE_SLOT_TYPES.LISTING
    ) {
      return slot;
    }

    const currentIndex =
      validFaces.findIndex(
        face =>
          Number(face) ===
          Number(slot.face)
      );

    const nextIndex =
      currentIndex === -1 ||
      currentIndex >=
        validFaces.length - 1
        ? 0
        : currentIndex + 1;

    return {
      ...slot,

      face:
        validFaces[nextIndex]
    };
  });
}

/* ===================================== */
/* PERSISTENCE PATCH                     */
/* ===================================== */

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

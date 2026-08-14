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

export function normalizeConsoleFaces(
  faces =
    IXI_CONSOLE_MODULE_FACES
) {
  const source =
    Array.isArray(faces)
      ? faces
      : IXI_CONSOLE_MODULE_FACES;


  const normalized =
    source
      .map(
        value =>
          Math.floor(
            Number(value)
          )
      )
      .filter(
        face =>
          Number.isFinite(face) &&
          face >= 2
      );


  return Array.from(
    new Set(
      normalized
    )
  );
}


function normalizeModuleFace(
  value,
  fallback =
    IXI_CONSOLE_DEFAULT_FACE,
  faces =
    IXI_CONSOLE_MODULE_FACES
) {
  const validFaces =
    normalizeConsoleFaces(
      faces
    );


  const face =
    Math.floor(
      Number(value)
    );


  if (
    validFaces.includes(
      face
    )
  ) {
    return face;
  }


  const fallbackFace =
    Math.floor(
      Number(fallback)
    );


  if (
    validFaces.includes(
      fallbackFace
    )
  ) {
    return fallbackFace;
  }


 return (
  validFaces.length
    ? validFaces[0]
    : null
);
}

export function createConsoleSlot({
  slotId,

  type =
    IXI_CONSOLE_SLOT_TYPES.MODULE,

  face =
    IXI_CONSOLE_DEFAULT_FACE,

  faces =
    IXI_CONSOLE_MODULE_FACES,

  defaultFace =
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
    face,
    defaultFace,
    faces
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
      IXI_CONSOLE_DEFAULT_FACE,

    faces =
      IXI_CONSOLE_MODULE_FACES
  } = {}
) {

  const validFaces =
    normalizeConsoleFaces(
      faces
    );
  
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
            defaultFace,
            validFaces
          ),

    faces:
      validFaces,

    defaultFace
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
      IXI_CONSOLE_MODULE_FACES,

    defaultFace =
      IXI_CONSOLE_DEFAULT_FACE,

    maxSlots =
      IXI_CONSOLE_MAX_DEPTH
  } = {}
) {
  const validFaces =
    normalizeConsoleFaces(
      faces
    );

  if (
    !validFaces.length
  ) {
    return null;
  }
  
  const current =
    normalizeConsoleSlots(
      slots,
      {
        faces:
          validFaces,

        defaultFace
      }
    );

  if (
    current.length >=
    maxSlots
  ) {
    return current;
  }
  

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
    ],
    defaultFace,
    validFaces
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

  type =
    IXI_CONSOLE_SLOT_TYPES.MODULE,

  maxSlots =
    IXI_CONSOLE_MAX_DEPTH,

  faces =
    IXI_CONSOLE_MODULE_FACES,

  defaultFace =
    IXI_CONSOLE_DEFAULT_FACE
}) {
    const validFaces =
    normalizeConsoleFaces(
      faces
    );


  const current =
    normalizeConsoleSlots(
      slots,
      {
        maxSlots,

        faces:
          validFaces,

        defaultFace
      }
    );
  const isEmptySlot =
  type ===
  IXI_CONSOLE_SLOT_TYPES.EMPTY;


  const resolvedFace =
    isEmptySlot
      ? null
      : normalizeModuleFace(
          face,
          getNextConsoleDefaultFace(
            current,
            {
              faces:
                validFaces,

              defaultFace
            }
          ),
          validFaces
        );


const nextSlot =
  createConsoleSlot({
    type:
      isEmptySlot
        ? IXI_CONSOLE_SLOT_TYPES.EMPTY
        : IXI_CONSOLE_SLOT_TYPES.MODULE,

    face:
      resolvedFace,

    faces:
      validFaces,

    defaultFace
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

export function assignConsoleSlotFace({
  slots = [],
  slotId,
  face,

  faces =
    IXI_CONSOLE_MODULE_FACES,

  defaultFace =
    IXI_CONSOLE_DEFAULT_FACE
}) {
  const validFaces =
    normalizeConsoleFaces(
      faces
    );


  const current =
    normalizeConsoleSlots(
      slots,
      {
        faces:
          validFaces,

        defaultFace
      }
    );


  const resolvedFace =
    normalizeModuleFace(
      face,
      defaultFace,
      validFaces
    );


  return current.map(
    slot => {

      if (
        String(
          slot.slotId
        ) !==
        String(
          slotId
        )
      ) {
        return slot;
      }


      if (
        slot.type ===
        IXI_CONSOLE_SLOT_TYPES
          .LISTING
      ) {
        return slot;
      }


      return createConsoleSlot({
        slotId:
          slot.slotId,

        type:
          IXI_CONSOLE_SLOT_TYPES
            .MODULE,

        face:
          resolvedFace,

        faces:
          validFaces,

        defaultFace
      });
    }
  );
}
/* ===================================== */
/* SLOT REMOVAL                          */
/* ===================================== */

export function removeConsoleSlot({
  slots = [],
  slotId,

  faces =
    IXI_CONSOLE_MODULE_FACES,

  defaultFace =
    IXI_CONSOLE_DEFAULT_FACE
}) {
  const current =
    normalizeConsoleSlots(
      slots,
      {
        faces,
        defaultFace
      }
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
    IXI_CONSOLE_MODULE_FACES,

  defaultFace =
    IXI_CONSOLE_DEFAULT_FACE
}) {
  const validFaces =
    normalizeConsoleFaces(
      faces
    );


  const current =
    normalizeConsoleSlots(
      slots,
      {
        faces:
          validFaces,

        defaultFace
      }
    );


  return current.map(
    slot => {

      if (
        String(
          slot.slotId
        ) !==
        String(
          slotId
        )
      ) {
        return slot;
      }


      if (
        slot.type ===
        IXI_CONSOLE_SLOT_TYPES
          .LISTING
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
          validFaces[
            nextIndex
          ]
      };
    }
  );
}

/* ===================================== */
/* PERSISTENCE PATCH                     */
/* ===================================== */

export function createConsoleSlotsPatch(
  slots = [],
  {
    faces =
      IXI_CONSOLE_MODULE_FACES,

    defaultFace =
      IXI_CONSOLE_DEFAULT_FACE,

    maxSlots =
      IXI_CONSOLE_MAX_DEPTH
  } = {}
) {
  const normalized =
    normalizeConsoleSlots(
      slots,
      {
        faces,
        defaultFace,
        maxSlots
      }
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

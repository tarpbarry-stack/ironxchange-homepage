/*
 * IXI AOS CONSOLE STATE ENGINE
 *
 * Console state is presentation/workspace state.
 *
 * It is NOT Object truth.
 * It is NOT Card Definition truth.
 *
 * Card Definition answers:
 *   can this Card use a console?
 *
 * Console state answers:
 *   is it open right now?
 *   which Faces are exposed?
 */


function clean(
  value
) {
  return String(
    value || ""
  ).trim();
}


function toPositiveInteger(
  value,
  fallback = 1
) {
  const number =
    Number(
      value
    );

  if (
    !Number.isFinite(
      number
    ) ||
    number < 1
  ) {
    return fallback;
  }

  return Math.floor(
    number
  );
}


export function createIXIAosConsoleState({
  open = false,

  leftOpen = false,
  rightOpen = false,

  leftFace = 2,
  rightFace = 3,

  updatedAt = null
} = {}) {

  return {
    open:
      Boolean(
        open
      ),

    leftOpen:
      Boolean(
        leftOpen
      ),

    rightOpen:
      Boolean(
        rightOpen
      ),

    leftFace:
      toPositiveInteger(
        leftFace,
        2
      ),

    rightFace:
      toPositiveInteger(
        rightFace,
        3
      ),

    updatedAt:
      updatedAt ||
      null
  };
}


export function getIXIAosConsoleState(
  ixiState = {}
) {
  return createIXIAosConsoleState(
    ixiState.console
  );
}


export function getIXIAosConsoleDepth(
  consoleState = {}
) {
  const state =
    createIXIAosConsoleState(
      consoleState
    );

  return (
    1 +
    (
      state.leftOpen
        ? 1
        : 0
    ) +
    (
      state.rightOpen
        ? 1
        : 0
    )
  );
}


export function openIXIAosConsole(
  consoleState = {},
  faceCount = 1
) {
  const state =
    createIXIAosConsoleState(
      consoleState
    );

  const count =
    Math.max(
      1,
      Number(
        faceCount || 1
      )
    );


  return {
    ...state,

    open:
      true,

    leftOpen:
      count >= 2
        ? true
        : false,

    rightOpen:
      count >= 3
        ? true
        : false,

    leftFace:
      count >= 2
        ? Math.min(
            2,
            count
          )
        : 1,

    rightFace:
      count >= 3
        ? Math.min(
            3,
            count
          )
        : (
            count >= 2
              ? 2
              : 1
          ),

    updatedAt:
      Date.now()
  };
}


export function closeIXIAosConsole(
  consoleState = {}
) {
  return {
    ...createIXIAosConsoleState(
      consoleState
    ),

    open:
      false,

    updatedAt:
      Date.now()
  };
}


export function toggleIXIAosConsole(
  consoleState = {},
  faceCount = 1
) {
  const state =
    createIXIAosConsoleState(
      consoleState
    );

  return state.open
    ? closeIXIAosConsole(
        state
      )
    : openIXIAosConsole(
        state,
        faceCount
      );
}


export function toggleIXIAosConsoleSide(
  consoleState = {},
  side = ""
) {
  const state =
    createIXIAosConsoleState(
      consoleState
    );

  const resolvedSide =
    clean(
      side
    ).toLowerCase();


  if (
    resolvedSide ===
    "left"
  ) {
    return {
      ...state,

      open:
        true,

      leftOpen:
        !state.leftOpen,

      updatedAt:
        Date.now()
    };
  }


  if (
    resolvedSide ===
    "right"
  ) {
    return {
      ...state,

      open:
        true,

      rightOpen:
        !state.rightOpen,

      updatedAt:
        Date.now()
    };
  }


  return state;
}


function getNextFaceIndex(
  currentFace,
  faceCount,
  primaryFace = 1
) {
  const count =
    Math.max(
      1,
      Number(
        faceCount || 1
      )
    );


  if (
    count <= 1
  ) {
    return 1;
  }


  let next =
    toPositiveInteger(
      currentFace,
      1
    ) + 1;


  if (
    next > count
  ) {
    next = 1;
  }


  /*
   * Side faces should not normally
   * duplicate the primary Face.
   */
  if (
    count > 1 &&
    next === primaryFace
  ) {
    next += 1;

    if (
      next > count
    ) {
      next = 1;
    }
  }


  return next;
}


export function cycleIXIAosConsoleFace({
  consoleState = {},
  side = "",
  faceCount = 1,
  primaryFace = 1
} = {}) {

  const state =
    createIXIAosConsoleState(
      consoleState
    );


  if (
    clean(
      side
    ).toLowerCase() ===
    "left"
  ) {
    return {
      ...state,

      open:
        true,

      leftOpen:
        true,

      leftFace:
        getNextFaceIndex(
          state.leftFace,
          faceCount,
          primaryFace
        ),

      updatedAt:
        Date.now()
    };
  }


  if (
    clean(
      side
    ).toLowerCase() ===
    "right"
  ) {
    return {
      ...state,

      open:
        true,

      rightOpen:
        true,

      rightFace:
        getNextFaceIndex(
          state.rightFace,
          faceCount,
          primaryFace
        ),

      updatedAt:
        Date.now()
    };
  }


  return state;
}


export default {
  createIXIAosConsoleState,
  getIXIAosConsoleState,

  getIXIAosConsoleDepth,

  openIXIAosConsole,
  closeIXIAosConsole,
  toggleIXIAosConsole,

  toggleIXIAosConsoleSide,
  cycleIXIAosConsoleFace
};

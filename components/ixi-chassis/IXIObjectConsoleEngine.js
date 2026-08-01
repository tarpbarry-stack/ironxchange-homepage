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
}

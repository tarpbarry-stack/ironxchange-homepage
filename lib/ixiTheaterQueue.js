import {
  fetchIxiMachineState,
  saveIxiMachinePatch
} from "./ixiMachineStateClient";

export const IXI_THEATER_QUEUE_ID = "__theaterQueue";

export const THEATER_RECEPTOR_KEYS = [
  "stack1",
  "stack2",
  "stack3",
  "stack4",
  "stack5",
  "stack6"
];

export function createEmptyTheaterContainers() {
  return {
    rail: [],
    stack1: [],
    stack2: [],
    stack3: [],
    stack4: [],
    stack5: [],
    stack6: []
  };
}

export function sanitizeTheaterContainers(rawContainers = {}) {
  const empty = createEmptyTheaterContainers();
  const seen = new Set();

  Object.keys(empty).forEach(key => {
    const source = Array.isArray(rawContainers[key])
      ? rawContainers[key]
      : [];

    empty[key] = source
      .map(id => String(id))
      .filter(id => {
        if (!id || seen.has(id)) return false;
        seen.add(id);
        return true;
      });
  });

  return empty;
}

export async function saveTheaterQueue({
  userId = "guest",
  containers = {}
}) {
  const safeContainers =
    sanitizeTheaterContainers(containers);

  return saveIxiMachinePatch({
    userId,
    listingId: IXI_THEATER_QUEUE_ID,
    patch: {
      containers: safeContainers,
      updatedAt: new Date().toISOString()
    }
  });
}
export async function sendMachinesToTheater({
  userId = "guest",
  listingIds = [],
  receptor = "stack1"
}) {
  const cleanIds = listingIds
    .map(id => String(id))
    .filter(Boolean);

  if (!cleanIds.length) return null;

  const targetReceptor = THEATER_RECEPTOR_KEYS.includes(receptor)
    ? receptor
    : "stack1";

  const remoteState = await fetchIxiMachineState(userId);
  const savedQueue = remoteState?.[IXI_THEATER_QUEUE_ID];

  const currentContainers = sanitizeTheaterContainers(
    savedQueue?.containers || savedQueue || {}
  );

  const nextContainers = sanitizeTheaterContainers({
    ...currentContainers,
    [targetReceptor]: [
      ...(currentContainers[targetReceptor] || []),
      ...cleanIds
    ]
  });

  return saveIxiMachinePatch({
    userId,
    listingId: IXI_THEATER_QUEUE_ID,
    patch: {
      containers: nextContainers,
      updatedAt: new Date().toISOString()
    }
  });
}

export async function sendMachineToTheater({
  userId = "guest",
  listingId,
  receptor = "stack1"
}) {
  return sendMachinesToTheater({
    userId,
    listingIds: [listingId],
    receptor
  });
}

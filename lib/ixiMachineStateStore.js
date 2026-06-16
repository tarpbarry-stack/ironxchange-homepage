import fs from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "data");
const filePath = path.join(dataDir, "ixi-machine-state.json");

export function ensureIxiMachineStateStore() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({ users: {} }, null, 2));
  }
}

export function loadIxiMachineStateStore() {
  ensureIxiMachineStateStore();

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return { users: {} };
  }
}

export function saveIxiMachineStateStore(store) {
  ensureIxiMachineStateStore();

  fs.writeFileSync(filePath, JSON.stringify(store, null, 2));
}

export function getUserIxiMachineState(userId) {
  const store = loadIxiMachineStateStore();

  return store.users?.[String(userId || "guest")] || {};
}

export function saveUserIxiMachinePatch({ userId, listingId, patch }) {
  const store = loadIxiMachineStateStore();

  const uid = String(userId || "guest");
  const lid = String(listingId);

  store.users = store.users || {};
  store.users[uid] = store.users[uid] || {};

  const current = store.users[uid][lid] || {
    color: "none",
    outline: 1,
    saved: false,
    pinned: false
  };

  const next = {
    ...current,
    ...patch,
    color: patch.color || current.color || "none",
    outline: Number(patch.outline || current.outline || 1),
    touched: true,
    updatedAt: Date.now()
  };

  const shouldRelease =
    next.color === "none" &&
    Number(next.outline || 1) === 1 &&
    !next.saved &&
    !next.pinned;

  if (shouldRelease) {
    delete store.users[uid][lid];
  } else {
    store.users[uid][lid] = next;
  }

  saveIxiMachineStateStore(store);

  return store.users[uid];
}

export function saveUserIxiWorkspaceLayout({ userId, layout }) {
  const store = loadIxiMachineStateStore();

  const uid = String(userId || "guest");

  store.users = store.users || {};
  store.users[uid] = store.users[uid] || {};

  store.users[uid].__workspaceLayout = {
    ...(store.users[uid].__workspaceLayout || {}),
    ...(layout || {}),
    updatedAt: Date.now()
  };

  saveIxiMachineStateStore(store);

  return store.users[uid].__workspaceLayout;
}

export function getUserIxiWorkspaceLayout(userId) {
  const state = getUserIxiMachineState(userId);

  return state.__workspaceLayout || null;
}

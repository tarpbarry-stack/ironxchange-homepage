// /lib/identity/IXIAnonymousIdentity.js

const IXI_ANONYMOUS_ID_KEY = "ixi_anonymous_identity";
const IXI_ANONYMOUS_ID_PREFIX = "ixi_anon_";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * Creates a durable anonymous IXI identity.
 *
 * Example:
 * ixi_anon_7c229b7f_08f4_4a1e_96bf_3be2e3cc1772
 */
function createAnonymousId() {
  if (
    typeof globalThis !== "undefined" &&
    globalThis.crypto &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return `${IXI_ANONYMOUS_ID_PREFIX}${globalThis.crypto
      .randomUUID()
      .replace(/-/g, "_")}`;
  }

  const randomPart = Math.random()
    .toString(36)
    .slice(2, 14);

  const timePart = Date.now().toString(36);

  return `${IXI_ANONYMOUS_ID_PREFIX}${timePart}_${randomPart}`;
}

function isBrowser() {
  return (
    typeof window !== "undefined" &&
    typeof document !== "undefined"
  );
}

function isValidAnonymousId(value = "") {
  const id = String(value || "").trim();

  return (
    id.startsWith(IXI_ANONYMOUS_ID_PREFIX) &&
    id.length >= 20 &&
    id.length <= 120 &&
    /^[a-zA-Z0-9_]+$/.test(id)
  );
}

function readCookie(name) {
  if (!isBrowser()) return "";

  const prefix = `${encodeURIComponent(name)}=`;

  const parts = String(document.cookie || "")
    .split(";")
    .map(part => part.trim());

  const match = parts.find(part =>
    part.startsWith(prefix)
  );

  if (!match) return "";

  try {
    return decodeURIComponent(
      match.slice(prefix.length)
    );
  } catch {
    return "";
  }
}

function writeCookie(name, value) {
  if (!isBrowser()) return;

  const secure =
    window.location.protocol === "https:"
      ? "; Secure"
      : "";

  document.cookie = [
    `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
    "Path=/",
    `Max-Age=${ONE_YEAR_SECONDS}`,
    "SameSite=Lax",
    secure
  ]
    .filter(Boolean)
    .join("; ");
}

function readLocalStorage() {
  if (!isBrowser()) return "";

  try {
    return (
      window.localStorage.getItem(
        IXI_ANONYMOUS_ID_KEY
      ) || ""
    );
  } catch {
    return "";
  }
}

function writeLocalStorage(value) {
  if (!isBrowser()) return;

  try {
    window.localStorage.setItem(
      IXI_ANONYMOUS_ID_KEY,
      value
    );
  } catch {
    // Safari private mode or blocked storage.
    // Cookie remains the fallback.
  }
}

/**
 * Returns the browser's existing anonymous identity.
 * Does not create a new one.
 */
export function getExistingIXIAnonymousId() {
  if (!isBrowser()) return "";

  const localId = readLocalStorage();

  if (isValidAnonymousId(localId)) {
    return localId;
  }

  const cookieId = readCookie(
    IXI_ANONYMOUS_ID_KEY
  );

  if (isValidAnonymousId(cookieId)) {
    writeLocalStorage(cookieId);

    return cookieId;
  }

  return "";
}

/**
 * Returns a durable anonymous identity.
 *
 * Resolution order:
 * 1. localStorage
 * 2. first-party cookie
 * 3. generate a new ID
 *
 * Both localStorage and cookie are written so one can
 * repair the other if Safari clears or blocks one layer.
 */
export function ensureIXIAnonymousId() {
  if (!isBrowser()) {
    return "";
  }

  const existingId =
    getExistingIXIAnonymousId();

  if (existingId) {
    writeLocalStorage(existingId);
    writeCookie(
      IXI_ANONYMOUS_ID_KEY,
      existingId
    );

    return existingId;
  }

  const newId = createAnonymousId();

  writeLocalStorage(newId);
  writeCookie(
    IXI_ANONYMOUS_ID_KEY,
    newId
  );

  return newId;
}

/**
 * Clears the local anonymous identity.
 *
 * Use this only after guest state has been merged into
 * the authenticated user's server state.
 */
export function clearIXIAnonymousId() {
  if (!isBrowser()) return;

  try {
    window.localStorage.removeItem(
      IXI_ANONYMOUS_ID_KEY
    );
  } catch {
    // Cookie deletion below still runs.
  }

  document.cookie = [
    `${encodeURIComponent(IXI_ANONYMOUS_ID_KEY)}=`,
    "Path=/",
    "Max-Age=0",
    "SameSite=Lax"
  ].join("; ");
}

/**
 * Returns a normalized identity object for use by
 * IXIListingsEngine and IXI state persistence.
 */
export function getIXIAnonymousIdentity() {
  const id = ensureIXIAnonymousId();

  if (!id) {
    return {
      type: "anonymous",
      id: "",
      persistent: false
    };
  }

  return {
    type: "anonymous",
    id,
    persistent: true
  };
}

export {
  IXI_ANONYMOUS_ID_KEY,
  IXI_ANONYMOUS_ID_PREFIX,
  isValidAnonymousId
};

export default ensureIXIAnonymousId;

const IXI_PASSPORT_PREFIX = "IXI";
const IXI_PASSPORT_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const IXI_PASSPORT_SERIAL_LENGTH = 7;


function clean(value) {
  return String(value ?? "").trim();
}


function normalizePassportId(value) {
  return clean(value)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}


export function isValidIxiPassportId(value) {
  const normalized =
    normalizePassportId(value);

  if (
    normalized.length !==
    IXI_PASSPORT_PREFIX.length +
      IXI_PASSPORT_SERIAL_LENGTH
  ) {
    return false;
  }

  if (!normalized.startsWith(IXI_PASSPORT_PREFIX)) {
    return false;
  }

  return normalized
    .slice(IXI_PASSPORT_PREFIX.length)
    .split("")
    .every(character =>
      IXI_PASSPORT_ALPHABET.includes(character)
    );
}


export function getCanonicalAosPassportId(object = {}) {
  const identities =
    Array.isArray(object?.identities)
      ? object.identities
      : [];

  const passportIdentity =
    identities.find(identity => {
      const type = clean(
        identity?.identityType ||
        identity?.type ||
        identity?.kind
      ).toLowerCase();

      return type === "ixi-passport";
    });

  const candidates = [
    object?.passportId,
    object?.ixiPassportId,
    object?.passport?.passportId,
    object?.passport?.id,
    object?.metadata?.provisioning?.passportId,
    passportIdentity?.passportId,
    passportIdentity?.value,
    passportIdentity?.id,
    object?.ixiNumber,
    object?.ixiId,
    object?.metadata?.ixiNumber,
    object?.metadata?.ixiId
  ];

  for (const candidate of candidates) {
    const normalized =
      normalizePassportId(candidate);

    if (isValidIxiPassportId(normalized)) {
      return normalized;
    }
  }

  return "";
}


export function getAosPassportDisplaySerial(object = {}) {
  if (
    object?.metadata?.source ===
    "aos-card-catalog-preview"
  ) {
    return "XXXXXXX";
  }

  const passportId =
    getCanonicalAosPassportId(object);

  return passportId
    ? passportId.slice(IXI_PASSPORT_PREFIX.length)
    : "PENDING";
}

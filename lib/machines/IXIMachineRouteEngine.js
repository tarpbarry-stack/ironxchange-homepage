function clean(value) {
  return String(value || "").trim();
}

export function slugifyMachineText(value = "") {
  return clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizePassportId(value = "") {
  return clean(value)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

export function getMachinePassportId(machine = {}) {
  const publicData =
    machine.publicData ||
    machine.attributes?.publicData ||
    {};

  return normalizePassportId(
    machine.passportId ||
    publicData.passportId ||
    publicData.ixiPassportId ||
    publicData.ixiMedia?.passportId ||
    machine.ixiMedia?.passportId ||
    ""
  );
}

export function getMachineDescriptor(machine = {}) {
  const publicData =
    machine.publicData ||
    machine.attributes?.publicData ||
    {};

  const year =
    clean(
      machine.year ||
      publicData.year
    );

  const make =
    clean(
      machine.make ||
      publicData.make
    );

  const model =
    clean(
      machine.model ||
      publicData.model
    );

  const structured =
    [year, make, model]
      .filter(Boolean)
      .join(" ");

  if (structured) {
    return slugifyMachineText(structured);
  }

  const title =
    clean(
      machine.title ||
      machine.attributes?.title
    );

  return (
    slugifyMachineText(title) ||
    "machine"
  );
}

export function buildCanonicalMachineSlug(
  machine = {}
) {
  const passportId =
    getMachinePassportId(machine);

  if (!passportId) {
    return "";
  }

  const descriptor =
    getMachineDescriptor(machine);

  return `${descriptor}--${passportId}`;
}

export function getMachineFilePath(
  machine = {}
) {
  const slug =
    buildCanonicalMachineSlug(machine);

  if (!slug) {
    return "";
  }

  return `/listing/${slug}`;
}

export function parseMachineSlug(
  value = ""
) {
  const slug =
    clean(value);

  if (!slug) {
    return {
      slug: "",
      descriptor: "",
      passportId: "",
      isCanonical: false
    };
  }

  const markerIndex =
    slug.lastIndexOf("--");

  if (markerIndex === -1) {
    return {
      slug,
      descriptor: slug,
      passportId: "",
      isCanonical: false
    };
  }

  const descriptor =
    slug.slice(
      0,
      markerIndex
    );

  const passportId =
    normalizePassportId(
      slug.slice(
        markerIndex + 2
      )
    );

  return {
    slug,
    descriptor,
    passportId,
    isCanonical:
      Boolean(
        descriptor &&
        passportId
      )
  };
}

export function isCanonicalMachineSlug(
  value = ""
) {
  return parseMachineSlug(
    value
  ).isCanonical;
}

export function getLegacyMachineSlug(
  machine = {}
) {
  return slugifyMachineText(
    machine.title ||
    machine.attributes?.title ||
    ""
  );
}

export function machineMatchesLegacySlug({
  machine,
  slug
}) {
  return (
    getLegacyMachineSlug(machine) ===
    clean(slug)
  );
}

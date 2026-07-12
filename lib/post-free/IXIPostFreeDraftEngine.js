// /lib/post-free/IXIPostFreeDraftEngine.js

export const IXI_POST_FREE_DRAFT_KEY =
  "IXI_POST_FREE_DRAFT_V1";

export const IXI_POST_FREE_DRAFT_VERSION = 1;

const EMPTY_EXTERNAL_LINKS = [
  { label: "", url: "" },
  { label: "", url: "" },
  { label: "", url: "" }
];

function canUseBrowserStorage() {
  return (
    typeof window !== "undefined" &&
    typeof window.localStorage !== "undefined"
  );
}

function safeParseJson(value, fallback = null) {
  if (!value) return fallback;

  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn(
      "IXI POST FREE DRAFT JSON PARSE FAILED:",
      error
    );

    return fallback;
  }
}

function normalizeString(value = "") {
  return String(value ?? "");
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) return [];

  return value
    .map(item => normalizeString(item).trim())
    .filter(Boolean);
}

function normalizeExternalLinks(value) {
  const links = Array.isArray(value)
    ? value.slice(0, 3)
    : [];

  return EMPTY_EXTERNAL_LINKS.map((emptyLink, index) => {
    const source = links[index] || emptyLink;

    return {
      label: normalizeString(source?.label),
      url: normalizeString(source?.url)
    };
  });
}

export function createEmptyPostFreeDraft() {
  return {
    version: IXI_POST_FREE_DRAFT_VERSION,

    category: "EXCAVATORS",
    year: "",
    make: "",
    model: "",

    hours: "",
    price: "",

    serialNumber: "",
    stockNumber: "",

    city: "",
    stateCode: "",

    description: "",

    selectedKeywords: [],
    keywordSearch: "",

    workflowStatus: "good-listing",
    photoPolishMode: "original",

    externalLinks: normalizeExternalLinks([]),

    previewFace: 1,
    activePhotoIndex: 0,

    photoOrder: [],

    createdAt: 0,
    updatedAt: 0
  };
}

export function normalizePostFreeDraft(input = {}) {
  const emptyDraft = createEmptyPostFreeDraft();

  const previewFace = Number(input.previewFace || 1);

  const activePhotoIndex = Number(
    input.activePhotoIndex || 0
  );

  return {
    ...emptyDraft,

    version: IXI_POST_FREE_DRAFT_VERSION,

    category:
      normalizeString(input.category).trim() ||
      emptyDraft.category,

    year: normalizeString(input.year),
    make: normalizeString(input.make),
    model: normalizeString(input.model),

    hours: normalizeString(input.hours),
    price: normalizeString(input.price),

    serialNumber: normalizeString(
      input.serialNumber
    ),

    stockNumber: normalizeString(
      input.stockNumber
    ),

    city: normalizeString(input.city),

    stateCode: normalizeString(
      input.stateCode
    ),

    description: normalizeString(
      input.description
    ),

    selectedKeywords: normalizeStringArray(
      input.selectedKeywords
    ),

    keywordSearch: normalizeString(
      input.keywordSearch
    ),

    workflowStatus:
      normalizeString(input.workflowStatus).trim() ||
      emptyDraft.workflowStatus,

    photoPolishMode:
      normalizeString(input.photoPolishMode).trim() ||
      emptyDraft.photoPolishMode,

    externalLinks: normalizeExternalLinks(
      input.externalLinks
    ),

    previewFace:
      [1, 2, 3, 4].includes(previewFace)
        ? previewFace
        : 1,

    activePhotoIndex:
      Number.isFinite(activePhotoIndex) &&
      activePhotoIndex >= 0
        ? activePhotoIndex
        : 0,

    photoOrder: normalizeStringArray(
      input.photoOrder
    ),

    createdAt:
      Number(input.createdAt) || Date.now(),

    updatedAt:
      Number(input.updatedAt) || Date.now()
  };
}

export function hasMeaningfulPostFreeDraft(
  input = {}
) {
  const draft = normalizePostFreeDraft(input);

  return Boolean(
    draft.year ||
    draft.make ||
    draft.model ||
    draft.hours ||
    draft.price ||
    draft.serialNumber ||
    draft.stockNumber ||
    draft.city ||
    draft.stateCode ||
    draft.description ||
    draft.selectedKeywords.length ||
    draft.photoOrder.length ||
    draft.externalLinks.some(
      link => link.label || link.url
    )
  );
}

export function loadPostFreeDraft() {
  if (!canUseBrowserStorage()) {
    return null;
  }

  try {
    const rawDraft = window.localStorage.getItem(
      IXI_POST_FREE_DRAFT_KEY
    );

    const parsedDraft = safeParseJson(
      rawDraft,
      null
    );

    if (!parsedDraft) {
      return null;
    }

    return normalizePostFreeDraft(parsedDraft);
  } catch (error) {
    console.error(
      "IXI POST FREE DRAFT LOAD FAILED:",
      error
    );

    return null;
  }
}

export function savePostFreeDraft(
  input = {}
) {
  if (!canUseBrowserStorage()) {
    return null;
  }

  try {
    const existingDraft =
      loadPostFreeDraft();

    const now = Date.now();

    const nextDraft =
      normalizePostFreeDraft({
        ...existingDraft,
        ...input,

        createdAt:
          existingDraft?.createdAt ||
          input.createdAt ||
          now,

        updatedAt: now
      });

    window.localStorage.setItem(
      IXI_POST_FREE_DRAFT_KEY,
      JSON.stringify(nextDraft)
    );

    return nextDraft;
  } catch (error) {
    console.error(
      "IXI POST FREE DRAFT SAVE FAILED:",
      error
    );

    return null;
  }
}

export function clearPostFreeDraft() {
  if (!canUseBrowserStorage()) {
    return false;
  }

  try {
    window.localStorage.removeItem(
      IXI_POST_FREE_DRAFT_KEY
    );

    return true;
  } catch (error) {
    console.error(
      "IXI POST FREE DRAFT CLEAR FAILED:",
      error
    );

    return false;
  }
}

export function getPostFreeDraftSummary(
  input = {}
) {
  const draft = normalizePostFreeDraft(input);

  return {
    title:
      [
        draft.year,
        draft.make,
        draft.model
      ]
        .filter(Boolean)
        .join(" ") ||
      "Unfinished Machine",

    location:
      [
        draft.city,
        draft.stateCode
      ]
        .filter(Boolean)
        .join(", "),

    photoCount:
      draft.photoOrder.length,

    keywordCount:
      draft.selectedKeywords.length,

    updatedAt:
      draft.updatedAt
  };
}

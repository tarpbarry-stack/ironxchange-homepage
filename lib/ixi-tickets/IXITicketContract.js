const TICKET_SCHEMA = "ixi-ticket-v1";

export const IXI_TICKET_STATUS = Object.freeze({
  DRAFT: "draft",
  READY_FOR_CHAT: "ready-for-chat",
  WORKING: "working",
  PR_OPEN: "pr-open",
  READY_TO_VERIFY: "ready-to-verify",
  REOPENED: "reopened",
  REJECTED: "rejected",
  CLOSED: "closed"
});

export const IXI_TICKET_TYPES = Object.freeze([
  "bug",
  "ui",
  "data",
  "integration",
  "build",
  "design",
  "test",
  "research"
]);

export const IXI_TICKET_PRIORITIES = Object.freeze([
  "low",
  "normal",
  "high",
  "critical"
]);

export const IXI_TICKET_EXECUTION_CLASSES = Object.freeze([
  "auto-safe",
  "review",
  "aws",
  "design",
  "blocked"
]);

function clean(value) {
  return String(value ?? "").trim();
}

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function randomCode() {
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = new Uint8Array(3);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("").toUpperCase();
  }

  return Math.random().toString(16).slice(2, 8).padEnd(6, "0").toUpperCase();
}

export function createLocalTicketNumber(date = new Date()) {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `CT-${yy}${mm}${dd}-${randomCode()}`;
}

export function createEditSection(description = "") {
  return {
    editId: makeId("edit"),
    description: clean(description),
    status: "open"
  };
}

export function createIXITicket({
  context = {},
  repositorySuggestion = "ironxchange-homepage",
  source = "internal-chat"
} = {}) {
  const timestamp = nowIso();

  return {
    schema: TICKET_SCHEMA,
    ticketId: makeId("ticket"),
    displayNumber: createLocalTicketNumber(),
    source,
    status: IXI_TICKET_STATUS.DRAFT,
    syncState: "local-draft",
    repository: repositorySuggestion,
    repositorySuggestion,
    type: "bug",
    priority: "normal",
    executionClass: "review",
    headline: "",
    originalRequest: "",
    editSections: [createEditSection()],
    context: {
      route: clean(context.route),
      pathname: clean(context.pathname),
      environment: clean(context.environment),
      objectId: clean(context.objectId),
      passportId: clean(context.passportId),
      cardFamily: clean(context.cardFamily),
      cardContext: clean(context.cardContext),
      face: clean(context.face),
      scaleMode: clean(context.scaleMode),
      transactModule: clean(context.transactModule),
      recordIds: context.recordIds && typeof context.recordIds === "object" ? context.recordIds : {},
      viewport: context.viewport && typeof context.viewport === "object" ? context.viewport : {},
      userAgent: clean(context.userAgent),
      buildVersion: clean(context.buildVersion),
      capturedAt: timestamp
    },
    attachments: [],
    metadata: {
      execution: {
        queuedAt: "",
        assignedTo: "",
        claimedAt: "",
        startedAt: "",
        source: ""
      },
      userReview: {
        score: null,
        note: "",
        ratedAt: ""
      }
    },
    github: {
      repository: "",
      issueNumber: null,
      issueUrl: "",
      state: "not-published",
      syncedAt: ""
    },
    closeout: {
      summary: "",
      editResults: [],
      filesChanged: [],
      tests: [],
      before: "",
      after: "",
      risks: "",
      notes: "",
      prs: [],
      agentRating: {
        score: null,
        confidence: null,
        note: ""
      },
      completedAt: ""
    },
    verification: {
      notes: [],
      approvedAt: "",
      reopenedAt: ""
    },
    audit: {
      createdAt: timestamp,
      updatedAt: timestamp,
      publishedAt: "",
      closedAt: ""
    }
  };
}

export function normalizeIXITicket(ticket = {}) {
  const base = createIXITicket({
    context: ticket.context || {},
    repositorySuggestion: ticket.repositorySuggestion || ticket.repository || "ironxchange-homepage",
    source: ticket.source || "internal-chat"
  });

  return {
    ...base,
    ...ticket,
    context: { ...base.context, ...(ticket.context || {}) },
    github: { ...base.github, ...(ticket.github || {}) },
    metadata: {
      ...base.metadata,
      ...(ticket.metadata || {}),
      execution: { ...base.metadata.execution, ...(ticket.metadata?.execution || {}) },
      userReview: { ...base.metadata.userReview, ...(ticket.metadata?.userReview || {}) }
    },
    closeout: {
      ...base.closeout,
      ...(ticket.closeout || {}),
      agentRating: { ...base.closeout.agentRating, ...(ticket.closeout?.agentRating || {}) }
    },
    verification: { ...base.verification, ...(ticket.verification || {}) },
    audit: { ...base.audit, ...(ticket.audit || {}) },
    editSections: Array.isArray(ticket.editSections) && ticket.editSections.length
      ? ticket.editSections.map(item => ({ ...createEditSection(), ...item }))
      : base.editSections,
    attachments: Array.isArray(ticket.attachments) ? ticket.attachments : []
  };
}

export function isOriginalRequestLocked(ticket = {}) {
  return ticket.status !== IXI_TICKET_STATUS.DRAFT;
}

export function touchTicket(ticket = {}) {
  return {
    ...ticket,
    audit: {
      ...(ticket.audit || {}),
      updatedAt: nowIso()
    }
  };
}

export { TICKET_SCHEMA };

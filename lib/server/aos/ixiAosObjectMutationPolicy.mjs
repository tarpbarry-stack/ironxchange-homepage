const ALLOWED_PATCH_KEYS = new Set([
  "actorId",
  "businessIdentifiers",
  "cardTemplateSlug",
  "cardTemplateVersion",
  "commandId",
  "currency",
  "definitionVersion",
  "displayName",
  "expectedRevision",
  "fields",
  "identities",
  "media",
  "metadata",
  "value"
]);

const ALLOWED_FIELD_TYPES = new Set([
  "boolean",
  "date",
  "datetime",
  "money",
  "number",
  "tags",
  "text",
  "time"
]);

const MAX_BODY_BYTES = 1024 * 1024;
const MAX_FIELDS = 1000;
const MAX_MEDIA_ITEMS = 250;
const MAX_BUSINESS_IDENTIFIERS = 25;
const MAX_COMMAND_LENGTH = 160;
const COMMAND_PATTERN = /^[A-Za-z0-9][A-Za-z0-9:._-]*$/;

function clean(value) {
  return String(value ?? "").trim();
}

function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function fail(code, message, status = 400, details = null) {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  error.details = details;
  throw error;
}

function parseRevision(value, source) {
  const normalized = clean(value)
    .replace(/^W\//i, "")
    .replace(/^\"|\"$/g, "");
  const revision = Number(normalized);

  if (!normalized || !Number.isInteger(revision) || revision < 0) {
    fail(
      "AOS_OBJECT_REVISION_REQUIRED",
      `A non-negative integer revision is required in ${source}.`,
      428
    );
  }

  return revision;
}

function validateFieldDefinitions(metadata = {}) {
  const definitions = metadata?.fieldDefinitions;
  if (definitions === undefined) return;

  if (!Array.isArray(definitions) || definitions.length > MAX_FIELDS) {
    fail(
      "AOS_FIELD_DEFINITIONS_INVALID",
      `fieldDefinitions must be an array containing no more than ${MAX_FIELDS} fields.`
    );
  }

  const used = new Set();
  definitions.forEach((definition, index) => {
    if (!isPlainObject(definition)) {
      fail("AOS_FIELD_DEFINITION_INVALID", `Field definition ${index + 1} must be an object.`);
    }

    const fieldId = clean(definition.fieldId);
    const label = clean(definition.label);
    const type = clean(definition.fieldType || definition.type || "text").toLowerCase();

    if (!fieldId || !label) {
      fail("AOS_FIELD_DEFINITION_INCOMPLETE", `Field definition ${index + 1} requires fieldId and label.`);
    }
    if (used.has(fieldId)) {
      fail("AOS_FIELD_DEFINITION_DUPLICATE", `Duplicate field definition: ${fieldId}.`);
    }
    if (!ALLOWED_FIELD_TYPES.has(type)) {
      fail("AOS_FIELD_TYPE_UNSUPPORTED", `Unsupported field type: ${type}.`);
    }

    used.add(fieldId);
  });
}

export function assertAosObjectMutationRequest({
  method,
  path,
  body,
  headers = {}
} = {}) {
  const normalizedMethod = clean(method).toUpperCase();
  const objectMatch = clean(path).match(/^\/objects\/([^/]+)$/);

  if (normalizedMethod !== "PATCH" || !objectMatch) return null;
  if (!isPlainObject(body)) {
    fail("AOS_OBJECT_PATCH_REQUIRED", "AOS object updates require a JSON object payload.");
  }

  const bodyBytes = Buffer.byteLength(JSON.stringify(body), "utf8");
  if (bodyBytes > MAX_BODY_BYTES) {
    fail("AOS_OBJECT_PATCH_TOO_LARGE", "AOS object update exceeds the 1 MB limit.", 413);
  }

  const unexpectedKeys = Object.keys(body).filter(key => !ALLOWED_PATCH_KEYS.has(key));
  if (unexpectedKeys.length) {
    fail(
      "AOS_OBJECT_PATCH_KEY_FORBIDDEN",
      "AOS object update contains unsupported properties.",
      400,
      { keys: unexpectedKeys }
    );
  }

  const commandId = clean(body.commandId);
  const idempotencyKey = clean(headers["idempotency-key"]);
  if (
    !commandId ||
    commandId.length > MAX_COMMAND_LENGTH ||
    !COMMAND_PATTERN.test(commandId)
  ) {
    fail("AOS_OBJECT_COMMAND_ID_INVALID", "A valid AOS object commandId is required.");
  }
  if (!idempotencyKey || idempotencyKey !== commandId) {
    fail(
      "AOS_OBJECT_IDEMPOTENCY_REQUIRED",
      "Idempotency-Key must be present and must match commandId.",
      428
    );
  }

  const expectedRevision = parseRevision(body.expectedRevision, "the request body");
  const headerRevision = parseRevision(
    headers["x-ixi-expected-revision"],
    "X-IXI-Expected-Revision"
  );
  if (headerRevision !== expectedRevision) {
    fail(
      "AOS_OBJECT_REVISION_MISMATCH",
      "X-IXI-Expected-Revision and expectedRevision must identify the same object revision.",
      412,
      { expectedRevision, headerRevision }
    );
  }

  const definitionVersion = clean(body.definitionVersion);
  if (!definitionVersion || definitionVersion.length > MAX_COMMAND_LENGTH) {
    fail("AOS_DEFINITION_VERSION_REQUIRED", "AOS object updates require definitionVersion.", 428);
  }

  if (!clean(body.displayName) || clean(body.displayName).length > 240) {
    fail("AOS_OBJECT_DISPLAY_NAME_INVALID", "Object name is required and must not exceed 240 characters.");
  }
  if (!isPlainObject(body.fields) || Object.keys(body.fields).length > MAX_FIELDS) {
    fail("AOS_OBJECT_FIELDS_INVALID", `fields must be an object containing no more than ${MAX_FIELDS} values.`);
  }
  if (!isPlainObject(body.metadata)) {
    fail("AOS_OBJECT_METADATA_INVALID", "metadata must be an object.");
  }
  const auditCommand = body.metadata?.aosCommand;
  if (
    !isPlainObject(auditCommand) ||
    clean(auditCommand.contractVersion) !== "ixi-aos-object-command-v1" ||
    clean(auditCommand.commandId) !== commandId ||
    clean(auditCommand.definitionVersion) !== definitionVersion ||
    Number(auditCommand.expectedRevision) !== expectedRevision
  ) {
    fail(
      "AOS_OBJECT_AUDIT_COMMAND_INVALID",
      "AOS object update requires command audit metadata matching the mutation envelope."
    );
  }
  if (!Array.isArray(body.businessIdentifiers) || body.businessIdentifiers.length > MAX_BUSINESS_IDENTIFIERS) {
    fail(
      "AOS_BUSINESS_IDENTIFIERS_INVALID",
      `businessIdentifiers must contain no more than ${MAX_BUSINESS_IDENTIFIERS} entries.`
    );
  }
  if (!Array.isArray(body.media) || body.media.length > MAX_MEDIA_ITEMS) {
    fail("AOS_OBJECT_MEDIA_INVALID", `media must contain no more than ${MAX_MEDIA_ITEMS} entries.`);
  }

  validateFieldDefinitions(body.metadata);

  return {
    objectId: decodeURIComponent(objectMatch[1]),
    commandId,
    expectedRevision,
    definitionVersion,
    bodyBytes
  };
}

export default assertAosObjectMutationRequest;

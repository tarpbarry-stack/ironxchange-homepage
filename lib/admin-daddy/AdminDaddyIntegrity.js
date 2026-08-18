function clean(value) {
  return String(value ?? "").trim();
}

function getObjectId(object = {}) {
  return clean(object.objectId || object.id || object.uuid);
}

function getPassportId(object = {}) {
  return clean(
    object.passportId ||
    object.passport?.passportId ||
    object.identity?.passportId ||
    object.metadata?.passportId
  );
}

function getDefinitionId(object = {}) {
  return clean(object.definitionId || object.definition?.definitionId);
}

function auditObjectIntegrity({ objects = [], definitions = [] } = {}) {
  const definitionIds = new Set(
    (Array.isArray(definitions) ? definitions : [])
      .map(definition => clean(definition.definitionId))
      .filter(Boolean)
  );

  const objectIds = new Set();
  const passportIds = new Map();
  const issues = [];

  for (const object of Array.isArray(objects) ? objects : []) {
    const objectId = getObjectId(object);
    const passportId = getPassportId(object);
    const definitionId = getDefinitionId(object);

    if (!objectId) {
      issues.push({ type: "missing-object-id", severity: "critical", objectId: "", passportId });
      continue;
    }

    if (objectIds.has(objectId)) {
      issues.push({ type: "duplicate-object-id", severity: "critical", objectId, passportId });
    }
    objectIds.add(objectId);

    if (!passportId) {
      issues.push({ type: "missing-passport", severity: "action", objectId, passportId: "" });
    } else {
      const prior = passportIds.get(passportId);
      if (prior && prior !== objectId) {
        issues.push({ type: "duplicate-passport-reference", severity: "critical", objectId, passportId, relatedObjectId: prior });
      } else {
        passportIds.set(passportId, objectId);
      }
    }

    if (definitionId && definitionIds.size > 0 && !definitionIds.has(definitionId)) {
      issues.push({ type: "unresolved-definition", severity: "action", objectId, passportId, definitionId });
    }

    const parentId = clean(object.parentObjectId || object.parentId || object.relationships?.parentObjectId);
    if (parentId && parentId === objectId) {
      issues.push({ type: "self-parent", severity: "critical", objectId, passportId });
    }
  }

  const counts = issues.reduce((acc, issue) => {
    acc[issue.type] = (acc[issue.type] || 0) + 1;
    acc[issue.severity] = (acc[issue.severity] || 0) + 1;
    return acc;
  }, {});

  return {
    generatedAt: new Date().toISOString(),
    objectCount: objectIds.size,
    passportReferenceCount: passportIds.size,
    issueCount: issues.length,
    counts,
    issues
  };
}

module.exports = {
  getObjectId,
  getPassportId,
  auditObjectIntegrity
};

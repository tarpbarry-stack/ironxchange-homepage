import {
  getAosPassportId
} from "../../../lib/mos/ixiAosProvisioningContract";

const clean = value => String(value ?? "").trim();
const objectValue = value => value && typeof value === "object" && !Array.isArray(value) ? value : {};

export function createIXITransactContext({
  object = {},
  actor = {},
  entity = {},
  activeWorkOrder = null,
  permissions = []
} = {}) {
  const source = objectValue(object);
  const fields = objectValue(source.fields);
  const passportId = clean(getAosPassportId(source));

  return {
    schema: "ixi-transact-context-v1",
    launchedAt: new Date().toISOString(),
    source: "aos-object-toolbar-dollar",

    primary: {
      passportId,
      objectId: clean(source.objectId || source.id),
      objectType: clean(source.objectType || source.type || source.templateType),
      label: clean(source.displayName || source.name || source.title) || "AOS OBJECT"
    },

    entity: {
      passportId: clean(getAosPassportId(entity) || source.entityPassportId || fields.entityPassportId),
      label: clean(entity.displayName || entity.name || source.entityName)
    },

    location: {
      passportId: clean(fields.locationPassportId || source.locationPassportId),
      label: clean(fields.location || source.location)
    },

    actor: {
      passportId: clean(getAosPassportId(actor)),
      userId: clean(actor.userId || actor.id),
      employeeId: clean(actor.employeeId),
      label: clean(actor.displayName || actor.name)
    },

    activeWorkOrder: activeWorkOrder
      ? { ...objectValue(activeWorkOrder) }
      : null,

    permissions: Array.isArray(permissions)
      ? permissions
      : [],

    references: [
      passportId
        ? {
            passportId,
            role: clean(source.objectType || source.type || "object").toLowerCase(),
            label: clean(source.displayName || source.name || source.title)
          }
        : null
    ].filter(Boolean)
  };
}

export default {
  createIXITransactContext
};

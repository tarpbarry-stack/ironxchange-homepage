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
      objectId: clean(source.objectId || source.mosObjectId),
      objectType: clean(source.objectType || source.type || source.templateType),
      label: clean(source.displayName || source.name || source.title) || "AOS OBJECT"
    },

    entity: {
      passportId: clean(getAosPassportId(entity) || source.entityPassportId || fields.entityPassportId),
      label: clean(entity.displayName || entity.companyName || entity.name || entity.label || source.entityName || source.companyName || source.sellerCompany),
      displayName: clean(entity.displayName || entity.companyName || entity.name || entity.label),
      companyName: clean(entity.companyName || entity.displayName || entity.name || entity.label || source.companyName || source.sellerCompany),
      legalName: clean(entity.legalName),
      logoUrl: clean(entity.logoUrl || entity.logo || source.sellerLogo || source.logoUrl),
      accentColor: clean(entity.accentColor || entity.brandColor),
      phone: clean(entity.phone || entity.businessPhone),
      email: clean(entity.email || entity.businessEmail),
      website: clean(entity.website),
      address: clean(entity.address || entity.officeLocation),
      salesTermsDocument: {
        ...objectValue(
          entity.salesTermsDocument ||
            source.salesTermsDocument ||
            fields.salesTermsDocument,
        ),
      },
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

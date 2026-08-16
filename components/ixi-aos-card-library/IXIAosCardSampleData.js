const SAMPLE_LOCATION_OBJECT = Object.freeze({
  objectId: "aos-card-preview-location-001",
  entityId: "aos-card-preview-entity",
  displayName: "YARD NAME",
  status: "active",
  value: 8750000,
  currency: "USD",
  fields: {
    address1: "2400 AVIATION DRIVE",
    address2: "",
    city: "DFW AIRPORT",
    state: "TX",
    postalCode: "75261",
    yardHours: "MON–SAT 6:00 AM–6:00 PM",
    yardContact: "JOHN CARTER",
    yardPhone: "432-555-0186"
  },
  relationships: [
    { id: "rel-equipment", label: "EQUIPMENT", value: "47 ASSETS", status: "ACTIVE" },
    { id: "rel-shop", label: "SHOP", value: "1 SHOP", status: "ACTIVE" },
    { id: "rel-employees", label: "EMPLOYEES", value: "18 PEOPLE", status: "ACTIVE" },
    { id: "rel-ramp", label: "RAMP", value: "2 RAMPS", status: "ACTIVE" }
  ],
  media: [],
  metadata: { creationState: "" }
});

const SAMPLE_LOCATION_PROJECTION = Object.freeze({
  assetCount: 47,
  employeeCount: 18,
  childLocationCount: 3,
  totalAssetValue: 8750000
});

const SAMPLE_LOCATION_ITEMS = Object.freeze([
  {
    objectId: "preview-machine-001",
    entityId: "aos-card-preview-entity",
    objectType: "machine",
    displayName: "2022 CATERPILLAR 336",
    directContainerId: "aos-card-preview-location-001",
    value: 285000,
    currency: "USD",
    fields: { year: 2022, make: "CATERPILLAR", model: "336", hours: 3842 },
    media: [],
    metadata: {}
  },
  {
    objectId: "preview-vehicle-001",
    entityId: "aos-card-preview-entity",
    objectType: "vehicle",
    displayName: "2024 FORD F-350",
    directContainerId: "aos-card-preview-location-001",
    value: 72000,
    currency: "USD",
    fields: { year: 2024, make: "FORD", model: "F-350" },
    media: [],
    metadata: {}
  },
  {
    objectId: "preview-tool-001",
    entityId: "aos-card-preview-entity",
    objectType: "tool",
    displayName: "FIELD TOOL SET",
    directContainerId: "aos-card-preview-location-001",
    value: 8500,
    currency: "USD",
    fields: {},
    media: [],
    metadata: {}
  }
]);

const PERSONNEL_ID = "aos-card-preview-personnel-004";

/*
 * Face Lab intentionally uses a personnel-flavored sample here.
 * The renderer does not know what "employee", "department", "CDL", etc. mean.
 * These labels and aggregate instructions live in persisted-like schema metadata.
 */
const SAMPLE_PERSONNEL_OBJECT = Object.freeze({
  objectId: PERSONNEL_ID,
  entityId: "aos-card-preview-entity",
  objectType: "customer-defined-container",
  singularLabel: "PERSONNEL CONTAINER",
  pluralLabel: "EMPLOYEES",
  displayName: "IRONXCHANGE PERSONNEL",
  status: "active",
  capabilities: {
    canContain: true,
    canCreate: true,
    canTransact: true,
    editable: true,
    hasConsole: true
  },
  presentation: {
    icon: "♟",
    totalLabel: "TOTAL PEOPLE",
    summaryTitle: "WORKFORCE SUMMARY",
    relationshipsTitle: "RELATIONSHIPS & INFRASTRUCTURE"
  },
  fieldDefinitions: [
    { fieldId: "company", label: "COMPANY", type: "text", presentationRole: "attribute", editable: true },
    { fieldId: "openJobs", label: "OPEN JOBS", type: "number", presentationRole: "attribute", editable: true },
    { fieldId: "teams", label: "TEAMS / CREWS", type: "number", presentationRole: "attribute", editable: true }
  ],
  fields: {
    company: "IRONXCHANGE INC.",
    openJobs: 8,
    teams: 3
  },
  relationships: [
    { id: "p-rel-company", label: "COMPANY", value: "IRONXCHANGE INC." },
    { id: "p-rel-region", label: "REGION", value: "WEST TEXAS" },
    { id: "p-rel-open-jobs", label: "OPEN JOBS", value: "8" },
    { id: "p-rel-teams", label: "TEAMS / CREWS", value: "3" }
  ],
  media: [],
  metadata: {
    nomenclature: { singular: "PERSONNEL CONTAINER", plural: "EMPLOYEES" }
  }
});

const PEOPLE = [
  ["JOHN CARTER", "EMP-1047", "MANAGEMENT", "ACTIVE", ["HEAVY EQUIPMENT", "CDL", "FORKLIFT"], "MIDLAND YARD"],
  ["SARAH JOHNSON", "EMP-1021", "SALES", "ACTIVE", ["HEAVY EQUIPMENT", "RIGGING"], "MIDLAND YARD"],
  ["DAVID MILLER", "EMP-0987", "SHOP", "ACTIVE", ["WELDING", "HYDRAULICS", "FORKLIFT"], "ODESSA SHOP"],
  ["MICHAEL BROWN", "EMP-0775", "FIELD", "OFF DUTY", ["HEAVY EQUIPMENT", "CDL", "HYDRAULICS"], "FIELD / MOBILE"],
  ["ALEX RIVERA", "EMP-1102", "SHOP", "ACTIVE", ["WELDING", "HYDRAULICS"], "ODESSA SHOP"],
  ["MARIA LOPEZ", "EMP-1094", "ADMIN", "ACTIVE", ["FORKLIFT"], "MIDLAND OFFICE"],
  ["JAMES WILSON", "EMP-0881", "FIELD", "ACTIVE", ["HEAVY EQUIPMENT", "CDL", "RIGGING"], "FIELD / MOBILE"],
  ["ROBERT KING", "EMP-0810", "SHOP", "ACTIVE", ["WELDING", "FORKLIFT"], "ODESSA SHOP"],
  ["EMILY DAVIS", "EMP-1115", "SALES", "ACTIVE", ["HEAVY EQUIPMENT"], "MIDLAND OFFICE"],
  ["CHRIS MARTIN", "EMP-0904", "FIELD", "ACTIVE", ["CDL", "HYDRAULICS"], "FIELD / MOBILE"],
  ["KEVIN THOMAS", "EMP-0932", "SHOP", "ACTIVE", ["WELDING", "RIGGING"], "ODESSA SHOP"],
  ["AMANDA WHITE", "EMP-1068", "ADMIN", "ON LEAVE", ["FORKLIFT"], "MIDLAND OFFICE"],
  ["BRIAN HALL", "EMP-0794", "FIELD", "ACTIVE", ["HEAVY EQUIPMENT", "CDL"], "FIELD / MOBILE"],
  ["LISA YOUNG", "EMP-1013", "SALES", "ACTIVE", ["HEAVY EQUIPMENT"], "MIDLAND OFFICE"],
  ["MARK ALLEN", "EMP-0835", "SHOP", "ACTIVE", ["WELDING", "HYDRAULICS"], "ODESSA SHOP"],
  ["ERIC SCOTT", "EMP-0961", "FIELD", "ACTIVE", ["HEAVY EQUIPMENT", "RIGGING"], "FIELD / MOBILE"],
  ["NANCY GREEN", "EMP-1120", "MANAGEMENT", "ACTIVE", ["HEAVY EQUIPMENT", "CDL"], "MIDLAND OFFICE"],
  ["PAUL ADAMS", "EMP-0742", "SHOP", "OFF DUTY", ["FORKLIFT", "HYDRAULICS"], "ODESSA SHOP"]
];

const PERSON_FIELD_DEFINITIONS = Object.freeze([
  {
    fieldId: "recordId",
    label: "EMPLOYEE ID",
    type: "text",
    presentationRole: "identifier",
    editable: true
  },
  {
    fieldId: "orgGroup",
    label: "DEPARTMENT",
    type: "text",
    presentationRole: "group",
    aggregate: { mode: "count-by-value", groupId: "workforce", label: "WORKFORCE SUMMARY", order: 1 }
  },
  {
    fieldId: "recordStatus",
    label: "STATUS",
    type: "text",
    presentationRole: "status",
    aggregate: { mode: "count-by-value", groupId: "status", label: "WORKFORCE STATUS", order: 0, hero: true }
  },
  {
    fieldId: "attributes",
    label: "CAPABILITIES",
    type: "multi-select",
    presentationRole: "attribute-list",
    aggregate: { mode: "count-each-value", groupId: "capabilities", label: "CAPABILITY OVERVIEW", order: 2 }
  },
  {
    fieldId: "primaryPlace",
    label: "PRIMARY LOCATION",
    type: "text",
    presentationRole: "location",
    aggregate: { mode: "count-by-value", groupId: "locations", label: "LOCATIONS", order: 3 }
  }
]);

const SAMPLE_PERSONNEL_ITEMS = Object.freeze(
  PEOPLE.map((person, index) => ({
    objectId: `preview-person-${String(index + 1).padStart(3, "0")}`,
    entityId: "aos-card-preview-entity",
    objectType: "customer-defined-object",
    singularLabel: "EMPLOYEE",
    pluralLabel: "EMPLOYEES",
    displayName: person[0],
    directContainerId: PERSONNEL_ID,
    status: person[3],
    fieldDefinitions: PERSON_FIELD_DEFINITIONS,
    fields: {
      recordId: person[1],
      orgGroup: person[2],
      recordStatus: person[3],
      attributes: person[4],
      primaryPlace: person[5]
    },
    media: [],
    metadata: {}
  }))
);

const SAMPLE_PERSONNEL_PROJECTION = Object.freeze({
  directChildCount: SAMPLE_PERSONNEL_ITEMS.length
});

/*
 * Layout 007 is a generic object layout. John Carter is only the sample schema.
 * Rename the labels/values and the same card can be a vendor, animal, attorney,
 * field tech, tenant, project contact, or any other customer-defined object.
 */
const SAMPLE_OBJECT_007 = Object.freeze({
  objectId: "preview-object-card-007",
  entityId: "aos-card-preview-entity",
  objectType: "customer-defined-object",
  singularLabel: "EMPLOYEE",
  pluralLabel: "EMPLOYEES",
  displayName: "JOHN CARTER",
  status: "ACTIVE",
  capabilities: {
    canContain: true,
    canCreate: true,
    canTransact: true,
    editable: true,
    hasConsole: true
  },
  presentation: {
    attributesTitle: "CAPABILITIES / SPECIAL SKILLS",
    relationshipsTitle: "RELATIONSHIPS & ASSOCIATIONS",
    primaryActionLabel: "MESSAGE",
    secondaryActionLabel: "CONTACT"
  },
  fieldDefinitions: [
    { fieldId: "statusValue", label: "STATUS", type: "text", presentationRole: "status", editable: true },
    { fieldId: "recordId", label: "EMPLOYEE ID", type: "text", presentationRole: "identifier", editable: true },
    { fieldId: "subtitle", label: "ROLE", type: "text", presentationRole: "subtitle", editable: true },
    { fieldId: "groupValue", label: "DEPARTMENT", type: "text", presentationRole: "group", editable: true },
    { fieldId: "placeValue", label: "PRIMARY LOCATION", type: "text", presentationRole: "location", editable: true },
    { fieldId: "contactOne", label: "WORK PHONE", type: "text", presentationRole: "contact-primary", editable: true },
    { fieldId: "contactTwo", label: "WORK EMAIL", type: "text", presentationRole: "contact-secondary", editable: true },
    { fieldId: "attributes", label: "CAPABILITIES", type: "multi-select", presentationRole: "attribute-list", editable: true }
  ],
  fields: {
    statusValue: "ACTIVE",
    recordId: "EMP-1047",
    subtitle: "FIELD SERVICE TECHNICIAN",
    groupValue: "SERVICE",
    placeValue: "MIDLAND YARD · MIDLAND, TX",
    contactOne: "(432) 555-0184",
    contactTwo: "john.carter@ixi.com",
    attributes: ["HEAVY EQUIPMENT", "HYDRAULICS", "CDL", "DIAGNOSTICS"]
  },
  relationships: [
    { id: "007-rel-1", displayLabel: "REPORTS TO", displayName: "MIKE THOMPSON", secondary: "SERVICE MANAGER" },
    { id: "007-rel-2", displayLabel: "DEPARTMENT", displayName: "SERVICE" },
    { id: "007-rel-3", displayLabel: "TEAM / CREW", displayName: "MIDLAND SERVICE TEAM" },
    { id: "007-rel-4", displayLabel: "PRIMARY LOCATION", displayName: "MIDLAND YARD", secondary: "MIDLAND, TX" }
  ],
  media: [],
  metadata: {
    nomenclature: { singular: "EMPLOYEE", plural: "EMPLOYEES" }
  }
});

export function getAosCardSampleData(templateSlug = "") {
  const slug = String(templateSlug || "").trim();

  if (["location-standard", "location-standard-002", "location-standard-003"].includes(slug)) {
    return {
      sampleData: SAMPLE_LOCATION_OBJECT,
      projection: SAMPLE_LOCATION_PROJECTION,
      directItems: SAMPLE_LOCATION_ITEMS
    };
  }

  if (["personnel-container-004", "personnel-container-005", "personnel-container-006"].includes(slug)) {
    return {
      sampleData: SAMPLE_PERSONNEL_OBJECT,
      projection: SAMPLE_PERSONNEL_PROJECTION,
      directItems: SAMPLE_PERSONNEL_ITEMS
    };
  }

  if (slug === "employee-basic-007") {
    return {
      sampleData: SAMPLE_OBJECT_007,
      projection: null,
      directItems: []
    };
  }

  return {
    sampleData: {
      displayName: "AOS OBJECT",
      status: "active",
      value: null,
      currency: "USD",
      fields: {},
      media: [],
      metadata: {}
    },
    projection: null,
    directItems: []
  };
}

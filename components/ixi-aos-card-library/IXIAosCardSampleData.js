const SAMPLE_LOCATION_OBJECT = Object.freeze({
  objectId: "aos-card-preview-location-001",
  entityId: "aos-card-preview-entity",
  objectType: "customer-defined-container",
  singularLabel: "LOCATION",
  pluralLabel: "LOCATIONS",
  displayName: "DFW AIRPORT YARD",
  status: "active",
  currency: "USD",
  capabilities: {
    canContain: true,
    canCreate: true,
    canTransact: true,
    editable: true,
    hasConsole: true,
    hasRail: true,
    hasRelationships: true
  },
  presentation: {
    primaryDescriptor: "2400 AVIATION DRIVE · DFW AIRPORT, TX 75261",
    secondaryDescriptor: "PRIMARY EQUIPMENT YARD",
    countLabel: "DIRECT OBJECTS",
    relationshipsTitle: "RELATIONSHIPS & INFRASTRUCTURE",
    consoleLabel: "LOCATION MANAGEMENT",
    faces: {
      2: {
        shortLabel: "OPERATIONS",
        title: "OPERATIONS",
        sections: [
          { title: "ARRIVAL", layout: "rows", fields: ["gateCode","gps","contact","hours"] },
          { title: "ACCESS", layout: "grid", fields: ["semiAccess","trailerAccess","gateWidth","clearance"] },
          { title: "SERVICES", layout: "grid", fields: ["forklift","electric","air","water"] },
          { title: "RELATIONSHIPS & INFRASTRUCTURE", layout: "relationships" }
        ]
      },
      3: {
        shortLabel: "FINANCIAL",
        title: "FINANCIAL INFORMATION",
        sections: [
          { title: "PROPERTY PROFILE", layout: "rows", fields: ["ownership","acquired","propertyOwner","propertyManager"] },
          { title: "VALUE SUMMARY", layout: "grid", fields: ["landValue","improvementValue","currentValue","lastAppraised"] },
          { title: "OPERATING COSTS", layout: "grid", fields: ["electricCost","waterCost","insuranceCost","taxCost"] }
        ]
      },
      4: {
        shortLabel: "OBLIGATIONS",
        title: "EXPENSES & OBLIGATIONS",
        sections: [
          { title: "CURRENT OBLIGATIONS", layout: "grid", fields: ["nextObligation","nextAmount","due30","ytdPaid"] },
          { title: "ACCOUNT SUMMARY", layout: "rows", fields: ["utilityAccount","insurancePolicy","taxAccount"] },
          { title: "RELATIONSHIPS", layout: "relationships" }
        ]
      },
      5: {
        shortLabel: "MAINTENANCE",
        title: "MAINTENANCE & FACILITY",
        sections: [
          { title: "FACILITY HEALTH", layout: "grid", fields: ["healthScore","openWorkOrders","pmCompliance","maintenanceCost"] },
          { title: "NEXT DUE", layout: "rows", fields: ["nextWorkOrder","nextDue","nextIssue"] },
          { title: "SERVICE PROFILE", layout: "grid", fields: ["serviceContracts","inspections","criticalIssues","downtime"] },
          { title: "RELATIONSHIPS", layout: "relationships" }
        ]
      }
    }
  },
  fieldDefinitions: [
    { fieldId: "gateCode", label: "GATE CODE", type: "text", presentationFace: 2, editable: true },
    { fieldId: "gps", label: "GPS COORDINATES", type: "text", presentationFace: 2, editable: true },
    { fieldId: "contact", label: "YARD CONTACT", type: "text", presentationFace: 2, editable: true },
    { fieldId: "hours", label: "HOURS", type: "text", presentationFace: 2, editable: true },
    { fieldId: "semiAccess", label: "SEMI", type: "text", presentationFace: 2, editable: true },
    { fieldId: "trailerAccess", label: "53' TRAILER", type: "text", presentationFace: 2, editable: true },
    { fieldId: "gateWidth", label: "GATE WIDTH", type: "text", presentationFace: 2, editable: true },
    { fieldId: "clearance", label: "CLEARANCE", type: "text", presentationFace: 2, editable: true },
    { fieldId: "forklift", label: "FORKLIFT", type: "text", presentationFace: 2, editable: true },
    { fieldId: "electric", label: "ELECTRIC", type: "text", presentationFace: 2, editable: true },
    { fieldId: "air", label: "AIR", type: "text", presentationFace: 2, editable: true },
    { fieldId: "water", label: "WATER", type: "text", presentationFace: 2, editable: true },
    { fieldId: "ownership", label: "OWNERSHIP STATUS", type: "text", presentationFace: 3, editable: true },
    { fieldId: "acquired", label: "ACQUIRED", type: "text", presentationFace: 3, editable: true },
    { fieldId: "propertyOwner", label: "PROPERTY OWNER", type: "text", presentationFace: 3, editable: true },
    { fieldId: "propertyManager", label: "PROPERTY MANAGER", type: "text", presentationFace: 3, editable: true },
    { fieldId: "landValue", label: "LAND VALUE", type: "money", presentationFace: 3, editable: true },
    { fieldId: "improvementValue", label: "IMPROVEMENT VALUE", type: "money", presentationFace: 3, editable: true },
    { fieldId: "currentValue", label: "CURRENT VALUE", type: "money", presentationFace: 3, editable: true },
    { fieldId: "lastAppraised", label: "LAST APPRAISED", type: "text", presentationFace: 3, editable: true },
    { fieldId: "electricCost", label: "ELECTRIC / MO", type: "money", presentationFace: 3, editable: true },
    { fieldId: "waterCost", label: "WATER / MO", type: "money", presentationFace: 3, editable: true },
    { fieldId: "insuranceCost", label: "INSURANCE / MO", type: "money", presentationFace: 3, editable: true },
    { fieldId: "taxCost", label: "PROPERTY TAX / MO", type: "money", presentationFace: 3, editable: true },
    { fieldId: "nextObligation", label: "NEXT OBLIGATION", type: "text", presentationFace: 4, editable: true },
    { fieldId: "nextAmount", label: "NEXT AMOUNT", type: "money", presentationFace: 4, editable: true },
    { fieldId: "due30", label: "DUE 30 DAYS", type: "money", presentationFace: 4, editable: true },
    { fieldId: "ytdPaid", label: "YTD PAID", type: "money", presentationFace: 4, editable: true },
    { fieldId: "utilityAccount", label: "UTILITY ACCOUNT", type: "text", presentationFace: 4, editable: true },
    { fieldId: "insurancePolicy", label: "INSURANCE POLICY", type: "text", presentationFace: 4, editable: true },
    { fieldId: "taxAccount", label: "PROPERTY TAX ACCOUNT", type: "text", presentationFace: 4, editable: true },
    { fieldId: "healthScore", label: "HEALTH SCORE", type: "number", presentationFace: 5, editable: true },
    { fieldId: "openWorkOrders", label: "OPEN WORK ORDERS", type: "number", presentationFace: 5, editable: true },
    { fieldId: "pmCompliance", label: "PM COMPLIANCE", type: "number", presentationFace: 5, editable: true },
    { fieldId: "maintenanceCost", label: "MAINT. COST YTD", type: "money", presentationFace: 5, editable: true },
    { fieldId: "nextWorkOrder", label: "WORK ORDER", type: "text", presentationFace: 5, editable: true },
    { fieldId: "nextDue", label: "DUE", type: "text", presentationFace: 5, editable: true },
    { fieldId: "nextIssue", label: "ISSUE", type: "text", presentationFace: 5, editable: true },
    { fieldId: "serviceContracts", label: "SERVICE CONTRACTS", type: "number", presentationFace: 5, editable: true },
    { fieldId: "inspections", label: "INSPECTIONS", type: "number", presentationFace: 5, editable: true },
    { fieldId: "criticalIssues", label: "CRITICAL ISSUES", type: "number", presentationFace: 5, editable: true },
    { fieldId: "downtime", label: "DOWNTIME YTD", type: "text", presentationFace: 5, editable: true }
  ],
  fields: {
    gateCode: "4821", gps: "32.899110, -97.040339", contact: "JOHN CARTER · 432-555-0186", hours: "MON–SAT 6:00 AM–6:00 PM", semiAccess: "YES", trailerAccess: "YES", gateWidth: "32 FT", clearance: "OPEN", forklift: "15,000 LB", electric: "120 / 240 / 480", air: "120 PSI", water: "YES",
    ownership: "OWNED", acquired: "MAR 12, 2018", propertyOwner: "IRONXCHANGE HOLDINGS LLC", propertyManager: "JOHN CARTER", landValue: 2750000, improvementValue: 6000000, currentValue: 8750000, lastAppraised: "AUG 12, 2024", electricCost: 4250, waterCost: 1150, insuranceCost: 1450, taxCost: 2980,
    nextObligation: "ELECTRIC", nextAmount: 4250, due30: 11540, ytdPaid: 321600, utilityAccount: "DFW-UTIL-22014", insurancePolicy: "IXI-PROP-8842", taxAccount: "TARRANT-77104",
    healthScore: 87, openWorkOrders: 5, pmCompliance: 94, maintenanceCost: 48720, nextWorkOrder: "WO-1044 · FUEL TANK 01", nextDue: "AUG 18, 2026", nextIssue: "CONTAINMENT INSPECTION", serviceContracts: 5, inspections: 5, criticalIssues: 1, downtime: "14 HRS"
  },
  relationships: [
    { id: "rel-equipment", label: "EQUIPMENT", value: "47 ASSETS" },
    { id: "rel-shop", label: "SHOP", value: "1 SHOP" },
    { id: "rel-employees", label: "EMPLOYEES", value: "18 PEOPLE" },
    { id: "rel-ramp", label: "RAMP", value: "2 RAMPS" }
  ],
  media: [],
  metadata: { nomenclature: { singular: "LOCATION", plural: "LOCATIONS" } }
});

const LOCATION_CHILD_DEFINITIONS = Object.freeze([
  { fieldId: "kind", label: "OBJECT TYPE", type: "text", aggregate: { mode: "count-by-value", groupId: "mix", label: "OBJECT MIX", hero: true, order: 0 } },
  { fieldId: "statusValue", label: "STATUS", type: "text", aggregate: { mode: "count-by-value", groupId: "status", label: "STATUS", order: 1 } }
]);

const SAMPLE_LOCATION_ITEMS = Object.freeze([
  { objectId: "preview-object-001", displayName: "2022 CATERPILLAR 336", singularLabel: "MACHINE", pluralLabel: "MACHINES", fieldDefinitions: LOCATION_CHILD_DEFINITIONS, fields: { kind: "MACHINE", statusValue: "ACTIVE" }, media: [] },
  { objectId: "preview-object-002", displayName: "2024 FORD F-350", singularLabel: "VEHICLE", pluralLabel: "VEHICLES", fieldDefinitions: LOCATION_CHILD_DEFINITIONS, fields: { kind: "VEHICLE", statusValue: "ACTIVE" }, media: [] },
  { objectId: "preview-object-003", displayName: "FIELD TOOL SET", singularLabel: "TOOL", pluralLabel: "TOOLS", fieldDefinitions: LOCATION_CHILD_DEFINITIONS, fields: { kind: "TOOL", statusValue: "IN SERVICE" }, media: [] }
]);

const SAMPLE_LOCATION_PROJECTION = Object.freeze({ directChildCount: 3 });
const PERSONNEL_ID = "aos-card-preview-personnel-004";

const SAMPLE_PERSONNEL_OBJECT = Object.freeze({
  objectId: PERSONNEL_ID,
  entityId: "aos-card-preview-entity",
  objectType: "customer-defined-container",
  singularLabel: "PERSONNEL CONTAINER",
  pluralLabel: "EMPLOYEES",
  displayName: "PERSONNEL",
  status: "active",
  capabilities: { canContain: true, canCreate: true, canTransact: true, editable: true, hasConsole: true },
  presentation: { icon: "♟", totalLabel: "TOTAL PEOPLE", analyticTotalLabel: "PEOPLE", analyticPrimaryFieldId: "openJobs", analyticPrimaryMetricLabel: "OPEN JOBS", analyticIdentifierLabel: "ID", dashboardTitle: "WORKFORCE STATUS", summaryTitle: "WORKFORCE SUMMARY", relationshipsTitle: "RELATIONSHIPS & INFRASTRUCTURE" },
  fieldDefinitions: [
    { fieldId: "company", label: "COMPANY", type: "text", presentationRole: "attribute", editable: true },
    { fieldId: "openJobs", label: "OPEN JOBS", type: "number", presentationRole: "attribute", editable: true },
    { fieldId: "teams", label: "TEAMS / CREWS", type: "number", presentationRole: "attribute", editable: true }
  ],
  fields: { company: "IRONXCHANGE INC.", openJobs: 8, teams: 3 },
  relationships: [
    { id: "p-rel-company", label: "COMPANY", value: "IRONXCHANGE INC." },
    { id: "p-rel-region", label: "REGION", value: "WEST TEXAS" },
    { id: "p-rel-open-jobs", label: "OPEN JOBS", value: "8" },
    { id: "p-rel-teams", label: "TEAMS / CREWS", value: "3" }
  ],
  media: [],
  metadata: { nomenclature: { singular: "PERSONNEL CONTAINER", plural: "EMPLOYEES" } }
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
  { fieldId: "recordId", label: "EMPLOYEE ID", type: "text", presentationRole: "identifier", editable: true },
  { fieldId: "orgGroup", label: "DEPARTMENT", type: "text", presentationRole: "group", aggregate: { mode: "count-by-value", groupId: "workforce", label: "WORKFORCE SUMMARY", order: 1 } },
  { fieldId: "recordStatus", label: "STATUS", type: "text", presentationRole: "status", aggregate: { mode: "count-by-value", groupId: "status", label: "WORKFORCE STATUS", order: 0, hero: true } },
  { fieldId: "attributes", label: "CAPABILITIES", type: "multi-select", presentationRole: "attribute-list", aggregate: { mode: "count-each-value", groupId: "capabilities", label: "CAPABILITY OVERVIEW", order: 2 } },
  { fieldId: "primaryPlace", label: "PRIMARY LOCATION", type: "text", presentationRole: "location", aggregate: { mode: "count-by-value", groupId: "locations", label: "LOCATIONS", order: 3 } }
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
    fields: { recordId: person[1], orgGroup: person[2], recordStatus: person[3], attributes: person[4], primaryPlace: person[5] },
    media: [],
    metadata: {}
  }))
);

const SAMPLE_PERSONNEL_PROJECTION = Object.freeze({ directChildCount: SAMPLE_PERSONNEL_ITEMS.length });

const SAMPLE_OBJECT_007 = Object.freeze({
  objectId: "preview-object-card-007",
  entityId: "aos-card-preview-entity",
  objectType: "customer-defined-object",
  singularLabel: "EMPLOYEE",
  pluralLabel: "EMPLOYEES",
  displayName: "JOHN CARTER",
  status: "ACTIVE",
  capabilities: { canContain: true, canCreate: true, canTransact: true, editable: true, hasConsole: true },
  presentation: { attributesTitle: "CAPABILITIES / SPECIAL SKILLS", relationshipsTitle: "RELATIONSHIPS & ASSOCIATIONS", primaryActionLabel: "MESSAGE", secondaryActionLabel: "CONTACT" },
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
  metadata: { nomenclature: { singular: "EMPLOYEE", plural: "EMPLOYEES" } }
});

const SAMPLE_VEHICLE_009B = Object.freeze({
  objectId: "preview-card-009b",
  entityId: "aos-card-preview-entity",
  objectType: "customer-defined-object",
  singularLabel: "VEHICLE",
  pluralLabel: "VEHICLES",
  displayName: "2024 FORD F-350 LARIAT",
  status: "active",
  capabilities: { canContain: false, canCreate: true, canTransact: true, editable: true, hasConsole: true, hasRail: true, hasRelationships: true },
  presentation: { relationshipsTitle: "RELATIONSHIPS", sampleUse: "VEHICLE / VIN / MILEAGE" },
  fieldDefinitions: [
    { fieldId: "businessIdentifier", label: "UNIT #", type: "text", fieldType: "text", editable: true, presentationOrder: 0, semanticRole: "business-identifier", presentationRole: "business-identifier" },
    { fieldId: "year", label: "YEAR", type: "integer", fieldType: "integer", editable: true, presentationOrder: 1 },
    { fieldId: "make", label: "MAKE", type: "text", fieldType: "text", editable: true, presentationOrder: 2 },
    { fieldId: "model", label: "MODEL", type: "text", fieldType: "text", editable: true, presentationOrder: 3 },
    { fieldId: "vin", label: "VIN #", type: "text", fieldType: "text", editable: true, presentationOrder: 4 },
    { fieldId: "miles", label: "MILES", type: "number", fieldType: "number", editable: true, presentationOrder: 5 },
    { fieldId: "operatingStatus", label: "STATUS", type: "text", fieldType: "text", editable: true, presentationOrder: 6 }
  ],
  fields: {
    businessIdentifier: "TRK-214",
    year: 2024,
    make: "FORD",
    model: "F-350 LARIAT",
    vin: "1FT8W3BT7REC21418",
    miles: 38412,
    operatingStatus: "ACTIVE"
  },
  relationships: [
    { id: "c009b-rel-1", displayLabel: "HOME LOCATION", displayName: "MIDLAND YARD" },
    { id: "c009b-rel-2", displayLabel: "ASSIGNED TO", displayName: "FIELD OPERATIONS" },
    { id: "c009b-rel-3", displayLabel: "PRIMARY DRIVER", displayName: "J. CARTER" }
  ],
  media: [],
  metadata: { sampleUse: "VEHICLE / VIN / MILEAGE", nomenclature: { singular: "VEHICLE", plural: "VEHICLES" } }
});

export function getAosCardSampleData(templateSlug = "") {
  const slug = String(templateSlug || "").trim();

  if (["location-standard", "location-standard-002", "location-standard-003"].includes(slug)) {
    return { sampleData: SAMPLE_LOCATION_OBJECT, projection: SAMPLE_LOCATION_PROJECTION, directItems: SAMPLE_LOCATION_ITEMS };
  }

  if (["personnel-container-004", "personnel-container-005", "personnel-container-006"].includes(slug)) {
    return { sampleData: SAMPLE_PERSONNEL_OBJECT, projection: SAMPLE_PERSONNEL_PROJECTION, directItems: SAMPLE_PERSONNEL_ITEMS };
  }

  if (slug === "employee-basic-007") {
    return { sampleData: SAMPLE_OBJECT_007, projection: null, directItems: [] };
  }

  if (slug === "aos-card-009b") {
    return { sampleData: SAMPLE_VEHICLE_009B, projection: null, directItems: [] };
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

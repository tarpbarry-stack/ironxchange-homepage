import { useEffect, useMemo, useState } from "react";

import IXIAosCommandAwareObjectConsole from "../ixi-aos/console-runtime/IXIAosCommandAwareObjectConsole";
import IXIAosLocationObjectConsole from "../ixi-aos/console-runtime/IXIAosLocationObjectConsole";
import IXITransactObjectConsole from "../ixi-aos/transact/IXITransactObjectConsole";
import IXIAosCard004Personnel from "../ixi-aos/cards/004/IXIAosCard004Personnel";
import IXIAosCard005Personnel from "../ixi-aos/cards/005/IXIAosCard005Personnel";
import IXIAosCard006Personnel from "../ixi-aos/cards/006/IXIAosCard006Personnel";
import IXIAosCard007EmployeeApplication from "../ixi-aos/cards/007/IXIAosCard007EmployeeApplication";
import IXIAosCard008Profile from "../ixi-aos/cards/008/IXIAosCard008Profile";
import IXIAosCard009 from "../ixi-aos/cards/009/IXIAosCard009";
import IXIAosCard010 from "../ixi-aos/cards/010/IXIAosCard010";
import IXIAosCard011 from "../ixi-aos/cards/011/IXIAosCard011";
import IXIAosCard012 from "../ixi-aos/cards/012/IXIAosCard012";
import IXIAosCard013 from "../ixi-aos/cards/013/IXIAosCard013";
import IXIAosCard014 from "../ixi-aos/cards/014/IXIAosCard014";
import IXIAosCard015 from "../ixi-aos/cards/015/IXIAosCard015";
import IXIAosCard016 from "../ixi-aos/cards/016/IXIAosCard016";
import IXIAosCard017 from "../ixi-aos/cards/017/IXIAosCard017";
import { adaptAosCardTemplate } from "../ixi-aos/card-runtime/IXIAosCardTemplateAdapter";
import IXIFaceLabScaledCard from "../ixi-face-studio/IXIFaceLabScaledCard";
import { getUniversal007PreviewItems } from "./IXIAosUniversal007PreviewData";

function clean(value) { return String(value || "").trim(); }
function safeObject(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
function resolveCatalogCardNumber(template = {}) {
  const direct = Number(template?.templateNumber || template?.metadata?.cardNumber || 0);
  if (Number.isFinite(direct) && direct > 0) return direct;
  const match = clean(template?.templateSlug).match(/(?:^|[-_])(\d{3})(?:$|[-_])/);
  return match ? Number(match[1]) : 0;
}

function universal007Sample() {
  return {
    objectId: "preview-universal-007", entityId: "aos-card-preview-entity", objectType: "customer-defined-object",
    singularLabel: "OBJECT", pluralLabel: "OBJECTS", displayName: "WEST TEXAS OPERATIONS", status: "active",
    capabilities: { canContain: true, canCreate: true, canTransact: true, editable: true, hasConsole: true, hasRail: true, hasRelationships: true },
    presentation: { detailsTitle: "DETAILS", relationshipsTitle: "RELATIONSHIPS", mediaLabel: "IXI MEDIA" },
    fieldDefinitions: [
      { fieldId: "field_1", label: "STATUS", type: "text", editable: true, presentationOrder: 0 },
      { fieldId: "field_2", label: "REGION", type: "text", editable: true, presentationOrder: 1 },
      { fieldId: "field_3", label: "OWNER", type: "text", editable: true, presentationOrder: 2 },
      { fieldId: "field_4", label: "PRIORITY", type: "text", editable: true, presentationOrder: 3 },
      { fieldId: "field_5", label: "REFERENCE", type: "text", editable: true, presentationOrder: 4 },
      { fieldId: "field_6", label: "CATEGORY", type: "text", editable: true, presentationOrder: 5 },
      { fieldId: "field_7", label: "CONTACT", type: "text", editable: true, presentationOrder: 6 },
      { fieldId: "field_8", label: "NOTES", type: "text", editable: true, presentationOrder: 7 }
    ],
    fields: { field_1: "ACTIVE", field_2: "WEST TEXAS", field_3: "IRONXCHANGE", field_4: "HIGH", field_5: "AOS-007", field_6: "OPERATIONS", field_7: "MAIN OFFICE", field_8: "CUSTOMER DEFINED" },
    relationships: [
      { id: "u007-rel-1", displayLabel: "PRIMARY LOCATION", displayName: "MIDLAND" },
      { id: "u007-rel-2", displayLabel: "RELATED GROUP", displayName: "FIELD OPERATIONS" },
      { id: "u007-rel-3", displayLabel: "ACTIVE PROJECT", displayName: "PROJECT 481" }
    ],
    media: [], metadata: { nomenclature: { singular: "OBJECT", plural: "OBJECTS" } }
  };
}

function card009Sample() {
  return {
    objectId: "preview-card-009", entityId: "aos-card-preview-entity", objectType: "customer-defined-object",
    singularLabel: "EQUIPMENT", pluralLabel: "EQUIPMENT", displayName: "2023 KOMATSU WA475-10", status: "active",
    capabilities: { canContain: false, canCreate: true, canTransact: true, editable: true, hasConsole: true, hasRail: true, hasRelationships: true },
    presentation: { relationshipsTitle: "RELATIONSHIPS", sampleUse: "POWERED / SERIALIZED EQUIPMENT" },
    fieldDefinitions: [
      { fieldId: "businessIdentifier", label: "UNIT #", type: "text", fieldType: "text", editable: true, presentationOrder: 0, semanticRole: "business-identifier", presentationRole: "business-identifier" },
      { fieldId: "year", label: "YEAR", type: "integer", fieldType: "integer", editable: true, presentationOrder: 1 },
      { fieldId: "make", label: "MAKE", type: "text", fieldType: "text", editable: true, presentationOrder: 2 },
      { fieldId: "model", label: "MODEL", type: "text", fieldType: "text", editable: true, presentationOrder: 3 },
      { fieldId: "serialNumber", label: "SERIAL #", type: "text", fieldType: "text", editable: true, presentationOrder: 4 },
      { fieldId: "primaryMeter", label: "HOURS", type: "number", fieldType: "number", editable: true, presentationOrder: 5 },
      { fieldId: "operatingStatus", label: "STATUS", type: "text", fieldType: "text", editable: true, presentationOrder: 6 }
    ],
    fields: { businessIdentifier: "142", year: 2023, make: "KOMATSU", model: "WA475-10", serialNumber: "KMTWA475XPA014821", primaryMeter: 4989, operatingStatus: "ACTIVE" },
    relationships: [
      { id: "c009-rel-1", displayLabel: "HOME YARD", displayName: "MIDLAND" },
      { id: "c009-rel-2", displayLabel: "ASSIGNED TO", displayName: "PROJECT 481" },
      { id: "c009-rel-3", displayLabel: "RESPONSIBLE TEAM", displayName: "FIELD OPERATIONS" }
    ],
    media: [], metadata: { sampleUse: "POWERED / SERIALIZED EQUIPMENT", nomenclature: { singular: "EQUIPMENT", plural: "EQUIPMENT" } }
  };
}

function card011Sample() {
  return {
    objectId: "preview-card-011", entityId: "aos-card-preview-entity", objectType: "customer-defined-object",
    singularLabel: "MATERIAL", pluralLabel: "MATERIALS", displayName: "HYDRAULIC HOSE · 3/4 IN", status: "active",
    capabilities: { canContain: false, canCreate: true, canTransact: true, editable: true, hasConsole: true, hasRail: true, hasRelationships: true },
    presentation: { detailsTitle: "STOCK PROFILE", relationshipsTitle: "RELATIONSHIPS", metricCaption: "AVAILABLE NOW", sampleUse: "INVENTORY / QUANTITY / CAPACITY" },
    fieldDefinitions: [
      { fieldId: "businessIdentifier", label: "ITEM #", type: "text", fieldType: "text", editable: true, presentationOrder: 0, semanticRole: "business-identifier", presentationRole: "business-identifier" },
      { fieldId: "available", label: "AVAILABLE", type: "number", fieldType: "number", editable: true, presentationOrder: 1 },
      { fieldId: "onHand", label: "ON HAND", type: "number", fieldType: "number", editable: true, presentationOrder: 2 },
      { fieldId: "committed", label: "COMMITTED", type: "number", fieldType: "number", editable: true, presentationOrder: 3 },
      { fieldId: "reorderPoint", label: "REORDER POINT", type: "number", fieldType: "number", editable: true, presentationOrder: 4 },
      { fieldId: "unitOfMeasure", label: "UOM", type: "text", fieldType: "text", editable: true, presentationOrder: 5 },
      { fieldId: "bin", label: "BIN", type: "text", fieldType: "text", editable: true, presentationOrder: 6 },
      { fieldId: "category", label: "CATEGORY", type: "text", fieldType: "text", editable: true, presentationOrder: 7 },
      { fieldId: "status", label: "STATUS", type: "text", fieldType: "text", editable: true, presentationOrder: 8 }
    ],
    fields: { businessIdentifier: "H-34019", available: 1842, onHand: 2264, committed: 422, reorderPoint: 600, unitOfMeasure: "FT", bin: "A-17-04", category: "HYDRAULICS", status: "ACTIVE" },
    relationships: [
      { id: "c011-rel-1", displayLabel: "WAREHOUSE", displayName: "MIDLAND PARTS" },
      { id: "c011-rel-2", displayLabel: "PREFERRED SOURCE", displayName: "GULF INDUSTRIAL SUPPLY" }
    ],
    media: [], metadata: { sampleUse: "INVENTORY / QUANTITY / CAPACITY", nomenclature: { singular: "MATERIAL", plural: "MATERIALS" } }
  };
}

function card012Sample() {
  return {
    objectId: "preview-card-012", entityId: "aos-card-preview-entity", objectType: "customer-defined-object",
    singularLabel: "PROJECT", pluralLabel: "PROJECTS", displayName: "WEST YARD EXPANSION", status: "active",
    capabilities: { canContain: true, canCreate: true, canTransact: true, editable: true, hasConsole: true, hasRail: true, hasRelationships: true },
    presentation: { relationshipsTitle: "RELATIONSHIPS", milestoneTitle: "NEXT MILESTONE", sampleUse: "PROJECT / LIFECYCLE / PROGRESS" },
    fieldDefinitions: [
      { fieldId: "businessIdentifier", label: "PROJECT #", type: "text", fieldType: "text", editable: true, presentationOrder: 0, semanticRole: "business-identifier", presentationRole: "business-identifier" },
      { fieldId: "status", label: "STATUS", type: "text", fieldType: "text", editable: true, presentationOrder: 1 },
      { fieldId: "progress", label: "PROGRESS", type: "number", fieldType: "number", editable: true, presentationOrder: 2 },
      { fieldId: "stage", label: "CURRENT STAGE", type: "text", fieldType: "text", editable: true, presentationOrder: 3 },
      { fieldId: "startDate", label: "START", type: "date", fieldType: "date", editable: true, presentationOrder: 4 },
      { fieldId: "targetDate", label: "TARGET", type: "date", fieldType: "date", editable: true, presentationOrder: 5 },
      { fieldId: "owner", label: "OWNER", type: "text", fieldType: "text", editable: true, presentationOrder: 6 },
      { fieldId: "nextMilestone", label: "NEXT MILESTONE", type: "text", fieldType: "text", editable: true, presentationOrder: 7 },
      { fieldId: "priority", label: "PRIORITY", type: "text", fieldType: "text", editable: true, presentationOrder: 8 },
      { fieldId: "phase", label: "PHASE", type: "text", fieldType: "text", editable: true, presentationOrder: 9 },
      { fieldId: "workstream", label: "WORKSTREAM", type: "text", fieldType: "text", editable: true, presentationOrder: 10 }
    ],
    fields: { businessIdentifier: "PX-481", status: "IN PROGRESS", progress: 68, stage: "SITE PREPARATION", startDate: "2026-07-06", targetDate: "2026-10-30", owner: "FIELD OPERATIONS", nextMilestone: "FOUNDATION RELEASE", priority: "HIGH", phase: "02", workstream: "CIVIL" },
    relationships: [
      { id: "c012-rel-1", displayLabel: "PRIMARY LOCATION", displayName: "MIDLAND YARD" },
      { id: "c012-rel-2", displayLabel: "RESPONSIBLE TEAM", displayName: "FIELD OPERATIONS" },
      { id: "c012-rel-3", displayLabel: "CUSTOMER", displayName: "WEST TEXAS INDUSTRIAL" }
    ],
    media: [], metadata: { sampleUse: "PROJECT / LIFECYCLE / PROGRESS", nomenclature: { singular: "PROJECT", plural: "PROJECTS" } }
  };
}

function card013Sample() {
  return {
    objectId: "preview-card-013", entityId: "aos-card-preview-entity", objectType: "customer-defined-object",
    singularLabel: "DOCUMENT", pluralLabel: "DOCUMENTS", displayName: "MIDLAND YARD · SITE PLAN REV C", status: "active",
    capabilities: { canContain: false, canCreate: true, canTransact: true, editable: true, hasConsole: true, hasRail: true, hasRelationships: true },
    presentation: { contentTitle: "PRIMARY CONTENT", relationshipsTitle: "RELATIONSHIPS", sampleUse: "DOCUMENT / DRAWING / KNOWLEDGE RECORD" },
    fieldDefinitions: [
      { fieldId: "businessIdentifier", label: "DOC #", type: "text", fieldType: "text", editable: true, presentationOrder: 0, semanticRole: "business-identifier", presentationRole: "business-identifier" },
      { fieldId: "documentType", label: "TYPE", type: "text", fieldType: "text", editable: true, presentationOrder: 1 },
      { fieldId: "version", label: "VERSION", type: "text", fieldType: "text", editable: true, presentationOrder: 2 },
      { fieldId: "status", label: "STATUS", type: "text", fieldType: "text", editable: true, presentationOrder: 3 },
      { fieldId: "effectiveDate", label: "EFFECTIVE", type: "date", fieldType: "date", editable: true, presentationOrder: 4 },
      { fieldId: "expirationDate", label: "EXPIRES", type: "date", fieldType: "date", editable: true, presentationOrder: 5 },
      { fieldId: "owner", label: "OWNER", type: "text", fieldType: "text", editable: true, presentationOrder: 6 },
      { fieldId: "discipline", label: "DISCIPLINE", type: "text", fieldType: "text", editable: true, presentationOrder: 7 },
      { fieldId: "classification", label: "CLASSIFICATION", type: "text", fieldType: "text", editable: true, presentationOrder: 8 },
      { fieldId: "revisionNote", label: "REVISION NOTE", type: "text", fieldType: "text", editable: true, presentationOrder: 9 }
    ],
    fields: { businessIdentifier: "SP-204-C", documentType: "SITE PLAN", version: "REV C", status: "CURRENT", effectiveDate: "2026-08-01", expirationDate: "", owner: "FACILITIES", discipline: "CIVIL", classification: "CONTROLLED", revisionNote: "WEST ACCESS UPDATE" },
    relationships: [
      { id: "c013-rel-1", displayLabel: "APPLIES TO", displayName: "MIDLAND YARD" },
      { id: "c013-rel-2", displayLabel: "RESPONSIBLE GROUP", displayName: "FACILITIES" },
      { id: "c013-rel-3", displayLabel: "RELATED PROJECT", displayName: "WEST YARD EXPANSION" }
    ],
    media: [], metadata: { sampleUse: "DOCUMENT / DRAWING / KNOWLEDGE RECORD", nomenclature: { singular: "DOCUMENT", plural: "DOCUMENTS" } }
  };
}

function card014Sample() {
  return {
    objectId: "preview-card-014", entityId: "aos-card-preview-entity", objectType: "customer-defined-object",
    singularLabel: "INCIDENT", pluralLabel: "INCIDENTS", displayName: "HYDRAULIC LEAK · BAY 3", status: "active",
    capabilities: { canContain: false, canCreate: true, canTransact: true, editable: true, hasConsole: true, hasRail: true, hasRelationships: true },
    presentation: { conditionTitle: "CONDITION / EVENT", currentStateTitle: "CURRENT CONDITION", evidenceTitle: "EVIDENCE / SUPPORTING DATA", relationshipsTitle: "RELATIONSHIPS", sampleUse: "INCIDENT / CONDITION / EXCEPTION" },
    fieldDefinitions: [
      { fieldId: "businessIdentifier", label: "INCIDENT #", type: "text", fieldType: "text", editable: true, presentationOrder: 0, semanticRole: "business-identifier", presentationRole: "business-identifier" },
      { fieldId: "severity", label: "SEVERITY", type: "text", fieldType: "text", editable: true, presentationOrder: 1 },
      { fieldId: "status", label: "STATUS", type: "text", fieldType: "text", editable: true, presentationOrder: 2 },
      { fieldId: "condition", label: "CONDITION / EVENT", type: "text", fieldType: "text", editable: true, presentationOrder: 3 },
      { fieldId: "occurredAt", label: "WHEN", type: "datetime", fieldType: "datetime", editable: true, presentationOrder: 4 },
      { fieldId: "location", label: "WHERE", type: "text", fieldType: "text", editable: true, presentationOrder: 5 },
      { fieldId: "relatedObject", label: "RELATED OBJECT", type: "text", fieldType: "text", editable: true, presentationOrder: 6 },
      { fieldId: "owner", label: "OWNER", type: "text", fieldType: "text", editable: true, presentationOrder: 7 },
      { fieldId: "currentCondition", label: "CURRENT CONDITION", type: "text", fieldType: "text", editable: true, presentationOrder: 8 },
      { fieldId: "reportedBy", label: "REPORTED BY", type: "text", fieldType: "text", editable: true, presentationOrder: 9 },
      { fieldId: "classification", label: "CLASSIFICATION", type: "text", fieldType: "text", editable: true, presentationOrder: 10 }
    ],
    fields: { businessIdentifier: "INC-2026-0418", severity: "HIGH", status: "OPEN", condition: "PRESSURIZED HYDRAULIC LEAK OBSERVED", occurredAt: "2026-08-16 14:32", location: "MIDLAND SHOP · BAY 3", relatedObject: "UNIT 142", owner: "SHOP OPERATIONS", currentCondition: "ISOLATED · AWAITING ASSESSMENT", reportedBy: "J. SMITH", classification: "SAFETY / EQUIPMENT" },
    relationships: [
      { id: "c014-rel-1", displayLabel: "APPLIES TO", displayName: "UNIT 142" },
      { id: "c014-rel-2", displayLabel: "OCCURRED AT", displayName: "MIDLAND SHOP · BAY 3" },
      { id: "c014-rel-3", displayLabel: "RESPONSIBLE GROUP", displayName: "SHOP OPERATIONS" }
    ],
    media: [], metadata: { sampleUse: "INCIDENT / CONDITION / EXCEPTION", nomenclature: { singular: "INCIDENT", plural: "INCIDENTS" } }
  };
}

function card015Sample() {
  return {
    objectId: "preview-card-015", entityId: "aos-card-preview-entity", objectType: "customer-defined-object",
    singularLabel: "AGREEMENT", pluralLabel: "AGREEMENTS", displayName: "MIDLAND FACILITY SERVICE AGREEMENT", status: "active",
    capabilities: { canContain: false, canCreate: true, canTransact: true, editable: true, hasConsole: true, hasRail: true, hasRelationships: true },
    presentation: { obligationTitle: "OBLIGATION / COVERAGE", relationshipsTitle: "RELATIONSHIPS", sampleUse: "AGREEMENT / OBLIGATION / EXPIRY" },
    fieldDefinitions: [
      { fieldId: "businessIdentifier", label: "AGREEMENT #", type: "text", fieldType: "text", editable: true, presentationOrder: 0, semanticRole: "business-identifier", presentationRole: "business-identifier" },
      { fieldId: "state", label: "STATE", type: "text", fieldType: "text", editable: true, presentationOrder: 1 },
      { fieldId: "party", label: "PARTY", type: "text", fieldType: "text", editable: true, presentationOrder: 2 },
      { fieldId: "counterparty", label: "COUNTERPARTY", type: "text", fieldType: "text", editable: true, presentationOrder: 3 },
      { fieldId: "effectiveDate", label: "EFFECTIVE", type: "date", fieldType: "date", editable: true, presentationOrder: 4 },
      { fieldId: "expirationDate", label: "EXPIRES", type: "date", fieldType: "date", editable: true, presentationOrder: 5 },
      { fieldId: "renewalDate", label: "RENEWAL", type: "date", fieldType: "date", editable: true, presentationOrder: 6 },
      { fieldId: "noticeDate", label: "NOTICE DATE", type: "date", fieldType: "date", editable: true, presentationOrder: 7 },
      { fieldId: "obligation", label: "OBLIGATION / COVERAGE", type: "text", fieldType: "text", editable: true, presentationOrder: 8 },
      { fieldId: "owner", label: "OWNER", type: "text", fieldType: "text", editable: true, presentationOrder: 9 },
      { fieldId: "classification", label: "CLASSIFICATION", type: "text", fieldType: "text", editable: true, presentationOrder: 10 },
      { fieldId: "renewalType", label: "RENEWAL TYPE", type: "text", fieldType: "text", editable: true, presentationOrder: 11 }
    ],
    fields: { businessIdentifier: "SA-2048", state: "ACTIVE", party: "WEST TEXAS OPERATIONS", counterparty: "GULF INDUSTRIAL SERVICES", effectiveDate: "2026-01-01", expirationDate: "2026-12-31", renewalDate: "2027-01-01", noticeDate: "2026-11-30", obligation: "PREVENTIVE SERVICE COVERAGE FOR DESIGNATED FACILITY SYSTEMS", owner: "FACILITIES", classification: "SERVICE AGREEMENT", renewalType: "ANNUAL" },
    relationships: [
      { id: "c015-rel-1", displayLabel: "APPLIES TO", displayName: "MIDLAND FACILITY" },
      { id: "c015-rel-2", displayLabel: "RESPONSIBLE GROUP", displayName: "FACILITIES" },
      { id: "c015-rel-3", displayLabel: "COUNTERPARTY", displayName: "GULF INDUSTRIAL SERVICES" }
    ],
    media: [], metadata: { sampleUse: "AGREEMENT / OBLIGATION / EXPIRY", nomenclature: { singular: "AGREEMENT", plural: "AGREEMENTS" } }
  };
}

function card016Sample() {
  return {
    objectId: "preview-card-016", entityId: "aos-card-preview-entity", objectType: "customer-defined-object",
    singularLabel: "TRIP", pluralLabel: "TRIPS", displayName: "MIDLAND → ODESSA · RUN 184", status: "active",
    capabilities: { canContain: false, canCreate: true, canTransact: true, editable: true, hasConsole: true, hasRail: true, hasRelationships: true },
    presentation: { sequenceTitle: "ROUTE / SEQUENCE", relationshipsTitle: "RELATIONSHIPS", sampleUse: "TIME / SEQUENCE / MOVEMENT" },
    fieldDefinitions: [
      { fieldId: "businessIdentifier", label: "RUN #", type: "text", fieldType: "text", editable: true, presentationOrder: 0, semanticRole: "business-identifier", presentationRole: "business-identifier" },
      { fieldId: "state", label: "STATE", type: "text", fieldType: "text", editable: true, presentationOrder: 1 },
      { fieldId: "date", label: "DATE", type: "date", fieldType: "date", editable: true, presentationOrder: 2 },
      { fieldId: "startTime", label: "START", type: "time", fieldType: "time", editable: true, presentationOrder: 3 },
      { fieldId: "endTime", label: "TARGET", type: "time", fieldType: "time", editable: true, presentationOrder: 4 },
      { fieldId: "origin", label: "ORIGIN", type: "text", fieldType: "text", editable: true, presentationOrder: 5 },
      { fieldId: "destination", label: "DESTINATION", type: "text", fieldType: "text", editable: true, presentationOrder: 6 },
      { fieldId: "stepOne", label: "STOP 1", type: "text", fieldType: "text", editable: true, presentationOrder: 7 },
      { fieldId: "stepTwo", label: "STOP 2", type: "text", fieldType: "text", editable: true, presentationOrder: 8 },
      { fieldId: "assigned", label: "ASSIGNED TO", type: "text", fieldType: "text", editable: true, presentationOrder: 9 },
      { fieldId: "related", label: "RELATED OBJECT", type: "text", fieldType: "text", editable: true, presentationOrder: 10 },
      { fieldId: "priority", label: "PRIORITY", type: "text", fieldType: "text", editable: true, presentationOrder: 11 }
    ],
    fields: { businessIdentifier: "184", state: "SCHEDULED", date: "2026-08-18", startTime: "07:00", endTime: "11:30", origin: "MIDLAND YARD", destination: "ODESSA SITE 12", stepOne: "WEST TERMINAL", stepTwo: "NORTH STAGING", assigned: "CREW 18", related: "UNIT 142", priority: "STANDARD" },
    relationships: [
      { id: "c016-rel-1", displayLabel: "ASSIGNED CREW", displayName: "CREW 18" },
      { id: "c016-rel-2", displayLabel: "RELATED UNIT", displayName: "UNIT 142" },
      { id: "c016-rel-3", displayLabel: "DESTINATION", displayName: "ODESSA SITE 12" }
    ],
    media: [], metadata: { sampleUse: "TIME / SEQUENCE / MOVEMENT", nomenclature: { singular: "TRIP", plural: "TRIPS" } }
  };
}

function card017Sample() {
  return {
    objectId: "preview-card-017", entityId: "aos-card-preview-entity", objectType: "customer-defined-container",
    singularLabel: "GROUP", pluralLabel: "GROUPS", displayName: "EQUIPMENT", status: "active",
    capabilities: { canContain: true, canCreate: true, canTransact: true, editable: true, hasConsole: true, hasRail: true, hasRelationships: true },
    presentation: { directChildrenLabel: "DIRECT GROUPS", descendantsLabel: "TOTAL BELOW", totalDescendants: 131, structureTitle: "STRUCTURE", relationshipsTitle: "RELATIONSHIPS", emptyContainerLabel: "READY TO RECEIVE", sampleUse: "STRUCTURAL HIERARCHY / DIRECTORY" },
    fieldDefinitions: [
      { fieldId: "businessIdentifier", label: "ID #", type: "text", fieldType: "text", editable: true, presentationOrder: 0, semanticRole: "business-identifier", presentationRole: "business-identifier" },
      { fieldId: "status", label: "STATUS", type: "text", fieldType: "text", editable: true, presentationOrder: 1 },
      { fieldId: "region", label: "REGION", type: "text", fieldType: "text", editable: true, presentationOrder: 2 },
      { fieldId: "owner", label: "OWNER", type: "text", fieldType: "text", editable: true, presentationOrder: 3 },
      { fieldId: "notes", label: "NOTES", type: "text", fieldType: "text", editable: true, presentationOrder: 4 }
    ],
    fields: { businessIdentifier: "EQ-GROUP", status: "ACTIVE", region: "WEST TEXAS", owner: "FIELD OPERATIONS", notes: "CUSTOMER DEFINED STRUCTURE" },
    relationships: [
      { id: "c017-rel-1", displayLabel: "RESPONSIBLE GROUP", displayName: "FIELD OPERATIONS" },
      { id: "c017-rel-2", displayLabel: "PRIMARY REGION", displayName: "WEST TEXAS" }
    ],
    media: [], metadata: { sampleUse: "STRUCTURAL HIERARCHY / DIRECTORY", nomenclature: { singular: "GROUP", plural: "GROUPS" } }
  };
}

function card017Items() {
  return [
    { objectId: "c017-child-1", objectType: "customer-defined-container", singularLabel: "GROUP", displayName: "BULLDOZERS", presentation: { directChildCount: 18, structuralDescriptor: "GROUP" }, fields: {}, fieldDefinitions: [], relationships: [], media: [] },
    { objectId: "c017-child-2", objectType: "customer-defined-container", singularLabel: "GROUP", displayName: "EXCAVATORS", presentation: { directChildCount: 32, structuralDescriptor: "GROUP" }, fields: {}, fieldDefinitions: [], relationships: [], media: [] },
    { objectId: "c017-child-3", objectType: "customer-defined-container", singularLabel: "GROUP", displayName: "WHEEL LOADERS", presentation: { directChildCount: 21, structuralDescriptor: "GROUP" }, fields: {}, fieldDefinitions: [], relationships: [], media: [] },
    { objectId: "c017-child-4", objectType: "customer-defined-container", singularLabel: "GROUP", displayName: "TRUCKS", presentation: { directChildCount: 60, structuralDescriptor: "GROUP" }, fields: {}, fieldDefinitions: [], relationships: [], media: [] }
  ];
}

function previewObject(template = {}, sample = {}) {
  const cardNumber = resolveCatalogCardNumber(template);
  const hasSampleFields = Object.keys(safeObject(sample?.fields)).length > 0;
  let resolvedSample = sample;
  if (!hasSampleFields) {
    if (cardNumber === 7) resolvedSample = universal007Sample();
    else if (cardNumber === 9) resolvedSample = card009Sample();
    else if (cardNumber === 11) resolvedSample = card011Sample();
    else if (cardNumber === 12) resolvedSample = card012Sample();
    else if (cardNumber === 13) resolvedSample = card013Sample();
    else if (cardNumber === 14) resolvedSample = card014Sample();
    else if (cardNumber === 15) resolvedSample = card015Sample();
    else if (cardNumber === 16) resolvedSample = card016Sample();
    else if (cardNumber === 17) resolvedSample = card017Sample();
  }
  const sampleFields = safeObject(resolvedSample?.fields);
  const templateFieldSchema = Array.isArray(template?.fieldSchema) ? template.fieldSchema : [];
  const sampleFieldDefinitions = Array.isArray(resolvedSample?.fieldDefinitions) ? resolvedSample.fieldDefinitions : [];
  const fieldDefinitions = sampleFieldDefinitions.length ? sampleFieldDefinitions : templateFieldSchema.map(item => ({
    ...item,
    fieldId: clean(item?.fieldId || item?.field),
    label: clean(item?.label),
    fieldType: clean(item?.fieldType || item?.type),
    presentationRole: clean(item?.presentationRole || item?.semanticRole || item?.presentation?.role)
  })).filter(item => item.fieldId);

  return {
    ...resolvedSample,
    objectId: clean(resolvedSample?.objectId) || "aos-card-catalog-preview",
    entityId: clean(resolvedSample?.entityId) || "aos-card-catalog-entity",
    objectType: clean(resolvedSample?.objectType) || clean(template?.baseObjectType) || "generic",
    templateType: clean(template?.baseObjectType) || clean(resolvedSample?.templateType) || "generic",
    templateSlug: clean(template?.templateSlug),
    templateVersion: Number(template?.version || 1),
    templateNumber: Number(template?.templateNumber || 0),
    displayName: clean(resolvedSample?.displayName) || clean(template?.label) || "AOS OBJECT",
    singularLabel: clean(resolvedSample?.singularLabel),
    pluralLabel: clean(resolvedSample?.pluralLabel),
    status: clean(resolvedSample?.status) || "active",
    value: resolvedSample?.value ?? null,
    currency: clean(resolvedSample?.currency) || "USD",
    fields: sampleFields,
    fieldDefinitions,
    relationships: Array.isArray(resolvedSample?.relationships) ? resolvedSample.relationships : [],
    infrastructure: Array.isArray(resolvedSample?.infrastructure) ? resolvedSample.infrastructure : [],
    media: Array.isArray(resolvedSample?.media) ? resolvedSample.media : [],
    presentation: { ...safeObject(template?.presentation), ...safeObject(resolvedSample?.presentation) },
    capabilities: { ...safeObject(template?.capabilities), ...safeObject(resolvedSample?.capabilities) },
    permissions: { ...safeObject(template?.permissions), ...safeObject(resolvedSample?.permissions) },
    effectivePermissions: { ...safeObject(template?.effectivePermissions), ...safeObject(resolvedSample?.effectivePermissions) },
    metadata: { source: "aos-card-catalog-preview", ...safeObject(resolvedSample?.metadata) }
  };
}

function getFaceConfig(object = {}, faceNumber = 1) {
  const faces = object?.presentation?.faces;
  if (Array.isArray(faces)) return safeObject(faces.find(item => Number(item?.face || item?.faceNumber || item?.index) === Number(faceNumber)));
  if (faces && typeof faces === "object") return safeObject(faces[String(faceNumber)] || faces[faceNumber]);
  return {};
}
function getFaceLabel(object = {}, faceNumber = 1) {
  if (faceNumber === 1) return "OVERVIEW";
  const config = getFaceConfig(object, faceNumber);
  return clean(config?.shortLabel || config?.title || config?.label) || `FACE ${faceNumber}`;
}
function getInitialPreviewItems(template = {}, directItems = []) {
  const items = Array.isArray(directItems) ? directItems : [];
  if (items.length) return items;
  const cardNumber = resolveCatalogCardNumber(template);
  if (cardNumber === 7) return getUniversal007PreviewItems();
  if (cardNumber === 17) return card017Items();
  return [];
}

export default function IXIAosCardCatalogPreview({ template = null, sampleData = {}, projection = null, directItems = [], parentLabel = "", skinId = "ixi:skin:default", onSaveObject = null }) {
  const [state, setState] = useState({});
  const [face, setFace] = useState(1);
  const [transactOpen, setTransactOpen] = useState(false);
  const [previewObjectOverride, setPreviewObjectOverride] = useState(null);
  const [previewItems, setPreviewItems] = useState(() => getInitialPreviewItems(template || {}, directItems));
  const baseObject = useMemo(() => previewObject(template || {}, sampleData), [template, sampleData]);

  useEffect(() => {
    setPreviewObjectOverride(null);
    setTransactOpen(false);
    setFace(1);
    setPreviewItems(getInitialPreviewItems(template || {}, directItems));
  }, [template?.templateSlug, sampleData, directItems]);

  const object = previewObjectOverride || baseObject;
  const definition = useMemo(() => template ? adaptAosCardTemplate({ template, object }) : null, [template, object]);
  if (!template) return <div className="preview-error">NO CARD SELECTED</div>;

  function update(id, patch = {}) {
    const key = clean(id) || object.objectId;
    setState(current => ({ ...current, [key]: { ...(current[key] || {}), ...patch } }));
  }
  async function savePreview(payload = {}) {
    const next = payload?.object && typeof payload.object === "object" ? payload.object : {
      ...object,
      displayName: payload?.displayName ?? object.displayName,
      fields: payload?.fields ?? object.fields,
      fieldDefinitions: payload?.fieldDefinitions ?? object.fieldDefinitions,
      metadata: payload?.metadata ?? object.metadata,
      media: payload?.media ?? object.media
    };
    setPreviewObjectOverride(next);
    await onSaveObject?.(payload);
    return next;
  }
  function addPreviewChild(parentObject) {
    const nextIndex = previewItems.length + 1;
    const child = {
      objectId: `preview-child-${Date.now()}-${nextIndex}`,
      entityId: parentObject?.entityId || "aos-card-preview-entity",
      objectType: "generic",
      singularLabel: "OBJECT",
      displayName: `NEW OBJECT ${nextIndex}`,
      fields: {}, fieldDefinitions: [], relationships: [], media: [], metadata: { previewOnly: true }
    };
    setPreviewItems(current => [...current, child]);
  }

  const current = state[object.objectId] || {};
  const cardNumber = resolveCatalogCardNumber(template);
  const ContainerCard = cardNumber === 4 ? IXIAosCard004Personnel : cardNumber === 5 ? IXIAosCard005Personnel : cardNumber === 6 ? IXIAosCard006Personnel : null;
  const numberedObjectCards = { 7: IXIAosCard007EmployeeApplication, 8: IXIAosCard008Profile, 9: IXIAosCard009, 10: IXIAosCard010, 11: IXIAosCard011, 12: IXIAosCard012, 13: IXIAosCard013, 14: IXIAosCard014, 15: IXIAosCard015, 16: IXIAosCard016, 17: IXIAosCard017 };

  if (transactOpen) {
    return <IXIFaceLabScaledCard objectFamily="private" surfaceLabel="Face Lab AOS Cards"><IXITransactObjectConsole object={object} ixiState={current} onIxiStateChange={update} onClose={() => setTransactOpen(false)} /></IXIFaceLabScaledCard>;
  }

  if (ContainerCard) {
    return <IXIFaceLabScaledCard objectFamily="private" surfaceLabel="Face Lab AOS Cards"><ContainerCard object={object} children={previewItems} ixiState={current} onIxiStateChange={update} onSaveObject={savePreview} onAddObject={addPreviewChild} onOpenTransact={() => setTransactOpen(true)} skinId="v12" /></IXIFaceLabScaledCard>;
  }

  const NumberedObjectCard = numberedObjectCards[cardNumber];
  if (NumberedObjectCard) {
    return <IXIFaceLabScaledCard objectFamily="private" surfaceLabel="Face Lab AOS Cards"><NumberedObjectCard object={object} children={previewItems} projection={projection} ixiState={current} onIxiStateChange={update} onSaveObject={savePreview} onAddObject={addPreviewChild} onOpenTransact={() => setTransactOpen(true)} skinId="v12" /></IXIFaceLabScaledCard>;
  }

  if ([1,2,3].includes(cardNumber)) {
    const faceNumbers = [1,2,3,4,5];
    return (
      <div className="numbered-container-preview">
        <div className="face-switch">{faceNumbers.map(faceNumber => <button key={faceNumber} type="button" className={face === faceNumber ? "active" : ""} onClick={() => setFace(faceNumber)}><b>F{faceNumber}</b><small>{getFaceLabel(object, faceNumber)}</small></button>)}</div>
        <IXIFaceLabScaledCard objectFamily="private" surfaceLabel="Face Lab AOS Cards"><IXIAosLocationObjectConsole cardNumber={cardNumber} object={object} projection={projection} objects={previewItems} ixiState={current} onIxiStateChange={update} onSaveObject={savePreview} onAddObject={addPreviewChild} primaryFace={face} onPrimaryFaceChange={setFace} onOpenTransact={() => setTransactOpen(true)} /></IXIFaceLabScaledCard>
        <style jsx>{`.numbered-container-preview{width:max-content;display:flex;flex-direction:column;align-items:center;gap:7px;overflow:visible}.face-switch{width:300px;height:35px;display:grid;grid-template-columns:repeat(5,1fr);gap:3px;padding:3px;border:1px solid #292d2b;border-radius:8px;background:#0d0f0e}.face-switch button{height:27px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:2px 3px;border:1px solid transparent;border-radius:5px;background:transparent;color:#777}.face-switch b{font-size:6px}.face-switch small{max-width:100%;overflow:hidden;font-size:4.2px;font-weight:850;text-overflow:ellipsis;white-space:nowrap}.face-switch .active{border-color:rgba(255,196,0,.52);background:rgba(255,196,0,.07);color:#ffc400}`}</style>
      </div>
    );
  }

  if (!definition) return <div className="preview-error">CARD DEFINITION FAILED</div>;
  return <IXIFaceLabScaledCard objectFamily="private" surfaceLabel="Face Lab AOS Cards"><IXIAosCommandAwareObjectConsole object={object} objectId={object.objectId} projection={projection} objects={previewItems} cardDefinition={definition} skinId={skinId} parentLabel={clean(parentLabel) || clean(template.librarySection) || "AOS"} ixiCardState={{}} updateIxiCardState={null} previewCardState={current} updatePreviewCardState={update} renderModule={null} studioEditing={false} selectedModuleId="" onSelectModule={null} onSelectFace={null} onCreateFace={null} enableCardScaling={false} cardScaleMode="xl" onOpenTransact={() => setTransactOpen(true)} /></IXIFaceLabScaledCard>;
}

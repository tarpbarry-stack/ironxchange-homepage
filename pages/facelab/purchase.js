import { useState } from "react";

import IXITransactFaceLabFrame from "../../components/ixi-face-studio/IXITransactFaceLabFrame";
import IXIPurchaseCard from "../../components/ixi-aos/transact/modules/purchase/IXIPurchaseCard";
import { applyIXIPurchaseAction } from "../../components/ixi-aos/transact/modules/purchase/IXIPurchaseRecordEngine";

const context = {
  primary: {
    objectId: "MACHINE-CAT-336",
    passportId: "PASS-CAT-336",
    objectType: "machine",
    label: "CAT 336"
  },
  location: {
    objectId: "LOC-MIDLAND",
    passportId: "PASS-MIDLAND",
    objectType: "location",
    label: "Midland Yard"
  },
  actor: {
    employeeId: "EMP-MIKE",
    passportId: "PASS-MIKE",
    displayName: "Mike Thompson",
    roles: ["manager"],
    purchasingAuthority: {
      roles: ["manager"],
      approvalLimit: 5000,
      directPoLimit: 2500,
      canIssuePo: true,
      canReceive: true,
      seeCosts: true,
      canMatchBill: true
    }
  },
  permissions: [
    "purchase:approve",
    "purchase:issue-po",
    "purchase:receive",
    "purchase:see-costs",
    "purchase:match-bill"
  ]
};

const initialRecord = {
  schema: "ixi-purchase-record-v2",
  identity: {
    purchaseId: "PUR-1023",
    clientRequestId: "PUR-1023",
    requestNumber: "PR-1023",
    poNumber: ""
  },
  context: {
    primaryPassportId: "PASS-CAT-336",
    primaryObjectId: "MACHINE-CAT-336",
    primaryObjectType: "machine",
    primaryObjectLabel: "CAT 336",
    locationPassportId: "PASS-MIDLAND",
    locationId: "LOC-MIDLAND",
    locationLabel: "Midland Yard",
    employeePassportId: "PASS-JOHN",
    employeeId: "EMP-JOHN",
    employeeLabel: "John Carter",
    workOrderId: "WO-ID-1058",
    workOrderNumber: "WO-1058"
  },
  purchase: {
    requestType: "purchase-request",
    vendorLabel: "Hydraulic Supply Co.",
    neededByDate: "2026-05-18",
    priority: "high",
    whatNeeded: "CAT 336 hydraulic pump seal kit, filter and oil.",
    businessReason: "CAT 336 hydraulic pump is leaking. Need parts to complete repair and return machine to service.",
    shipToLabel: "Midland Yard",
    chargeTo: "WO-1058",
    costCode: "REPAIR-PARTS",
    currency: "USD",
    requestedById: "EMP-JOHN",
    requestedByLabel: "John Carter",
    requestedAt: "2026-05-15T15:32:00.000Z",
    items: [
      { lineId: "L1", description: "Hydraulic Pump Seal Kit", quantity: 1, unit: "EA", estimatedUnitCost: 245, committedUnitCost: 245, receivedQuantity: 0, remainingQuantity: 1 },
      { lineId: "L2", description: "Hydraulic Filter", quantity: 1, unit: "EA", estimatedUnitCost: 38, committedUnitCost: 38, receivedQuantity: 0, remainingQuantity: 1 },
      { lineId: "L3", description: "Hydraulic Oil (5 Gal)", quantity: 2, unit: "EA", estimatedUnitCost: 72.5, committedUnitCost: 72.5, receivedQuantity: 0, remainingQuantity: 2 }
    ],
    subtotal: 428,
    estimatedShipping: 25,
    estimatedTotal: 453,
    quoteCount: 0,
    attachments: []
  },
  approval: {
    status: "pending",
    requiredRole: "supervisor",
    requiredRoleLabel: "Supervisor",
    requiredAuthority: 500,
    currentApproverId: "EMP-MIKE",
    currentApproverLabel: "Mike Thompson",
    approvals: []
  },
  receiving: {
    lines: [
      { lineId: "L1", description: "Hydraulic Pump Seal Kit", quantity: 1, unit: "EA", estimatedUnitCost: 245, committedUnitCost: 245, receivedQuantity: 0, remainingQuantity: 1 },
      { lineId: "L2", description: "Hydraulic Filter", quantity: 1, unit: "EA", estimatedUnitCost: 38, committedUnitCost: 38, receivedQuantity: 0, remainingQuantity: 1 },
      { lineId: "L3", description: "Hydraulic Oil (5 Gal)", quantity: 2, unit: "EA", estimatedUnitCost: 72.5, committedUnitCost: 72.5, receivedQuantity: 0, remainingQuantity: 2 }
    ],
    orderedQuantity: 4,
    receivedQuantity: 0,
    remainingQuantity: 4,
    percentReceived: 0,
    complete: false
  },
  costs: {
    estimated: 453,
    committed: 0,
    billed: 0,
    paid: 0,
    variance: 0
  },
  bills: [],
  documents: [],
  notes: [],
  related: [
    { id: "MACHINE-CAT-336", label: "CAT 336", type: "Machine" },
    { id: "WO-ID-1058", label: "WO-1058", type: "Work Order" },
    { id: "LOC-MIDLAND", label: "Midland Yard", type: "Location" },
    { id: "EMP-JOHN", label: "John Carter", type: "Employee" },
    { id: "VENDOR-HYDRAULIC", label: "Hydraulic Supply Co.", type: "Vendor" }
  ],
  timeline: [
    { activityId: "A1", type: "request-created", label: "Purchase Request PR-1023 created", actorLabel: "John Carter", occurredAt: "2026-05-15T15:32:00.000Z", note: "" }
  ],
  status: "pending-approval",
  updatedAt: "2026-05-15T15:32:00.000Z",
  version: 1
};

export default function PurchaseFaceLabPage() {
  const [record, setRecord] = useState(initialRecord);
  const [language, setLanguage] = useState("en");
  const [error, setError] = useState("");

  function onAction(action, payload = {}) {
    try {
      const next = applyIXIPurchaseAction({
        record,
        action,
        context,
        actor: context.actor,
        authority: context.actor.purchasingAuthority,
        payload
      });
      setRecord(next);
      setError("");
    } catch (err) {
      setError(String(err?.message || err || "Purchase action failed."));
    }
  }

  return (
    <IXITransactFaceLabFrame title="PURCHASE ORDER · 3 FACE RECORD" route="/facelab/purchase">
      <IXIPurchaseCard
        record={record}
        context={context}
        authority={context.actor.purchasingAuthority}
        language={language}
        onLanguageChange={setLanguage}
        onAction={onAction}
        error={error}
      />
    </IXITransactFaceLabFrame>
  );
}

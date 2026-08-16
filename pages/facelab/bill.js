import { useState } from "react";

import IXITransactFaceLabFrame from "../../components/ixi-face-studio/IXITransactFaceLabFrame";
import IXIBillStandaloneApp from "../../components/ixi-aos/transact/modules/bill/IXIBillStandaloneApp";

const context = {
  primary: {
    objectId: "LOC-MIDLAND",
    passportId: "PASS-MIDLAND",
    objectType: "location",
    label: "MIDLAND YARD"
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
    roles: ["manager", "accounting"],
    billAuthority: {
      roles: ["manager", "accounting"],
      canApproveBills: true,
      billApprovalLimit: 5000,
      canApproveBillVariance: true,
      billVarianceLimit: 500,
      canPayBills: true,
      canVoidBills: true
    }
  },
  entity: {
    passportId: "PASS-IXI-HOLDINGS",
    objectType: "entity",
    label: "IronXchange Holdings LLC"
  },
  permissions: ["bill:approve", "bill:pay", "bill:void", "bill:variance"]
};

const initialRecords = [
  {
    schema: "ixi-bill-record-v1",
    identity: {
      billRecordId: "BILL-19482",
      billDocumentId: "FIN-BILL-19482",
      billNumber: "BILL-19482",
      invoiceNumber: "884921",
      clientRequestId: "BILL-19482"
    },
    context: {
      primaryObjectId: "LOC-MIDLAND",
      primaryObjectLabel: "Midland Yard",
      primaryObjectType: "location",
      locationObjectId: "LOC-MIDLAND",
      locationLabel: "Midland Yard",
      employeeId: "EMP-JOHN",
      employeeLabel: "John Carter"
    },
    bill: {
      vendorLabel: "TXU Energy",
      description: "Electric service — August",
      category: "Electric / Utilities",
      amount: 4250,
      currency: "USD",
      invoiceDate: "2026-08-12",
      dueDate: "2026-08-28",
      notes: "Billing period 08/01/2026 – 08/31/2026. Account # 123-456-7890.",
      attachments: [{
        documentId: "DOC-884921",
        fileName: "Invoice 884921.pdf",
        mimeType: "application/pdf",
        size: 184200,
        status: "attached"
      }]
    },
    purchaseMatch: {
      purchaseOrderId: "",
      purchaseOrderNumber: "",
      poCommittedAmount: 0,
      receivedAmount: 0,
      receivedComplete: false,
      billedAmount: 4250,
      variance: 0,
      status: "n/a",
      varianceApproval: null
    },
    approval: {
      status: "pending",
      requiredAuthority: 5000,
      requiredRole: "manager",
      requiredRoleLabel: "Manager",
      currentApproverId: "EMP-MIKE",
      currentApproverLabel: "Mike Thompson",
      approvedById: "",
      approvedByLabel: "",
      approvedAt: ""
    },
    payment: {
      status: "unpaid",
      scheduledDate: "",
      paidDate: "",
      amountPaid: 0,
      method: "",
      reference: "",
      paidById: "",
      paidByLabel: ""
    },
    status: "open",
    documents: [{
      documentId: "DOC-884921",
      fileName: "Invoice 884921.pdf",
      mimeType: "application/pdf",
      size: 184200,
      status: "attached"
    }],
    related: [
      { id: "LOC-MIDLAND", label: "Midland Yard", type: "location" },
      { id: "EMP-JOHN", label: "John Carter", type: "employee" }
    ],
    timeline: [{
      activityId: "ACT-BILL-19482",
      type: "bill-created",
      label: "Bill created",
      actorLabel: "John Carter",
      occurredAt: "2026-08-12T19:13:00.000Z"
    }],
    audit: {
      createdAt: "2026-08-12T19:13:00.000Z",
      createdById: "EMP-JOHN",
      createdByLabel: "John Carter",
      updatedAt: "2026-08-12T19:13:00.000Z",
      version: 1
    }
  },
  {
    schema: "ixi-bill-record-v1",
    identity: {
      billRecordId: "BILL-19483",
      billDocumentId: "FIN-BILL-19483",
      billNumber: "BILL-19483",
      invoiceNumber: "INV-78451",
      clientRequestId: "BILL-19483"
    },
    context: {
      primaryObjectId: "LOC-MIDLAND",
      primaryObjectLabel: "Midland Yard",
      primaryObjectType: "location",
      locationObjectId: "LOC-MIDLAND",
      locationLabel: "Midland Yard",
      employeeId: "EMP-JOHN",
      employeeLabel: "John Carter"
    },
    bill: {
      vendorLabel: "Hydraulic Supply Co.",
      description: "CAT 336 hydraulic repair parts",
      category: "Parts / Fittings",
      amount: 482.17,
      currency: "USD",
      invoiceDate: "2026-05-18",
      dueDate: "2026-06-17",
      notes: "Vendor invoice for PO-2048.",
      attachments: []
    },
    purchaseMatch: {
      purchaseOrderId: "PO-ID-2048",
      purchaseOrderNumber: "PO-2048",
      poCommittedAmount: 468,
      receivedAmount: 468,
      receivedComplete: true,
      billedAmount: 482.17,
      variance: 14.17,
      status: "exception",
      varianceApproval: null
    },
    approval: {
      status: "approved",
      requiredAuthority: 500,
      requiredRole: "supervisor",
      requiredRoleLabel: "Supervisor",
      currentApproverId: "EMP-MIKE",
      currentApproverLabel: "Mike Thompson",
      approvedById: "EMP-MIKE",
      approvedByLabel: "Mike Thompson",
      approvedAt: "2026-05-18T14:22:00.000Z"
    },
    payment: {
      status: "unpaid",
      scheduledDate: "",
      paidDate: "",
      amountPaid: 0,
      method: "",
      reference: "",
      paidById: "",
      paidByLabel: ""
    },
    status: "approved",
    documents: [],
    related: [
      { id: "PO-ID-2048", label: "PO-2048", type: "purchase-order" },
      { id: "LOC-MIDLAND", label: "Midland Yard", type: "location" }
    ],
    timeline: [{
      activityId: "ACT-BILL-19483",
      type: "bill-created",
      label: "Bill matched to PO-2048 with variance",
      actorLabel: "Sarah Jones",
      occurredAt: "2026-05-18T13:58:00.000Z"
    }],
    audit: {
      createdAt: "2026-05-18T13:58:00.000Z",
      createdById: "EMP-SARAH",
      createdByLabel: "Sarah Jones",
      updatedAt: "2026-05-18T14:22:00.000Z",
      version: 2
    }
  }
];

export default function BillFaceLabPage() {
  const [language, setLanguage] = useState("en");
  const [records, setRecords] = useState(initialRecords);

  async function onRecordChange(nextRecord) {
    const id = nextRecord?.identity?.billRecordId || nextRecord?.identity?.billDocumentId;
    setRecords(current => {
      const exists = current.some(item => (item?.identity?.billRecordId || item?.identity?.billDocumentId) === id);
      return exists
        ? current.map(item => (item?.identity?.billRecordId || item?.identity?.billDocumentId) === id ? nextRecord : item)
        : [...current, nextRecord];
    });
  }

  return (
    <IXITransactFaceLabFrame title="BILL / INVOICE · STANDALONE MODULE" route="/facelab/bill">
      <IXIBillStandaloneApp
        context={context}
        object={context.primary}
        initialRecords={records}
        authority={context.actor.billAuthority}
        language={language}
        onLanguageChange={setLanguage}
        onRecordChange={onRecordChange}
      />
    </IXITransactFaceLabFrame>
  );
}

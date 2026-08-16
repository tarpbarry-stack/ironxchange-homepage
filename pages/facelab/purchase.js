import IXITransactFaceLabFrame from "../../components/ixi-face-studio/IXITransactFaceLabFrame";
import IXIPurchaseOrderApp from "../../components/ixi-aos/transact/modules/purchase-order/IXIPurchaseOrderApp";

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
      canMatchBill: true,
      varianceLimit: 500
    }
  },
  permissions: [
    "purchase:issue-po",
    "purchase:receive",
    "purchase:see-costs",
    "purchase:match-bill"
  ]
};

const approvedRequestSource = {
  identity: {
    purchaseId: "PUR-1023",
    purchaseNumber: "PR-1023"
  },
  context: {
    primaryPassportId: "PASS-CAT-336",
    primaryObjectId: "MACHINE-CAT-336",
    workOrderId: "WO-ID-1058",
    workOrderNumber: "WO-1058"
  },
  purchase: {
    vendorId: "VENDOR-HYDRAULIC",
    vendorLabel: "Hydraulic Supply Co.",
    neededByDate: "2026-08-18",
    priority: "high",
    description: "CAT 336 hydraulic pump seal kit, filter and oil.",
    businessReason: "CAT 336 hydraulic pump is leaking. Parts are required to complete WO-1058 and return the machine to service.",
    shipToLabel: "Midland Yard",
    currency: "USD",
    items: [
      { lineId: "L1", description: "Hydraulic Pump Seal Kit", quantity: 1, unit: "EA", estimatedUnitCost: 245 },
      { lineId: "L2", description: "Hydraulic Filter", quantity: 1, unit: "EA", estimatedUnitCost: 38 },
      { lineId: "L3", description: "Hydraulic Oil (5 Gal)", quantity: 2, unit: "EA", estimatedUnitCost: 72.5 }
    ],
    estimatedTotal: 428,
    attachments: []
  }
};

export default function PurchaseFaceLabPage() {
  return (
    <IXITransactFaceLabFrame
      title="PURCHASE ORDER · STANDALONE 3-FACE PRODUCT"
      route="/facelab/purchase"
    >
      <IXIPurchaseOrderApp
        context={context}
        sourceRequest={approvedRequestSource}
        authority={context.actor.purchasingAuthority}
        onRecordChange={async () => {}}
      />
    </IXITransactFaceLabFrame>
  );
}

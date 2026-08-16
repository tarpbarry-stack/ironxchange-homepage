import IXITransactFaceLabFrame from "../../components/ixi-face-studio/IXITransactFaceLabFrame";
import IXIMaterialStandaloneApp from "../../components/ixi-aos/transact/modules/material/IXIMaterialStandaloneApp";

const context = {
  primary: {
    objectId: "MACHINE-CAT336",
    passportId: "PASS-CAT336",
    objectType: "machine",
    label: "CAT 336"
  },
  location: {
    objectId: "LOC-MIDLAND",
    passportId: "PASS-MIDLAND",
    objectType: "location",
    label: "MIDLAND YARD"
  },
  entity: {
    passportId: "PASS-IXI",
    label: "IRONXCHANGE"
  },
  actor: {
    employeeId: "EMP-JOHN",
    passportId: "PASS-JOHN",
    displayName: "JOHN CARTER",
    label: "JOHN CARTER"
  },
  activeWorkOrder: {
    identity: {
      workOrderId: "WO-1058",
      number: "WO-1058"
    }
  },
  permissions: []
};

const object = {
  objectId: "MACHINE-CAT336",
  passportId: "PASS-CAT336",
  objectType: "machine",
  label: "CAT 336"
};

const inventoryItems = [
  {
    inventoryItemId: "INV-1R1808",
    inventoryPassportId: "PASS-INV-1R1808",
    sku: "1R-1808",
    description: "CAT Hydraulic Filter",
    onHand: 12,
    unit: "EA",
    averageCost: 84.5,
    locationLabel: "MIDLAND YARD · SHELF A12"
  },
  {
    inventoryItemId: "INV-HYD-OIL",
    sku: "HYD-OIL-10W",
    description: "Hydraulic Oil",
    onHand: 185,
    unit: "GAL",
    averageCost: 18.4,
    locationLabel: "MIDLAND YARD · BULK TANK"
  }
];

const purchaseOrderLines = [
  {
    purchaseOrderId: "PO-2048",
    purchaseOrderNumber: "PO-2048",
    purchaseOrderLineId: "PO-2048-L1",
    receivingRecordId: "RCV-2048-1",
    sku: "1R-1808",
    description: "CAT Hydraulic Filter",
    receivedQuantity: 4,
    consumedQuantity: 1,
    unit: "EA",
    unitCost: 86.25
  }
];

export default function MaterialFaceLabPage() {
  return (
    <IXITransactFaceLabFrame title="PART / MATERIAL · V13" route="/facelab/material">
      <IXIMaterialStandaloneApp
        context={context}
        object={object}
        inventoryItems={inventoryItems}
        purchaseOrderLines={purchaseOrderLines}
        onBack={() => {}}
        onRecordChange={async () => {}}
      />
    </IXITransactFaceLabFrame>
  );
}

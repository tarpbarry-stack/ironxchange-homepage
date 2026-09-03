import { useState } from "react";

import IXITransactFaceLabFrame from "../../components/ixi-face-studio/IXITransactFaceLabFrame";
import IXIRentalExpenseApp from "../../components/ixi-aos/transact/modules/rental-expense/IXIRentalExpenseApp";

const context = {
  primary: { objectId: "JOB-MIDLAND-LOADOUT", passportId: "PASS-JOB-MIDLAND-LOADOUT", objectType: "project", label: "MIDLAND YARD · LOADOUT" },
  location: { objectId: "LOC-MIDLAND", passportId: "PASS-MIDLAND", objectType: "location", label: "MIDLAND YARD" },
  entity: { objectId: "ENTITY-IXI", passportId: "PASS-IXI", objectType: "entity", label: "IRONXCHANGE LLC" },
  actor: { employeeId: "EMP-JOHN", passportId: "PASS-JOHN", displayName: "JOHN CARTER", label: "JOHN CARTER" },
  permissions: []
};

const object = {
  id: "JOB-MIDLAND-LOADOUT",
  objectId: "JOB-MIDLAND-LOADOUT",
  passportId: "PASS-JOB-MIDLAND-LOADOUT",
  objectType: "project",
  displayName: "MIDLAND YARD · LOADOUT",
  name: "MIDLAND YARD · LOADOUT"
};

export default function RentalExpenseFaceLabPage() {
  const [record, setRecord] = useState(null);

  return <IXITransactFaceLabFrame title="RENTAL EXPENSE · RNTEXP-#####" route="/facelab/rental-expense">
    <IXIRentalExpenseApp
      context={context}
      object={object}
      initialRecord={record}
      relatedTransactions={[]}
      onBack={() => {}}
      onRecordChange={async next => setRecord(next)}
    />
  </IXITransactFaceLabFrame>;
}

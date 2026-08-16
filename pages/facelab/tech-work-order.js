import { useState } from "react";

import IXITransactFaceLabFrame from "../../components/ixi-face-studio/IXITransactFaceLabFrame";
import IXITechWorkOrderApp from "../../components/ixi-aos/transact/modules/tech-work-order/IXITechWorkOrderApp";

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
    label: "MIDLAND YARD"
  },
  entity: {
    objectId: "ENTITY-IXI",
    passportId: "PASS-IXI",
    objectType: "entity",
    label: "IRONXCHANGE"
  },
  actor: {
    employeeId: "EMP-JOHN",
    passportId: "PASS-JOHN",
    displayName: "JOHN CARTER",
    roles: ["technician"]
  },
  permissions: []
};

export default function TechWorkOrderFaceLabPage() {
  const [record, setRecord] = useState(null);

  return (
    <IXITransactFaceLabFrame title="TECH WORK ORDER · TECHWO# XXXXXX" route="/facelab/tech-work-order">
      <IXITechWorkOrderApp
        context={context}
        initialTechWorkOrder={record}
        onBack={() => {}}
        onCreate={async next => setRecord(next)}
        onRecordChange={async next => setRecord(next)}
      />
    </IXITransactFaceLabFrame>
  );
}

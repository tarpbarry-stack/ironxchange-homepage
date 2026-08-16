import { useState } from "react";

import IXITransactFaceLabFrame from "../../components/ixi-face-studio/IXITransactFaceLabFrame";
import IXITimeStandaloneApp from "../../components/ixi-aos/transact/modules/time/IXITimeStandaloneApp";

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
    passportId: "PASS-JOHN-TIME-LAB",
    displayName: "JOHN CARTER",
    roles: ["technician"]
  },
  permissions: []
};

const object = {
  objectId: "LOC-MIDLAND",
  passportId: "PASS-MIDLAND",
  objectType: "location",
  displayName: "MIDLAND YARD"
};

export default function TimeFaceLabPage() {
  const [lastRecord, setLastRecord] = useState(null);

  return (
    <IXITransactFaceLabFrame title="TIME MODULE V13 · UNIVERSAL AOS CONTEXT" route="/facelab/time">
      <IXITimeStandaloneApp
        context={context}
        object={object}
        onBack={() => {}}
        onRecordChange={async record => setLastRecord(record)}
      />
      {lastRecord ? <span style={{ display: "none" }}>{lastRecord.identity?.timeEntryId}</span> : null}
    </IXITransactFaceLabFrame>
  );
}

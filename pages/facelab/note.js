import IXITransactFaceLabFrame from "../../components/ixi-face-studio/IXITransactFaceLabFrame";
import IXINoteApp from "../../components/ixi-aos/transact/modules/note/IXINoteApp";

const previewContext = {
  primary: {
    passportId: "IXI-CAT336",
    objectId: "CAT-336",
    objectType: "machine",
    label: "CAT 336"
  },
  entity: {
    passportId: "IXI-ENTITY-DEMO",
    label: "IRONXCHANGE EQUIPMENT"
  },
  location: {
    passportId: "IXI-LOC-MIDLAND",
    label: "MIDLAND YARD"
  },
  actor: {
    passportId: "IXI-EMP-JC",
    employeeId: "EMP-JC",
    displayName: "JOHN CARTER",
    label: "JOHN CARTER"
  }
};

const previewWorkOrder = {
  identity: {
    workOrderId: "WO-1058",
    number: "WO-1058"
  },
  work: {
    status: "in-progress",
    type: "repair",
    description: "Hydraulic leak diagnosis and pump repair"
  }
};

export default function IXIFaceLabNotePage() {
  return (
    <IXITransactFaceLabFrame
      title="WORK ORDER · ADD NOTE"
      route="/facelab/note"
    >
      <IXINoteApp
        context={previewContext}
        workOrder={previewWorkOrder}
        onCancel={() => {}}
        onSave={(note, input) => {
          console.log("FACE LAB NOTE SAVE", note, input);
        }}
      />
    </IXITransactFaceLabFrame>
  );
}

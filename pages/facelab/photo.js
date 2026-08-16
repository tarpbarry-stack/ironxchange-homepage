import IXITransactFaceLabFrame from "../../components/ixi-face-studio/IXITransactFaceLabFrame";
import IXIPhotoApp from "../../components/ixi-aos/transact/modules/photo/IXIPhotoApp";

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

export default function IXIFaceLabPhotoPage() {
  return (
    <IXITransactFaceLabFrame
      title="WORK ORDER · ADD PHOTO"
      route="/facelab/photo"
    >
      <IXIPhotoApp
        context={previewContext}
        workOrder={previewWorkOrder}
        onCancel={() => {}}
        onSave={(photo, input) => {
          console.log("FACE LAB PHOTO SAVE", photo, input);
        }}
      />
    </IXITransactFaceLabFrame>
  );
}

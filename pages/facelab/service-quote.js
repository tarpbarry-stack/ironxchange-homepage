import IXITransactFaceLabFrame from "../../components/ixi-face-studio/IXITransactFaceLabFrame";
import IXIServiceQuoteApp from "../../components/ixi-aos/transact/modules/service-quote/IXIServiceQuoteApp";

const context = {
  primary: {
    objectId: "M-CUST-CAT336",
    passportId: "PASS-CUST-CAT336",
    objectType: "machine",
    label: "2020 CAT 336 · CUSTOMER ASSET"
  },
  location: {
    passportId: "PASS-ODESSA",
    label: "ODESSA JOBSITE"
  },
  entity: {
    passportId: "PASS-IXI",
    label: "IRONXCHANGE LLC"
  },
  actor: {
    employeeId: "EMP-JOHN",
    passportId: "PASS-JOHN",
    displayName: "JOHN CARTER"
  },
  permissions: []
};

const object = {
  objectId: "M-CUST-CAT336",
  passportId: "PASS-CUST-CAT336",
  objectType: "machine",
  displayName: "2020 CAT 336 · CUSTOMER ASSET"
};

export default function ServiceQuoteFaceLabPage() {
  return (
    <IXITransactFaceLabFrame
      title="SERVICE QUOTE · SQ-#####"
      route="/facelab/service-quote"
    >
      <IXIServiceQuoteApp
        context={context}
        object={object}
        onBack={() => {}}
        onRecordChange={async () => {}}
        onCreateServiceWorkOrder={async quote => ({
          identity: {
            workOrderId: "CSWO-1058",
            number: "CSWO-1058"
          },
          customer: quote.customer,
          asset: quote.asset
        })}
      />
    </IXITransactFaceLabFrame>
  );
}

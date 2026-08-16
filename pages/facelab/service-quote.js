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
    objectId: "LOC-ODESSA",
    passportId: "PASS-ODESSA",
    objectType: "location",
    label: "ODESSA JOBSITE"
  },
  entity: {
    objectId: "ENTITY-IXI",
    passportId: "PASS-IXI",
    objectType: "entity",
    label: "IRONXCHANGE LLC"
  },
  actor: {
    employeeId: "EMP-JOHN",
    passportId: "PASS-JOHN",
    displayName: "JOHN CARTER",
    label: "JOHN CARTER"
  },
  permissions: []
};

const object = {
  id: "M-CUST-CAT336",
  objectId: "M-CUST-CAT336",
  passportId: "PASS-CUST-CAT336",
  objectType: "machine",
  displayName: "2020 CAT 336 · CUSTOMER ASSET",
  name: "2020 CAT 336 · CUSTOMER ASSET",
  serialNumber: "JHD00123",
  hours: 4218
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
          asset: quote.asset,
          quote: quote.identity
        })}
      />
    </IXITransactFaceLabFrame>
  );
}

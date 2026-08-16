import { useState } from "react";
import IXITransactFaceLabFrame from "../../components/ixi-face-studio/IXITransactFaceLabFrame";
import IXIRentalIncomeApp from "../../components/ixi-aos/transact/modules/rental-income/IXIRentalIncomeApp";

const context = {
  primary:{ objectId:"M-CAT336", passportId:"PASS-CAT336", objectType:"machine", label:"2019 CAT 336" },
  location:{ objectId:"LOC-MIDLAND", passportId:"PASS-MIDLAND", objectType:"location", label:"MIDLAND YARD" },
  entity:{ objectId:"ENTITY-IXI", passportId:"PASS-IXI", objectType:"entity", label:"IRONXCHANGE LLC" },
  actor:{ employeeId:"EMP-JOHN", passportId:"PASS-JOHN", displayName:"JOHN CARTER", label:"JOHN CARTER" },
  permissions:[]
};

const object = { id:"M-CAT336", objectId:"M-CAT336", passportId:"PASS-CAT336", objectType:"machine", displayName:"2019 CAT 336", name:"2019 CAT 336", serialNumber:"JHD00123", hours:4218 };

const relatedTransactions = [
  { documentId:"INV-RINC-1", documentType:"invoice", amount:12500, rentalIncomeId:"RNTINC-DEMO", references:[{ externalId:"RNTINC-DEMO", role:"rental" }] },
  { documentId:"PAY-RINC-1", documentType:"customer-payment", amount:7500, rentalIncomeId:"RNTINC-DEMO", references:[{ externalId:"RNTINC-DEMO", role:"rental" }] }
];

export default function RentalIncomeFaceLabPage(){
  const [record, setRecord] = useState(null);
  return <IXITransactFaceLabFrame title="RENTAL INCOME · RNTINC-#####" route="/facelab/rental-income">
    <IXIRentalIncomeApp context={context} object={object} initialRecord={record} relatedTransactions={relatedTransactions} onBack={() => {}} onRecordChange={async next => setRecord(next)} />
  </IXITransactFaceLabFrame>;
}

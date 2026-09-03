import IXITransactFaceLabFrame from "../../components/ixi-face-studio/IXITransactFaceLabFrame";
import IXIFinancialReportingApp from "../../components/ixi-aos/transact/modules/financial-reporting/IXIFinancialReportingApp";

const context = {
  primary: { objectId: "ENTITY-IXI", passportId: "PASS-IXI", objectType: "entity", label: "IRONXCHANGE LLC" },
  entity: { objectId: "ENTITY-IXI", passportId: "PASS-IXI", objectType: "entity", label: "IRONXCHANGE LLC" },
  actor: {},
  permissions: []
};
const object = { objectId: "ENTITY-IXI", passportId: "PASS-IXI", objectType: "entity", label: "IRONXCHANGE LLC" };

export default function FinancialReportingFaceLabPage() {
  return <IXITransactFaceLabFrame title="FINANCIAL REPORTING" route="/facelab/financial-reporting">
    <IXIFinancialReportingApp context={context} object={object} onBack={() => {}} />
  </IXITransactFaceLabFrame>;
}

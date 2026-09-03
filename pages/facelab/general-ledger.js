import IXITransactFaceLabFrame from "../../components/ixi-face-studio/IXITransactFaceLabFrame";
import IXIGeneralLedgerApp from "../../components/ixi-aos/transact/modules/general-ledger/IXIGeneralLedgerApp";

const context = {
  primary: { objectId: "ENTITY-IXI", passportId: "PASS-IXI", objectType: "entity", label: "IRONXCHANGE LLC" },
  entity: { objectId: "ENTITY-IXI", passportId: "PASS-IXI", objectType: "entity", label: "IRONXCHANGE LLC" },
  location: { objectId: "LOC-MIDLAND", passportId: "PASS-MIDLAND", objectType: "location", label: "MIDLAND YARD" },
  actor: {},
  permissions: []
};
const object = { objectId: "ENTITY-IXI", passportId: "PASS-IXI", objectType: "entity", label: "IRONXCHANGE LLC" };

export default function GeneralLedgerFaceLabPage() {
  return <IXITransactFaceLabFrame title="GENERAL LEDGER / CLOSE" route="/facelab/general-ledger">
    <IXIGeneralLedgerApp context={context} object={object} onBack={() => {}} />
  </IXITransactFaceLabFrame>;
}

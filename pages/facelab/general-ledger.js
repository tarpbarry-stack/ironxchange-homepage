import IXITransactFaceLabFrame from"../../components/ixi-face-studio/IXITransactFaceLabFrame";
import{createIXIGLChart}from"../../components/ixi-aos/transact/modules/general-ledger/IXIGeneralLedgerContract";
export default function GeneralLedgerFaceLabPage(){const chart=createIXIGLChart({entityPassportId:"PASS-IXI"});return <IXITransactFaceLabFrame title="GENERAL LEDGER / CLOSE" route="/facelab/general-ledger"><div style={{color:"white",padding:12}}>GL CONTRACT · {chart.accounts.length} ACCOUNTS</div></IXITransactFaceLabFrame>}

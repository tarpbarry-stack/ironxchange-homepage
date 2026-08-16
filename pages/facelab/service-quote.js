import IXITransactFaceLabFrame from "../../components/ixi-face-studio/IXITransactFaceLabFrame";
import { createIXIServiceQuoteDraft } from "../../components/ixi-aos/transact/modules/service-quote/IXIServiceQuoteContract";

export default function ServiceQuoteFaceLabPage() {
  const draft = createIXIServiceQuoteDraft({
    context: {
      primary: {
        objectId: "M-CUST-CAT336",
        passportId: "PASS-CUST-CAT336",
        objectType: "machine",
        label: "2020 CAT 336 · CUSTOMER ASSET"
      }
    },
    input: {
      customerName: "ABC CONTRACTORS",
      problem: "Hydraulic leak",
      customerScope: "Diagnose and repair hydraulic leak",
      quoteDate: "2026-08-16",
      validThrough: "2026-08-30",
      options: [{ label: "BASE SCOPE", required: true, lines: [{ type: "labor", description: "Diagnostic labor", quantity: 4, unit: "hour", unitPrice: 165, unitCost: 72 }] }]
    }
  });

  return (
    <IXITransactFaceLabFrame title="SERVICE QUOTE · CONTRACT TEST" route="/facelab/service-quote">
      <div style={{ width: 298, height: 471, background: "#090b0a", color: "#ffc400", padding: 16 }}>
        SERVICE QUOTE CONTRACT · {draft.schema}
      </div>
    </IXITransactFaceLabFrame>
  );
}

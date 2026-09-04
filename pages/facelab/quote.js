import { useMemo } from "react";

import IXITransactFaceLabFrame from "../../components/ixi-face-studio/IXITransactFaceLabFrame";
import IXIQuoteApp from "../../components/ixi-aos/transact/modules/quote/IXIQuoteApp";
import { createIXIQuoteDraft } from "../../components/ixi-aos/transact/modules/quote/IXIQuoteContract";

const context = {
  primary: { objectId: "M-CAT336", passportId: "PASS-CAT336", objectType: "machine", label: "2022 CAT 336" },
  location: { passportId: "PASS-MIDLAND", label: "MIDLAND YARD" },
  entity: { passportId: "PASS-IXI", label: "IRONXCHANGE EQUIPMENT", companyName: "IRONXCHANGE EQUIPMENT", logoUrl: "/images/ironxchange-logo.png", accentColor: "#ffc400", phone: "(888) 555-0199", email: "sales@ironxchange.com", website: "ironxchange.com", address: "Midland, Texas" },
  actor: { employeeId: "EMP-SALES", passportId: "PASS-SALES", label: "MIKE THOMPSON" }
};
const object = { objectId: "M-CAT336", passportId: "PASS-CAT336", objectType: "machine", displayName: "2022 CAT 336", year: "2022", make: "CAT", model: "336", serialNumber: "CAT00336EXAMPLE", stockNumber: "IX-336-22", hours: "3,842", location: "MIDLAND YARD" };

export default function QuoteFaceLab() {
  const record = useMemo(() => createIXIQuoteDraft({ context, object, input: { customerName: "ABC CONTRACTORS", customerContactName: "JOHN SMITH", customerPhone: "(432) 555-0144", customerEmail: "john@abccontractors.com", quotedPrice: 185000, freight: 2750, quoteDate: "2026-09-04", validThrough: "2026-09-18", paymentTerms: "Wire transfer or approved financing before release", depositTerms: "$10,000 deposit upon acceptance", deliveryTerms: "FOB Midland Yard · Freight quoted separately", equipmentDescription: "2022 CAT 336 hydraulic excavator with 3,842 hours. Offered subject to prior sale.", conditionTerms: "Used equipment offered as-is, where-is, subject to buyer inspection.", warrantyTerms: "No warranty expressed or implied unless stated in writing.", customerMessage: "Thank you for the opportunity to quote this machine." } }), []);
  return <IXITransactFaceLabFrame title="QUOTE · QT-#####" route="/facelab/quote"><IXIQuoteApp context={context} object={object} initialRecord={record} onBack={() => {}} onRecordChange={async () => {}} /></IXITransactFaceLabFrame>;
}

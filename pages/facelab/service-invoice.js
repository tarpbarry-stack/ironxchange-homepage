import { useState } from "react";
import IXITransactFaceLabFrame from "../../components/ixi-face-studio/IXITransactFaceLabFrame";
import IXIServiceInvoiceApp from "../../components/ixi-aos/transact/modules/service-invoice/IXIServiceInvoiceApp";

const context = {
  primary: { objectId: "M-CUST-CAT336", passportId: "PASS-CUST-CAT336", objectType: "machine", label: "2020 CAT 336 · CUSTOMER ASSET" },
  location: { passportId: "PASS-ODESSA", label: "ODESSA JOBSITE" },
  entity: { passportId: "PASS-IXI", label: "IRONXCHANGE LLC" },
  actor: { employeeId: "EMP-SARAH", passportId: "PASS-SARAH", displayName: "SARAH JONES" },
  permissions: []
};

const object = { objectId: "M-CUST-CAT336", passportId: "PASS-CUST-CAT336", objectType: "machine", displayName: "2020 CAT 336 · CUSTOMER ASSET" };

const workOrder = {
  schema: "ixi-customer-service-work-order-v1",
  identity: { workOrderId: "CSWO-1058", number: "CSWO-1058" },
  context: { primaryPassportId: "PASS-CUST-CAT336", primaryObjectId: "M-CUST-CAT336", primaryObjectType: "machine", primaryLabel: "2020 CAT 336 · CUSTOMER ASSET", locationLabel: "ODESSA JOBSITE" },
  work: { type: "repair", title: "Hydraulic leak", description: "Repair hydraulic leak and replace failed hose group", status: "complete", customerService: true, serviceDirection: "external-customer" },
  customer: { customerId: "CUST-ABC", passportId: "PASS-ABC", name: "ABC CONTRACTORS", contactName: "MIKE SMITH", email: "mike@example.com" },
  commercial: { serviceQuoteId: "SQ-1048", serviceQuoteNumber: "SQ-1048", acceptedRevision: 2, pricingType: "estimate", originalAuthorizedRevenue: 12620, approvedChangeOrderRevenue: 2250, totalAuthorizedRevenue: 14870, customerPoNumber: "PO-88452", acceptedAt: "2026-08-18T21:16:00.000Z", acceptedBy: "MIKE SMITH", acceptanceMethod: "digital", acceptedOptionIds: ["OPT-1"], quoteSnapshot: { quotedRevenue: 12620, estimatedInternalCost: 7480, authorizedRevenue: 12620 } },
  financial: { laborActual: 3480, materialActual: 4210, serviceActual: 850, otherActual: 400, totalActual: 8940, authorizedRevenue: 14870, quotedRevenue: 12620, invoicedRevenue: 0, receivedRevenue: 0, status: "complete" }
};

export default function ServiceInvoiceFaceLabPage(){
  const [record,setRecord] = useState(null);
  return <IXITransactFaceLabFrame title="SERVICE INVOICE · SINV-#####" route="/facelab/service-invoice"><IXIServiceInvoiceApp context={context} object={object} workOrder={workOrder} initialRecord={record} onBack={()=>{}} onRecordChange={async next=>setRecord(next)} /></IXITransactFaceLabFrame>;
}

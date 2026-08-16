import { useState } from "react";
import IXITransactFaceLabFrame from "../../components/ixi-face-studio/IXITransactFaceLabFrame";
import IXICollectionsApp from "../../components/ixi-aos/transact/modules/collections/IXICollectionsApp";

const context = {
  primary: { objectId: "ENTITY-IXI", passportId: "PASS-IXI", objectType: "entity", label: "IRONXCHANGE LLC" },
  entity: { objectId: "ENTITY-IXI", passportId: "PASS-IXI", objectType: "entity", label: "IRONXCHANGE LLC" },
  location: { objectId: "LOC-MIDLAND", passportId: "PASS-MIDLAND", objectType: "location", label: "MIDLAND YARD" },
  actor: { employeeId: "EMP-SARAH", passportId: "PASS-SARAH", displayName: "SARAH JONES", label: "SARAH JONES" },
  permissions: []
};
const object = { objectId: "ENTITY-IXI", passportId: "PASS-IXI", objectType: "entity", label: "IRONXCHANGE LLC" };
const refs = customer => [{ passportId: "PASS-IXI", role: "entity", label: "IRONXCHANGE LLC", objectType: "entity" }, { passportId: customer.passportId, role: "customer", label: customer.label, objectType: "entity" }];
const initialFinancialRecords = [
  { documentType: "invoice", documentId: "INV-SALE-2048", input: { amount: 225000, currency: "USD", status: "issued", financialState: "receivable", invoiceType: "asset-sale", invoiceNumber: "SALE-2048", invoiceDate: "2026-07-15", dueDate: "2026-07-30", references: refs({ passportId: "PASS-ABC", label: "ABC CONTRACTORS" }) } },
  { documentType: "payment", documentId: "PAY-1", input: { amount: 175000, currency: "USD", direction: "in", financialState: "received", relatedInvoiceId: "INV-SALE-2048", occurredAt: "2026-07-20", references: refs({ passportId: "PASS-ABC", label: "ABC CONTRACTORS" }) } },
  { documentType: "invoice", documentId: "INV-SVC-3092", input: { amount: 18420, currency: "USD", status: "issued", financialState: "receivable", invoiceType: "service-invoice", invoiceNumber: "SINV-3092", invoiceDate: "2026-08-01", dueDate: "2026-08-31", references: refs({ passportId: "PASS-WEST", label: "WEST TEXAS PIPELINE" }) } },
  { documentType: "invoice", documentId: "INV-RENT-442", input: { amount: 12800, currency: "USD", status: "issued", financialState: "receivable", invoiceType: "rental", invoiceNumber: "RINV-442", invoiceDate: "2026-06-01", dueDate: "2026-06-30", references: refs({ passportId: "PASS-LONE", label: "LONE STAR CIVIL" }) } },
  { documentType: "payment", documentId: "PAY-2", input: { amount: 4800, currency: "USD", direction: "in", financialState: "received", relatedInvoiceId: "INV-RENT-442", occurredAt: "2026-07-10", references: refs({ passportId: "PASS-LONE", label: "LONE STAR CIVIL" }) } }
];

export default function CollectionsFaceLabPage() {
  const [records, setRecords] = useState(initialFinancialRecords);
  const [cases, setCases] = useState([]);
  return <IXITransactFaceLabFrame title="COLLECTIONS / A/R" route="/facelab/collections"><IXICollectionsApp context={context} object={object} financialRecords={records} initialCases={cases} onBack={() => {}} onRecordChange={async (record, change) => { if (record?.receivable?.invoiceId) setCases(current => [...current.filter(item => item.receivable?.invoiceId !== record.receivable.invoiceId), record]); if (change?.financialRecord) setRecords(current => [...current, change.financialRecord]); }} /></IXITransactFaceLabFrame>;
}

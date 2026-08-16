import Head from "next/head";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import IXIWorkOrderDocumentsApp from "../../components/ixi-aos/transact/modules/documents/IXIWorkOrderDocumentsApp";

const previewContext={
 primary:{passportId:"IXI-CAT336",objectId:"CAT-336",objectType:"machine",label:"CAT 336"},
 entity:{passportId:"IXI-ENTITY-DEMO",label:"IRONXCHANGE EQUIPMENT"},
 location:{passportId:"IXI-LOC-MIDLAND",label:"MIDLAND YARD"},
 actor:{passportId:"IXI-EMP-JC",employeeId:"EMP-JC",displayName:"JOHN CARTER",label:"JOHN CARTER"}
};

const previewWorkOrder={identity:{workOrderId:"WO-1058",number:"WO-1058"},work:{status:"in-progress",type:"repair",description:"Hydraulic leak diagnosis and pump repair"}};

const previewDocuments=[
 {documentId:"DOC-1",fileName:"INV-78451.pdf",issuer:"Hydraulic Solutions",type:"invoice",typeLabel:"INVOICE",relatedType:"service",relatedId:"SVC-2081",relatedLabel:"SVC-2081",date:"2026-05-15T10:32:00-05:00",addedBy:"John Carter"},
 {documentId:"DOC-2",fileName:"RCPT-081526.jpg",issuer:"Hydraulic Supply",type:"receipt",typeLabel:"RECEIPT",relatedType:"expense",relatedId:"EXP-1842",relatedLabel:"EXP-1842",date:"2026-05-15T09:18:00-05:00",addedBy:"John Carter"},
 {documentId:"DOC-3",fileName:"Seal Kit Quote.pdf",issuer:"Hydraulic Supply Co.",type:"quote",typeLabel:"QUOTE",relatedType:"purchase order",relatedId:"PO-2048",relatedLabel:"PO-2048",date:"2026-05-15T08:44:00-05:00",addedBy:"John Carter"},
 {documentId:"DOC-4",fileName:"Hydraulic Leak.jpg",issuer:"Pump area",type:"photo",typeLabel:"WORK PHOTO",relatedType:"general",relatedId:"WO-1058",relatedLabel:"WO-1058",date:"2026-05-15T08:22:00-05:00",addedBy:"John Carter"},
 {documentId:"DOC-5",fileName:"ET Report.pdf",issuer:"Caterpillar Electronic",type:"report",typeLabel:"DIAGNOSTIC REPORT",relatedType:"tech work",relatedId:"TW-0084",relatedLabel:"TW-0084",date:"2026-05-14T16:12:00-05:00",addedBy:"John Carter"},
 {documentId:"DOC-6",fileName:"Inspection Sheet.pdf",issuer:"Pre-Delivery Inspection",type:"report",typeLabel:"INSPECTION",relatedType:"general",relatedId:"WO-1058",relatedLabel:"WO-1058",date:"2026-05-14T14:55:00-05:00",addedBy:"John Carter"},
 {documentId:"DOC-7",fileName:"Delivery Ticket.jpg",issuer:"ABC Transport",type:"other",typeLabel:"DELIVERY TICKET",relatedType:"material",relatedId:"MAT-1123",relatedLabel:"MAT-1123",date:"2026-05-14T13:10:00-05:00",addedBy:"John Carter"},
 {documentId:"DOC-8",fileName:"Warranty Form.pdf",issuer:"Caterpillar Warranty",type:"other",typeLabel:"WARRANTY",relatedType:"general",relatedId:"WO-1058",relatedLabel:"WO-1058",date:"2026-05-13T11:03:00-05:00",addedBy:"John Carter"}
];

export default function IXIFaceLabDocumentsPage(){
 return <>
  <Head><title>IXI Face Lab · Work Order Documents</title></Head>
  <Navbar/>
  <main className="docs-lab-page">
   <div className="lab-bar"><div><strong>IXI FACE LAB</strong><span>TRAN$ACT · WORK ORDER · DOCUMENTS</span></div><code>/facelab/documents</code></div>
   <div className="lab-stage">
    <div className="native-label">NATIVE CARD · 298 × 471 · V13 · SCROLLABLE VIEWPORT</div>
    <div className="native-card">
     <IXIWorkOrderDocumentsApp context={previewContext} workOrder={previewWorkOrder} documents={previewDocuments} onBack={()=>{}} onDocumentAction={(action,document)=>console.log("FACE LAB DOCUMENT ACTION",action,document)} onAddGeneralDocument={(input)=>console.log("FACE LAB GENERAL DOCUMENT",input)}/>
    </div>
   </div>
  </main>
  <Footer/>
  <style jsx>{`
   .docs-lab-page{min-height:calc(100vh - 160px);padding:18px;background:radial-gradient(circle at top,rgba(255,196,0,.05),transparent 42%),#0b0b0b;color:#eee}.lab-bar{height:48px;display:flex;align-items:center;justify-content:space-between;padding:0 14px;border:1px solid rgba(255,255,255,.08);border-radius:10px;background:#121212}.lab-bar strong{display:block;color:#ffc400;font-size:10px;letter-spacing:.08em}.lab-bar span{display:block;margin-top:3px;color:#888;font-size:8px}.lab-bar code{color:#bbb;font-size:10px}.lab-stage{display:flex;flex-direction:column;align-items:center;padding:28px}.native-label{margin-bottom:10px;color:#777;font-size:8px;font-weight:900;letter-spacing:.08em}.native-card{width:298px;height:471px;overflow-y:auto;overflow-x:hidden;border:1px solid rgba(255,196,0,.25);border-radius:10px;background:#050706;box-shadow:0 22px 54px rgba(0,0,0,.58);scrollbar-width:thin;scrollbar-color:#6f5700 #111}
  `}</style>
 </>;
}

import Head from "next/head";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import IXINoteApp from "../../components/ixi-aos/transact/modules/note/IXINoteApp";

const previewContext={
 primary:{passportId:"IXI-CAT336",objectId:"CAT-336",objectType:"machine",label:"CAT 336"},
 entity:{passportId:"IXI-ENTITY-DEMO",label:"IRONXCHANGE EQUIPMENT"},
 location:{passportId:"IXI-LOC-MIDLAND",label:"MIDLAND YARD"},
 actor:{passportId:"IXI-EMP-JC",employeeId:"EMP-JC",displayName:"JOHN CARTER",label:"JOHN CARTER"}
};
const previewWorkOrder={identity:{workOrderId:"WO-1058",number:"WO-1058"},work:{status:"in-progress",type:"repair",description:"Hydraulic leak diagnosis and pump repair"}};

export default function IXIFaceLabNotePage(){return <>
 <Head><title>IXI Face Lab · Add Note</title></Head><Navbar/>
 <main className="note-lab-page"><div className="lab-bar"><div><strong>IXI FACE LAB</strong><span>TRAN$ACT · WORK ORDER · ADD NOTE</span></div><code>/facelab/note</code></div><div className="lab-stage"><div className="native-label">NATIVE CARD · 298 × 471 · V13 · SCROLLABLE VIEWPORT</div><div className="native-card"><IXINoteApp context={previewContext} workOrder={previewWorkOrder} onCancel={()=>{}} onSave={(note,input)=>console.log("FACE LAB NOTE SAVE",note,input)}/></div></div></main><Footer/>
 <style jsx>{`.note-lab-page{min-height:calc(100vh - 160px);padding:18px;background:radial-gradient(circle at top,rgba(255,196,0,.05),transparent 42%),#0b0b0b;color:#eee}.lab-bar{height:48px;display:flex;align-items:center;justify-content:space-between;padding:0 14px;border:1px solid rgba(255,255,255,.08);border-radius:10px;background:#121212}.lab-bar strong{display:block;color:#ffc400;font-size:10px;letter-spacing:.08em}.lab-bar span{display:block;margin-top:3px;color:#888;font-size:8px}.lab-bar code{color:#bbb;font-size:10px}.lab-stage{display:flex;flex-direction:column;align-items:center;padding:28px}.native-label{margin-bottom:10px;color:#777;font-size:8px;font-weight:900;letter-spacing:.08em}.native-card{width:298px;height:471px;overflow-y:auto;overflow-x:hidden;border:1px solid rgba(255,196,0,.25);border-radius:10px;background:#050706;box-shadow:0 22px 54px rgba(0,0,0,.58);scrollbar-width:thin;scrollbar-color:#6f5700 #111}`}</style>
 </>}

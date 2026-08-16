import {useState} from "react";
import IXITransactFaceLabFrame from "../../components/ixi-face-studio/IXITransactFaceLabFrame";
import IXIAssetAcquisitionApp from "../../components/ixi-aos/transact/modules/asset-acquisition/IXIAssetAcquisitionApp";

const context={
  primary:{objectId:"M-CAT336",passportId:"PASS-CAT336",objectType:"machine",label:"2019 CAT 336"},
  location:{objectId:"LOC-MIDLAND",passportId:"PASS-MIDLAND",objectType:"location",label:"MIDLAND YARD"},
  entity:{objectId:"ENTITY-IXI",passportId:"PASS-IXI",objectType:"entity",label:"IRONXCHANGE LLC"},
  actor:{employeeId:"EMP-JOHN",passportId:"PASS-JOHN",displayName:"JOHN CARTER",label:"JOHN CARTER"},
  permissions:[]
};

const object={id:"M-CAT336",objectId:"M-CAT336",passportId:"PASS-CAT336",objectType:"machine",displayName:"2019 CAT 336",name:"2019 CAT 336"};

const actuals=[
  {documentId:"BILL-FREIGHT-1",amount:4200,date:"2026-08-19",category:"freight",acquisitionCost:true,assetPassportId:"PASS-CAT336",metadata:{acquisitionCost:true,acquisitionCategory:"freight"},references:[{passportId:"PASS-CAT336",role:"asset"}]},
  {documentId:"WO-MAKE-READY-1",amount:13842,date:"2026-08-21",category:"initial-repairs",acquisitionCost:true,assetPassportId:"PASS-CAT336",metadata:{acquisitionCost:true,acquisitionCategory:"initial-repairs"},references:[{passportId:"PASS-CAT336",role:"asset"}]},
  {documentId:"EXP-TECH-1",amount:740,date:"2026-08-22",category:"technology",acquisitionCost:true,assetPassportId:"PASS-CAT336",metadata:{acquisitionCost:true,acquisitionCategory:"technology"},references:[{passportId:"PASS-CAT336",role:"asset"}]},
  {documentId:"WO-LATER-1",amount:2750,date:"2026-09-15",category:"initial-repairs",acquisitionCost:true,assetPassportId:"PASS-CAT336",metadata:{acquisitionCost:true,acquisitionCategory:"initial-repairs"},references:[{passportId:"PASS-CAT336",role:"asset"}]}
];

export default function AssetAcquisitionFaceLabPage(){
  const[record,setRecord]=useState(null);
  return <IXITransactFaceLabFrame title="ASSET ACQUISITION · ACQ-#####" route="/facelab/asset-acquisition">
    <IXIAssetAcquisitionApp context={context} object={object} initialRecord={record} relatedTransactions={actuals} onBack={()=>{}} onRecordChange={async next=>setRecord(next)}/>
  </IXITransactFaceLabFrame>;
}

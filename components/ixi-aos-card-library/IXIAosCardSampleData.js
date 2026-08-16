const SAMPLE_LOCATION_OBJECT=Object.freeze({objectId:"aos-card-preview-location-001",entityId:"aos-card-preview-entity",displayName:"YARD NAME",status:"active",value:8750000,currency:"USD",fields:{address1:"2400 AVIATION DRIVE",address2:"",city:"DFW AIRPORT",state:"TX",postalCode:"75261",yardHours:"MON–SAT 6:00 AM–6:00 PM",yardContact:"JOHN CARTER",yardPhone:"432-555-0186"},relationships:[{id:"rel-equipment",label:"EQUIPMENT",value:"47 ASSETS",status:"ACTIVE"},{id:"rel-shop",label:"SHOP",value:"1 SHOP",status:"ACTIVE"},{id:"rel-employees",label:"EMPLOYEES",value:"18 PEOPLE",status:"ACTIVE"},{id:"rel-ramp",label:"RAMP",value:"2 RAMPS",status:"ACTIVE"}],media:[],metadata:{creationState:""}});
const SAMPLE_LOCATION_PROJECTION=Object.freeze({assetCount:47,employeeCount:18,childLocationCount:3,totalAssetValue:8750000});
const SAMPLE_LOCATION_ITEMS=Object.freeze([{objectId:"preview-machine-001",entityId:"aos-card-preview-entity",objectType:"machine",displayName:"2022 CATERPILLAR 336",directContainerId:"aos-card-preview-location-001",value:285000,currency:"USD",fields:{year:2022,make:"CATERPILLAR",model:"336",hours:3842},media:[],metadata:{}},{objectId:"preview-vehicle-001",entityId:"aos-card-preview-entity",objectType:"vehicle",displayName:"2024 FORD F-350",directContainerId:"aos-card-preview-location-001",value:72000,currency:"USD",fields:{year:2024,make:"FORD",model:"F-350"},media:[],metadata:{}},{objectId:"preview-tool-001",entityId:"aos-card-preview-entity",objectType:"tool",displayName:"FIELD TOOL SET",directContainerId:"aos-card-preview-location-001",value:8500,currency:"USD",fields:{},media:[],metadata:{}}]);

const PERSONNEL_ID="aos-card-preview-personnel-004";
const SAMPLE_PERSONNEL_OBJECT=Object.freeze({objectId:PERSONNEL_ID,entityId:"aos-card-preview-entity",objectType:"personnel-container",displayName:"MIDLAND YARD STAFF",pluralLabel:"EMPLOYEES",status:"active",fields:{containerLabel:"EMPLOYEES",location:"MIDLAND YARD, TX",company:"IRONXCHANGE INC.",openJobs:8,teams:3},relationships:[{id:"p-rel-location",label:"LOCATION",value:"MIDLAND YARD, TX"},{id:"p-rel-company",label:"COMPANY",value:"IRONXCHANGE INC."}],metadata:{nomenclature:{plural:"EMPLOYEES"}}});
const people=[
 ["JOHN CARTER","EMP-1047","MANAGEMENT","active",["HEAVY EQUIPMENT","CDL","FORKLIFT"]],
 ["SARAH JOHNSON","EMP-1021","SALES","active",["HEAVY EQUIPMENT","RIGGING"]],
 ["DAVID MILLER","EMP-0987","SHOP","active",["WELDING","HYDRAULICS","FORKLIFT"]],
 ["MICHAEL BROWN","EMP-0775","FIELD","off duty",["HEAVY EQUIPMENT","CDL","HYDRAULICS"]],
 ["ALEX RIVERA","EMP-1102","SHOP","active",["WELDING","HYDRAULICS"]],
 ["MARIA LOPEZ","EMP-1094","ADMIN","active",["FORKLIFT"]],
 ["JAMES WILSON","EMP-0881","FIELD","active",["HEAVY EQUIPMENT","CDL","RIGGING"]],
 ["ROBERT KING","EMP-0810","SHOP","active",["WELDING","FORKLIFT"]],
 ["EMILY DAVIS","EMP-1115","SALES","active",["HEAVY EQUIPMENT"]],
 ["CHRIS MARTIN","EMP-0904","FIELD","active",["CDL","HYDRAULICS"]],
 ["KEVIN THOMAS","EMP-0932","SHOP","active",["WELDING","RIGGING"]],
 ["AMANDA WHITE","EMP-1068","ADMIN","on leave",["FORKLIFT"]],
 ["BRIAN HALL","EMP-0794","FIELD","active",["HEAVY EQUIPMENT","CDL"]],
 ["LISA YOUNG","EMP-1013","SALES","active",["HEAVY EQUIPMENT"]],
 ["MARK ALLEN","EMP-0835","SHOP","active",["WELDING","HYDRAULICS"]],
 ["ERIC SCOTT","EMP-0961","FIELD","active",["HEAVY EQUIPMENT","RIGGING"]],
 ["NANCY GREEN","EMP-1120","MANAGEMENT","active",["HEAVY EQUIPMENT","CDL"]],
 ["PAUL ADAMS","EMP-0742","SHOP","off duty",["FORKLIFT","HYDRAULICS"]]
];
const SAMPLE_PERSONNEL_ITEMS=Object.freeze(people.map((p,i)=>({objectId:`preview-employee-${String(i+1).padStart(3,"0")}`,entityId:"aos-card-preview-entity",objectType:"employee",displayName:p[0],directContainerId:PERSONNEL_ID,status:p[3],fields:{employeeNumber:p[1],department:p[2],employmentStatus:p[3],capabilities:p[4]},media:[],metadata:{}})));
const SAMPLE_PERSONNEL_PROJECTION=Object.freeze({directChildCount:SAMPLE_PERSONNEL_ITEMS.length});

export function getAosCardSampleData(templateSlug=""){
 const slug=String(templateSlug||"").trim();
 if(["location-standard","location-standard-002","location-standard-003"].includes(slug))return {sampleData:SAMPLE_LOCATION_OBJECT,projection:SAMPLE_LOCATION_PROJECTION,directItems:SAMPLE_LOCATION_ITEMS};
 if(["personnel-container-004","personnel-container-005","personnel-container-006"].includes(slug))return {sampleData:SAMPLE_PERSONNEL_OBJECT,projection:SAMPLE_PERSONNEL_PROJECTION,directItems:SAMPLE_PERSONNEL_ITEMS};
 return {sampleData:{displayName:"AOS OBJECT",status:"active",value:null,currency:"USD",fields:{},media:[],metadata:{}},projection:null,directItems:[]};
}

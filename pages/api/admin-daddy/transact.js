function clean(value){return String(value??"").trim();}
function currentPeriod(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;}
function bounds(period){const m=clean(period).match(/^(\d{4})-(\d{2})$/);if(!m)return {from:"",through:""};const last=new Date(Number(m[1]),Number(m[2]),0).getDate();return {from:`${m[1]}-${m[2]}-01`,through:`${m[1]}-${m[2]}-${String(last).padStart(2,"0")}`};}
function getBase(req){const proto=clean(req.headers["x-forwarded-proto"])||"http";const host=clean(req.headers["x-forwarded-host"]||req.headers.host);return `${proto}://${host}`;}
async function readJson(response){const text=await response.text();try{return text?JSON.parse(text):null;}catch{return null;}}
export default async function handler(req,res){
 if(req.method!=="GET"){res.setHeader("Allow","GET");return res.status(405).json({ok:false,error:{code:"METHOD_NOT_ALLOWED",message:"GET required."}});}
 const period=clean(req.query.period)||currentPeriod();const range=bounds(period);
 const query={contract:"ixi-transact-dashboard-query",contractVersion:"1.0.0",scope:{entityPassportIds:[],locationPassportIds:[],assetPassportIds:[],customerPassportIds:[],vendorPassportIds:[]},period:{...range,accountingPeriod:period},currency:"USD",filters:{},include:["executive","ar","ap","treasury","gl-controls","reporting","attention"]};
 try{
  const response=await fetch(`${getBase(req)}/api/ixi/financial/dashboard`,{method:"POST",headers:{Accept:"application/json","Content-Type":"application/json",cookie:clean(req.headers.cookie)},body:JSON.stringify(query)});
  const payload=await readJson(response);
  if(!response.ok||payload?.ok===false)return res.status(response.status||502).json({ok:false,error:{code:payload?.error?.code||payload?.errors?.[0]?.code||"ADMIN_DADDY_TRANSACT_FAILED",message:payload?.error?.message||payload?.errors?.[0]?.message||"TRAN$ACT oversight projection failed."}});
  const projection=payload?.projection||payload?.dashboard||payload;
  return res.status(200).json({ok:true,period,projection});
 }catch(error){return res.status(502).json({ok:false,error:{code:"ADMIN_DADDY_TRANSACT_NETWORK_FAILED",message:error?.message||"TRAN$ACT oversight unavailable."}});}
}

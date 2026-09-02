function clean(value){return String(value??"").trim();}
function getBase(req){const proto=clean(req.headers["x-forwarded-proto"])||"http";const host=clean(req.headers["x-forwarded-host"]||req.headers.host);return `${proto}://${host}`;}
async function readJson(response){const text=await response.text();try{return text?JSON.parse(text):null;}catch{return null;}}
export default async function handler(req,res){
 if(req.method!=="POST"){res.setHeader("Allow","POST");return res.status(405).json({ok:false,error:{code:"METHOD_NOT_ALLOWED",message:"POST required."}});}
 const body=req.body&&typeof req.body==="object"&&!Array.isArray(req.body)?req.body:{};
 if(!clean(body.action)){return res.status(400).json({ok:false,error:{code:"ADMIN_DADDY_AUTHORITY_ACTION_REQUIRED",message:"Authority action is required."}});}
 try{
  const response=await fetch(`${getBase(req)}/api/ixi/authority/evaluate`,{method:"POST",headers:{Accept:"application/json","Content-Type":"application/json",cookie:clean(req.headers.cookie),authorization:clean(req.headers.authorization)},body:JSON.stringify(body)});
  const payload=await readJson(response);
  return res.status(response.status).json(payload||{ok:false,error:{code:"ADMIN_DADDY_AUTHORITY_BAD_RESPONSE",message:"Authority returned no JSON response."}});
 }catch(error){return res.status(502).json({ok:false,error:{code:"ADMIN_DADDY_AUTHORITY_NETWORK_FAILED",message:error?.message||"Authority inspector unavailable."}});}
}

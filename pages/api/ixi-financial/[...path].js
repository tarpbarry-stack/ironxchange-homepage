const clean=value=>String(value??"").trim();
const SAFE_METHODS=new Set(["GET","POST","PUT","PATCH","DELETE"]);
const FORWARD_HEADERS=["authorization","cookie","x-request-id","x-ixi-source","x-csrf-token"];

function getBaseUrl(){return clean(process.env.IXI_CORE_BASE_URL||process.env.IX_CORE_BASE_URL||process.env.IXI_FINANCIAL_API_BASE_URL).replace(/\/+$/,"");}
function getTargetPath(req){const parts=Array.isArray(req.query?.path)?req.query.path:[req.query?.path].filter(Boolean);return `/${parts.map(part=>encodeURIComponent(String(part))).join("/")}`;}
function buildHeaders(req){const headers={"Content-Type":"application/json","X-IXI-Proxy":"ironxchange-vercel"};FORWARD_HEADERS.forEach(name=>{const value=req.headers?.[name];if(value)headers[name]=Array.isArray(value)?value.join(","):String(value)});return headers;}

export default async function handler(req,res){
 const method=String(req.method||"GET").toUpperCase();
 if(!SAFE_METHODS.has(method))return res.status(405).json({ok:false,errors:[{name:"IXIFinancialProxyMethodError",message:"Method not allowed."}]});
 const base=getBaseUrl();
 if(!base)return res.status(503).json({ok:false,errors:[{name:"IXIFinancialProxyConfigurationError",message:"IX-Core financial base URL is not configured on the server."}]});
 const target=`${base}${getTargetPath(req)}`;
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),30000);
 try{
  const upstream=await fetch(target,{method,headers:buildHeaders(req),body:["GET","HEAD"].includes(method)?undefined:JSON.stringify(req.body??{}),signal:controller.signal});
  const text=await upstream.text();
  res.status(upstream.status);
  const contentType=upstream.headers.get("content-type")||"application/json";
  res.setHeader("Content-Type",contentType);
  res.setHeader("Cache-Control","no-store, private");
  if(!text)return res.end();
  return res.send(text);
 }catch(error){
  const aborted=error?.name==="AbortError";
  console.error("IXI FINANCIAL PROXY FAILED:",error);
  return res.status(aborted?504:502).json({ok:false,errors:[{name:aborted?"IXIFinancialProxyTimeoutError":"IXIFinancialProxyUpstreamError",message:aborted?"IX-Core financial request timed out.":"IX-Core financial request failed."}]});
 }finally{clearTimeout(timeout)}
}

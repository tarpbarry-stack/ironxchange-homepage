const clean=value=>String(value??"").trim();
const FORWARD_HEADERS=["authorization","cookie","x-request-id","x-ixi-source","x-csrf-token"];
const ROUTES=new Map([
 ["POST /financial/dashboard",true],
 ["POST /financial/commands/create",true],
 ["GET /financial/health",true]
]);

function getBaseUrl(){return clean(process.env.IXI_CORE_BASE_URL||process.env.IX_CORE_BASE_URL||process.env.IXI_FINANCIAL_API_BASE_URL).replace(/\/+$/,"");}
function getTargetPath(req){const parts=Array.isArray(req.query?.path)?req.query.path:[req.query?.path].filter(Boolean);return `/${parts.map(part=>encodeURIComponent(String(part))).join("/")}`;}
function buildHeaders(req){const headers={"Content-Type":"application/json","X-IXI-Proxy":"ironxchange-vercel"};FORWARD_HEADERS.forEach(name=>{const value=req.headers?.[name];if(value)headers[name]=Array.isArray(value)?value.join(","):String(value)});return headers;}
function originAllowed(req){const origin=clean(req.headers?.origin);if(!origin)return true;const host=clean(req.headers?.["x-forwarded-host"]||req.headers?.host);if(!host)return false;try{return new URL(origin).host===host}catch{return false}}

export default async function handler(req,res){
 const method=String(req.method||"GET").toUpperCase();
 const path=getTargetPath(req);
 if(!ROUTES.has(`${method} ${path}`))return res.status(404).json({ok:false,errors:[{name:"IXIFinancialProxyRouteError",message:"Financial proxy route not allowed."}]});
 if(!originAllowed(req))return res.status(403).json({ok:false,errors:[{name:"IXIFinancialProxyOriginError",message:"Cross-origin financial request denied."}]});
 const base=getBaseUrl();
 if(!base)return res.status(503).json({ok:false,errors:[{name:"IXIFinancialProxyConfigurationError",message:"IX-Core financial base URL is not configured on the server."}]});
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),30000);
 try{
  const upstream=await fetch(`${base}${path}`,{method,headers:buildHeaders(req),body:method==="GET"?undefined:JSON.stringify(req.body??{}),signal:controller.signal});
  const text=await upstream.text();
  res.status(upstream.status);
  res.setHeader("Content-Type",upstream.headers.get("content-type")||"application/json");
  res.setHeader("Cache-Control","no-store, private");
  res.setHeader("X-Content-Type-Options","nosniff");
  if(!text)return res.end();
  return res.send(text);
 }catch(error){
  const aborted=error?.name==="AbortError";
  console.error("IXI FINANCIAL PROXY FAILED:",error);
  return res.status(aborted?504:502).json({ok:false,errors:[{name:aborted?"IXIFinancialProxyTimeoutError":"IXIFinancialProxyUpstreamError",message:aborted?"IX-Core financial request timed out.":"IX-Core financial request failed."}]});
 }finally{clearTimeout(timeout)}
}

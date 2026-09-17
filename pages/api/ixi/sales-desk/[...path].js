import { salesInquiries } from "../../../../lib/sales-desk/inquiryServer";
import { salesInventory,salesFinancials } from "../../../../lib/sales-desk/salesServer";
import { resolveAosBrowserSession } from "../../../../lib/server/aos/resolveAosBrowserSession";
import { resolveExistingIxCoreAosContext, requestIxCoreMos } from "../../../../lib/server/aos/ixiMosInternalClient";
import { mutationOriginIsValid } from "../../../../lib/ixi-authority/ixiAuthorityProxy";

export function createSalesDeskHandler(deps = {}) {
  const sessionFor = deps.sessionFor || resolveAosBrowserSession;
  const contextFor = deps.contextFor || resolveExistingIxCoreAosContext;
  const request = deps.request || requestIxCoreMos;
  return async function handler(req,res) {
    res.setHeader("Cache-Control","private, no-store, max-age=0");
    const path = `/${(Array.isArray(req.query.path) ? req.query.path : []).map(encodeURIComponent).join("/")}`;
    const valid = req.method === "GET" && /^\/(?:companies|inventory|team|context|bootstrap|people|calendar|work|financial\/[a-zA-Z0-9_-]+|related\/(?:contacts|deals)\/[a-zA-Z0-9_-]+|records\/(?:contacts|deals|tasks|notes|boards|packages|inquiries)(?:\/[a-zA-Z0-9_-]+)?)$/.test(path) || req.method === "POST" && /^\/(?:commands|inquiries\/sync|calendar\/preview|team|invitations(?:\/(?:accept|revoke))?|import\/(?:preview|commit))$/.test(path);
    if (!valid) return res.status(405).json({ok:false,error:{message:"Unsupported Sales Desk operation."}});
    if (!mutationOriginIsValid(req)) return res.status(403).json({ok:false,error:{message:"Cross-origin request denied."}});
    try {
      const session = await sessionFor(req,res);
      const unscoped=path==="/companies" || path==="/invitations/accept";
      const selected=typeof req.query.company==="string" ? req.query.company.trim() : "";
      const context=unscoped ? {entityId:""} : selected ? {entityId:selected} : await contextFor({session});
      const call=(suffix,method="GET",body=null)=>request({path:`/sales-desk${suffix}`,method,body,principalId:session.userId,entityId:context.entityId});
      if(path==="/inquiries/sync") {
        const verified=await call("/context");
        const source=await (deps.inquiriesFor || salesInquiries)(verified.context,{page:req.body?.page,until:req.body?.until});
        const captured=await call("/intake","POST",{rows:source.rows});
        return res.status(200).json({ok:true,...captured,issues:source.issues,page:source.page,totalPages:source.totalPages,total:source.total,until:source.until});
      }
      if(path==="/inventory" || path.startsWith("/financial/")) {
        const verified=await call("/context"),actor=verified.context;
        if(path==="/inquiries/sync") {
        const verified=await call("/context");
        const source=await (deps.inquiriesFor || salesInquiries)(verified.context,{page:req.body?.page,until:req.body?.until});
        const captured=await call("/intake","POST",{rows:source.rows});
        return res.status(200).json({ok:true,...captured,issues:source.issues,page:source.page,totalPages:source.totalPages,total:source.total,until:source.until});
      }
      if(path==="/inventory")return res.status(200).json({ok:true,items:await (deps.inventoryFor || salesInventory)(actor)});
        const id=path.split("/")[2],detail=await call(`/records/deals/${id}`);
        return res.status(200).json({ok:true,...await (deps.financialFor || salesFinancials)({actor,deal:detail.record})});
      }
      const query = new URLSearchParams();
      for (const key of ["q","offset","limit","today","parentId","contactId","dealId","dueBefore","openOnly","from","to","zone","scope","bucket","includeCompleted"]) if (typeof req.query[key] === "string") query.set(key,req.query[key]);
      let payload;
      try { payload = await request({path:`/sales-desk${path}${query.size ? `?${query}` : ""}`,method:req.method,body:req.method === "POST" ? path==="/invitations/accept" ? {entityId:req.body?.entityId,id:req.body?.id,token:req.body?.token,email:session.currentUser?.attributes?.email || "",verifiedEmail:session.currentUser?.attributes?.emailVerified===true} : req.body : null,principalId:session.userId,entityId:context.entityId}); }
      catch(error) {
        if(path!=="/companies" || error.code!=="IXI_INTERNAL_ENTITY_REQUIRED")throw error;
        // Compatibility while a complete backend release is being installed.
        // Resolve the existing owner context; never create an account or seat.
        const existing=await contextFor({session});
        const verified=await request({path:"/sales-desk/context",method:"GET",principalId:session.userId,entityId:existing.entityId});
        const actor=verified.context;
        payload={ok:true,companies:[{entityId:actor.entityId,company:actor.company,role:actor.role}]};
      }
      return res.status(200).json(payload);
    } catch(error) {
      const status = Number(error.status || error.statusCode || 502);
      return res.status(status >= 400 && status <= 599 ? status : 502).json({ok:false,error:{code:error.code || "SALES_UNAVAILABLE",message:status === 404 ? "Sales Desk is being prepared. Please try again shortly." : error.message || "Sales Desk is temporarily unavailable."}});
    }
  };
}
export default createSalesDeskHandler();

export const config={api:{bodyParser:{sizeLimit:"2mb"}},maxDuration:60};

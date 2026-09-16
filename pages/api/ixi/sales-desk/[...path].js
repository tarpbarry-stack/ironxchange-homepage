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
    const valid = req.method === "GET" && /^\/(?:context|bootstrap|people|records\/(?:contacts|deals|tasks|notes|boards)(?:\/[a-zA-Z0-9_-]+)?)$/.test(path) || req.method === "POST" && path === "/commands";
    if (!valid) return res.status(405).json({ok:false,error:{message:"Unsupported Sales Desk operation."}});
    if (!mutationOriginIsValid(req)) return res.status(403).json({ok:false,error:{message:"Cross-origin request denied."}});
    try {
      const session = await sessionFor(req,res);
      const context = await contextFor({session});
      const query = new URLSearchParams();
      for (const key of ["q","offset","limit","today","parentId"]) if (typeof req.query[key] === "string") query.set(key,req.query[key]);
      const payload = await request({path:`/sales-desk${path}${query.size ? `?${query}` : ""}`,method:req.method,body:req.method === "POST" ? req.body : null,principalId:session.userId,entityId:context.entityId});
      return res.status(200).json(payload);
    } catch(error) {
      const status = Number(error.status || error.statusCode || 502);
      return res.status(status >= 400 && status <= 599 ? status : 502).json({ok:false,error:{code:error.code || "SALES_UNAVAILABLE",message:status === 404 ? "Sales Desk is being prepared. Please try again shortly." : error.message || "Sales Desk is temporarily unavailable."}});
    }
  };
}
export default createSalesDeskHandler();

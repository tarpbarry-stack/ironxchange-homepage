import { getIXIEntityLogoUrl } from "../../../../../lib/mos/ixiEntityBranding.mjs";
import fs from "node:fs/promises";
import path from "node:path";
import { mutationOriginIsValid } from "../../../../../lib/ixi-authority/ixiAuthorityProxy";
import { resolveAosBrowserSession } from "../../../../../lib/server/aos/resolveAosBrowserSession";
import { resolveExistingIxCoreAosContext, requestIxCoreFinancial } from "../../../../../lib/server/aos/ixiMosInternalClient";
import { buildMachineLedger } from "../../../../../components/ixi-command-center/IXITransactMachineLedger.mjs";
import { createTransactionPdf } from "../../../../../components/ixi-command-center/IXITransactDocumentDownload";

export const config = { api: { bodyParser: { sizeLimit: "64kb" } }, maxDuration: 60 };

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, private");
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ ok: false, error: "POST required." }); }
  if (!mutationOriginIsValid(req)) return res.status(403).json({ ok: false, error: "Request origin could not be verified." });
  try {
    const ids = [...new Set((Array.isArray(req.body?.documentIds) ? req.body.documentIds : []).map(value => String(value).trim()))];
    if (!ids.length || ids.length > 100 || ids.some(id => !/^ifd_[a-zA-Z0-9_-]+$/.test(id))) return res.status(400).json({ ok: false, error: "Select one to 100 saved transactions." });
    const session = await resolveAosBrowserSession(req, res);
    const context = await resolveExistingIxCoreAosContext({ session });
    const request = options => requestIxCoreFinancial({ ...options, principalId: session.userId, entityId: context.entityId });
    const access = await request({ path: "/financial/access-context", method: "GET" });
    if (access.data?.capabilities?.["financial.export"] !== true) return res.status(403).json({ ok: false, error: "Your account does not have transaction export authority." });
    const records = [];
    for (let index = 0; index < ids.length; index += 8) {
      const batch = await Promise.all(ids.slice(index, index + 8).map(id => request({ path: `/financial/documents/${encodeURIComponent(id)}`, method: "GET" })));
      records.push(...batch.map(result => result.data?.record || result.record).filter(Boolean));
    }
    if (records.length !== ids.length) throw new Error("A selected transaction could not be loaded. Refresh and retry.");
    const entityPassportId = access.data.defaults.entityPassportId;
    const history = await request({ path: `/financial/passports/${encodeURIComponent(entityPassportId)}/documents`, method: "GET" });
    const pool = [...new Map([...(history.data?.documents || []), ...records].map(record => [(record.financialDocument || record.record?.financialDocument)?.financialDocumentId, record])).values()];
    const ledger = buildMachineLedger(pool, { passportId: entityPassportId });
    const rows = ids.map(id => ledger.rows.find(row => row.id === id));
    if (rows.some(row => !row)) throw new Error("The document selection could not be rendered.");
    const entity = { ...(access.data.entities || []).find(item => item.passportId === entityPassportId), displayName: session.displayName };
    entity.logoUrl = getIXIEntityLogoUrl(session, entity);
    // Server PDF rendering may fetch only the governed media CDN.
    const logo = String(entity.logoUrl || entity.imageUrl || entity.logo?.url || entity.logo?.imageUrl || "");
    entity.imageUrl = ""; entity.logo = null; entity.logoUrl = logo;
    try { const url = new URL(logo); if (url.protocol !== "https:" || !url.hostname.endsWith(".imgix.net")) entity.logoUrl = ""; } catch { entity.logoUrl = ""; }
    const blob = await createTransactionPdf({ rows, entity, context: { title: entity.displayName || "IXI TRAN$ACT", passportId: entityPassportId }, fontBytes: await fs.readFile(path.join(process.cwd(), "public/fonts/IXI-Document-Sans.ttf")) });
    const pdf = Buffer.from(await blob.arrayBuffer());
    const result = await request({ path: "/financial/delivery/email", method: "POST", body: {
      documentIds: ids, recipient: String(req.body.recipient || "").trim(), commandId: String(req.body.commandId || ""),
      revisions: Object.fromEntries(records.map(record => [(record.financialDocument || record.record?.financialDocument)?.financialDocumentId, record.server.revision])), pdfBase64: pdf.toString("base64")
    } });
    return res.status(200).json(result);
  } catch (error) { return res.status(error.status || 502).json({ ok: false, error: error.message || "The document could not be sent." }); }
}

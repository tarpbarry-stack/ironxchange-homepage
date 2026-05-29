import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      sellerEmail,
      sellerName,
      buyerName,
      machineTitle,
      machineUrl,
      location,
      hours,
      price,
      message
    } = req.body || {};

    if (!sellerEmail || !machineTitle) {
      return res.status(400).json({
        error: "Missing required fields: sellerEmail and machineTitle"
      });
    }

    const result = await resend.emails.send({
      from: "IronXchange <inquiries@ironxchange.com>",
      to: sellerEmail,
      subject: `New inquiry on your ${machineTitle}`,
      html: `
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#0b0b0b;font-family:Arial,Helvetica,sans-serif;color:#f2f2f2;">
    <div style="width:100%;background:#0b0b0b;padding:34px 14px;">
      <div style="max-width:680px;margin:0 auto;background:#141414;border:1px solid rgba(255,255,255,.10);border-radius:18px;overflow:hidden;">

        <div style="padding:26px 28px 18px;text-align:center;border-bottom:1px solid rgba(255,255,255,.07);">
          <img src="https://preview.ironxchange.com/images/ironxchange-logo.png" alt="IronXchange" style="height:42px;width:auto;margin:0 auto 18px;display:block;" />

          <div style="color:#FFC400;font-size:10px;font-weight:900;letter-spacing:1.8px;text-transform:uppercase;">
            New Buyer Opportunity
          </div>

          <h1 style="margin:9px 0 0;color:#f2f2f2;font-size:27px;line-height:1.12;font-weight:950;">
            New inquiry received
          </h1>
        </div>

        <div style="padding:28px;">
          <p style="margin:0 0 18px;color:#f2f2f2;font-size:16px;line-height:1.55;font-weight:800;">
            ${sellerName ? `Hey ${sellerName},` : "Hey,"}
          </p>

          <p style="margin:0 0 18px;color:rgba(255,255,255,.78);font-size:15px;line-height:1.6;">
            A buyer sent an inquiry on one of your machines.
          </p>

          <div style="margin:22px 0;padding:20px;border-radius:16px;background:#101010;border:1px solid rgba(255,196,0,.20);">
            <div style="color:#FFC400;font-size:11px;font-weight:950;letter-spacing:1.4px;text-transform:uppercase;margin-bottom:8px;">
              Machine
            </div>

            <h2 style="margin:0 0 14px;color:#f2f2f2;font-size:22px;line-height:1.18;font-weight:950;">
              ${machineTitle}
            </h2>

            <div style="color:rgba(255,255,255,.70);font-size:14px;line-height:1.7;">
              ${price ? `<div><strong style="color:#f2f2f2;">Price:</strong> ${price}</div>` : ""}
              ${hours ? `<div><strong style="color:#f2f2f2;">Hours:</strong> ${hours}</div>` : ""}
              ${location ? `<div><strong style="color:#f2f2f2;">Location:</strong> ${location}</div>` : ""}
            </div>
          </div>

          <div style="margin:22px 0;padding:18px;border-radius:14px;background:#0f0f0f;border:1px solid rgba(255,255,255,.08);">
            <div style="color:#FFC400;font-size:11px;font-weight:950;letter-spacing:1.4px;text-transform:uppercase;margin-bottom:10px;">
              Buyer
            </div>

            <p style="margin:0;color:#f2f2f2;font-size:16px;font-weight:900;">
              ${buyerName || "Buyer"}
            </p>
          </div>

          ${
            message
              ? `
          <div style="margin:22px 0;padding:18px;border-radius:14px;background:#0f0f0f;border:1px solid rgba(255,255,255,.08);">
            <div style="color:#FFC400;font-size:11px;font-weight:950;letter-spacing:1.4px;text-transform:uppercase;margin-bottom:10px;">
              Message
            </div>

            <p style="margin:0;color:rgba(255,255,255,.78);font-size:15px;line-height:1.6;">
              “${message}”
            </p>
          </div>
              `
              : ""
          }

          <div style="text-align:center;margin:30px 0;">
            <a href="${machineUrl || "https://ironxchange.com/account/messages"}"
               style="display:inline-block;background:#FFC400;color:#111;text-decoration:none;font-size:12px;font-weight:950;letter-spacing:.8px;text-transform:uppercase;padding:15px 22px;border-radius:12px;">
              View Inquiry
            </a>
          </div>

          <div style="margin-top:26px;padding:16px;border-radius:14px;background:#101010;border:1px solid rgba(255,255,255,.075);">
            <p style="margin:0;color:rgba(255,255,255,.58);font-size:13px;line-height:1.55;text-align:center;">
              IronXchange sends emails when something matters. A new buyer inquiry is an opportunity worth seeing.
            </p>
          </div>
        </div>

        <div style="padding:18px 28px 24px;border-top:1px solid rgba(255,255,255,.07);text-align:center;background:#101010;">
          <p style="margin:0;color:rgba(255,255,255,.46);font-size:12px;line-height:1.5;">
            IronXchange • Machine Distribution Platform
          </p>
        </div>

      </div>
    </div>
  </body>
</html>
      `
    });

    return res.status(200).json({
      ok: true,
      result,
      hasResendKey: !!process.env.RESEND_API_KEY
    });
  } catch (err) {
    console.error("NEW INQUIRY EMAIL ERROR:", err);

    return res.status(500).json({
      error: "New inquiry email failed",
      details: err?.message || String(err)
    });
  }
}

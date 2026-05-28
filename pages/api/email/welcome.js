import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, firstName } = req.body || {};

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const result = await resend.emails.send({
      from: "IronXchange <welcome@ironxchange.com>",
      to: email,
      subject: "Welcome to IronXchange",
      html: `
        <div style="font-family: Arial, sans-serif; background:#0b0b0b; padding:28px; color:#f2f2f2;">
          <div style="max-width:640px; margin:0 auto; background:#141414; border:1px solid rgba(255,255,255,.10); border-radius:16px; padding:28px;">
            <h1 style="color:#FFC400; margin:0 0 14px;">Welcome to IronXchange</h1>

            <p style="font-size:16px; line-height:1.55;">
              ${firstName ? `Hey ${firstName},` : "Hey,"}
            </p>

            <p style="font-size:16px; line-height:1.55;">
              Your IronXchange account has been created.
            </p>

            <p style="font-size:16px; line-height:1.55;">
              IronXchange is built for equipment people — free listings, real machine visibility, and marketplace tools designed to help move iron.
            </p>

            <p style="font-size:16px; line-height:1.55;">
              Before posting or messaging, please confirm your email using the verification email sent separately.
            </p>

            <a href="https://preview.ironxchange.com/account"
               style="display:inline-block; margin-top:14px; background:#FFC400; color:#111; text-decoration:none; font-weight:900; padding:13px 18px; border-radius:10px;">
              Go to Account
            </a>

            <p style="margin-top:24px; color:#999; font-size:12px; line-height:1.45;">
              IronXchange email policy: we send emails when opportunity exists, action is required, security requires attention, or you requested it.
            </p>
          </div>
        </div>
      `,
    });

    return res.status(200).json({ ok: true, result });
  } catch (err) {
    console.error("WELCOME EMAIL ERROR:", err);

    return res.status(500).json({
      error: "Welcome email failed",
      details: err?.message || String(err),
    });
  }
}

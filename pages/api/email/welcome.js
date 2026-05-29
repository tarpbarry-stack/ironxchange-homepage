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

    const first = firstName ? String(firstName).trim() : "";

    const result = await resend.emails.send({
      from: "IronXchange <welcome@ironxchange.com>",
      to: email,
      subject: "Welcome to IronXchange",
      html: `
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#0b0b0b;font-family:Arial,Helvetica,sans-serif;color:#f2f2f2;">
    <div style="width:100%;background:
      radial-gradient(circle at top center, rgba(255,196,0,.08), transparent 32%),
      radial-gradient(circle at 18% 12%, rgba(255,255,255,.035), transparent 28%),
      #0b0b0b;padding:34px 14px;">

      <div style="max-width:680px;margin:0 auto;background:
        linear-gradient(180deg, rgba(255,255,255,.035), rgba(255,255,255,0)),
        #141414;border:1px solid rgba(255,255,255,.10);border-radius:18px;overflow:hidden;
        box-shadow:0 28px 70px rgba(0,0,0,.42);">

        <div style="padding:26px 28px 18px;border-bottom:1px solid rgba(255,255,255,.07);text-align:center;">
          <img src="https://ironxchange.com/images/ironxchange-logo.png" alt="IronXchange" style="height:42px;width:auto;margin:0 auto 18px;display:block;" />

          <div style="color:#FFC400;font-size:10px;font-weight:900;letter-spacing:1.8px;text-transform:uppercase;">
            Machine Distribution Platform
          </div>

          <h1 style="margin:9px 0 0;color:#f2f2f2;font-size:28px;line-height:1.08;font-weight:950;letter-spacing:-.5px;">
            Welcome to IronXchange
          </h1>

          <p style="margin:10px 0 0;color:rgba(255,255,255,.66);font-size:15px;line-height:1.5;">
            ${first ? `Your account is live, ${first}.` : "Your account is live."}
          </p>
        </div>

        <div style="padding:28px;">
          <p style="margin:0 0 18px;color:#f2f2f2;font-size:17px;line-height:1.55;font-weight:800;">
            Thank you for joining us.
          </p>

          <p style="margin:0 0 18px;color:rgba(255,255,255,.78);font-size:15px;line-height:1.6;">
            IronXchange was built because we believe equipment buyers and sellers deserve a better way to move iron.
          </p>

          <div style="margin:20px 0;padding:18px 18px;border-radius:14px;background:#101010;border:1px solid rgba(255,255,255,.08);">
            <p style="margin:0;color:#FFC400;font-size:12px;font-weight:950;letter-spacing:1px;text-transform:uppercase;">
              Not more fees. Not more gatekeepers. Not more friction.
            </p>

            <p style="margin:10px 0 0;color:#f2f2f2;font-size:17px;font-weight:900;line-height:1.45;">
              Just a faster path between a machine and the market.
            </p>
          </div>

          <div style="display:block;margin:24px 0;">
            <div style="margin-bottom:10px;color:rgba(255,255,255,.38);font-size:10px;font-weight:950;letter-spacing:1.2px;text-transform:uppercase;">
              Our Mission
            </div>

            <div style="border-left:3px solid #FFC400;padding-left:15px;">
              <p style="margin:0 0 8px;color:#f2f2f2;font-size:15px;line-height:1.5;font-weight:850;">
                Help you create more opportunities.
              </p>
              <p style="margin:0 0 8px;color:#f2f2f2;font-size:15px;line-height:1.5;font-weight:850;">
                Help you generate more inquiries.
              </p>
              <p style="margin:0;color:#f2f2f2;font-size:15px;line-height:1.5;font-weight:850;">
                Help you buy and sell more equipment.
              </p>
            </div>
          </div>

          <div style="margin:26px 0;padding:20px;border-radius:16px;background:
            linear-gradient(180deg, rgba(255,196,0,.08), rgba(255,196,0,.01)),
            #101010;border:1px solid rgba(255,196,0,.20);">
            <div style="color:#FFC400;font-size:11px;font-weight:950;letter-spacing:1.4px;text-transform:uppercase;margin-bottom:8px;">
              Machine Passport + Launch
            </div>

            <p style="margin:0 0 14px;color:rgba(255,255,255,.80);font-size:15px;line-height:1.6;">
              When you list a machine on IronXchange, you're not just creating another listing.
            </p>

            <p style="margin:0 0 14px;color:#f2f2f2;font-size:18px;line-height:1.35;font-weight:950;">
              You're creating a Machine Passport.
            </p>

            <p style="margin:0 0 16px;color:rgba(255,255,255,.78);font-size:15px;line-height:1.6;">
              A machine record designed to help organize, present, distribute, and market equipment from a single location.
            </p>

            <p style="margin:0 0 14px;color:rgba(255,255,255,.78);font-size:15px;line-height:1.6;">
              Launch takes that passport and helps generate the assets needed to distribute that machine across your sales channels, buyer network, marketing efforts, and equipment contacts.
            </p>

            <div style="display:grid;gap:8px;margin-top:18px;">
              <div style="padding:10px 12px;border-radius:10px;background:#0b0b0b;border:1px solid rgba(255,255,255,.07);color:#f2f2f2;font-size:14px;font-weight:900;">
                One machine.
              </div>
              <div style="padding:10px 12px;border-radius:10px;background:#0b0b0b;border:1px solid rgba(255,255,255,.07);color:#f2f2f2;font-size:14px;font-weight:900;">
                One passport.
              </div>
              <div style="padding:10px 12px;border-radius:10px;background:#0b0b0b;border:1px solid rgba(255,196,0,.22);color:#FFC400;font-size:14px;font-weight:950;">
                One launch point.
              </div>
            </div>
          </div>

          <p style="margin:0 0 18px;color:rgba(255,255,255,.78);font-size:15px;line-height:1.6;">
            Our goal is to make IronXchange the machine distribution hub for the equipment industry — a place where machines are listed, managed, distributed, tracked, and ultimately sold.
          </p>

          <p style="margin:0 0 22px;color:rgba(255,255,255,.78);font-size:15px;line-height:1.6;">
            New tools, new distribution capabilities, new analytics, and new machine intelligence systems are being added continuously.
          </p>

          <div style="text-align:center;margin:28px 0 30px;">
            <a href="https://ironxchange.com/account" style="display:inline-block;background:#FFC400;color:#111;text-decoration:none;font-size:12px;font-weight:950;letter-spacing:.8px;text-transform:uppercase;padding:15px 22px;border-radius:12px;">
              Go To My Account
            </a>
          </div>

          <div style="margin:24px 0;padding:18px;border-radius:14px;background:#0f0f0f;border:1px solid rgba(255,255,255,.075);">
            <div style="color:#FFC400;font-size:11px;font-weight:950;letter-spacing:1.4px;text-transform:uppercase;margin-bottom:10px;">
              Before You Start
            </div>

            <p style="margin:0;color:rgba(255,255,255,.74);font-size:14px;line-height:1.55;">
              Before posting or messaging, please verify your email using the verification email sent separately.
            </p>
          </div>

          <div style="margin:26px 0 0;padding:20px;border-radius:16px;background:#101010;border:1px solid rgba(255,255,255,.08);">
            <div style="color:#FFC400;font-size:11px;font-weight:950;letter-spacing:1.4px;text-transform:uppercase;margin-bottom:10px;">
              Our Email Philosophy
            </div>

            <p style="margin:0 0 12px;color:rgba(255,255,255,.76);font-size:14px;line-height:1.55;">
              We don't send emails because software says we should. We don't send emails because a database changed.
            </p>

            <p style="margin:0 0 14px;color:#f2f2f2;font-size:15px;font-weight:900;line-height:1.5;">
              We send emails when something matters.
            </p>

            <div style="display:grid;gap:8px;">
              <div style="color:rgba(255,255,255,.82);font-size:14px;line-height:1.4;">✓ Opportunity exists</div>
              <div style="color:rgba(255,255,255,.82);font-size:14px;line-height:1.4;">✓ Action is required</div>
              <div style="color:rgba(255,255,255,.82);font-size:14px;line-height:1.4;">✓ Security requires attention</div>
              <div style="color:rgba(255,255,255,.82);font-size:14px;line-height:1.4;">✓ You specifically requested information</div>
            </div>

            <p style="margin:15px 0 0;color:rgba(255,255,255,.58);font-size:13px;line-height:1.55;">
              If an email doesn't help you buy, sell, manage, distribute, protect, or move equipment, we generally won't send it.
            </p>
          </div>

          <p style="margin:28px 0 6px;color:#f2f2f2;font-size:18px;line-height:1.45;font-weight:950;text-align:center;">
            Now go buy and sell some iron.
          </p>

          <p style="margin:0;color:rgba(255,255,255,.48);font-size:13px;text-align:center;">
            — The IronXchange Team
          </p>
        </div>

        <div style="padding:18px 28px 24px;border-top:1px solid rgba(255,255,255,.07);text-align:center;background:#101010;">
          <p style="margin:0 0 8px;color:rgba(255,255,255,.46);font-size:12px;line-height:1.5;">
            IronXchange • Machine Distribution Platform
          </p>

          <p style="margin:0;color:rgba(255,255,255,.34);font-size:11px;line-height:1.5;">
            Free equipment listings. Machine passports. Launch tools. Marketplace intelligence.
          </p>

          <p style="margin:14px 0 0;color:rgba(255,255,255,.30);font-size:10px;line-height:1.5;">
            You received this because you created an IronXchange account.
          </p>
        </div>
      </div>
    </div>
  </body>
</html>
      `,
    });

    return res.status(200).json({
      ok: true,
      result,
      hasResendKey: !!process.env.RESEND_API_KEY
    });
  } catch (err) {
    console.error("WELCOME EMAIL ERROR:", err);

    return res.status(500).json({
      error: "Welcome email failed",
      details: err?.message || String(err),
    });
  }
}

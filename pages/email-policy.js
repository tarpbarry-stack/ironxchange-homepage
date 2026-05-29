import Head from "next/head";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const BRAND_YELLOW = "#FFC400";

export default function EmailPolicyPage() {
  return (
    <>
      <Head>
        <title>Email Policy | IronXchange</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Navbar />

      <main>
        <section className="policy-card">
          <div className="eyebrow">IronXchange Email Policy</div>

          <h1>We email when something matters.</h1>

          <p className="lead">
            IronXchange does not send emails simply because activity occurred.
            We send emails when there is opportunity, action required, security
            concern, or information you specifically requested.
          </p>

          <div className="rule-box">
            <h2>The IronXchange Email Rule</h2>

            <div className="rule-grid">
              <div>Opportunity exists</div>
              <div>Action is required</div>
              <div>Security requires attention</div>
              <div>You requested information</div>
            </div>
          </div>

          <section>
            <h2>Emails We Send</h2>

            <p>
              We may send emails for account security, new inquiries, buyer or
              seller replies, saved search matches, listing issues, account
              notices, marketplace activity, machine opportunities, and other
              communications that help you buy, sell, manage, distribute,
              protect, or move equipment.
            </p>
          </section>

          <section>
            <h2>Emails We Generally Do Not Send</h2>

            <p>
              We generally do not send emails just because you uploaded a
              machine, edited a listing, changed a price, updated photos, or
              performed an action that is already visible inside your account.
            </p>

            <p>
              If you performed the action yourself, you probably do not need an
              email reminding you that you performed it.
            </p>
          </section>

          <section>
            <h2>Our Commitment</h2>

            <p>
              IronXchange was built by equipment people for equipment people.
              We understand the difference between useful information and inbox
              noise.
            </p>

            <p>
              Our goal is not to send more email. Our goal is to send the right
              email when it matters.
            </p>
          </section>

          <div className="closing">
            If an email does not help you buy, sell, manage, distribute,
            protect, or move equipment, we generally will not send it.
          </div>
        </section>
      </main>

      <Footer />

      <style jsx>{`
        :global(html),
        :global(body) {
          margin: 0;
          background: #0b0b0b;
          color: #f2f2f2;
          font-family: Arial, sans-serif;
        }

        main {
          min-height: calc(100vh - 120px);
          padding: 42px 4% 60px;
          background:
            radial-gradient(circle at top center, rgba(255,196,0,.06), transparent 32%),
            radial-gradient(circle at 18% 12%, rgba(255,255,255,.035), transparent 28%),
            #0b0b0b;
        }

        .policy-card {
          max-width: 920px;
          margin: 0 auto;
          padding: 34px;
          border-radius: 18px;
          background:
            linear-gradient(180deg, rgba(255,255,255,.035), rgba(255,255,255,0)),
            #141414;
          border: 1px solid rgba(255,255,255,.09);
          box-shadow:
            0 1px 0 rgba(255,255,255,.04) inset,
            0 28px 70px rgba(0,0,0,.38);
        }

        .eyebrow {
          color: ${BRAND_YELLOW};
          font-size: 10px;
          font-weight: 950;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          margin-bottom: 12px;
        }

        h1 {
          margin: 0 0 16px;
          font-size: 38px;
          line-height: 1.05;
          letter-spacing: -1px;
        }

        .lead {
          max-width: 760px;
          color: rgba(255,255,255,.74);
          font-size: 17px;
          line-height: 1.65;
          margin: 0 0 26px;
        }

        .rule-box {
          margin: 28px 0;
          padding: 22px;
          border-radius: 16px;
          background:
            linear-gradient(180deg, rgba(255,196,0,.075), rgba(255,196,0,.01)),
            #101010;
          border: 1px solid rgba(255,196,0,.20);
        }

        h2 {
          margin: 0 0 12px;
          color: #f2f2f2;
          font-size: 15px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: .8px;
        }

        .rule-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
        }

        .rule-grid div {
          padding: 13px;
          border-radius: 12px;
          background: #0b0b0b;
          border: 1px solid rgba(255,255,255,.075);
          color: ${BRAND_YELLOW};
          font-size: 12px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: .45px;
          text-align: center;
        }

        section {
          margin-top: 28px;
          padding-top: 24px;
          border-top: 1px solid rgba(255,255,255,.07);
        }

        p {
          color: rgba(255,255,255,.72);
          font-size: 15px;
          line-height: 1.65;
          margin: 0 0 14px;
        }

        .closing {
          margin-top: 30px;
          padding: 18px;
          border-radius: 14px;
          background: #101010;
          border: 1px solid rgba(255,255,255,.08);
          color: #f2f2f2;
          font-size: 16px;
          font-weight: 900;
          line-height: 1.5;
          text-align: center;
        }

        @media (max-width: 760px) {
          main {
            padding: 24px 4% 42px;
          }

          .policy-card {
            padding: 24px 20px;
          }

          h1 {
            font-size: 29px;
          }

          .rule-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}

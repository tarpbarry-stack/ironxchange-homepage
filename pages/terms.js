import Head from "next/head";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function TermsPage() {
  return (
    <>
      <Head>
  <title>Terms of Service | IronXchange</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />

  <link
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
    rel="stylesheet"
  />
</Head>

      <main>
        <Navbar />

        <section className="legal-wrap">
          <div className="legal-card">
            <span>IronXchange Legal</span>
            <h1>Terms of Service</h1>
            <p className="updated">Last updated: May 26, 2026</p>

            <p>
              IronXchange is a heavy equipment marketplace that allows users to browse,
              post, and inquire about equipment listings. By using IronXchange, you agree
              to these Terms of Service.
            </p>

            <h2>1. Marketplace Role</h2>
            <p>
              IronXchange provides a platform for equipment buyers and sellers to connect.
              IronXchange is not a party to any sale, purchase, inspection, financing,
              transportation, warranty, or other transaction between users.
            </p>

            <h2>2. Listings</h2>
            <p>
              Sellers are responsible for the accuracy of their listings, including machine
              condition, hours, location, price, ownership, liens, attachments, photos, and
              descriptions. IronXchange may remove or restrict listings that appear false,
              misleading, unlawful, abusive, or inappropriate.
            </p>

            <h2>3. Buyer Responsibility</h2>
            <p>
              Buyers are responsible for inspecting equipment, verifying ownership,
              confirming condition, reviewing documents, and completing their own due
              diligence before any purchase.
            </p>

            <h2>4. No Warranty</h2>
            <p>
              IronXchange does not guarantee the condition, availability, accuracy,
              legality, merchantability, fitness, ownership, or value of any equipment
              listed on the platform.
            </p>

            <h2>5. User Conduct</h2>
            <p>
              Users may not post fraudulent listings, impersonate others, upload malicious
              content, scrape the platform without permission, interfere with site
              operations, or use IronXchange for unlawful activity.
            </p>

            <h2>6. Account Information</h2>
            <p>
              You are responsible for keeping your account credentials secure and for all
              activity that occurs under your account.
            </p>

            <h2>7. Communications</h2>
            <p>
              By using IronXchange, you agree that buyers, sellers, and IronXchange may
              contact you regarding listings, inquiries, account activity, and marketplace
              operations.
            </p>

            <h2>8. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, IronXchange is not liable for lost
              profits, lost opportunities, equipment defects, failed transactions, disputes,
              damages, or losses arising from use of the platform.
            </p>

            <h2>9. Changes</h2>
            <p>
              IronXchange may update these Terms from time to time. Continued use of the
              platform after changes means you accept the updated Terms.
            </p>

            <h2>10. Contact</h2>
            <p>
              Questions about these Terms may be sent through the IronXchange contact page.
            </p>
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
          font-family: 'Inter Variable', Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          -webkit-font-smoothing: antialiased;
          text-rendering: geometricPrecision;
        }

        main {
          min-height: 100vh;
          background:
            radial-gradient(circle at top center, rgba(255,196,0,.04), transparent 30%),
            #0b0b0b;
        }

        .legal-wrap {
          max-width: 980px;
          margin: 0 auto;
          padding: 34px 3% 54px;
        }

        .legal-card {
          background:
            linear-gradient(180deg, rgba(255,255,255,.032), rgba(255,255,255,0)),
            radial-gradient(circle at top, rgba(255,255,255,.018), transparent 72%),
            #141414;

          border: 1px solid rgba(255,255,255,.065);
          outline: 1px solid rgba(255,255,255,.018);
          border-radius: 15px;

          padding: 32px;

          box-shadow:
            0 1px 0 rgba(255,255,255,.045) inset,
            0 28px 70px rgba(0,0,0,.32);
        }

        span {
          color: #FFC400;
          font-size: 12px;
          font-weight: 950;
          letter-spacing: .72px;
          text-transform: uppercase;
        }

        h1 {
          margin: 8px 0 6px;
          font-size: 34px;
          line-height: 1;
          font-weight: 950;
          letter-spacing: -1px;
          text-transform: uppercase;
        }

        .updated {
          color: rgba(255,255,255,.38);
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .45px;
          margin-bottom: 24px;
        }

        h2 {
          margin: 24px 0 8px;
          color: rgba(255,255,255,.88);
          font-size: 16px;
          font-weight: 950;
          letter-spacing: .62px;
          text-transform: uppercase;
        }

        p {
          margin: 0 0 12px;
          color: rgba(255,255,255,.66);
          font-size: 16px;
          line-height: 1.62;
        }

        @media (max-width: 650px) {
          .legal-card {
            padding: 24px 20px;
          }

          h1 {
            font-size: 26px;
          }
        }
      `}</style>
    </>
  );
}

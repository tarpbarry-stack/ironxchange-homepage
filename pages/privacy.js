import Head from "next/head";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function PrivacyPage() {
  return (
    <>
      <Head>
  <title>Privacy Policy | IronXchange</title>
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
            <h1>Privacy Policy</h1>
            <p className="updated">Last updated: February 1, 2026</p>

            <p>
              IronXchange operates an online marketplace platform that enables users
              to browse, list, promote, and inquire about equipment and related
              services. This Privacy Policy explains how we collect, use, disclose,
              and otherwise process personal information when you use IronXchange.
            </p>

            <h2>1. Data Controller</h2>
            <p>
              IronXchange is responsible for the processing of personal information
              described in this Privacy Policy.
            </p>
            <p>
              Contact: legal@ironexchange.com<br />
              Location: United States, Texas
            </p>

            <h2>2. Information We Collect</h2>
            <p>
              We may collect information you provide directly, including your name,
              company name, email address, phone number, account credentials, seller
              profile information, listings, descriptions, photos, videos, messages,
              and other information submitted through the Service.
            </p>
            <p>
              We may also collect information automatically, including IP address,
              browser type, device identifiers, approximate location, usage data,
              search activity, logs, cookies, and similar technologies.
            </p>
            <p>
              We may receive information from third parties, including payment
              processors, analytics providers, advertising providers, public databases,
              business information sources, service providers, and other users.
            </p>

            <h2>3. How We Use Information</h2>
            <p>
              We use personal information to operate the marketplace, create and manage
              accounts, publish listings, enable buyer-seller communications, improve
              the Service, provide customer support, prevent fraud, secure the platform,
              analyze performance, market IronXchange, and comply with legal obligations.
            </p>

            <h2>4. Legal Bases</h2>
            <p>
              Where applicable, we process personal information based on performance of
              a contract, legitimate business interests, user consent, and compliance
              with legal obligations.
            </p>

            <h2>5. Sharing of Information</h2>
            <p>
              We may share personal information with other users as part of normal
              marketplace activity, service providers, contractors, payment processors,
              analytics and advertising partners, affiliates, business partners,
              authorities where legally required, and parties involved in a merger,
              acquisition, financing, or sale of assets.
            </p>

            <h2>6. Public Content</h2>
            <p>
              Listings, images, descriptions, seller profiles, and other content posted
              publicly may be visible to other users, search engines, and third parties.
              You are responsible for the information you choose to make public.
            </p>

            <h2>7. Cookies and Tracking</h2>
            <p>
              We use cookies and similar technologies to operate and improve the Service,
              analyze usage, remember preferences, support security, and assist with
              marketing or advertising. You may control cookies through your browser
              settings, though disabling cookies may affect functionality.
            </p>

            <h2>8. Data Retention</h2>
            <p>
              We retain personal information for as long as reasonably necessary for the
              purposes described in this Privacy Policy, as required by law, or as needed
              for legitimate business purposes, including fraud prevention, dispute
              resolution, compliance, and recordkeeping.
            </p>

            <h2>9. Security</h2>
            <p>
              We use commercially reasonable safeguards to protect personal information.
              However, no system is completely secure, and we cannot guarantee absolute
              security.
            </p>

            <h2>10. Your Rights</h2>
            <p>
              Depending on your location, you may have rights to access, correct, delete,
              restrict, object to, or request a copy of certain personal information. You
              may also have the right to withdraw consent where processing is based on
              consent.
            </p>
            <p>
              Privacy requests may be submitted to legal@ironexchange.com. We may need
              to verify your identity and may deny requests where permitted by law.
            </p>

            <h2>11. U.S. State Privacy Rights</h2>
            <p>
              Some U.S. state privacy laws, including California privacy law, provide
              eligible residents rights regarding personal information collected,
              disclosed, shared, or sold by businesses. These rights may include the
              right to know, access, correct, delete, opt out of certain sharing or sales,
              and not be discriminated against for exercising privacy rights. California’s
              CCPA gives consumers control over personal information businesses collect
              about them. 
            </p>

            <h2>12. International Transfers</h2>
            <p>
              Personal information may be processed and stored in the United States or
              other jurisdictions where our service providers operate. By using the
              Service, you understand that your information may be transferred to and
              processed in those locations.
            </p>

            <h2>13. Children</h2>
            <p>
              IronXchange is intended for business and equipment marketplace users and
              is not directed to children under 13. We do not knowingly collect personal
              information from children under 13.
            </p>

            <h2>14. Changes</h2>
            <p>
              We may update this Privacy Policy from time to time. Changes become
              effective when posted. Continued use of IronXchange after changes are
              posted means you accept the updated Privacy Policy.
            </p>

            <h2>15. Contact</h2>
            <p>
              Questions or privacy requests may be sent to:<br />
              IronXchange<br />
              Email: legal@ironexchange.com
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
          font-family: Arial, sans-serif;
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
          font-size: 9px;
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
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .45px;
          margin-bottom: 24px;
        }

        h2 {
          margin: 24px 0 8px;
          color: rgba(255,255,255,.88);
          font-size: 12px;
          font-weight: 950;
          letter-spacing: .62px;
          text-transform: uppercase;
        }

        p {
          margin: 0 0 12px;
          color: rgba(255,255,255,.66);
          font-size: 14px;
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

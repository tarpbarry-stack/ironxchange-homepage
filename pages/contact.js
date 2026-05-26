import Head from "next/head";

export default function Contact() {
return (
  <>
    <Head>
      <title>Contact IronXchange</title>

      <meta
        name="description"
        content="Contact IronXchange for marketplace support, partnerships, listings, and advertising opportunities."
      />

      <meta
        name="viewport"
        content="width=device-width, initial-scale=1"
      />

      <link
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
        rel="stylesheet"
      />
    </Head>

    <main>
      <nav className="topbar">
        <a href="/" className="logo-wrap">
          <img
            src="/images/ironxchange-logo.png"
            alt="IronXchange"
            className="logo"
          />
        </a>

        <div className="nav-links">
          <a href="/browse">SEARCH</a>

          <a href="/post-free" className="yellow-link">
            POST FREE
          </a>

          <a href="/login" className="login-icon">
            <i className="fa-regular fa-user"></i>
          </a>
        </div>
      </nav>

      <section className="hero-shell">
        <div className="hero-panel">
          <span className="eyebrow">IronXchange Contact</span>

          <h1>CONTACT IRONXCHANGE</h1>

          <p className="intro">
            Marketplace support, listing help, partnerships, advertising,
            integrations, media opportunities, and dealer onboarding.
          </p>

          <div className="contact-grid">
            <div className="contact-card">
              <div className="contact-icon">
                <i className="fa-regular fa-envelope"></i>
              </div>

              <div>
                <span>General Support</span>

                <a href="mailto:info@ironxchange.com">
                  info@ironxchange.com
                </a>

                <p>
                  Listing support, buyer questions, seller help, and marketplace operations.
                </p>
              </div>
            </div>

            <div className="contact-card">
              <div className="contact-icon">
                <i className="fa-solid fa-handshake"></i>
              </div>

              <div>
                <span>Partnership Opportunities</span>

                <a href="mailto:info@ironxchange.com">
                  info@ironxchange.com
                </a>

                <p>
                  Dealer partnerships, auction companies, integrations, media,
                  sponsorships, and growth opportunities.
                </p>
              </div>
            </div>

            <div className="contact-card">
              <div className="contact-icon">
                <i className="fa-solid fa-location-dot"></i>
              </div>

              <div>
                <span>Headquarters</span>

                <strong>Irving, Texas</strong>

                <p>
                  IronXchange is operated in the United States and built for the heavy equipment industry.
                </p>
              </div>
            </div>
          </div>

          <div className="bottom-links">
            <a href="/terms">Terms</a>
            <a href="/privacy">Privacy</a>
            <a href="/browse">Browse Equipment</a>
          </div>
        </div>
      </section>

      <style jsx>{`
        :global(html),
        :global(body) {
          margin: 0;
          min-height: 100%;
          overflow-x: hidden;
          background: #0b0b0b;
          color: #f2f2f2;
          font-family: Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
          text-rendering: geometricPrecision;
        }

        * {
          box-sizing: border-box;
        }

        main {
          min-height: 100vh;

          background:
            radial-gradient(circle at top center, rgba(255,196,0,.045), transparent 28%),
            radial-gradient(circle at 18% 10%, rgba(255,255,255,.02), transparent 22%),
            #0b0b0b;
        }

        .topbar {
          height: 60px;

          display: flex;
          justify-content: space-between;
          align-items: center;

          padding: 7px 2.5%;

          background:
            linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,0)),
            #050505;

          border-bottom: 1px solid rgba(255,255,255,.07);

          box-shadow:
            0 1px 0 rgba(255,255,255,.025) inset,
            0 10px 28px rgba(0,0,0,.28);
        }

        .logo {
          height: 36px;
          width: auto;
          display: block;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .nav-links a {
          color: rgba(255,255,255,.76);

          text-decoration: none;

          font-size: 11px;
          font-weight: 900;

          letter-spacing: .55px;
          text-transform: uppercase;

          transition:
            color .14s ease,
            transform .14s ease;
        }

        .nav-links a:hover {
          color: #f2f2f2;
          transform: translateY(-1px);
        }

        .yellow-link {
          color: #FFC400 !important;
        }

        .login-icon {
          width: 27px;
          height: 27px;

          display: grid;
          place-items: center;

          border: 1px solid rgba(255,255,255,.18);
          border-radius: 50%;

          color: rgba(255,255,255,.7) !important;

          background:
            linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,0)),
            #080808;
        }

        .hero-shell {
          max-width: 1120px;

          margin: 0 auto;

          padding: 44px 3% 60px;
        }

        .hero-panel {
          position: relative;

          background:
            linear-gradient(180deg, rgba(255,255,255,.032), rgba(255,255,255,0)),
            radial-gradient(circle at top, rgba(255,255,255,.018), transparent 72%),
            #141414;

          border: 1px solid rgba(255,255,255,.065);
          outline: 1px solid rgba(255,255,255,.018);

          border-radius: 18px;

          padding: 40px;

          overflow: hidden;

          box-shadow:
            0 1px 0 rgba(255,255,255,.045) inset,
            0 28px 70px rgba(0,0,0,.34);
        }

        .hero-panel::before {
          content: "";

          position: absolute;
          top: 0;
          left: 40px;
          right: 40px;

          height: 1px;

          background:
            linear-gradient(
              90deg,
              transparent,
              rgba(255,196,0,.38),
              transparent
            );

          opacity: .65;
        }

        .eyebrow {
          display: block;

          color: #FFC400;

          font-size: 9px;
          font-weight: 950;

          letter-spacing: .72px;
          text-transform: uppercase;

          margin-bottom: 10px;
        }

        h1 {
          margin: 0;

          color: #f2f2f2;

          font-size: clamp(42px, 5vw, 72px);
          line-height: .92;

          font-weight: 950;
          letter-spacing: -2px;

          text-transform: uppercase;
        }

        .intro {
          max-width: 720px;

          margin: 16px 0 0;

          color: rgba(255,255,255,.62);

          font-size: 15px;
          line-height: 1.7;
        }

        .contact-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));

          gap: 12px;

          margin-top: 34px;
        }

        .contact-card {
          background:
            linear-gradient(180deg, rgba(255,255,255,.02), rgba(255,255,255,0)),
            #101010;

          border: 1px solid rgba(255,255,255,.06);
          border-radius: 14px;

          padding: 18px;

          box-shadow:
            0 1px 0 rgba(255,255,255,.02) inset,
            0 14px 34px rgba(0,0,0,.16);

          transition:
            border-color .14s ease,
            transform .14s ease,
            background .14s ease;
        }

        .contact-card:hover {
          transform: translateY(-2px);

          border-color: rgba(255,196,0,.22);

          background:
            linear-gradient(180deg, rgba(255,196,0,.03), rgba(255,196,0,0)),
            #141414;
        }

        .contact-icon {
          width: 42px;
          height: 42px;

          display: grid;
          place-items: center;

          border-radius: 12px;

          margin-bottom: 14px;

          color: #FFC400;

          border: 1px solid rgba(255,196,0,.18);

          background:
            linear-gradient(180deg, rgba(255,196,0,.08), rgba(255,196,0,0)),
            #151515;
        }

        .contact-card span {
          display: block;

          color: rgba(255,255,255,.42);

          font-size: 8.5px;
          font-weight: 950;

          letter-spacing: .68px;
          text-transform: uppercase;

          margin-bottom: 8px;
        }

        .contact-card a,
        .contact-card strong {
          display: block;

          color: #f2f2f2;

          font-size: 16px;
          font-weight: 900;

          line-height: 1.3;

          text-decoration: none;
        }

        .contact-card p {
          margin: 10px 0 0;

          color: rgba(255,255,255,.52);

          font-size: 12px;
          line-height: 1.55;
        }

        .bottom-links {
          display: flex;
          gap: 18px;

          margin-top: 34px;
          padding-top: 20px;

          border-top: 1px solid rgba(255,255,255,.05);
        }

        .bottom-links a {
          color: rgba(255,255,255,.42);

          text-decoration: none;

          font-size: 10px;
          font-weight: 900;

          letter-spacing: .55px;
          text-transform: uppercase;
        }

        .bottom-links a:hover {
          color: #FFC400;
        }

        @media (max-width: 900px) {
          .contact-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 650px) {
          .hero-panel {
            padding: 26px 22px;
            border-radius: 16px;
          }

          .hero-panel::before {
            left: 22px;
            right: 22px;
          }

          .bottom-links {
            flex-direction: column;
            gap: 10px;
          }
        }
      `}</style>
    </main>
  </>
);

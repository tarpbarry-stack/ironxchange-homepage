import Head from "next/head";

const STAGING = "https://staging.ironxchange.com";
const BRAND_YELLOW = "#FFC400";

export default function ListingPage() {
  return (
    <>
      <Head>
        <title>2020 DEERE 872GP | IronXchange</title>

        <link
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
          rel="stylesheet"
        />
      </Head>

      <main>
        <nav className="nav">
          <a href="/" className="logo-wrap">
            <img
              src="/images/ironxchange-logo.png"
              className="logo-img"
              alt="IronXchange"
            />
          </a>

          <div className="nav-links">
            <a href={`${STAGING}/l/new`} className="yellow-link">
              POST FREE
            </a>

            <a
              href={`${STAGING}/login`}
              className="login-icon"
              aria-label="Login"
            >
              <i className="fa-regular fa-user"></i>
            </a>
          </div>
        </nav>

        <section className="page">
          <div className="title-row">
            <div>
              <h1>2020 DEERE 872GP</h1>
              <p>3,875 hrs · Colorado City, TX</p>
            </div>

            <div className="price">$179,000</div>
          </div>

          <div className="photo-grid">
            <div className="hero-wrap">
              <img
                src="/images/2020-Deere-772GP.jpg"
                alt="2020 Deere 872GP"
                className="hero-photo"
              />

              <button className="arrow left">‹</button>
              <button className="arrow right">›</button>

              <div className="photo-actions">
                <span>♡ Save</span>
                <span>↗ Share</span>
                <span>👁 Watch</span>
              </div>
            </div>

            <div className="photo-rail">
              <img src="/images/2020-Deere-772GP.jpg" alt="" />
              <img src="/images/2020-Deere-772GP.jpg" alt="" />
              <img src="/images/2020-Deere-772GP.jpg" alt="" />
              <img src="/images/2020-Deere-772GP.jpg" alt="" />
              <img src="/images/2020-Deere-772GP.jpg" alt="" />
              <img src="/images/2020-Deere-772GP.jpg" alt="" />
              <img src="/images/2020-Deere-772GP.jpg" alt="" />
              <img src="/images/2020-Deere-772GP.jpg" alt="" />
            </div>
          </div>

          <section className="info-grid">
            <div className="panel">
              <h2>Quick Facts</h2>

              <div className="facts">
                <span>Year</span>
                <strong>2020</strong>

                <span>Make</span>
                <strong>Deere</strong>

                <span>Model</span>
                <strong>872GP</strong>

                <span>Hours</span>
                <strong>3,875</strong>

                <span>Serial #</span>
                <strong>1DW872GPCLF123456</strong>

                <span>Location</span>
                <strong>Colorado City, TX</strong>

                <span>Seller</span>
                <strong>Private Seller</strong>
              </div>
            </div>

            <div className="panel">
              <h2>Highlights</h2>

              <ul className="highlights">
                <li>Clean cab</li>
                <li>Push block</li>
                <li>Rear ripper</li>
                <li>Matching tires</li>
                <li>Tight machine</li>
                <li>Ready to work</li>
              </ul>
            </div>
          </section>

          <section className="panel description">
            <h2>Description</h2>

            <p>
              Very clean 2020 John Deere 872GP with 3,875 hours. Machine has
              been well maintained and is work ready. Tight and straight with no
              known issues. Push block, rear ripper, clean cab, and strong
              overall presentation.
            </p>

            <p>
              Cab is clean and in good shape. Controls are tight and responsive.
              Machine starts, runs, and operates as it should.
            </p>
          </section>

          <section className="panel seller-panel">
            <div>
              <h2>Contact Seller</h2>

              <div className="seller-row">
                <div className="seller-avatar">
                  <i className="fa-regular fa-user"></i>
                </div>

                <div>
                  <strong>Private Seller</strong>
                  <p>Colorado City, TX</p>
                </div>
              </div>
            </div>

            <div className="seller-actions">
              <a href={`${STAGING}/login`} className="message-btn">
                Message Seller
              </a>

              <a href="tel:" className="call-btn">
                Call
              </a>
            </div>
          </section>
        </section>
      </main>

      <style jsx>{`
        :global(body) {
          margin: 0;
          background: #0b0b0b;
          color: #d6d6d6;
          font-family: Arial, sans-serif;
        }

        * {
          box-sizing: border-box;
        }

        main {
          min-height: 100vh;
          background: #0b0b0b;
        }

        .nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 5%;
          background: #050505;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .logo-img {
          height: 78px;
          width: auto;
          display: block;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 28px;
        }

        .nav-links a {
          color: white;
          text-decoration: none;
          font-weight: 900;
          text-transform: uppercase;
          font-size: 13px;
          letter-spacing: 0.6px;
        }

        .yellow-link {
          color: ${BRAND_YELLOW} !important;
        }

        .login-icon {
          border: 2px solid white;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          display: grid;
          place-items: center;
          font-size: 15px !important;
        }

        .page {
          padding: 28px 3%;
          max-width: 1500px;
          margin: 0 auto;
        }

        .title-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 24px;
          margin-bottom: 18px;
        }

        h1 {
          margin: 0;
          color: #f2f2f2;
          font-size: 30px;
          font-weight: 800;
          letter-spacing: -0.5px;
          line-height: 1.1;
        }

        .title-row p {
          margin: 10px 0 0;
          color: #9a9a9a;
          font-size: 16px;
        }

        .price {
          color: #f2f2f2;
          font-size: 32px;
          font-weight: 800;
          letter-spacing: -0.6px;
          white-space: nowrap;
        }

        .photo-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 300px;
          gap: 12px;
          margin-top: 18px;
        }

        .hero-wrap {
          position: relative;
          min-width: 0;
        }

        .hero-photo {
          width: 100%;
          height: 620px;
          object-fit: cover;
          display: block;
          border-radius: 14px;
          background: #111;
        }

        .photo-rail {
          height: 620px;
          overflow-y: auto;
          display: grid;
          grid-auto-rows: 146px;
          gap: 12px;
          padding-right: 2px;
        }

        .photo-rail img {
          width: 100%;
          height: 146px;
          object-fit: cover;
          border-radius: 14px;
          cursor: pointer;
          opacity: 0.9;
          transition: opacity 0.15s ease, transform 0.15s ease;
        }

        .photo-rail img:hover {
          opacity: 1;
          transform: translateY(-1px);
        }

        .photo-actions {
          position: absolute;
          left: 20px;
          bottom: 20px;
          display: flex;
          gap: 18px;
          background: rgba(0, 0, 0, 0.62);
          backdrop-filter: blur(8px);
          padding: 12px 16px;
          border-radius: 10px;
          color: #e5e5e5;
          font-size: 14px;
        }

        .arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 42px;
          height: 42px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.28);
          background: rgba(0, 0, 0, 0.42);
          color: #f2f2f2;
          font-size: 32px;
          line-height: 1;
          cursor: pointer;
        }

        .arrow.left {
          left: 18px;
        }

        .arrow.right {
          right: 18px;
        }

        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-top: 22px;
        }

        .panel {
          background: #151515;
          border: 1px solid #282828;
          border-radius: 16px;
          padding: 24px;
        }

        .panel h2 {
          margin: 0 0 18px;
          color: #f2f2f2;
          font-size: 18px;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .facts {
          display: grid;
          grid-template-columns: 130px 1fr;
          row-gap: 12px;
          column-gap: 24px;
          font-size: 15px;
        }

        .facts span {
          color: #9a9a9a;
        }

        .facts strong {
          color: #e5e5e5;
          font-weight: 500;
        }

        .highlights {
          margin: 0;
          padding: 0;
          list-style: none;
          display: grid;
          gap: 14px;
          font-size: 15px;
        }

        .highlights li::before {
          content: "✓";
          color: ${BRAND_YELLOW};
          margin-right: 12px;
          font-weight: 900;
        }

        .description {
          margin-top: 16px;
        }

        .description p {
          color: #d0d0d0;
          line-height: 1.7;
          font-size: 16px;
          margin: 0 0 16px;
          max-width: 1100px;
        }

        .description p:last-child {
          margin-bottom: 0;
        }

        .seller-panel {
          margin-top: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 24px;
        }

        .seller-row {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .seller-avatar {
          width: 58px;
          height: 58px;
          border-radius: 50%;
          border: 1px solid #777;
          display: grid;
          place-items: center;
          font-size: 28px;
          color: #ddd;
        }

        .seller-row strong {
          color: #f2f2f2;
          font-size: 16px;
        }

        .seller-row p {
          margin: 5px 0 0;
          color: #aaa;
        }

        .seller-actions {
          display: flex;
          gap: 16px;
          min-width: 430px;
        }

        .message-btn,
        .call-btn {
          flex: 1;
          text-align: center;
          text-decoration: none;
          text-transform: uppercase;
          font-weight: 900;
          border-radius: 10px;
          padding: 18px 20px;
          font-size: 13px;
          letter-spacing: 0.3px;
        }

        .message-btn {
          background: ${BRAND_YELLOW};
          color: #050505;
        }

        .call-btn {
          border: 1px solid #3a3a3a;
          color: #e5e5e5;
        }

        @media (max-width: 950px) {
          .photo-grid {
            grid-template-columns: 1fr;
          }

          .hero-photo {
            height: auto;
            object-fit: contain;
          }

          .photo-rail {
            display: none;
          }

          .info-grid {
            grid-template-columns: 1fr;
          }

          .seller-panel {
            align-items: stretch;
            flex-direction: column;
          }

          .seller-actions {
            min-width: 0;
            width: 100%;
          }
        }

        @media (max-width: 850px) {
          .logo-img {
            height: 56px;
          }

          .nav-links {
            gap: 18px;
          }

          .yellow-link {
            font-size: 12px !important;
          }

          .login-icon {
            width: 28px;
            height: 28px;
          }

          .page {
            padding: 22px 4%;
          }

          .title-row {
            flex-direction: column;
            gap: 8px;
          }

          h1 {
            font-size: 24px;
          }

          .price {
            font-size: 25px;
          }

          .photo-actions {
            left: 12px;
            bottom: 12px;
            gap: 12px;
            font-size: 12px;
            padding: 10px 12px;
          }

          .arrow {
            display: none;
          }

          .panel {
            padding: 20px;
          }

          .facts {
            grid-template-columns: 110px 1fr;
            font-size: 14px;
          }

          .seller-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </>
  );
}

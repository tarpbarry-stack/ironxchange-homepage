import { useEffect, useState } from "react";

export default function Navbar() {

const [loggedIn, setLoggedIn] = useState(false);

useEffect(() => {
  async function checkAuth() {
    try {
      const SharetribeSdk = await import("sharetribe-flex-sdk");

      const sdk = SharetribeSdk.createInstance({
        clientId: process.env.NEXT_PUBLIC_SHARETRIBE_CLIENT_ID
      });

      await sdk.currentUser.show();

      setLoggedIn(true);
    } catch {
      setLoggedIn(false);
    }
  }

  checkAuth();
}, []);



  
  return (
    <nav className="nav">
      <div className="brand-side">
        <a href="/" className="logo-wrap">
          <img
            src="/images/ironxchange-logo.png"
            className="logo-img"
            alt="IronXchange"
          />
        </a>

        <div className="social-mini">
          <a
            href="https://www.facebook.com/profile.php?id=61589249515383"
            aria-label="Facebook"
            target="_blank"
            rel="noreferrer"
          >
            <i className="fa-brands fa-facebook-f"></i>
          </a>

          <a
            href="https://www.instagram.com/ironxchangehq/"
            aria-label="Instagram"
            target="_blank"
            rel="noreferrer"
          >
            <i className="fa-brands fa-instagram"></i>
          </a>

          <a
            href="https://www.linkedin.com/company/ironxchange/"
            aria-label="LinkedIn"
            target="_blank"
            rel="noreferrer"
          >
            <i className="fa-brands fa-linkedin-in"></i>
          </a>

          <a
            href="https://www.youtube.com/channel/UCjAc5SVwVEcW5EaAKi2cfFg"
            aria-label="YouTube"
            target="_blank"
            rel="noreferrer"
          >
            <i className="fa-brands fa-youtube"></i>
          </a>

          <a
            href="https://www.tiktok.com/@ironxchangehq"
            aria-label="TikTok"
            target="_blank"
            rel="noreferrer"
          >
            <i className="fa-brands fa-tiktok"></i>
          </a>
        </div>
      </div>

      <div className="nav-links">
        <a href="/browse">SEARCH</a>

        <a href="/post-free" className="yellow-link">
          POST FREE
        </a>

       <a
  href={loggedIn ? "/account" : "/login"}
  className={`login-icon ${loggedIn ? "logged-in" : ""}`}
  aria-label="Account"
>
          <i className="fa-regular fa-user"></i>
        </a>
      </div>

      <style jsx>{`
        .nav {
          height: 60px;

          display: flex;
          justify-content: space-between;
          align-items: center;

          padding: 7px 2.5%;

          background:
            linear-gradient(180deg, rgba(255,255,255,.028), rgba(255,255,255,0)),
            #050505;

          border-bottom: 1px solid rgba(255,255,255,.07);

          box-shadow:
            0 1px 0 rgba(255,255,255,.025) inset,
            0 10px 28px rgba(0,0,0,.28);
        }

        .brand-side {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .logo-img {
          height: 36px;
          display: block;
        }

        .social-mini {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .social-mini a {
          width: 13px;
          height: 18px;

          display: grid;
          place-items: center;

          color: rgba(255,255,255,.40) !important;

          font-size: 8.75px;
          line-height: 1;

          text-decoration: none;

          transition: color .14s ease;
        }

        .social-mini a:hover {
          color: rgba(255,196,0,.78) !important;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .nav-links a {
          color: rgba(255,255,255,.86);
          text-decoration: none;
          font-weight: 900;
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: .55px;
          line-height: 1;
        }

        .yellow-link {
          color: #FFC400 !important;
        }

        .login-icon {
          width: 27px;
          height: 27px;

          display: grid;
          place-items: center;

          border: 1px solid rgba(56,161,105,.78);
          border-radius: 50%;

          color: #38A169 !important;

          font-size: 13px !important;

          box-shadow:
            0 1px 0 rgba(255,255,255,.05) inset,
            0 0 0 1px rgba(255,255,255,.018);
        }

        .login-icon.logged-in {
          border-color: rgba(56,161,105,.78);
          color: #38A169 !important;
        }

        @media (max-width: 850px) {
          .nav {
            height: 60px;
          }

          .logo-img {
            height: 32px;
          }

          .social-mini {
            display: none;
          }

          .nav-links {
            gap: 12px;
          }

          .nav-links a {
            font-size: 10px;
          }
        }
      `}</style>
    </nav>
  );
}

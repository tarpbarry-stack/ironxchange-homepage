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
        <a href="/browse-v2" className="logo-wrap">
          <img
            src="/images/ironxchange-logo.png"
            className="logo-img"
            alt="IronXchange"
          />
        </a>
      </div>

      <div className="nav-links">
        <div
          className="header-tools"
          data-ixi-header-tools="true"
          aria-label="IXI workspace tools"
        />

        <div className="social-mini">
          <a href="https://www.facebook.com/profile.php?id=61589249515383" aria-label="Facebook" target="_blank" rel="noreferrer">
            <i className="fa-brands fa-facebook-f"></i>
          </a>
          <a href="https://www.instagram.com/ironxchangehq/" aria-label="Instagram" target="_blank" rel="noreferrer">
            <i className="fa-brands fa-instagram"></i>
          </a>
          <a href="https://www.linkedin.com/company/ironxchange/" aria-label="LinkedIn" target="_blank" rel="noreferrer">
            <i className="fa-brands fa-linkedin-in"></i>
          </a>
          <a href="https://www.youtube.com/channel/UCjAc5SVwVEcW5EaAKi2cfFg" aria-label="YouTube" target="_blank" rel="noreferrer">
            <i className="fa-brands fa-youtube"></i>
          </a>
          <a href="https://www.tiktok.com/@ironxchangehq" aria-label="TikTok" target="_blank" rel="noreferrer">
            <i className="fa-brands fa-tiktok"></i>
          </a>
        </div>

        <a
          href={loggedIn ? "/account" : "/login"}
          className={`login-icon ${loggedIn ? "logged-in" : ""}`}
          aria-label="Account"
        >
          <i className="fa-solid fa-helmet-safety"></i>
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
            linear-gradient(180deg, rgba(255,255,255,.034), rgba(255,255,255,0)),
            radial-gradient(circle at top center, rgba(255,196,0,.022), transparent 38%),
            #050505;
          border-bottom: 1px solid rgba(255,255,255,.075);
          box-shadow:
            0 1px 0 rgba(255,255,255,.032) inset,
            0 12px 30px rgba(0,0,0,.30);
        }

        .brand-side {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .logo-img {
          height: 30px;
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
          color: rgba(255,255,255,.36) !important;
          font-size: 8.75px;
          line-height: 1;
          text-decoration: none;
          transition: color .14s ease, transform .14s ease, text-shadow .14s ease;
        }

        .social-mini a:hover { transform: translateY(-1px); }
        .social-mini a:nth-child(1):hover { color: #1877F2 !important; text-shadow: 0 0 14px rgba(24,119,242,.28); }
        .social-mini a:nth-child(2):hover { color: #ff4fd8 !important; text-shadow: 0 0 14px rgba(255,79,216,.24); }
        .social-mini a:nth-child(3):hover { color: #f2f2f2 !important; text-shadow: 0 0 14px rgba(255,255,255,.20); }
        .social-mini a:nth-child(4):hover { color: #FF0000 !important; text-shadow: 0 0 14px rgba(255,0,0,.24); }
        .social-mini a:nth-child(5):hover { color: #b86cff !important; text-shadow: 0 0 14px rgba(184,108,255,.26); }

        .nav-links {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .header-tools {
          min-width: 0;
          min-height: 40px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 6px;
        }

        .nav-links a {
          color: rgba(255,255,255,.76);
          text-decoration: none;
          font-weight: 900;
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: .55px;
          line-height: 1;
          transition: color .14s ease, transform .14s ease, text-shadow .14s ease;
        }

        .nav-links a:hover {
          color: rgba(255,255,255,.96);
          transform: translateY(-1px);
        }

        .login-icon {
          width: 18px;
          height: 18px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(255,255,255,.20);
          border-radius: 4px;
          color: rgba(255,255,255,.62) !important;
          font-size: 11px !important;
          background:
            linear-gradient(180deg, rgba(255,255,255,.035), rgba(255,255,255,0)),
            #080808;
          box-shadow:
            0 1px 0 rgba(255,255,255,.045) inset,
            0 0 0 1px rgba(255,255,255,.018),
            0 7px 18px rgba(0,0,0,.22);
          transition: color .16s ease, border-color .16s ease, box-shadow .16s ease, background .16s ease, transform .16s ease;
        }

        .login-icon:hover {
          transform: translateY(-1px);
          color: #38d4ff;
          border-color: rgba(0,194,255,.95);
          background:
            linear-gradient(180deg, rgba(255,196,0,.07), rgba(255,196,0,0)),
            #0d0d0d;
          box-shadow:
            0 1px 0 rgba(255,255,255,.05) inset,
            0 0 0 1px rgba(255,196,0,.05),
            0 0 18px rgba(255,196,0,.08),
            0 8px 20px rgba(0,0,0,.24);
        }

        .login-icon.logged-in {
          border-color: rgba(0,194,255,.72);
          color: #00C2FF !important;
          box-shadow:
            0 1px 0 rgba(255,255,255,.045) inset,
            0 0 0 1px rgba(0,194,255,.10),
            0 0 14px rgba(0,194,255,.10),
            0 7px 18px rgba(0,0,0,.22);
        }

        .login-icon.logged-in:hover {
          border-color: rgba(0,194,255,.95);
          color: #38d4ff !important;
          background:
            linear-gradient(180deg, rgba(0,194,255,.10), rgba(0,194,255,0)),
            #0d0d0d;
          box-shadow:
            0 1px 0 rgba(255,255,255,.05) inset,
            0 0 0 1px rgba(0,194,255,.14),
            0 0 18px rgba(0,194,255,.16),
            0 8px 20px rgba(0,0,0,.24);
        }

        @media (max-width: 850px) {
          .nav { height: 60px; padding-inline: 10px; }
          .logo-img {
            width: auto;
            height: 26px;
            max-width: 120px;
            object-fit: contain;
          }
          .social-mini { display: none; }
          .nav-links { gap: 7px; }
          .header-tools { min-height: 36px; gap: 4px; }
          .nav-links a { font-size: 10px; }
        }
      `}</style>
    </nav>
  );
}

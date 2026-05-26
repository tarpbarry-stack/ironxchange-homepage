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

  color: rgba(255,255,255,.36) !important;

  font-size: 8.75px;
  line-height: 1;

  text-decoration: none;

  transition:
    color .14s ease,
    transform .14s ease,
    text-shadow .14s ease;
}

.social-mini a:hover {
  color: rgba(255,196,0,.82) !important;
  transform: translateY(-1px);
  text-shadow: 0 0 12px rgba(255,196,0,.18);
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 14px;
}

.nav-links a {
  color: rgba(255,255,255,.76);
  text-decoration: none;
  font-weight: 900;
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: .55px;
  line-height: 1;

  transition:
    color .14s ease,
    transform .14s ease,
    text-shadow .14s ease;
}

.nav-links a:hover {
  color: rgba(255,255,255,.96);
  transform: translateY(-1px);
}

.yellow-link {
  color: #FFC400 !important;
  text-shadow: 0 0 14px rgba(255,196,0,.08);
}

.yellow-link:hover {
  color: #ffd84a !important;
  text-shadow: 0 0 16px rgba(255,196,0,.18);
}

.login-icon {
  width: 27px;
  height: 27px;

  display: grid;
  place-items: center;

  border: 1px solid rgba(255,255,255,.22);
  border-radius: 50%;

  color: rgba(255,255,255,.68) !important;

  font-size: 13px !important;

  background:
    linear-gradient(180deg, rgba(255,255,255,.032), rgba(255,255,255,0)),
    #080808;

  box-shadow:
    0 1px 0 rgba(255,255,255,.045) inset,
    0 0 0 1px rgba(255,255,255,.018),
    0 7px 18px rgba(0,0,0,.22);

  transition:
    color .16s ease,
    border-color .16s ease,
    box-shadow .16s ease,
    background .16s ease,
    transform .16s ease;
}

.login-icon:hover {
  transform: translateY(-1px);

  border-color: rgba(255,196,0,.36);
  color: #FFC400 !important;

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
  border-color: rgba(56,161,105,.72);
  color: #38A169 !important;

  box-shadow:
    0 1px 0 rgba(255,255,255,.045) inset,
    0 0 0 1px rgba(56,161,105,.10),
    0 0 14px rgba(56,161,105,.10),
    0 7px 18px rgba(0,0,0,.22);
}

.login-icon.logged-in:hover {
  border-color: rgba(56,161,105,.95);
  color: #48c57d !important;

  background:
    linear-gradient(180deg, rgba(56,161,105,.10), rgba(56,161,105,0)),
    #0d0d0d;

  box-shadow:
    0 1px 0 rgba(255,255,255,.05) inset,
    0 0 0 1px rgba(56,161,105,.14),
    0 0 18px rgba(56,161,105,.16),
    0 8px 20px rgba(0,0,0,.24);
}

@media (max-width: 850px) {
  .nav {
    height: 60px;
  }

  .logo-img {
    height: 36px;
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

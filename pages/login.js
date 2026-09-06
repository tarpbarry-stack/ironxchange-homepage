import Head from "next/head";
import { useState } from "react";

import {
  ensureCommercialOnboarding,
  backfillOwnedMachines
} from "../lib/onboarding/ixiCommercialOnboardingClient";

const BRAND_YELLOW = "#FFC400";
const STAGING = "https://staging.ironxchange.com";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

async function handleLogin(e) {
  e.preventDefault();

  const cleanEmail = email.trim().toLowerCase();

  setLoading(true);
  setError("");

  try {
    const SharetribeSdk = await import("sharetribe-flex-sdk");

    const sdk = SharetribeSdk.createInstance({
      clientId: process.env.NEXT_PUBLIC_SHARETRIBE_CLIENT_ID
    });

    const result = await sdk.login({
      username: cleanEmail,
      password
    });

    console.log("LOGIN SUCCESS:", result);

    await ensureCommercialOnboarding();

    try {
      await backfillOwnedMachines();
    } catch (backfillError) {
      console.error("IXI MACHINE BACKFILL ERROR:", backfillError);
    }

   const params = new URLSearchParams(window.location.search);

const next = params.get("next") || "/";

window.location.href = next;
  } catch (err) {
    console.error("LOGIN ERROR FULL:", err);

    setError(
      err?.data?.errors?.[0]?.title ||
      err?.message ||
      "Login failed."
    );
  } finally {
    setLoading(false);
  }
}

  return (
    <>
      <Head>
        <title>Login | IronXchange</title>
      </Head>

      <main>
        <div className="card">
          <img src="/images/ironxchange-logo.png" alt="IronXchange" className="logo" />

        <h1>Sign In</h1>

          <form onSubmit={handleLogin}>
            <label>
              Email
             <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>

            <label>
              Password
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>

  <a href="/forgot-password" className="forgot-link">
  Forgot password?
</a>
  
            <button type="submit" disabled={loading}>
  {loading ? "Signing In..." : "Login"}
</button>

<div className="signup-area">
  <span>New to IronXchange?</span>

 <a href="/signup" className="signup-link">
    CREATE ACCOUNT
  </a>
</div>

            {error ? <div className="error-box">{error}</div> : null}
          </form>
        </div>
      </main>

      <style jsx>{`
  :global(html),
  :global(body) {
    margin: 0;
    min-height: 100%;
    overflow-x: hidden;
    background: #0b0b0b;
    color: #f2f2f2;
    font-family: 'Inter Variable', Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    -webkit-font-smoothing: antialiased;
    text-rendering: geometricPrecision;
  }

  * {
    box-sizing: border-box;
  }

  main {
    min-height: 100vh;

    display: grid;
    place-items: center;

    padding: 24px;

    background:
      radial-gradient(circle at top center, rgba(255,196,0,.055), transparent 30%),
      radial-gradient(circle at 22% 16%, rgba(255,255,255,.025), transparent 24%),
      #0b0b0b;
  }

  .card {
    width: 100%;
    max-width: 420px;

    position: relative;

    background:
      linear-gradient(180deg, rgba(255,255,255,.032), rgba(255,255,255,0)),
      radial-gradient(circle at top, rgba(255,255,255,.018), transparent 72%),
      #141414;

    border: 1px solid rgba(255,255,255,.065);
    outline: 1px solid rgba(255,255,255,.018);

    border-radius: 15px;

    padding: 28px 28px 24px;

    box-shadow:
      0 1px 0 rgba(255,255,255,.045) inset,
      0 28px 70px rgba(0,0,0,.38);
  }

  .card::before {
    content: "";

    position: absolute;
    left: 28px;
    right: 28px;
    top: 0;

    height: 1px;

    background:
      linear-gradient(
        90deg,
        transparent,
        rgba(255,196,0,.42),
        transparent
      );

    opacity: .55;
  }

  .logo {
    height: 39px;
    width: auto;

    display: block;

    margin: 0 auto 21px;

    filter:
      contrast(1.03)
      saturate(1.02);
  }

  h1 {
    margin: 0 0 18px;

    text-align: center;

    color: rgba(255,255,255,.90);

    font-size: 22px;
    font-weight: 850;

    letter-spacing: -.25px;
    text-transform: uppercase;
  }

  form {
    display: grid;
    gap: 13px;
  }

  label {
    display: grid;
    gap: 6px;

    color: rgba(255,255,255,.42);

    font-size: 12px;
    font-weight: 800;

    letter-spacing: .58px;
    text-transform: uppercase;
  }

  input {
    width: 100%;
    height: 38px;

    background:
      linear-gradient(180deg, rgba(255,255,255,.014), rgba(255,255,255,0)),
      #101010;

    border: 1px solid rgba(255,255,255,.075);
    border-radius: 10px;

    color: #f2f2f2;

    padding: 0 12px;

    font-size: 15px;
    font-weight: 600;

    outline: none;

    box-shadow:
      0 1px 0 rgba(255,255,255,.022) inset;

    transition:
      border-color .14s ease,
      box-shadow .14s ease,
      background .14s ease;
  }

  input:hover {
    border-color: rgba(255,255,255,.13);
  }

  input:focus {
    border-color: rgba(255,196,0,.44);

    box-shadow:
      0 0 0 1px rgba(255,196,0,.14),
      0 1px 0 rgba(255,255,255,.028) inset;

    background: #121212;
  }

  button {
    height: 38px;

    margin-top: 4px;

    display: inline-flex;
    align-items: center;
    justify-content: center;

    border: 1px solid rgba(255,196,0,.24);
    border-radius: 10px;

    background:
      linear-gradient(180deg, rgba(255,196,0,.10), rgba(255,196,0,0)),
      #151515;

    color: #FFC400;

    padding: 0 14px;

    font-size: 13px;
    font-weight: 800;

    letter-spacing: .6px;
    text-transform: uppercase;

    cursor: pointer;

    box-shadow:
      0 1px 0 rgba(255,255,255,.035) inset,
      0 0 18px rgba(255,196,0,.045);

    transition:
      transform .14s ease,
      border-color .14s ease,
      background .14s ease,
      box-shadow .14s ease,
      color .14s ease;
  }

  button:hover {
    transform: translateY(-1px);

    background:
      linear-gradient(180deg, rgba(255,196,0,.16), rgba(255,196,0,0)),
      #1a1400;

    border-color: rgba(255,196,0,.58);

    box-shadow:
      0 1px 0 rgba(255,255,255,.05) inset,
      0 12px 28px rgba(0,0,0,.22),
      0 0 20px rgba(255,196,0,.065);
  }

  button:disabled {
    opacity: .58;
    cursor: default;
    transform: none;
  }

  .signup-area {
    margin-top: 14px;
    padding-top: 14px;

    border-top: 1px solid rgba(255,255,255,.055);

    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;

    color: rgba(255,255,255,.42);

    font-size: 12.5px;
    font-weight: 650;
  }

.forgot-link {
  justify-self: end;

  color: rgba(255,255,255,.42);
  text-decoration: none;

  font-size: 12px;
  font-weight: 750;

  letter-spacing: .45px;
  text-transform: uppercase;
}

.forgot-link:hover {
  color: #FFC400;
}

  .signup-link {
    color: #FFC400;
    text-decoration: none;

    font-size: 12px;
    font-weight: 800;

    letter-spacing: .58px;
    text-transform: uppercase;

    transition:
      color .14s ease,
      transform .14s ease;
  }

  .signup-link:hover {
    color: #f2f2f2;
  }

  .error-box {
    margin-top: 2px;

    border-radius: 10px;
    padding: 10px 12px;

    background:
      linear-gradient(180deg, rgba(229,62,62,.12), rgba(229,62,62,.06)),
      #111;

    border: 1px solid rgba(229,62,62,.38);

    color: #ffb4b4;

    font-size: 11px;
    font-weight: 700;
    line-height: 1.35;
  }

  @media (max-width: 520px) {
    main {
      padding: 18px;
    }

    .card {
      padding: 24px 20px 21px;
      border-radius: 14px;
    }

    .logo {
      height: 36px;
    }

    .signup-area {
      flex-direction: column;
      gap: 7px;
    }
  }
`}</style>

  </>
  );
}

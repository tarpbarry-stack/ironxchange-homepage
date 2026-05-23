import Head from "next/head";
import { useState } from "react";

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
  :global(body) {
    margin: 0;
    background: #0b0b0b;
    color: #f2f2f2;
    font-family: Arial, sans-serif;
  }

  * {
    box-sizing: border-box;
  }

  main {
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: 22px;
    background:
      radial-gradient(circle at top, rgba(255,196,0,.055), transparent 34%),
      #0b0b0b;
  }

  .card {
    width: 100%;
    max-width: 430px;

    background: #151515;
    border: 1px solid #282828;
    border-radius: 12px;

    padding: 28px;

    box-shadow: 0 24px 70px rgba(0,0,0,.42);
  }

  .logo {
    height: 40px;
    display: block;
    margin: 0 auto 22px;
  }

  h1 {
    margin: 0 0 18px;

    text-align: center;

    color: #f2f2f2;

    font-size: 16px;
    font-weight: 900;

    letter-spacing: .65px;
    text-transform: uppercase;
  }

  form {
    display: grid;
    gap: 13px;
  }

  label {
    display: grid;
    gap: 6px;

    color: #9a9a9a;

    font-size: 9px;
    font-weight: 900;

    letter-spacing: .45px;
    text-transform: uppercase;
  }

  input {
    width: 100%;
    height: 36px;

    border: 1px solid #2a2a2a;
    border-radius: 8px;

    background: #101010;
    color: #f2f2f2;

    padding: 0 12px;

    font-size: 13px;
    outline: none;
  }

  input:focus {
    border-color: #FFC400;
    box-shadow: 0 0 0 1px rgba(255,196,0,.12);
  }

  button {
    height: 36px;

    margin-top: 4px;

    border: 1px solid #3a2d00;
    border-radius: 8px;

    background: #151515;
    color: #FFC400;

    padding: 0 14px;

    font-size: 10px;
    font-weight: 900;

    letter-spacing: .45px;
    text-transform: uppercase;

    cursor: pointer;
  }

  button:hover {
    background: #1a1400;
    border-color: #FFC400;
  }

  button:disabled {
    opacity: .6;
    cursor: default;
  }

  .signup-area {
    margin-top: 14px;
    padding-top: 14px;

    border-top: 1px solid #252525;

    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;

    font-size: 11px;
    color: #8a8a8a;
  }

  .signup-link {
    color: #FFC400;
    text-decoration: none;

    font-size: 10px;
    font-weight: 900;

    letter-spacing: .45px;
    text-transform: uppercase;
  }

  .signup-link:hover {
    color: #f2f2f2;
  }

  .error-box {
    margin-top: 2px;

    border-radius: 8px;
    padding: 10px 12px;

    background: rgba(229,62,62,.10);
    border: 1px solid rgba(229,62,62,.38);
    color: #ffb4b4;

    font-size: 11px;
    line-height: 1.35;
  }
`}</style>
</>
  );
}

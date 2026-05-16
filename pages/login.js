import Head from "next/head";
import { useState } from "react";

const BRAND_YELLOW = "#FFC400";

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

  <a href={`${STAGING}/signup`} className="signup-link">
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
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .card {
          width: 100%;
          max-width: 460px;
          background: #151515;
          border: 1px solid #282828;
          border-radius: 18px;
          padding: 34px;
        }

        .logo {
          height: 42px;
          display: block;
          margin: 0 auto 24px;
        }

       h1 {
  margin: 0 0 18px;
  text-align: center;
  font-size: 18px;
  letter-spacing: .4px;
  text-transform: uppercase;
  font-weight: 800;
  color: #f2f2f2;
}

        form {
          display: grid;
          gap: 16px;
        }

        label {
          display: grid;
          gap: 8px;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        input {
          width: 100%;
          border: 1px solid #333;
          background: #0d0d0d;
          color: white;
          border-radius: 10px;
          padding: 14px;
          font-size: 15px;
        }

        button {
          margin-top: 8px;
          border: none;
          border-radius: 10px;
          background: ${BRAND_YELLOW};
          color: #050505;
          padding: 18px 20px;
          font-size: 13px;
          font-weight: 900;
          text-transform: uppercase;
          cursor: pointer;
        }

        .error-box {
          margin-top: 4px;
          border-radius: 12px;
          padding: 14px;
          background: rgba(197,48,48,.15);
          border: 1px solid rgba(197,48,48,.5);
        }

        .signup-area {
  margin-top: 18px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: #9A9A9A;
}

.signup-link {
  color: #FFC400;
  text-decoration: none;
  font-weight: 900;
  letter-spacing: .3px;
}
      `}</style>
    </>
  );
}

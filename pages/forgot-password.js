import Head from "next/head";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleReset(e) {
    e.preventDefault();

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError("Enter your email address.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const SharetribeSdk = await import("sharetribe-flex-sdk");

      const sdk = SharetribeSdk.createInstance({
        clientId: process.env.NEXT_PUBLIC_SHARETRIBE_CLIENT_ID
      });

      await sdk.passwordReset.request({
        email: cleanEmail
      });

      setSent(true);
    } catch (err) {
      console.error("PASSWORD RESET ERROR:", err);

      setError(
        err?.data?.errors?.[0]?.title ||
          err?.data?.errors?.[0]?.detail ||
          err?.message ||
          "Password reset failed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Forgot Password | IronXchange</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main>
        <div className="card">
          <img src="/images/ironxchange-logo.png" alt="IronXchange" className="logo" />

          <h1>Reset Password</h1>

          {sent ? (
            <div className="success-box">
              <strong>Check your email.</strong>
              <p>If that email exists, Sharetribe will send a password reset link.</p>

              <a href="/login" className="back-link">
                Back to Login
              </a>
            </div>
          ) : (
            <form onSubmit={handleReset}>
              <label>
                Email
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>

              <button type="submit" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
              </button>

              <div className="signin-area">
                <span>Remembered it?</span>

                <a href="/login" className="signin-link">
                  SIGN IN
                </a>
              </div>

              {error ? <div className="error-box">{error}</div> : null}
            </form>
          )}
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
          font-family: Arial, sans-serif;
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
          background: linear-gradient(90deg, transparent, rgba(255,196,0,.42), transparent);
          opacity: .55;
        }

        .logo {
          height: 39px;
          width: auto;
          display: block;
          margin: 0 auto 21px;
          filter: contrast(1.03) saturate(1.02);
        }

        h1 {
          margin: 0 0 18px;
          text-align: center;
          color: rgba(255,255,255,.90);
          font-size: 13px;
          font-weight: 950;
          letter-spacing: .75px;
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
          font-size: 8.75px;
          font-weight: 950;
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
          font-size: 13px;
          font-weight: 600;
          outline: none;
          box-shadow: 0 1px 0 rgba(255,255,255,.022) inset;
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
          font-size: 9.5px;
          font-weight: 950;
          letter-spacing: .6px;
          text-transform: uppercase;
          cursor: pointer;
        }

        button:hover {
          background:
            linear-gradient(180deg, rgba(255,196,0,.16), rgba(255,196,0,0)),
            #1a1400;
          border-color: rgba(255,196,0,.58);
        }

        button:disabled {
          opacity: .58;
          cursor: default;
        }

        .signin-area {
          margin-top: 14px;
          padding-top: 14px;
          border-top: 1px solid rgba(255,255,255,.055);
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 10px;
          color: rgba(255,255,255,.42);
          font-size: 10.5px;
          font-weight: 700;
        }

        .signin-link,
        .back-link {
          color: #FFC400;
          text-decoration: none;
          font-size: 9px;
          font-weight: 950;
          letter-spacing: .58px;
          text-transform: uppercase;
        }

        .signin-link:hover,
        .back-link:hover {
          color: #f2f2f2;
        }

        .error-box,
        .success-box {
          border-radius: 10px;
          padding: 12px;
          font-size: 11px;
          font-weight: 700;
          line-height: 1.35;
        }

        .error-box {
          margin-top: 2px;
          background:
            linear-gradient(180deg, rgba(229,62,62,.12), rgba(229,62,62,.06)),
            #111;
          border: 1px solid rgba(229,62,62,.38);
          color: #ffb4b4;
        }

        .success-box {
          background:
            linear-gradient(180deg, rgba(56,161,105,.12), rgba(56,161,105,.04)),
            #111;
          border: 1px solid rgba(56,161,105,.34);
          color: rgba(255,255,255,.72);
          display: grid;
          gap: 8px;
          text-align: center;
        }

        .success-box strong {
          color: #38A169;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: .5px;
        }

        .success-box p {
          margin: 0;
        }
      `}</style>
    </>
  );
}

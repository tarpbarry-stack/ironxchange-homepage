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

    setLoading(true);
    setError("");

    try {
      const SharetribeSdk = await import("sharetribe-flex-sdk");

      const sdk = SharetribeSdk.createInstance({
        clientId: process.env.NEXT_PUBLIC_SHARETRIBE_CLIENT_ID
      });

      const result = await sdk.login({
  email,
  password
})
      ;

      console.log("LOGIN SUCCESS:", result);

      window.location.href = "/";
    } catch (err) {
      console.error("LOGIN ERROR:", err);
      setError("Invalid email or password.");
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

          <h1>Marketplace Login</h1>

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
          height: 72px;
          display: block;
          margin: 0 auto 24px;
        }

        h1 {
          margin: 0 0 24px;
          text-align: center;
          font-size: 30px;
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
      `}</style>
    </>
  );
}

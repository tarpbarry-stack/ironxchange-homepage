import Head from "next/head";
import { useState } from "react";

const BRAND_YELLOW = "#FFC400";

export default function SignupPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignup(e) {
    e.preventDefault();

    const cleanEmail = email.trim().toLowerCase();
    const cleanFirst = firstName.trim();
    const cleanLast = lastName.trim();
    const cleanCompany = companyName.trim();
    const cleanPhone = phone.trim();

    if (!cleanFirst || !cleanLast || !cleanEmail || !password) {
      setError("First name, last name, email, and password are required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const SharetribeSdk = await import("sharetribe-flex-sdk");

      const sdk = SharetribeSdk.createInstance({
        clientId: process.env.NEXT_PUBLIC_SHARETRIBE_CLIENT_ID
      });

      await sdk.currentUser.create(
        {
          email: cleanEmail,
          password,
          firstName: cleanFirst,
          lastName: cleanLast,
          displayName: cleanCompany || `${cleanFirst} ${cleanLast}`,
          protectedData: {
            phoneNumber: cleanPhone,
            companyName: cleanCompany
          },
          publicData: {
            companyName: cleanCompany
          }
        },
        {
          expand: true
        }
      );

      await sdk.login({
        username: cleanEmail,
        password
      });

      const params = new URLSearchParams(window.location.search);
      const next = params.get("next") || "/account";

      window.location.href = next;
    } catch (err) {
      console.error("SIGNUP ERROR FULL:", err);

      setError(
        err?.data?.errors?.[0]?.title ||
          err?.data?.errors?.[0]?.detail ||
          err?.message ||
          "Signup failed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Create Account | IronXchange</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main>
        <div className="card">
          <img src="/images/ironxchange-logo.png" alt="IronXchange" className="logo" />

          <h1>Create Account</h1>

          <form onSubmit={handleSignup}>
            <div className="two-col">
              <label>
                First Name
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </label>

              <label>
                Last Name
                <input value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </label>
            </div>

            <label>
              Company Name
              <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            </label>

            <label>
              Phone
              <input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </label>

            <label>
              Email
              <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>

            <label>
              Password
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>

            <button type="submit" disabled={loading}>
              {loading ? "Creating Account..." : "Create Account"}
            </button>

            <div className="signin-area">
              <span>Already have an account?</span>

              <a href="/login" className="signin-link">
                SIGN IN
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
          max-width: 520px;
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

        .two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
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

        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .signin-area {
          margin-top: 18px;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: #9A9A9A;
        }

        .signin-link {
          color: #FFC400;
          text-decoration: none;
          font-weight: 900;
          letter-spacing: .3px;
        }

        .error-box {
          margin-top: 4px;
          border-radius: 12px;
          padding: 14px;
          background: rgba(197,48,48,.15);
          border: 1px solid rgba(197,48,48,.5);
          color: #f2f2f2;
          font-size: 14px;
        }

        @media (max-width: 560px) {
          .two-col {
            grid-template-columns: 1fr;
          }

          .card {
            padding: 28px;
          }
        }
      `}</style>
    </>
  );
}

import Head from "next/head";

import Navbar from "../Navbar";
import Footer from "../Footer";

export default function IXITransactFaceLabFrame({
  title = "TRAN$ACT MODULE",
  route = "",
  children
}) {
  return (
    <>
      <Head>
        <title>{`IXI Face Lab · ${title}`}</title>
      </Head>

      <Navbar />

      <main className="transact-lab-page">
        <div className="lab-bar">
          <div>
            <strong>IXI FACE LAB</strong>
            <span>{`TRAN$ACT · ${title}`}</span>
          </div>
          <code>{route}</code>
        </div>

        <div className="lab-stage">
          <div className="native-label">
            NATIVE CARD · 298 × 471 · V13 · SCROLLABLE VIEWPORT
          </div>

          <div className="native-card">
            {children}
          </div>
        </div>
      </main>

      <Footer />

      <style jsx>{`
        .transact-lab-page {
          min-height: calc(100vh - 160px);
          padding: 18px;
          background:
            radial-gradient(circle at top,rgba(255,196,0,.05),transparent 42%),
            #0b0b0b;
          color: #eee;
        }

        .lab-bar {
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 14px;
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 10px;
          background: #121212;
        }

        .lab-bar strong {
          display: block;
          color: #ffc400;
          font-size: 10px;
          letter-spacing: .08em;
        }

        .lab-bar span {
          display: block;
          margin-top: 3px;
          color: #888;
          font-size: 8px;
        }

        .lab-bar code {
          color: #bbb;
          font-size: 10px;
        }

        .lab-stage {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 28px;
        }

        .native-label {
          margin-bottom: 10px;
          color: #777;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: .08em;
        }

        .native-card {
          width: 298px;
          height: 471px;
          overflow-y: auto;
          overflow-x: hidden;
          border: 1px solid rgba(255,196,0,.25);
          border-radius: 10px;
          background: #050706;
          box-shadow: 0 22px 54px rgba(0,0,0,.58);
          scrollbar-width: thin;
          scrollbar-color: #6f5700 #111;
        }
      `}</style>
    </>
  );
}

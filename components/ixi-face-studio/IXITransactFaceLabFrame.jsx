import Head from "next/head";

import Navbar from "../Navbar";
import Footer from "../Footer";

import IXIFaceLabScaledCard
  from "./IXIFaceLabScaledCard";

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
          <IXIFaceLabScaledCard
            surfaceLabel="Face Lab TRAN$ACT"
          >
            {children}
          </IXIFaceLabScaledCard>
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

      `}</style>
    </>
  );
}

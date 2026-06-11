import Head from "next/head";
import Navbar from "../../components/Navbar";

export default function IXVisionClassifier() {
  return (
    <>
      <Head>
        <title>IX Vision Classifier | IronXchange</title>
      </Head>

      <Navbar />

      <main>
        <section>
          <span>IX Vision Intelligence</span>
          <h1>Vision Classifier</h1>
          <p>Classifier room is live. Next we wire analyzer scores into photo type and pipeline recommendation.</p>
        </section>
      </main>

      <style jsx>{`
        main {
          min-height: 100vh;
          padding: 40px;
          background: #070707;
          color: #f2f2f2;
          font-family: Arial, sans-serif;
        }

        section {
          max-width: 900px;
          margin: 0 auto;
          padding: 28px;
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 16px;
          background: #141414;
        }

        span {
          color: #FFC400;
          font-size: 10px;
          font-weight: 950;
          letter-spacing: .9px;
          text-transform: uppercase;
        }

        h1 {
          margin: 8px 0;
          font-size: 34px;
          text-transform: uppercase;
        }

        p {
          color: rgba(255,255,255,.55);
        }
      `}</style>
    </>
  );
}

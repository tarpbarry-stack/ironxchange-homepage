import Head from "next/head";
import { useRouter } from "next/router";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function UrlImportPage() {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>URL Import | IronXchange</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main>
        <Navbar />

        <section className="v12-shell">
          <div className="v12-panel">
            <span>IronXchange Harvest System</span>
            <h1>URL Import</h1>
            <p>
              Paste equipment listing URLs and convert outside machines into IronXchange machine drafts. This page is staged for the V12 URL harvest workflow.
            </p>

            <div className="v12-actions">
              <button type="button" onClick={() => router.push("/post-free")}>
                Back to Post Free
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <style jsx>{`
        :global(html),
        :global(body) {
          margin: 0;
          background: #0b0b0b;
          color: #d6d6d6;
          font-family: Arial, sans-serif;
        }

        main {
          min-height: 100vh;
          background:
            radial-gradient(circle at top center, rgba(255,196,0,.035), transparent 28%),
            radial-gradient(circle at 18% 12%, rgba(0,209,255,.035), transparent 22%),
            #0b0b0b;
        }

        .v12-shell {
          max-width: 1600px;
          margin: 0 auto;
          padding: 44px 2% 72px;
        }

        .v12-panel {
          max-width: 760px;
          margin: 0 auto;
          padding: 32px;

          border-radius: 16px;
          border: 1px solid rgba(255,255,255,.07);
          outline: 1px solid rgba(255,255,255,.018);

          background:
            linear-gradient(180deg, rgba(255,255,255,.036), rgba(255,255,255,0)),
            radial-gradient(circle at top left, rgba(0,209,255,.065), transparent 60%),
            #141414;

          box-shadow:
            0 1px 0 rgba(255,255,255,.045) inset,
            0 22px 52px rgba(0,0,0,.30);
        }

        .v12-panel span {
          color: #7DEBFF;
          font-size: 9px;
          font-weight: 950;
          letter-spacing: .9px;
          text-transform: uppercase;
        }

        .v12-panel h1 {
          margin: 8px 0 10px;
          color: #f2f2f2;
          font-size: 42px;
          font-weight: 950;
          letter-spacing: -1.2px;
          text-transform: uppercase;
        }

        .v12-panel p {
          max-width: 620px;
          margin: 0;
          color: rgba(255,255,255,.52);
          font-size: 14px;
          line-height: 1.55;
        }

        .v12-actions {
          margin-top: 24px;
        }

        .v12-actions button {
          height: 34px;
          padding: 0 14px;

          border-radius: 999px;
          border: 1px solid rgba(0,209,255,.34);

          background:
            linear-gradient(180deg, rgba(0,209,255,.08), rgba(0,209,255,0)),
            #101010;

          color: #7DEBFF;

          font-size: 8.5px;
          font-weight: 950;
          letter-spacing: .62px;
          text-transform: uppercase;

          cursor: pointer;
        }

        .v12-actions button:hover {
          border-color: rgba(0,209,255,.65);
          background: #071317;
        }
      `}</style>
    </>
  );
}

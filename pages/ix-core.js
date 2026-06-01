import Head from "next/head";

export default function IXCorePage() {
  return (
    <>
      <Head>
        <title>IX Core | IronXchange</title>
      </Head>

      <main className="ix-core-page">
        <section className="ix-core-shell">
          <p className="eyebrow">IRONXCHANGE ARCHITECTURE RECORD</p>

          <h1>IX Core</h1>

          <p className="lead">
            Internal architecture notes for IX Core, IXI Workspace, IXSearchSurface,
            Machine Passport, Board Engine, Stacks, Decks, Pockets, and related
            IronXchange machine intelligence systems.
          </p>

          <div className="record-box">
            <strong>Version:</strong> v1.0<br />
            <strong>Date of Record:</strong> May 31, 2026<br />
            <strong>Status:</strong> Original system architecture documentation
          </div>

          <h2>IXSearchSurface</h2>
          <p>
            IXSearchSurface is a machine workspace control surface, not a
            traditional search bar. It uses dash-based controls, progressive
            disclosure, minimal text, and machine-centric filtering to operate
            inside the larger IXI Workspace environment.
          </p>

          <h2>IX Core</h2>
          <p>
            IX Core is the persistent machine state engine for IronXchange. It is
            designed to store machine state, workspace state, color state,
            outline state, stacks, decks, pockets, machine passports, and future
            machine intelligence independent of Sharetribe.
          </p>

          <h2>Machine Passport</h2>
          <p>
            Every machine becomes a persistent digital object. The card is not a
            preview. The card is the package. Machine state, metadata,
            organization, notes, and intelligence attach to the machine over time.
          </p>

          <h2>Stacks, Decks, and Pockets</h2>
          <p>
            Stacks are temporary work surfaces. Decks are saved machine
            collections. Pockets are persistent collection entrances. Together
            they allow users to organize machines inside IronXchange instead of
            exporting lists, PDFs, spreadsheets, or links.
          </p>

          <h2>Strategic Position</h2>
          <p>
            IronXchange is evolving from a listing marketplace into a
            machine-centric operating environment. The long-term architecture is:
            Machine → Passport → Workspace → Stack → Deck → Pocket → Shared
            Intelligence.
          </p>
        </section>
      </main>

      <style jsx>{`
        .ix-core-page {
          min-height: 100vh;
          padding: 58px 5%;
          background: #0b0b0b;
          color: #d6d6d6;
          font-family: Arial, sans-serif;
        }

        .ix-core-shell {
          max-width: 880px;
          margin: 0 auto;
          padding: 34px;
          border: 1px solid rgba(255,255,255,.07);
          border-radius: 14px;
          background:
            linear-gradient(180deg, rgba(255,255,255,.022), rgba(255,255,255,0)),
            #101010;
        }

        .eyebrow {
          margin: 0 0 12px;
          color: rgba(255,196,0,.72);
          font-size: 10px;
          font-weight: 950;
          letter-spacing: .9px;
        }

        h1 {
          margin: 0 0 12px;
          color: #f2f2f2;
          font-size: 34px;
          font-weight: 950;
        }

        h2 {
          margin: 30px 0 10px;
          color: #FFC400;
          font-size: 15px;
          font-weight: 950;
          letter-spacing: .4px;
          text-transform: uppercase;
        }

        p {
          color: rgba(255,255,255,.62);
          font-size: 13px;
          line-height: 1.65;
        }

        .lead {
          color: rgba(255,255,255,.72);
          font-size: 15px;
        }

        .record-box {
          margin: 24px 0 28px;
          padding: 14px 16px;
          border: 1px solid rgba(255,196,0,.14);
          border-radius: 10px;
          background: rgba(255,196,0,.035);
          color: rgba(255,255,255,.68);
          font-size: 12px;
          line-height: 1.7;
        }
      `}</style>
    </>
  );
}

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
            Internal architecture notes for IX Core, IXI Workspace,
            IXSearchSurface, IXI Rail, Machine Passport, Board Engine,
            Stacks, Decks, Pockets, and related IronXchange machine
            intelligence systems.
          </p>

          <div className="record-box">
            <strong>Version:</strong> v1.0<br />
            <strong>Date of Record:</strong> May 31, 2026<br />
            <strong>Status:</strong> Original system architecture documentation
          </div>

          <h2>IXSearchSurface</h2>
          <p>
            IXSearchSurface is a machine workspace control surface, not a
            traditional marketplace search bar. It uses dash-based controls,
            progressive disclosure, minimal text, and machine-centric filtering
            to operate inside the larger IXI Workspace environment.
          </p>

          <p>
            Its purpose is not merely to search listings. Its purpose is to help
            users organize, filter, evaluate, sort, collect, and manage machine
            relationships inside a persistent machine operating environment.
          </p>

          <h2>IXI Rail</h2>
          <p>
            IXI Rail is the machine interaction rail. It lets users quietly
            assign meaning to machines without changing the machine card itself.
            It supports color state, outline thickness, save state, pin state,
            and future movement or stack controls.
          </p>

          <p>
            IXSearchSurface is discovery-focused. IXI Rail is machine-focused.
            They work together visually but remain separate systems.
          </p>

            <h2>IX Core</h2>

          <p>
            IX Core is the persistent machine state engine for IronXchange.
            It exists independently of Sharetribe and serves as the long-term
            system of record for machine intelligence, workspace state, machine
            passports, stacks, decks, pockets, and future machine AI systems.
          </p>

          <p>
            Machine state survives page refreshes, browser sessions, device
            changes, marketplace navigation, and future migrations away from
            Sharetribe.
          </p>

          <h2>Machine Passport</h2>

          <p>
            Every machine becomes a persistent digital object.
            The card is not a preview.
            The card is the package.
          </p>

          <p>
            A Machine Passport may eventually contain photos, videos, machine
            metadata, hours, pricing history, seller history, notes, workspace
            state, deck membership, intelligence data, valuation data, and
            future machine memory systems.
          </p>

          <h2>Stacks, Decks, and Pockets</h2>

          <p>
            Stacks are temporary work surfaces.
            Users build them, organize machines inside them, compare machines,
            and make decisions.
          </p>

          <p>
            When saved, a stack becomes a Deck.
            Decks are persistent collections.
            Stacks disappear after saving in order to keep the workspace clean.
          </p>

          <p>
            Pockets are collection entrances.
            On desktop they can create and manage active stacks.
            On mobile they become navigation entrances into stored collections.
          </p>

          <h2>Board Engine</h2>

          <p>
            The Board Engine transforms machine cards into movable machine
            passports.
            Users can rank, organize, compare, color, group, reject, prioritize,
            and evaluate machines naturally without requiring traditional compare
            tools or spreadsheet workflows.
          </p>

          <p>
            Movement is a language.
            Left means reject.
            Right means keep.
            Down means not now.
            Up means priority.
          </p>
          <h2>Operating Principles</h2>

          <ol>
            <li>
              <strong>The Card Is Sacred.</strong>
              The machine card is the machine passport.
              Intelligence happens around the machine, never inside it.
            </li>

            <li>
              <strong>Discovery Over Instruction.</strong>
              Users should discover power through interaction rather than
              tutorials, onboarding flows, or marketing language.
            </li>

            <li>
              <strong>Color Belongs To The User.</strong>
              IronXchange stores color meaning but does not define color meaning.
            </li>

            <li>
              <strong>Stacks Are Temporary.</strong>
              Stacks are work surfaces. Decks are persistent collections.
            </li>

            <li>
              <strong>Search And Machine Control Are Separate.</strong>
              IXSearchSurface discovers machines. IXI Rail manages machine state.
            </li>

            <li>
              <strong>AWS Owns The Intelligence Layer.</strong>
              Critical machine intelligence should not depend on Sharetribe.
            </li>

            <li>
              <strong>One Source Of Truth.</strong>
              One taxonomy. One deployment path. One machine identity system.
            </li>

            <li>
              <strong>Industrial Premium.</strong>
              IronXchange should feel like heavy equipment operating software,
              not startup SaaS.
            </li>

            <li>
              <strong>The Machine Is The Center.</strong>
              Machine → Passport → Workspace → Stack → Deck → Pocket →
              Shared Intelligence.
            </li>
          </ol>

          <h2>Long-Term Vision</h2>

          <p>
            IronXchange is evolving beyond a listing marketplace.
          </p>

          <p>
            Marketplace
            <br />
            ↓
            <br />
            Workspace
            <br />
            ↓
            <br />
            Machine Passport
            <br />
            ↓
            <br />
            Machine Intelligence Network
          </p>

          <p>
            The machine becomes the primary object.
            Users no longer manage listings.
            Users manage machine relationships.
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
            linear-gradient(
              180deg,
              rgba(255,255,255,.022),
              rgba(255,255,255,0)
            ),
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

        p,
        li {
          color: rgba(255,255,255,.62);
          font-size: 13px;
          line-height: 1.7;
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

        ol {
          padding-left: 20px;
        }

        li {
          margin-bottom: 12px;
        }
      `}</style>
    </>
  );
}

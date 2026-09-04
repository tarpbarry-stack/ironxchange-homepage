import Head from "next/head";
import Link from "next/link";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

import IXIFaceLabTypography
  from "../../components/ixi-face-studio/IXIFaceLabTypography";

import IXIFaceStudio
  from "../../components/ixi-face-studio/IXIFaceStudio";

export default function IXIFaceLabPage() {
  return (
    <>
      <Head>
        <title>
          IXI Face Lab
        </title>
      </Head>

      <Navbar />

      <main className="face-lab-page">
        <div className="f3-preview-launcher">
          <div className="f3-preview-copy">
            <span>LOCATION F3 · FINANCIAL</span>
            <strong>OPEN THE ACTUAL V12 F3 VARIANT</strong>
          </div>

          <div className="f3-preview-actions">
            <Link href="/facelab/location-f3-owned">
              OPEN OWNED F3
            </Link>

            <Link href="/facelab/location-f3-leased" className="leased">
              OPEN LEASED / RENTAL F3
            </Link>
          </div>
        </div>

        <IXIFaceStudio />
      </main>

      <Footer />

      <IXIFaceLabTypography />

      <style jsx>{`
        .face-lab-page {
          min-height: calc(100vh - 160px);
          padding: 18px;
          background:
            radial-gradient(
              circle at top,
              rgba(255,196,0,.05),
              transparent 42%
            ),
            linear-gradient(
              180deg,
              rgba(255,255,255,.018),
              rgba(255,255,255,0)
            ),
            #0b0b0b;
        }

        .f3-preview-launcher {
          min-height: 56px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 12px;
          padding: 9px 12px;
          border: 1px solid rgba(255,196,0,.28);
          border-radius: 8px;
          background:
            linear-gradient(
              180deg,
              rgba(255,196,0,.07),
              rgba(255,196,0,.02)
            ),
            #111311;
          box-shadow: inset 0 1px rgba(255,255,255,.04);
        }

        .f3-preview-copy {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .f3-preview-copy span {
          color: #ffc400;
          font-size: 8px;
          font-weight: 950;
          letter-spacing: .08em;
        }

        .f3-preview-copy strong {
          color: rgba(255,255,255,.82);
          font-size: 9px;
          font-weight: 950;
        }

        .f3-preview-actions {
          flex: 0 0 auto;
          display: flex;
          gap: 8px;
        }

        .f3-preview-actions :global(a) {
          height: 30px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 12px;
          border: 1px solid rgba(255,255,255,.14);
          border-radius: 5px;
          background: #141714;
          color: rgba(255,255,255,.76);
          font-size: 7px;
          font-weight: 950;
          letter-spacing: .04em;
          text-decoration: none;
        }

        .f3-preview-actions :global(a.leased) {
          border-color: rgba(255,196,0,.62);
          background: rgba(255,196,0,.12);
          color: #ffc400;
        }

        .f3-preview-actions :global(a:hover) {
          border-color: #ffc400;
          color: #ffc400;
        }
      `}</style>
    </>
  );
}

import Head from "next/head";
import Link from "next/link";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

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
        <div className="face-lab-shortcuts">
          <Link href="/facelab/location-f3-leased">
            F3 LEASED / RENTAL PREVIEW
          </Link>
        </div>

        <IXIFaceStudio />
      </main>

      <Footer />

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

        .face-lab-shortcuts {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 10px;
        }

        .face-lab-shortcuts :global(a) {
          height: 26px;
          display: inline-flex;
          align-items: center;
          padding: 0 10px;
          border: 1px solid rgba(255,196,0,.24);
          border-radius: 5px;
          background: rgba(255,196,0,.06);
          color: #ffc400;
          font-size: 7px;
          font-weight: 950;
          letter-spacing: .04em;
          text-decoration: none;
        }

        .face-lab-shortcuts :global(a:hover) {
          border-color: rgba(255,196,0,.48);
          background: rgba(255,196,0,.10);
        }
      `}</style>
    </>
  );
}

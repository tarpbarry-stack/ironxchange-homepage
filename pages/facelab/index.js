import Head from "next/head";

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
      `}</style>
    </>
  );
}

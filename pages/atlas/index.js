import Head from "next/head";
import IXITechnicalAtlas from "../../components/ixi-atlas/IXITechnicalAtlas";

export default function AtlasPage() {
  return (
    <>
      <Head>
        <title>IXI Technical Atlas — Machine Card</title>
        <meta
          name="description"
          content="Interactive build sheets for the IronXchange operating system."
        />
      </Head>
      <IXITechnicalAtlas />
      <style jsx global>{`html, body { margin: 0; background: #080b0c; }`}</style>
    </>
  );
}

AtlasPage.hideGlobalTicketLauncher = true;

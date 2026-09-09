import Head from "next/head";
import IXITechnicalAtlas from "../../components/ixi-atlas/IXITechnicalAtlas";

export default function AtlasPage() {
  return (
    <>
      <Head>
        <title>IXI Technical Atlas — Machine Card</title>
        <meta name="description" content="Interactive build sheets for the IronXchange operating system." />
      </Head>
      <IXITechnicalAtlas />
    </>
  );
}

AtlasPage.hideGlobalTicketLauncher = true;

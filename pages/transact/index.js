import Head from "next/head";

import IXITransactCommandCenter from "../../components/ixi-command-center/IXITransactCommandCenter";

export default function IXITransactPage() {
  return (
    <>
      <Head>
        <title>IXI TRAN$ACT</title>
        <meta
          name="description"
          content="IXI TRAN$ACT financial operating system"
        />
      </Head>

      <IXITransactCommandCenter />
    </>
  );
}

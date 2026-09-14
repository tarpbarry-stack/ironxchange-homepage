import Head from "next/head";

import { getIXITransactLayout } from "../../components/ixi-transact-dashboard/IXITransactSessionLayout";

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
    </>
  );
}

IXITransactPage.getLayout = getIXITransactLayout;

import Head from "next/head";

import IXITransactDashboardApp from "../../components/ixi-transact-dashboard/IXITransactDashboardApp";

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

      <IXITransactDashboardApp />
    </>
  );
}

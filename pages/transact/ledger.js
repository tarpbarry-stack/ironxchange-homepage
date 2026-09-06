import Head from "next/head";

import IXITransactDashboardApp from "../../components/ixi-transact-dashboard/IXITransactDashboardApp";

export default function IXITransactLedgerPage() {
  return (
    <>
      <Head>
        <title>IXI TRAN$ACT Ledger</title>
        <meta
          name="description"
          content="IXI TRAN$ACT governed ledger, close and reporting workspace"
        />
      </Head>
      <IXITransactDashboardApp />
    </>
  );
}

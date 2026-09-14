import Head from "next/head";

import { getIXITransactLayout } from "../../components/ixi-transact-dashboard/IXITransactSessionLayout";

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
    </>
  );
}

IXITransactLedgerPage.getLayout = getIXITransactLayout;

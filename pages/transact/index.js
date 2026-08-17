import Head from "next/head";
import { useRouter } from "next/router";
import IXITransactDashboardApp from "../../components/ixi-transact-dashboard/IXITransactDashboardApp";

const clean = value => String(value ?? "").trim();
const list = value => Array.isArray(value)
  ? value.flatMap(item => String(item || "").split(","))
  : String(value || "").split(",");

export default function IXITransactDesktopPage() {
  const router = useRouter();
  const entityPassportIds = list(router.query.entity || router.query.entityPassportId).map(clean).filter(Boolean);
  const locationPassportIds = list(router.query.location || router.query.locationPassportId).map(clean).filter(Boolean);
  const accountingPeriod = clean(router.query.period);
  const through = clean(router.query.through);
  const from = clean(router.query.from);
  const workspace = clean(router.query.workspace || "executive");

  return (
    <>
      <Head>
        <title>IXI TRAN$ACT</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <IXITransactDashboardApp
        entityPassportIds={entityPassportIds}
        entityLabel={clean(router.query.entityLabel)}
        accountingPeriod={accountingPeriod}
        from={from}
        through={through}
        locationPassportIds={locationPassportIds}
        locationLabel={clean(router.query.locationLabel || "ALL LOCATIONS")}
        currency={clean(router.query.currency || "USD")}
        initialWorkspace={workspace}
        apiBaseUrl={clean(process.env.NEXT_PUBLIC_IXI_CORE_URL)}
      />
    </>
  );
}

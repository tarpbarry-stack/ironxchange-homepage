import Head from "next/head";
import { useRouter } from "next/router";
import IXITransactDashboardApp from "../../components/ixi-transact-dashboard/IXITransactDashboardApp";

const clean = value => String(value ?? "").trim();
const list = value => Array.isArray(value) ? value.flatMap(item => String(item || "").split(",")) : String(value || "").split(",");
const FILTER_KEYS = ["q", "status", "sort", "direction", "cursor", "owner", "aging", "groupBy"];

export default function IXITransactDesktopPage() {
  const router = useRouter();
  const entityPassportIds = list(router.query.entity || router.query.entityPassportId).map(clean).filter(Boolean);
  const locationPassportIds = list(router.query.location || router.query.locationPassportId).map(clean).filter(Boolean);
  const accountingPeriod = clean(router.query.period);
  const through = clean(router.query.through);
  const from = clean(router.query.from);
  const workspace = clean(router.query.workspace || "executive");
  const workspaceFilters = FILTER_KEYS.reduce((out, key) => { const value = clean(router.query[key]); if (value) out[key] = value; return out; }, {});

  const replaceQuery = patch => {
    if (!router.isReady) return;
    const nextQuery = { ...router.query, ...patch };
    Object.keys(nextQuery).forEach(key => { if (nextQuery[key] === "" || nextQuery[key] === null || nextQuery[key] === undefined) delete nextQuery[key]; });
    router.replace({ pathname: router.pathname, query: nextQuery }, undefined, { shallow: true, scroll: false });
  };

  const handleWorkspaceChange = nextWorkspace => {
    const next = clean(nextWorkspace || "executive");
    if (!router.isReady || next === workspace) return;
    const reset = FILTER_KEYS.reduce((out, key) => ({ ...out, [key]: undefined }), {});
    replaceQuery({ ...reset, workspace: next });
  };

  const handleWorkspaceFiltersChange = nextFilters => {
    const patch = FILTER_KEYS.reduce((out, key) => ({ ...out, [key]: clean(nextFilters?.[key]) || undefined }), {});
    replaceQuery(patch);
  };

  const handleScopeChange = nextScope => {
    const entityPassportId = clean(nextScope?.entityPassportId);
    const locationPassportId = clean(nextScope?.locationPassportId);
    replaceQuery({
      entity: entityPassportId || undefined,
      entityPassportId: undefined,
      entityLabel: clean(nextScope?.entityLabel) || undefined,
      period: clean(nextScope?.accountingPeriod) || undefined,
      from: clean(nextScope?.from) || undefined,
      through: clean(nextScope?.through) || undefined,
      location: locationPassportId || undefined,
      locationPassportId: undefined,
      locationLabel: locationPassportId ? clean(nextScope?.locationLabel) || undefined : undefined,
      cursor: undefined
    });
  };

  return (
    <>
      <Head><title>IXI TRAN$ACT</title><meta name="robots" content="noindex,nofollow" /></Head>
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
        workspaceFilters={workspaceFilters}
        onWorkspaceChange={handleWorkspaceChange}
        onWorkspaceFiltersChange={handleWorkspaceFiltersChange}
        onScopeChange={handleScopeChange}
      />
    </>
  );
}

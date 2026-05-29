import Head from "next/head";
import { useEffect, useMemo, useState } from "react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import aerialTaxonomy from "../lib/aerialTaxonomy";
import aggregateTaxonomy from "../lib/aggregateTaxonomy";
import agricultureHarvestersTaxonomy from "../lib/agricultureHarvestersTaxonomy";
import agricultureTractorsTaxonomy from "../lib/agricultureTractorsTaxonomy";
import asphaltEquipmentTaxonomy from "../lib/asphaltEquipmentTaxonomy";
import attachmentsPartsTaxonomy from "../lib/attachmentsPartsTaxonomy";
import backhoeLoadersTaxonomy from "../lib/backhoeLoadersTaxonomy";
import compactionRollersTaxonomy from "../lib/compactionRollersTaxonomy";
import cranesTaxonomy from "../lib/cranesTaxonomy";
import crawlerCarriersTaxonomy from "../lib/crawlerCarriersTaxonomy";
import dozersTaxonomy from "../lib/dozersTaxonomy";
import drillsAndPilingTaxonomy from "../lib/drillsAndPilingTaxonomy";
import dumpTrucksTaxonomy from "../lib/dumpTrucksTaxonomy";
import excavatorsTaxonomy from "../lib/excavatorsTaxonomy";
import forkliftsTaxonomy from "../lib/forkliftsTaxonomy";
import motorGradersTaxonomy from "../lib/motorGradersTaxonomy";
import scraperTaxonomy from "../lib/scraperTaxonomy";
import skidSteerCtlTaxonomy from "../lib/skidSteerCtlTaxonomy";
import supportEquipmentTaxonomy from "../lib/supportEquipmentTaxonomy";
import telehandlersTaxonomy from "../lib/telehandlersTaxonomy";
import trailersTaxonomy from "../lib/trailersTaxonomy";
import trenchersTaxonomy from "../lib/trenchersTaxonomy";
import trucksTaxonomy from "../lib/trucksTaxonomy";
import utilityCartsTaxonomy from "../lib/utilityCartsTaxonomy";
import wheelLoadersTaxonomy from "../lib/wheelLoadersTaxonomy";

import categoryDnaKeywords from "../lib/categoryDnaKeywords";

const BRAND_YELLOW = "#FFC400";

const taxonomyLibraries = {
  "AERIAL LIFTS": aerialTaxonomy,
  "AGGREGATE": aggregateTaxonomy,
  "AGRICULTURE HARVESTERS": agricultureHarvestersTaxonomy,
  "AGRICULTURE TRACTORS": agricultureTractorsTaxonomy,
  "ASPHALT EQUIPMENT": asphaltEquipmentTaxonomy,
  "ATTACHMENTS / PARTS": attachmentsPartsTaxonomy,
  "BACKHOE LOADERS": backhoeLoadersTaxonomy,
  "COMPACTION ROLLERS": compactionRollersTaxonomy,
  "CRANES": cranesTaxonomy,
  "CRAWLER CARRIERS": crawlerCarriersTaxonomy,
  "DOZERS": dozersTaxonomy,
  "DRILLS AND PILING": drillsAndPilingTaxonomy,
  "DUMP TRUCKS": dumpTrucksTaxonomy,
  "EXCAVATORS": excavatorsTaxonomy,
  "FORKLIFTS": forkliftsTaxonomy,
  "MOTOR GRADERS": motorGradersTaxonomy,
  "SCRAPERS": scraperTaxonomy,
  "SKID STEER / CTL": skidSteerCtlTaxonomy,
  "SUPPORT EQUIPMENT": supportEquipmentTaxonomy,
  "TELEHANDLERS": telehandlersTaxonomy,
  "TRAILERS": trailersTaxonomy,
  "TRENCHERS": trenchersTaxonomy,
  "TRUCKS": trucksTaxonomy,
  "UTILITY CARTS / UTV": utilityCartsTaxonomy,
  "WHEEL LOADERS": wheelLoadersTaxonomy
};

const tabs = [
  "command",
  "taxonomy",
  "dna",
  "sharetribe",
  "listings",
  "accounts",
  "messages",
  "moderation",
  "logs"
];

const approvedMakeNames = new Set([
  "CATERPILLAR",
  "JOHN DEERE",
  "KOMATSU",
  "CASE",
  "CASE IH",
  "VOLVO",
  "HITACHI",
  "KUBOTA",
  "BOBCAT",
  "JCB",
  "DOOSAN",
  "DEVELON",
  "HYUNDAI",
  "KOBELCO",
  "LIEBHERR",
  "SANY",
  "TAKEUCHI",
  "YANMAR",
  "NEW HOLLAND",
  "BOMAG",
  "DYNAPAC",
  "HAMM",
  "WIRTGEN",
  "LEEBOY",
  "ROADTEC",
  "GROVE",
  "TEREX",
  "GENIE",
  "JLG",
  "SKYJACK",
  "MANITOU",
  "MERLO",
  "GRADALL"
]);

function clean(value) {
  return value ? String(value).trim() : "";
}

function upper(value) {
  return clean(value).toUpperCase();
}

function getListingId(listing = {}) {
  return listing.id?.uuid || listing.id || listing.uuid || listing.listingId || "";
}

function getPublicData(listing = {}) {
  return listing.publicData || listing.attributes?.publicData || {};
}

function getListingMake(listing = {}) {
  const pd = getPublicData(listing);
  return upper(listing.make || pd.make || listing.metadata?.make || "");
}

function getListingModel(listing = {}) {
  const pd = getPublicData(listing);
  return upper(listing.model || pd.model || listing.metadata?.model || "");
}

function getListingCategory(listing = {}) {
  const pd = getPublicData(listing);
  return upper(
    pd.category ||
      listing.category ||
      listing.categoryLevel1 ||
      pd.categoryLevel1 ||
      ""
  );
}

function getListingStatus(listing = {}) {
  const pd = getPublicData(listing);
  return listing.listingStatus || pd.listingStatus || listing.metadata?.listingStatus || "live";
}

function pullMakesFromTaxonomy(taxonomy) {
  if (!taxonomy) return [];

  if (Array.isArray(taxonomy)) {
    return taxonomy.map(item => {
      if (typeof item === "string") return item;
      return item.make || item.label || item.name || item.value || "";
    }).filter(Boolean);
  }

  if (typeof taxonomy === "object") {
    return Object.keys(taxonomy);
  }

  return [];
}

function pullModelsFromTaxonomy(taxonomy, make) {
  if (!taxonomy || !make) return [];

  if (Array.isArray(taxonomy)) {
    const found = taxonomy.find(item => {
      const itemMake = upper(item?.make || item?.label || item?.name || item?.value);
      return itemMake === upper(make);
    });

    const raw =
      found?.models ||
      found?.children ||
      found?.options ||
      found?.values ||
      [];

    return Array.isArray(raw) ? raw.map(String) : [];
  }

  if (typeof taxonomy === "object") {
    const key = Object.keys(taxonomy).find(item => upper(item) === upper(make));
    const raw = key ? taxonomy[key] : [];

    if (Array.isArray(raw)) return raw.map(String);

    if (raw && typeof raw === "object") {
      if (Array.isArray(raw.models)) return raw.models.map(String);
      if (Array.isArray(raw.children)) return raw.children.map(String);
      return Object.keys(raw);
    }
  }

  return [];
}

function auditTaxonomyLibrary(category, taxonomy) {
  const makes = pullMakesFromTaxonomy(taxonomy).map(upper).filter(Boolean);
  const badMakes = [];
  const lowModelMakes = [];

  makes.forEach(make => {
    if (make === "CAT") {
      badMakes.push({
        category,
        make,
        issue: "Hardwired CAT found",
        fix: "Replace with CATERPILLAR"
      });
    }

    if (approvedMakeNames.size && make && !approvedMakeNames.has(make)) {
      // Not automatically wrong. Just needs review.
      if (make.length <= 3 || make === "CAT") {
        badMakes.push({
          category,
          make,
          issue: "Make needs review",
          fix: "Confirm official make spelling"
        });
      }
    }

    const models = pullModelsFromTaxonomy(taxonomy, make);
    if (models.length > 0 && models.length < 4) {
      lowModelMakes.push({
        category,
        make,
        modelCount: models.length
      });
    }
  });

  return {
    category,
    makeCount: makes.length,
    badMakes,
    lowModelMakes
  };
}

export default function AdminDaddyPage() {
  const [activeTab, setActiveTab] = useState("command");
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState("MOTOR GRADERS");
  const [selectedMake, setSelectedMake] = useState("");
  const [taxonomySearch, setTaxonomySearch] = useState("");
  const [newModel, setNewModel] = useState("");
  const [patchQueue, setPatchQueue] = useState([]);
  const [adminLog, setAdminLog] = useState([]);

  useEffect(() => {
    fetch("/api/listings")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setListings(data);
      })
      .catch(err => console.error("Admin Daddy listing load failed:", err))
      .finally(() => setLoading(false));
  }, []);

  const categoryNames = useMemo(() => Object.keys(taxonomyLibraries).sort(), []);

  const selectedTaxonomy = taxonomyLibraries[selectedCategory];

  const makes = useMemo(() => {
    return pullMakesFromTaxonomy(selectedTaxonomy).map(String).sort();
  }, [selectedTaxonomy]);

  const activeMake = selectedMake || makes[0] || "";

  const models = useMemo(() => {
    return pullModelsFromTaxonomy(selectedTaxonomy, activeMake).sort();
  }, [selectedTaxonomy, activeMake]);

  const filteredModels = useMemo(() => {
    const search = taxonomySearch.trim().toLowerCase();
    if (!search) return models.slice(0, 500);

    return models
      .filter(model => model.toLowerCase().includes(search))
      .slice(0, 500);
  }, [models, taxonomySearch]);

  const taxonomyAudits = useMemo(() => {
    return Object.entries(taxonomyLibraries).map(([category, taxonomy]) =>
      auditTaxonomyLibrary(category, taxonomy)
    );
  }, []);

  const badMakeAlerts = useMemo(() => {
    return taxonomyAudits.flatMap(item => item.badMakes);
  }, [taxonomyAudits]);

  const lowModelAlerts = useMemo(() => {
    return taxonomyAudits.flatMap(item => item.lowModelMakes);
  }, [taxonomyAudits]);

  const listingAudit = useMemo(() => {
    const badMakes = [];
    const missingModels = [];
    const missingCategories = [];

    listings.forEach(listing => {
      const id = getListingId(listing);
      const title = listing.title || "Untitled";
      const category = getListingCategory(listing);
      const make = getListingMake(listing);
      const model = getListingModel(listing);

      if (!category) missingCategories.push({ id, title });
      if (make === "CAT") badMakes.push({ id, title, current: "CAT", fix: "CATERPILLAR" });
      if (!model) missingModels.push({ id, title, category, make });
    });

    return { badMakes, missingModels, missingCategories };
  }, [listings]);

  const dnaCategoryNames = useMemo(() => {
    return Object.keys(categoryDnaKeywords || {}).sort();
  }, []);

  const selectedDnaCategory = dnaCategoryNames.includes(selectedCategory)
    ? selectedCategory
    : dnaCategoryNames[0];

  const dnaKeywords = useMemo(() => {
    const raw = categoryDnaKeywords?.[selectedDnaCategory] || [];
    return Array.isArray(raw) ? raw : [];
  }, [selectedDnaCategory]);

  function addLog(message, type = "info") {
    setAdminLog(current => [
      {
        id: `${Date.now()}-${Math.random()}`,
        message,
        type,
        createdAt: new Date().toLocaleString()
      },
      ...current
    ].slice(0, 100));
  }

  function queueAddModel() {
    const value = upper(newModel);

    if (!selectedCategory || !activeMake || !value) {
      alert("Pick category, make, and enter a model.");
      return;
    }

    if (models.map(upper).includes(value)) {
      alert(`${value} already exists under ${activeMake}.`);
      return;
    }

    const patch = {
      id: `${Date.now()}-${Math.random()}`,
      type: "ADD_MODEL",
      category: selectedCategory,
      make: activeMake,
      model: value,
      status: "STAGED"
    };

    setPatchQueue(current => [patch, ...current]);
    setNewModel("");
    addLog(`Staged model add: ${selectedCategory} / ${activeMake} / ${value}`, "success");
  }

  function queueMakeFix(category, make, fix) {
    const patch = {
      id: `${Date.now()}-${Math.random()}`,
      type: "FIX_MAKE",
      category,
      current: make,
      replacement: fix,
      status: "STAGED"
    };

    setPatchQueue(current => [patch, ...current]);
    addLog(`Staged make fix: ${category} / ${make} → ${fix}`, "warn");
  }

  function protectedAction(label) {
    const typed = window.prompt(`${label}\n\nType ADMIN DADDY to stage this protected action.`);

    if (typed !== "ADMIN DADDY") {
      addLog(`Cancelled protected action: ${label}`, "warn");
      return;
    }

    addLog(`Protected action staged: ${label}`, "danger");
    alert("Staged only. Backend write endpoint comes next.");
  }

  function copyPatchQueue() {
    const text = JSON.stringify(patchQueue, null, 2);
    navigator.clipboard.writeText(text);
    addLog("Copied taxonomy patch queue", "success");
  }

  return (
    <>
      <Head>
        <title>Admin Daddy | IronXchange</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main>
        <Navbar />

        <section className="wrap">
          <section className="hero">
            <div>
              <span>IronXchange Operator OS</span>
              <h1>Admin Daddy</h1>
              <p>AWS/code taxonomy first. Sharetribe patching second. No migration nightmare later.</p>
            </div>

            <div className="stats">
              <div><strong>{categoryNames.length}</strong><span>Taxonomy Files</span></div>
              <div><strong>{dnaCategoryNames.length}</strong><span>DNA Libraries</span></div>
              <div><strong>{badMakeAlerts.length}</strong><span>Make Alerts</span></div>
              <div><strong>{patchQueue.length}</strong><span>Patch Queue</span></div>
            </div>
          </section>

          <section className="shell">
            <aside className="nav">
              {tabs.map(tab => (
                <button
                  key={tab}
                  type="button"
                  className={activeTab === tab ? "active" : ""}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </aside>

            <section className="panelArea">
              {activeTab === "command" && (
                <div className="grid">
                  <Card title="Command Center" label="Admin Daddy V1" wide>
                    <p>Taxonomy files are separated from DNA badge files. Sharetribe is treated as downstream listing storage, not the master taxonomy brain.</p>
                  </Card>

                  <Metric title="Listings Loaded" value={loading ? "..." : listings.length} />
                  <Metric title="Bad Make Alerts" value={badMakeAlerts.length} />
                  <Metric title="Missing Listing Models" value={listingAudit.missingModels.length} />
                  <Metric title="Patch Queue" value={patchQueue.length} />

                  <Card title="Today’s Target" label="Taxonomy Correction" wide>
                    <p>Fix hardwired CAT in skid steer taxonomy and identify missing Motor Grader models under CATERPILLAR.</p>
                  </Card>
                </div>
              )}

              {activeTab === "taxonomy" && (
                <div className="taxonomyGrid">
                  <Card title="Taxonomy Manager" label="Category / Make / Model">
                    <select value={selectedCategory} onChange={e => {
                      setSelectedCategory(e.target.value);
                      setSelectedMake("");
                      setTaxonomySearch("");
                    }}>
                      {categoryNames.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>

                    <select value={activeMake} onChange={e => setSelectedMake(e.target.value)}>
                      {makes.map(make => (
                        <option key={make} value={make}>{make}</option>
                      ))}
                    </select>

                    <div className="addRow">
                      <input
                        value={newModel}
                        onChange={e => setNewModel(e.target.value)}
                        placeholder="Add missing model, ex: 140H"
                      />
                      <button type="button" onClick={queueAddModel}>Stage Add</button>
                    </div>

                    <input
                      value={taxonomySearch}
                      onChange={e => setTaxonomySearch(e.target.value)}
                      placeholder="Search models..."
                    />

                    <div className="chipBox">
                      {filteredModels.map(model => (
                        <button key={model} type="button">{model}</button>
                      ))}
                    </div>
                  </Card>

                  <Card title="Make Alerts" label="Bad hardwired dropdown values">
                    {badMakeAlerts.length === 0 ? (
                      <p>No hardwired make alerts found.</p>
                    ) : badMakeAlerts.map((alert, index) => (
                      <div className="issue" key={`${alert.category}-${alert.make}-${index}`}>
                        <strong>{alert.category}</strong>
                        <p>{alert.issue}: {alert.make}</p>
                        <small>{alert.fix}</small>
                        {alert.make === "CAT" && (
                          <button type="button" onClick={() => queueMakeFix(alert.category, "CAT", "CATERPILLAR")}>
                            Stage CAT Fix
                          </button>
                        )}
                      </div>
                    ))}
                  </Card>

                  <Card title="Low Model Count Alerts" label="Review thin taxonomy groups" wide>
                    <div className="miniTable">
                      {lowModelAlerts.slice(0, 80).map((item, index) => (
                        <div className="miniRow" key={`${item.category}-${item.make}-${index}`}>
                          <strong>{item.category}</strong>
                          <span>{item.make}</span>
                          <small>{item.modelCount} models</small>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              )}

              {activeTab === "dna" && (
                <div className="grid">
                  <Card title="DNA / Badge Manager" label="Badges, not dropdown taxonomy" wide>
                    <p>This section uses categoryDnaKeywords and the Dna.js files. This is where HIGH FLOW, AUX HYDRAULICS, RIPPER, GPS, SMARTGRADE, etc. belong.</p>
                  </Card>

                  <Metric title="DNA Groups" value={dnaCategoryNames.length} />
                  <Metric title="Selected DNA Keywords" value={dnaKeywords.length} />

                  <Card title="DNA Preview" label={selectedDnaCategory || "DNA"}>
                    <div className="chipBox">
                      {dnaKeywords.slice(0, 350).map(keyword => (
                        <button key={keyword} type="button">{String(keyword).toLowerCase()}</button>
                      ))}
                    </div>
                  </Card>
                </div>
              )}

              {activeTab === "sharetribe" && (
                <div className="grid">
                  <Card title="Sharetribe Patch Layer" label="Downstream Sync" wide>
                    <p>Admin Daddy owns the taxonomy. Sharetribe gets patched only when saved listing data needs correction.</p>
                  </Card>

                  <Card title="Patch Queue" label="Staged Changes" wide>
                    {patchQueue.length === 0 ? (
                      <p>No staged patches yet.</p>
                    ) : patchQueue.map(patch => (
                      <div className="issue" key={patch.id}>
                        <strong>{patch.type}</strong>
                        <p>{patch.category} {patch.make ? `/ ${patch.make}` : ""}</p>
                        <small>{patch.model || `${patch.current} → ${patch.replacement}`}</small>
                      </div>
                    ))}

                    <button type="button" onClick={copyPatchQueue}>Copy Patch Queue</button>
                    <button type="button" onClick={() => protectedAction("Run Sharetribe patch migration")}>
                      Stage Sharetribe Migration
                    </button>
                  </Card>
                </div>
              )}

              {activeTab === "listings" && (
                <Card title="Listings Control" label={loading ? "Loading..." : `${listings.length} listings`} wide>
                  <div className="table">
                    {listings.slice(0, 100).map(listing => (
                      <div className="row" key={getListingId(listing)}>
                        <strong>{listing.title || "Untitled"}</strong>
                        <span>{getListingCategory(listing) || "NO CATEGORY"}</span>
                        <span>{getListingMake(listing) || "NO MAKE"}</span>
                        <span>{getListingModel(listing) || "NO MODEL"}</span>
                        <small>{getListingStatus(listing)}</small>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {activeTab === "accounts" && (
                <Stub title="Account Control" onAction={protectedAction} />
              )}

              {activeTab === "messages" && (
                <Stub title="Admin Daddy Messages" onAction={protectedAction} />
              )}

              {activeTab === "moderation" && (
                <Stub title="Moderation Queue" onAction={protectedAction} />
              )}

              {activeTab === "logs" && (
                <Card title="Admin Log" label="Session actions" wide>
                  {adminLog.length === 0 ? <p>No admin actions yet.</p> : adminLog.map(item => (
                    <div className={`log ${item.type}`} key={item.id}>
                      <strong>{item.message}</strong>
                      <small>{item.createdAt}</small>
                    </div>
                  ))}
                </Card>
              )}
            </section>
          </section>
        </section>
      </main>

      <Footer />

      <style jsx>{`
        :global(html), :global(body) {
          margin: 0;
          background: #080808;
          color: #f2f2f2;
          font-family: Arial, sans-serif;
        }

        * { box-sizing: border-box; }

        main {
          min-height: 100vh;
          background: radial-gradient(circle at top, rgba(255,196,0,.055), transparent 34%), #080808;
        }

        .wrap {
          max-width: 1600px;
          margin: 0 auto;
          padding: 14px 2% 48px;
        }

        .hero, .shell, .card {
          background: linear-gradient(180deg, rgba(255,255,255,.035), rgba(255,255,255,0)), #141414;
          border: 1px solid rgba(255,255,255,.07);
          border-radius: 16px;
          box-shadow: 0 1px 0 rgba(255,255,255,.045) inset, 0 20px 46px rgba(0,0,0,.30);
        }

        .hero {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 18px;
          padding: 18px 20px;
          margin-bottom: 12px;
        }

        .hero span, .cardLabel {
          color: ${BRAND_YELLOW};
          font-size: 8px;
          font-weight: 950;
          letter-spacing: .8px;
          text-transform: uppercase;
        }

        .hero h1 {
          margin: 3px 0;
          font-size: 38px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: -1.4px;
        }

        .hero p, .card p {
          margin: 0;
          color: rgba(255,255,255,.46);
          font-size: 12px;
          line-height: 1.45;
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(4, 105px);
          gap: 8px;
        }

        .stats div {
          padding: 11px;
          border-radius: 14px;
          background: #0d0d0d;
          border: 1px solid rgba(255,255,255,.06);
          text-align: center;
        }

        .stats strong {
          display: block;
          color: ${BRAND_YELLOW};
          font-size: 24px;
          font-weight: 950;
        }

        .stats span {
          color: rgba(255,255,255,.48);
          font-size: 7.5px;
          font-weight: 950;
          text-transform: uppercase;
        }

        .shell {
          display: grid;
          grid-template-columns: 215px 1fr;
          gap: 12px;
          padding: 12px;
        }

        .nav {
          display: grid;
          align-content: start;
          gap: 7px;
        }

        .nav button {
          height: 38px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,.07);
          background: #0f0f0f;
          color: rgba(255,255,255,.58);
          font-size: 9px;
          font-weight: 950;
          letter-spacing: .65px;
          text-transform: uppercase;
          cursor: pointer;
        }

        .nav button.active {
          color: #050505;
          background: ${BRAND_YELLOW};
          border-color: ${BRAND_YELLOW};
        }

        .panelArea { min-height: 640px; }

        .grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }

        .taxonomyGrid {
          display: grid;
          grid-template-columns: 1.15fr .85fr;
          gap: 10px;
        }

        .card {
          padding: 15px;
        }

        .wide {
          grid-column: 1 / -1;
        }

        .card h2 {
          margin: 6px 0 9px;
          font-size: 18px;
          font-weight: 950;
          letter-spacing: -.35px;
          text-transform: uppercase;
        }

        .metricValue {
          display: block;
          color: #f2f2f2;
          font-size: 34px;
          font-weight: 950;
        }

        select, input {
          width: 100%;
          height: 38px;
          margin-top: 8px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,.08);
          background: #0b0b0b;
          color: #f2f2f2;
          padding: 0 11px;
          font-weight: 850;
          outline: none;
        }

        .addRow {
          display: grid;
          grid-template-columns: 1fr 110px;
          gap: 8px;
        }

        button {
          font-family: inherit;
        }

        .card button {
          min-height: 30px;
          margin-top: 8px;
          border-radius: 999px;
          border: 1px solid rgba(255,196,0,.35);
          background: #111;
          color: ${BRAND_YELLOW};
          padding: 0 12px;
          font-size: 8px;
          font-weight: 950;
          letter-spacing: .6px;
          text-transform: uppercase;
          cursor: pointer;
        }

        .chipBox {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          max-height: 360px;
          overflow-y: auto;
          margin-top: 10px;
          padding: 9px;
          border-radius: 12px;
          background: #0b0b0b;
          border: 1px solid rgba(255,255,255,.055);
        }

        .chipBox button {
          margin: 0;
          min-height: 24px;
          border-color: rgba(255,255,255,.07);
          color: rgba(255,255,255,.62);
          text-transform: none;
        }

        .issue, .log {
          margin-top: 8px;
          padding: 10px;
          border-radius: 11px;
          background: #0d0d0d;
          border: 1px solid rgba(255,255,255,.07);
        }

        .issue strong, .log strong {
          display: block;
          font-size: 11px;
          color: #f2f2f2;
        }

        .issue small, .log small {
          display: block;
          margin-top: 4px;
          color: rgba(255,255,255,.42);
          font-size: 9px;
        }

        .miniTable, .table {
          display: grid;
          gap: 6px;
          max-height: 520px;
          overflow-y: auto;
          margin-top: 10px;
        }

        .miniRow, .row {
          display: grid;
          grid-template-columns: 1.4fr 1fr 90px;
          gap: 8px;
          padding: 9px;
          border-radius: 10px;
          background: #0d0d0d;
          border: 1px solid rgba(255,255,255,.055);
          font-size: 10px;
        }

        .row {
          grid-template-columns: 2fr 1fr 1fr 1fr 80px;
        }

        .miniRow span, .miniRow small, .row span, .row small {
          color: rgba(255,255,255,.50);
          font-weight: 850;
          text-transform: uppercase;
        }

        @media (max-width: 1000px) {
          .hero, .shell, .grid, .taxonomyGrid {
            grid-template-columns: 1fr;
          }

          .hero { display: grid; }

          .stats {
            grid-template-columns: repeat(2, 1fr);
          }

          .row, .miniRow {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}

function Card({ title, label, wide, children }) {
  return (
    <section className={wide ? "card wide" : "card"}>
      <span className="cardLabel">{label}</span>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function Metric({ title, value }) {
  return (
    <section className="card">
      <span className="cardLabel">{title}</span>
      <strong className="metricValue">{value}</strong>
    </section>
  );
}

function Stub({ title, onAction }) {
  return (
    <section className="card wide">
      <span className="cardLabel">Ready To Wire</span>
      <h2>{title}</h2>
      <p>This module is staged inside Admin Daddy but not connected to destructive backend writes yet.</p>
      <button type="button" onClick={() => onAction(title)}>
        Stage Protected Action
      </button>
    </section>
  );
}

/* -------------------- */
/* MAIN ADMIN DADDY PAGE */
/* -------------------- */

export default function AdminDaddyPage() {
  const [activeTab, setActiveTab] = useState("command");

  const [listings, setListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState("SKID STEER / CTL");
  const [selectedMake, setSelectedMake] = useState("");
  const [taxonomySearch, setTaxonomySearch] = useState("");

  const [newCategoryName, setNewCategoryName] = useState("");
  const [newMakeName, setNewMakeName] = useState("");
  const [newModelName, setNewModelName] = useState("");

  const [resolverInput, setResolverInput] = useState("");
  const [resolverCategory, setResolverCategory] = useState("");
  const [resolverMake, setResolverMake] = useState("");

  const [patchQueue, setPatchQueue] = useState([]);
  const [adminLog, setAdminLog] = useState([]);

  useEffect(() => {
    fetch("/api/listings")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setListings(data);
      })
      .catch(err => {
        console.error("Admin Daddy listing load failed:", err);
        addLog("Listing load failed", "danger");
      })
      .finally(() => setLoadingListings(false));
  }, []);

  const categoryNames = useMemo(() => {
    return Object.keys(TAXONOMY_REGISTRY).sort();
  }, []);

  const selectedRegistryItem = TAXONOMY_REGISTRY[selectedCategory] || null;

  const taxonomyRows = useMemo(() => {
    return getTaxonomyRows(selectedRegistryItem?.data);
  }, [selectedRegistryItem]);

  const allTaxonomyRows = useMemo(() => {
    return Object.entries(TAXONOMY_REGISTRY).flatMap(([category, item]) =>
      getTaxonomyRows(item.data).map(row => ({
        ...row,
        category,
        file: item.file,
        registryKey: item.key
      }))
    );
  }, []);

  const makes = useMemo(() => {
    return getUniqueMakesFromRows(taxonomyRows);
  }, [taxonomyRows]);

  const activeMake = selectedMake || makes[0] || "";

  const modelsForMake = useMemo(() => {
    return getModelsForMake(taxonomyRows, activeMake);
  }, [taxonomyRows, activeMake]);

  const filteredRows = useMemo(() => {
    const search = taxonomySearch.trim().toLowerCase();

    const rows = taxonomyRows.filter(row => {
      if (!activeMake) return true;
      return upper(row.make) === upper(activeMake);
    });

    if (!search) return rows.slice(0, 500);

    return rows
      .filter(row => {
        const haystack = `${row.make} ${row.model}`.toLowerCase();
        return haystack.includes(search);
      })
      .slice(0, 500);
  }, [taxonomyRows, activeMake, taxonomySearch]);

  const badMakeRows = useMemo(() => {
    return findBadMakeRows(allTaxonomyRows);
  }, [allTaxonomyRows]);

  const selectedBadMakeRows = useMemo(() => {
    return findBadMakeRows(taxonomyRows);
  }, [taxonomyRows]);

  const dnaCategoryNames = useMemo(() => {
    return Object.keys(categoryDnaKeywords || {}).sort();
  }, []);

  const selectedDnaCategory =
    dnaCategoryNames.includes(selectedCategory)
      ? selectedCategory
      : dnaCategoryNames[0] || "";

  const selectedDnaKeywords = useMemo(() => {
    const raw = categoryDnaKeywords?.[selectedDnaCategory] || [];
    return Array.isArray(raw) ? raw : [];
  }, [selectedDnaCategory]);

  const listingAudit = useMemo(() => {
    const badMakes = [];
    const missingModels = [];
    const missingCategories = [];
    const provisionalCandidates = [];

    listings.forEach(listing => {
      const id = getListingId(listing);
      const title = listing.title || "Untitled";
      const category = getListingCategory(listing);
      const make = getListingMake(listing);
      const model = getListingModel(listing);

      if (!category) {
        missingCategories.push({ id, title });
      }

      if (KNOWN_BAD_MAKES[make]) {
        badMakes.push({
          id,
          title,
          category,
          currentMake: make,
          replacementMake: KNOWN_BAD_MAKES[make]
        });
      }

      if (!model) {
        missingModels.push({
          id,
          title,
          category,
          make
        });
      }

      if (model && category && make) {
        const registry = TAXONOMY_REGISTRY[category];
        const rows = getTaxonomyRows(registry?.data);
        const existingModels = getModelsForMake(rows, make).map(normalizeModel);

        if (!existingModels.includes(normalizeModel(model))) {
          provisionalCandidates.push({
            id,
            title,
            category,
            make,
            model
          });
        }
      }
    });

    return {
      badMakes,
      missingModels,
      missingCategories,
      provisionalCandidates
    };
  }, [listings]);

  const resolverMatches = useMemo(() => {
    const scopeRows = resolverCategory
      ? allTaxonomyRows.filter(row => upper(row.category) === upper(resolverCategory))
      : allTaxonomyRows;

    const makeRows = resolverMake
      ? scopeRows.filter(row => upper(row.make) === upper(resolverMake))
      : scopeRows;

    return findModelMatches(makeRows, resolverInput);
  }, [allTaxonomyRows, resolverCategory, resolverMake, resolverInput]);

  const resolverBestGuess = useMemo(() => {
    const exact = resolverMatches.exact[0];
    const normalized = resolverMatches.normalized[0];
    const loose = resolverMatches.loose[0];

    if (exact) {
      return {
        status: "approved",
        confidence: "100%",
        row: exact,
        note: "Exact model already exists in taxonomy."
      };
    }

    if (normalized) {
      return {
        status: "normalized",
        confidence: "94%",
        row: normalized,
        note: "Model matches after spacing/dash cleanup."
      };
    }

    if (loose) {
      return {
        status: "possible",
        confidence: "70%",
        row: loose,
        note: "Loose match found. Admin Daddy should review."
      };
    }

    if (resolverInput.trim()) {
      return {
        status: "provisional",
        confidence: "unknown",
        row: null,
        note: "Not found in current taxonomy. Can be staged as provisional model."
      };
    }

    return null;
  }, [resolverMatches, resolverInput]);

  function addLog(message, type = "info") {
    setAdminLog(current => [
      {
        id: buildPatchId(),
        message,
        type,
        createdAt: new Date().toLocaleString()
      },
      ...current
    ].slice(0, 100));
  }

  function stagePatch(patch) {
    const finalPatch = {
      id: buildPatchId(),
      status: "STAGED",
      createdAt: new Date().toISOString(),
      ...patch
    };

    setPatchQueue(current => [finalPatch, ...current]);

    addLog(
      `${finalPatch.type} staged — ${finalPatch.category || ""} ${
        finalPatch.make || finalPatch.currentMake || ""
      } ${finalPatch.model || ""}`,
      "success"
    );
  }

  function stageAddCategory() {
    const category = upper(newCategoryName);

    if (!category) {
      alert("Enter category name.");
      return;
    }

    if (TAXONOMY_REGISTRY[category]) {
      alert(`${category} already exists.`);
      return;
    }

    stagePatch({
      type: "ADD_CATEGORY",
      category,
      target: "IX_AWS_TAXONOMY",
      sharetribeImpact: "REQUIRES_SHARETRIBE_FIELD_SYNC"
    });

    setNewCategoryName("");
  }

  function stageAddMake() {
    const make = upper(newMakeName);

    if (!selectedCategory || !make) {
      alert("Select category and enter make.");
      return;
    }

    if (makes.includes(make)) {
      alert(`${make} already exists in ${selectedCategory}.`);
      return;
    }

    stagePatch({
      type: "ADD_MAKE",
      category: selectedCategory,
      make,
      file: selectedRegistryItem?.file,
      target: "IX_AWS_TAXONOMY",
      sharetribeImpact: "REQUIRES_SHARETRIBE_ALLOWED_VALUE_SYNC"
    });

    setNewMakeName("");
  }

  function stageAddModel() {
    const model = upper(newModelName);

    if (!selectedCategory || !activeMake || !model) {
      alert("Select category, make, and enter model.");
      return;
    }

    if (modelsForMake.map(normalizeModel).includes(normalizeModel(model))) {
      alert(`${model} already exists under ${activeMake}.`);
      return;
    }

    stagePatch({
      type: "ADD_MODEL",
      category: selectedCategory,
      make: activeMake,
      model,
      file: selectedRegistryItem?.file,
      target: "IX_AWS_TAXONOMY",
      sharetribeImpact: "REQUIRES_SHARETRIBE_ALLOWED_VALUE_SYNC"
    });

    setNewModelName("");
  }

  function stageFixMake(category, currentMake, replacementMake) {
    stagePatch({
      type: "FIX_MAKE",
      category,
      currentMake,
      replacementMake,
      target: "IX_AWS_TAXONOMY",
      sharetribeImpact: "REQUIRES_SHARETRIBE_VALUE_MIGRATION"
    });
  }

  function stageResolverProvisional() {
    const model = upper(resolverInput);

    if (!resolverCategory || !resolverMake || !model) {
      alert("Select category, make, and enter model input first.");
      return;
    }

    stagePatch({
      type: "ADD_PROVISIONAL_MODEL",
      category: resolverCategory,
      make: resolverMake,
      model,
      target: "IX_AWS_TAXONOMY",
      sharetribeImpact: "REQUIRES_SHARETRIBE_ALLOWED_VALUE_SYNC",
      note: "Created from Model Resolver"
    });
  }

  function stageSharetribeSync() {
    const typed = window.prompt(
      "Stage Sharetribe sync patch?\n\nThis does NOT run yet. Type ADMIN DADDY to stage."
    );

    if (typed !== "ADMIN DADDY") {
      addLog("Sharetribe sync cancelled", "warn");
      return;
    }

    stagePatch({
      type: "SHARETRIBE_SYNC_BATCH",
      target: "SHARETRIBE",
      count: patchQueue.length,
      sharetribeImpact: "BATCH_SYNC_REQUIRED"
    });
  }

  async function copyPatchQueue() {
    const text = JSON.stringify(patchQueue, null, 2);

    try {
      await navigator.clipboard.writeText(text);
      addLog("Patch queue copied", "success");
    } catch {
      alert(text);
    }
  }

  function clearPatchQueue() {
    const typed = window.prompt("Clear patch queue? Type CLEAR to confirm.");

    if (typed !== "CLEAR") return;

    setPatchQueue([]);
    addLog("Patch queue cleared", "warn");
  }

  function protectedStub(actionName) {
    const typed = window.prompt(
      `${actionName}\n\nProtected Admin Daddy action. Type ADMIN DADDY to stage.`
    );

    if (typed !== "ADMIN DADDY") {
      addLog(`${actionName} cancelled`, "warn");
      return;
    }

    stagePatch({
      type: "PROTECTED_ACTION",
      action: actionName,
      target: "FUTURE_BACKEND_ENDPOINT"
    });
  }

  return (
    <>
      <Head>
        <title>Admin Daddy | IronXchange</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main>
        <Navbar />

        <section className="admin-wrap">
          <section className="admin-hero">
            <div>
              <span>IronXchange Operator OS</span>
              <h1>Admin Daddy</h1>
              <p>
                Edit the IX taxonomy, stage Sharetribe sync patches, manage DNA badges, and protect launch operations from one control room.
              </p>
            </div>

            <div className="hero-stats">
              <div>
                <strong>{categoryNames.length}</strong>
                <span>Taxonomy Files</span>
              </div>

              <div>
                <strong>{allTaxonomyRows.length}</strong>
                <span>Model Rows</span>
              </div>

              <div>
                <strong>{badMakeRows.length}</strong>
                <span>Bad Make Rows</span>
              </div>

              <div>
                <strong>{patchQueue.length}</strong>
                <span>Staged Patches</span>
              </div>
            </div>
          </section>

          <section className="admin-shell">
            <aside className="admin-nav">
              {ADMIN_TABS.map(tab => (
                <button
                  key={tab}
                  type="button"
                  className={activeTab === tab ? "active" : ""}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </aside>

            <section className="admin-content">
              {activeTab === "command" && (
                <section className="grid four">
                  <AdminCard label="Mission" title="Command Center" wide>
                    <p>
                      Admin Daddy is the IronXchange source-of-truth layer. IX/AWS taxonomy is edited first, Sharetribe receives sync patches second, and Post/Search consume the clean result.
                    </p>
                  </AdminCard>

                  <MetricCard label="Listings" value={loadingListings ? "..." : listings.length} />
                  <MetricCard label="Taxonomy Rows" value={allTaxonomyRows.length} />
                  <MetricCard label="Bad Makes" value={badMakeRows.length} />
                  <MetricCard label="Provisional Listings" value={listingAudit.provisionalCandidates.length} />

                  <AdminCard label="Today" title="Primary Launch Blocker" wide>
                    <p>
                      Fix make/model taxonomy visibility, stage CAT → CATERPILLAR correction, and create a clean path for adding missing models without breaking Sharetribe uploads.
                    </p>
                  </AdminCard>
                </section>
              )}

              {activeTab === "taxonomy" && (
                <section className="grid taxonomy">
                  <AdminCard label="Taxonomy Tree" title="Category → Make → Model">
                    <select
                      value={selectedCategory}
                      onChange={e => {
                        setSelectedCategory(e.target.value);
                        setSelectedMake("");
                        setTaxonomySearch("");
                      }}
                    >
                      {categoryNames.map(category => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>

                    <select
                      value={activeMake}
                      onChange={e => setSelectedMake(e.target.value)}
                    >
                      {makes.map(make => (
                        <option key={make} value={make}>
                          {make}
                        </option>
                      ))}
                    </select>

                    <input
                      value={taxonomySearch}
                      onChange={e => setTaxonomySearch(e.target.value)}
                      placeholder="Search make/model rows..."
                    />

                    <div className="row-table small">
                      {filteredRows.map(row => (
                        <div className="taxonomy-row" key={row.id}>
                          <strong>{row.make || "NO MAKE"}</strong>
                          <span>{row.model || "NO MODEL"}</span>
                        </div>
                      ))}
                    </div>
                  </AdminCard>

                  <AdminCard label="Add / Stage" title="Taxonomy Builder">
                    <input
                      value={newCategoryName}
                      onChange={e => setNewCategoryName(e.target.value)}
                      placeholder="New category"
                    />
                    <button type="button" onClick={stageAddCategory}>
                      Stage Category
                    </button>

                    <input
                      value={newMakeName}
                      onChange={e => setNewMakeName(e.target.value)}
                      placeholder="New make"
                    />
                    <button type="button" onClick={stageAddMake}>
                      Stage Make
                    </button>

                    <input
                      value={newModelName}
                      onChange={e => setNewModelName(e.target.value)}
                      placeholder="New model"
                    />
                    <button type="button" onClick={stageAddModel}>
                      Stage Model
                    </button>
                  </AdminCard>

                  <AdminCard label="Audit" title="Bad Make Rows" wide>
                    {selectedBadMakeRows.length === 0 ? (
                      <p>No known bad make rows in this category.</p>
                    ) : (
                      <div className="row-table">
                        {selectedBadMakeRows.map(row => (
                          <div className="audit-row" key={`${row.id}-${row.model}`}>
                            <strong>{row.currentMake}</strong>
                            <span>{row.model || "NO MODEL"}</span>
                            <small>→ {row.replacementMake}</small>
                            <button
                              type="button"
                              onClick={() =>
                                stageFixMake(selectedCategory, row.currentMake, row.replacementMake)
                              }
                            >
                              Stage Fix
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </AdminCard>
                </section>
              )}

              {activeTab === "model resolver" && (
                <section className="grid two">
                  <AdminCard label="Model Resolver" title="Messy Input → Canonical Model">
                    <select value={resolverCategory} onChange={e => setResolverCategory(e.target.value)}>
                      <option value="">All Categories</option>
                      {categoryNames.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>

                    <select value={resolverMake} onChange={e => setResolverMake(e.target.value)}>
                      <option value="">All Makes</option>
                      {getUniqueMakesFromRows(allTaxonomyRows).map(make => (
                        <option key={make} value={make}>{make}</option>
                      ))}
                    </select>

                    <input
                      value={resolverInput}
                      onChange={e => setResolverInput(e.target.value)}
                      placeholder="Example: 306-07, 259 d3, 140 h..."
                    />

                    {resolverBestGuess ? (
                      <div className="resolver-result">
                        <strong>{resolverBestGuess.status}</strong>
                        <span>{resolverBestGuess.confidence}</span>
                        <p>{resolverBestGuess.note}</p>

                        {resolverBestGuess.row ? (
                          <small>
                            {resolverBestGuess.row.category} / {resolverBestGuess.row.make} / {resolverBestGuess.row.model}
                          </small>
                        ) : (
                          <button type="button" onClick={stageResolverProvisional}>
                            Stage Provisional Model
                          </button>
                        )}
                      </div>
                    ) : (
                      <p>Type a raw model to resolve against the taxonomy.</p>
                    )}
                  </AdminCard>

                  <AdminCard label="Match Buckets" title="Resolver Matches">
                    <h3>Exact</h3>
                    {resolverMatches.exact.slice(0, 8).map(row => (
                      <div className="mini-line" key={`exact-${row.category}-${row.make}-${row.model}`}>
                        {row.category} / {row.make} / {row.model}
                      </div>
                    ))}

                    <h3>Normalized</h3>
                    {resolverMatches.normalized.slice(0, 8).map(row => (
                      <div className="mini-line" key={`norm-${row.category}-${row.make}-${row.model}`}>
                        {row.category} / {row.make} / {row.model}
                      </div>
                    ))}

                    <h3>Loose</h3>
                    {resolverMatches.loose.slice(0, 12).map(row => (
                      <div className="mini-line" key={`loose-${row.category}-${row.make}-${row.model}`}>
                        {row.category} / {row.make} / {row.model}
                      </div>
                    ))}
                  </AdminCard>
                </section>
              )}

              {activeTab === "dna badges" && (
                <section className="grid two">
                  <AdminCard label="DNA / Badge Manager" title="Feature Intelligence">
                    <p>
                      This section is separate from taxonomy. These are badges/keywords like HIGH FLOW, AUX HYDRAULICS, RIPPER, GPS, SMARTGRADE, ROPS, and package DNA.
                    </p>

                    <select
                      value={selectedDnaCategory}
                      onChange={e => setSelectedCategory(e.target.value)}
                    >
                      {dnaCategoryNames.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>

                    <div className="chip-box">
                      {selectedDnaKeywords.slice(0, 500).map(keyword => (
                        <button key={keyword} type="button">
                          {String(keyword).toLowerCase()}
                        </button>
                      ))}
                    </div>
                  </AdminCard>

                  <AdminCard label="Future" title="Badge Controls">
                    <p>Future controls live here:</p>
                    <ul>
                      <li>Add DNA keyword</li>
                      <li>Remove DNA keyword</li>
                      <li>Public/private badge visibility</li>
                      <li>Badge click intelligence</li>
                      <li>Badge-to-inquiry analytics</li>
                    </ul>
                  </AdminCard>
                </section>
              )}

              {activeTab === "sharetribe sync" && (
                <section className="grid two">
                  <AdminCard label="Patch Queue" title="IX → Sharetribe Sync" wide>
                    <p>
                      Admin Daddy stages taxonomy changes first. Sharetribe sync is the downstream patch required so listing creation/search fields do not fail.
                    </p>

                    <div className="action-row">
                      <button type="button" onClick={copyPatchQueue}>
                        Copy Patch Queue
                      </button>

                      <button type="button" onClick={stageSharetribeSync}>
                        Stage Sharetribe Sync
                      </button>

                      <button type="button" onClick={clearPatchQueue}>
                        Clear Queue
                      </button>
                    </div>

                    {patchQueue.length === 0 ? (
                      <p>No staged patches yet.</p>
                    ) : (
                      <div className="row-table">
                        {patchQueue.map(patch => (
                          <div className="patch-row" key={patch.id}>
                            <strong>{patch.type}</strong>
                            <span>{patch.category || patch.target || "GLOBAL"}</span>
                            <span>
                              {patch.make ||
                                patch.currentMake ||
                                patch.model ||
                                patch.action ||
                                "—"}
                            </span>
                            <small>{patch.sharetribeImpact || patch.status}</small>
                          </div>
                        ))}
                      </div>
                    )}
                  </AdminCard>
                </section>
              )}

              {activeTab === "listings" && (
                <section className="grid two">
                  <AdminCard label="Listings Control" title={loadingListings ? "Loading Listings" : `${listings.length} Listings Loaded`} wide>
                    <div className="row-table">
                      {listings.slice(0, 150).map(listing => (
                        <div className="listing-row" key={getListingId(listing)}>
                          <strong>{listing.title || "Untitled"}</strong>
                          <span>{getListingCategory(listing) || "NO CATEGORY"}</span>
                          <span>{getListingMake(listing) || "NO MAKE"}</span>
                          <span>{getListingModel(listing) || "NO MODEL"}</span>
                          <small>{getListingStatus(listing)}</small>
                        </div>
                      ))}
                    </div>
                  </AdminCard>

                  <AdminCard label="Listing Health" title="Data Alerts" wide>
                    <div className="metric-strip">
                      <div><strong>{listingAudit.badMakes.length}</strong><span>Bad Makes</span></div>
                      <div><strong>{listingAudit.missingModels.length}</strong><span>Missing Models</span></div>
                      <div><strong>{listingAudit.missingCategories.length}</strong><span>Missing Categories</span></div>
                      <div><strong>{listingAudit.provisionalCandidates.length}</strong><span>Provisional</span></div>
                    </div>
                  </AdminCard>
                </section>
              )}

              {activeTab === "accounts" && (
                <FutureModule
                  title="Account Control"
                  text="Freeze accounts, unfreeze accounts, inspect seller inventory, mark trusted sellers, mark dealer accounts, and disable bad actors."
                  onAction={protectedStub}
                />
              )}

              {activeTab === "messages" && (
                <FutureModule
                  title="Admin Daddy Messages"
                  text="Send correction requests, warnings, seller broadcasts, approval notices, and support messages from Admin Daddy."
                  onAction={protectedStub}
                />
              )}

              {activeTab === "moderation" && (
                <FutureModule
                  title="Moderation Queue"
                  text="Bad photos, bad titles, missing hours, suspicious machines, duplicate listings, incomplete profiles, and provisional model approvals."
                  onAction={protectedStub}
                />
              )}

              {activeTab === "analytics" && (
                <FutureModule
                  title="Seller Intelligence"
                  text="Views, saves, inquiries, badge clicks, external-link clicks, WhatsApp launches, PostHog events, and seller performance reporting."
                  onAction={protectedStub}
                />
              )}

              {activeTab === "logs" && (
                <AdminCard label="Audit Trail" title="Admin Daddy Log" wide>
                  {adminLog.length === 0 ? (
                    <p>No admin actions logged this session yet.</p>
                  ) : (
                    adminLog.map(item => (
                      <div className={`log-line ${item.type}`} key={item.id}>
                        <strong>{item.message}</strong>
                        <small>{item.createdAt}</small>
                      </div>
                    ))
                  )}
                </AdminCard>
              )}
            </section>
          </section>
        </section>
      </main>

      <Footer />

      <style jsx>{`
        :global(html),
        :global(body) {
          margin: 0;
          background: #080808;
          color: #f2f2f2;
          font-family: Arial, sans-serif;
        }

        * {
          box-sizing: border-box;
        }

        main {
          min-height: 100vh;
          background:
            radial-gradient(circle at top, rgba(255,196,0,.055), transparent 32%),
            radial-gradient(circle at 20% 8%, rgba(255,255,255,.025), transparent 24%),
            #080808;
        }

        button,
        input,
        select {
          font-family: inherit;
        }

        .admin-wrap {
          max-width: 1640px;
          margin: 0 auto;
          padding: 14px 2% 48px;
        }

        .admin-hero,
        .admin-shell,
        .admin-card {
          background:
            linear-gradient(180deg, rgba(255,255,255,.035), rgba(255,255,255,0)),
            #141414;

          border: 1px solid rgba(255,255,255,.07);
          border-radius: 16px;

          box-shadow:
            0 1px 0 rgba(255,255,255,.045) inset,
            0 20px 46px rgba(0,0,0,.30);
        }

        .admin-hero {
          min-height: 118px;
          margin-bottom: 12px;
          padding: 18px 20px;

          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 18px;
        }

        .admin-hero span,
        .admin-card-label {
          color: ${BRAND_YELLOW};
          font-size: 8px;
          font-weight: 950;
          letter-spacing: .8px;
          text-transform: uppercase;
        }

        .admin-hero h1 {
          margin: 3px 0 4px;

          color: #f2f2f2;

          font-size: 40px;
          font-weight: 950;
          letter-spacing: -1.5px;
          text-transform: uppercase;
        }

        .admin-hero p,
        .admin-card p,
        .admin-card li {
          margin: 0;
          color: rgba(255,255,255,.46);
          font-size: 12px;
          line-height: 1.45;
        }

        .hero-stats {
          display: grid;
          grid-template-columns: repeat(4, 112px);
          gap: 8px;
        }

        .hero-stats div,
        .metric-strip div {
          padding: 12px;
          border-radius: 14px;

          background:
            linear-gradient(180deg, rgba(255,255,255,.018), rgba(255,255,255,0)),
            #0d0d0d;

          border: 1px solid rgba(255,255,255,.06);
          text-align: center;
        }

        .hero-stats strong,
        .metric-strip strong {
          display: block;
          color: ${BRAND_YELLOW};
          font-size: 25px;
          font-weight: 950;
        }

        .hero-stats span,
        .metric-strip span {
          color: rgba(255,255,255,.48);
          font-size: 7.5px;
          font-weight: 950;
          letter-spacing: .55px;
          text-transform: uppercase;
        }

        .admin-shell {
          display: grid;
          grid-template-columns: 220px 1fr;
          gap: 12px;
          padding: 12px;
        }

        .admin-nav {
          display: grid;
          align-content: start;
          gap: 7px;
        }

        .admin-nav button {
          height: 38px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,.07);

          background:
            linear-gradient(180deg, rgba(255,255,255,.018), rgba(255,255,255,0)),
            #0f0f0f;

          color: rgba(255,255,255,.58);

          font-size: 8.5px;
          font-weight: 950;
          letter-spacing: .62px;
          text-transform: uppercase;

          cursor: pointer;
        }

        .admin-nav button.active {
          background: ${BRAND_YELLOW};
          border-color: ${BRAND_YELLOW};
          color: #050505;
        }

        .admin-content {
          min-height: 680px;
        }

        .grid {
          display: grid;
          gap: 10px;
        }

        .grid.four {
          grid-template-columns: repeat(4, 1fr);
        }

        .grid.two {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .grid.taxonomy {
          grid-template-columns: 1.2fr .8fr;
        }

        .admin-card {
          padding: 15px;
        }

        .admin-card.wide {
          grid-column: 1 / -1;
        }

        .admin-card h2 {
          margin: 6px 0 9px;

          color: #f2f2f2;

          font-size: 18px;
          font-weight: 950;
          letter-spacing: -.35px;
          text-transform: uppercase;
        }

        .metric-value {
          display: block;
          color: #f2f2f2;
          font-size: 36px;
          font-weight: 950;
          letter-spacing: -1px;
        }

        select,
        input {
          width: 100%;
          height: 38px;

          margin-top: 8px;
          padding: 0 11px;

          border-radius: 10px;
          border: 1px solid rgba(255,255,255,.08);

          background:
            linear-gradient(180deg, rgba(255,255,255,.012), rgba(255,255,255,0)),
            #0b0b0b;

          color: #f2f2f2;

          font-size: 11px;
          font-weight: 850;
          outline: none;
        }

        .admin-card button,
        .action-row button {
          min-height: 30px;

          margin-top: 8px;
          padding: 0 12px;

          border-radius: 999px;
          border: 1px solid rgba(255,196,0,.34);

          background:
            linear-gradient(180deg, rgba(255,196,0,.055), rgba(255,196,0,0)),
            #111;

          color: ${BRAND_YELLOW};

          font-size: 8px;
          font-weight: 950;
          letter-spacing: .6px;
          text-transform: uppercase;

          cursor: pointer;
        }

        .row-table {
          display: grid;
          gap: 6px;

          max-height: 520px;
          overflow-y: auto;

          margin-top: 10px;
        }

        .row-table.small {
          max-height: 390px;
        }

        .taxonomy-row,
        .audit-row,
        .patch-row,
        .listing-row,
        .log-line,
        .mini-line {
          display: grid;
          align-items: center;
          gap: 8px;

          padding: 9px;

          border-radius: 10px;
          border: 1px solid rgba(255,255,255,.055);

          background:
            linear-gradient(180deg, rgba(255,255,255,.014), rgba(255,255,255,0)),
            #0d0d0d;

          font-size: 10px;
        }

        .taxonomy-row {
          grid-template-columns: 180px 1fr;
        }

        .audit-row {
          grid-template-columns: 120px 1fr 160px 110px;
        }

        .patch-row {
          grid-template-columns: 1fr 1fr 1fr 1.4fr;
        }

        .listing-row {
          grid-template-columns: 2fr 1fr 1fr 1fr 80px;
        }

        .taxonomy-row strong,
        .audit-row strong,
        .patch-row strong,
        .listing-row strong,
        .log-line strong,
        .mini-line {
          color: #f2f2f2;
          font-weight: 950;
        }

        .taxonomy-row span,
        .audit-row span,
        .audit-row small,
        .patch-row span,
        .patch-row small,
        .listing-row span,
        .listing-row small,
        .log-line small {
          color: rgba(255,255,255,.50);
          font-weight: 850;
          text-transform: uppercase;
        }

        .resolver-result {
          margin-top: 12px;
          padding: 12px;

          border-radius: 13px;
          border: 1px solid rgba(255,196,0,.22);

          background:
            linear-gradient(180deg, rgba(255,196,0,.055), rgba(255,196,0,0)),
            #0d0d0d;
        }

        .resolver-result strong {
          display: block;
          color: ${BRAND_YELLOW};
          text-transform: uppercase;
          font-size: 14px;
          font-weight: 950;
        }

        .resolver-result span {
          display: block;
          color: rgba(255,255,255,.58);
          font-size: 10px;
          font-weight: 950;
          margin-top: 2px;
        }

        .resolver-result small {
          display: block;
          margin-top: 7px;
          color: rgba(255,255,255,.52);
          font-size: 10px;
          font-weight: 850;
          text-transform: uppercase;
        }

        .chip-box {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;

          max-height: 430px;
          overflow-y: auto;

          margin-top: 10px;
          padding: 9px;

          border-radius: 12px;
          border: 1px solid rgba(255,255,255,.055);
          background: #0b0b0b;
        }

        .chip-box button {
          margin: 0;
          min-height: 24px;
          border-color: rgba(255,255,255,.07);
          color: rgba(255,255,255,.62);
          text-transform: lowercase;
        }

        .metric-strip {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-top: 10px;
        }

        .action-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin: 12px 0;
        }

        ul {
          margin: 8px 0 0;
          padding-left: 18px;
        }

        @media (max-width: 1000px) {
          .admin-hero,
          .admin-shell,
          .grid.four,
          .grid.two,
          .grid.taxonomy {
            grid-template-columns: 1fr;
          }

          .admin-hero {
            display: grid;
          }

          .hero-stats,
          .metric-strip {
            grid-template-columns: repeat(2, 1fr);
          }

          .taxonomy-row,
          .audit-row,
          .patch-row,
          .listing-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}

/* -------------------- */
/* SHARED COMPONENTS */
/* -------------------- */

function AdminCard({ label, title, wide, children }) {
  return (
    <section className={wide ? "admin-card wide" : "admin-card"}>
      <span className="admin-card-label">{label}</span>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function MetricCard({ label, value }) {
  return (
    <section className="admin-card">
      <span className="admin-card-label">{label}</span>
      <strong className="metric-value">{value}</strong>
    </section>
  );
}

function FutureModule({ title, text, onAction }) {
  return (
    <section className="grid two">
      <AdminCard label="Ready To Wire" title={title} wide>
        <p>{text}</p>
        <button type="button" onClick={() => onAction(title)}>
          Stage Protected Action
        </button>
      </AdminCard>
    </section>
  );
}

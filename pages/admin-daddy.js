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

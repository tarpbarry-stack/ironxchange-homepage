import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import categoryDnaKeywords from "../lib/categoryDnaKeywords";

const BRAND_YELLOW = "#FFC400";

const tabs = [
  "command",
  "taxonomy",
  "listings",
  "accounts",
  "messages",
  "moderation",
  "analytics",
  "logs"
];

const MASTER_MAKES = [
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
  "BLAW-KNOX",
  "GROVE",
  "TEREX",
  "GENIE",
  "JLG",
  "SKYJACK",
  "MANITOU",
  "MERLO",
  "GRADALL"
];

function clean(value) {
  return value ? String(value).trim() : "";
}

function getListingId(listing = {}) {
  return listing.id?.uuid || listing.id || listing.uuid || listing.listingId || "";
}

function getPublicData(listing = {}) {
  return listing.publicData || listing.attributes?.publicData || {};
}

function getListingMake(listing = {}) {
  const pd = getPublicData(listing);
  return clean(listing.make || pd.make || listing.metadata?.make || "").toUpperCase();
}

function getListingModel(listing = {}) {
  const pd = getPublicData(listing);
  return clean(listing.model || pd.model || listing.metadata?.model || "").toUpperCase();
}

function getListingCategory(listing = {}) {
  const pd = getPublicData(listing);
  return clean(
    pd.category ||
      listing.category ||
      listing.categoryLevel1 ||
      pd.categoryLevel1 ||
      ""
  ).toUpperCase();
}

function getListingStatus(listing = {}) {
  const pd = getPublicData(listing);
  return (
    listing.listingStatus ||
    pd.listingStatus ||
    listing.metadata?.listingStatus ||
    "live"
  );
}

function normalizeCategoryKey(value = "") {
  const raw = clean(value);
  if (categoryDnaKeywords[raw]) return raw;
  if (categoryDnaKeywords[raw.toUpperCase()]) return raw.toUpperCase();
  return raw.toUpperCase();
}

function auditTaxonomy() {
  const categoryKeys = Object.keys(categoryDnaKeywords || {});
  const badMakeFlags = [];
  const categoryStats = [];

  categoryKeys.forEach(category => {
    const value = categoryDnaKeywords[category];

    let keywordCount = 0;

    if (Array.isArray(value)) {
      keywordCount = value.length;
    } else if (value && typeof value === "object") {
      keywordCount = JSON.stringify(value).length;
    }

    const text = JSON.stringify(value || {}).toUpperCase();

    if (text.includes('"CAT"') || text.includes(":\"CAT\"") || text.includes(" CAT ")) {
      badMakeFlags.push({
        category,
        problem: "CAT found",
        fix: "Replace CAT with CATERPILLAR"
      });
    }

    categoryStats.push({
      category,
      keywordCount
    });
  });

  return {
    categoryCount: categoryKeys.length,
    badMakeFlags,
    categoryStats
  };
}

export default function AdminDaddyPage() {
  const [activeTab, setActiveTab] = useState("command");
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminLog, setAdminLog] = useState([]);

  const [taxonomySearch, setTaxonomySearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    fetch("/api/listings")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setListings(data);
      })
      .catch(err => {
        console.error("Admin Daddy listing load failed:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const taxonomyAudit = useMemo(() => auditTaxonomy(), []);

  const categoryKeys = useMemo(() => {
    return Object.keys(categoryDnaKeywords || {}).sort();
  }, []);

  const activeCategory = selectedCategory || categoryKeys[0] || "";

  const activeCategoryKeywords = useMemo(() => {
    const raw = categoryDnaKeywords[activeCategory] || [];

    if (Array.isArray(raw)) return raw;

    if (raw && typeof raw === "object") {
      return Object.keys(raw);
    }

    return [];
  }, [activeCategory]);

  const filteredCategoryKeywords = useMemo(() => {
    const search = taxonomySearch.trim().toLowerCase();

    if (!search) return activeCategoryKeywords.slice(0, 400);

    return activeCategoryKeywords
      .filter(item => String(item).toLowerCase().includes(search))
      .slice(0, 400);
  }, [activeCategoryKeywords, taxonomySearch]);

  const listingAudit = useMemo(() => {
    const badMakes = [];
    const missingModels = [];
    const missingCategories = [];

    listings.forEach(listing => {
      const make = getListingMake(listing);
      const model = getListingModel(listing);
      const category = getListingCategory(listing);
      const id = getListingId(listing);

      if (!category) {
        missingCategories.push({ id, title: listing.title || "Untitled" });
      }

      if (make === "CAT") {
        badMakes.push({
          id,
          title: listing.title || "Untitled",
          current: "CAT",
          fix: "CATERPILLAR"
        });
      }

      if (!model) {
        missingModels.push({
          id,
          title: listing.title || "Untitled",
          category,
          make
        });
      }
    });

    return {
      badMakes,
      missingModels,
      missingCategories
    };
  }, [listings]);

  function addLog(message, type = "info") {
    setAdminLog(current => [
      {
        id: `${Date.now()}-${Math.random()}`,
        message,
        type,
        createdAt: new Date().toLocaleString()
      },
      ...current
    ].slice(0, 50));
  }

  function dangerousStub(action) {
    const confirmText = window.prompt(
      `ADMIN DADDY protected action:\n\n${action}\n\nType ADMIN DADDY to confirm.`
    );

    if (confirmText !== "ADMIN DADDY") {
      addLog(`Cancelled protected action: ${action}`, "warn");
      return;
    }

    addLog(`Protected action staged, not wired yet: ${action}`, "danger");
    alert("Staged only. Backend wire-up comes next.");
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
          <section className="hero">
            <div>
              <span>IronXchange Operator OS</span>
              <h1>Admin Daddy</h1>
              <p>
                Control taxonomy, listings, accounts, moderation, messages, and launch operations from one command room.
              </p>
            </div>

            <div className="hero-stats">
              <div>
                <strong>{listings.length}</strong>
                <span>Listings</span>
              </div>
              <div>
                <strong>{taxonomyAudit.categoryCount}</strong>
                <span>Taxonomy Groups</span>
              </div>
              <div>
                <strong>{taxonomyAudit.badMakeFlags.length + listingAudit.badMakes.length}</strong>
                <span>Make Alerts</span>
              </div>
            </div>
          </section>

          <section className="admin-shell">
            <aside className="side-nav">
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

            <section className="admin-panel">
              {activeTab === "command" && (
                <div className="grid">
                  <div className="card wide">
                    <span>Command Center</span>
                    <h2>Launch Control</h2>
                    <p>
                      V1 is reading live listings and taxonomy. Destructive actions are protected and staged.
                    </p>
                  </div>

                  <div className="card">
                    <span>Taxonomy Alerts</span>
                    <strong>{taxonomyAudit.badMakeFlags.length}</strong>
                    <p>Hardwired taxonomy values that need inspection.</p>
                  </div>

                  <div className="card">
                    <span>Listing Make Alerts</span>
                    <strong>{listingAudit.badMakes.length}</strong>
                    <p>Listings currently showing bad make values like CAT.</p>
                  </div>

                  <div className="card">
                    <span>Missing Models</span>
                    <strong>{listingAudit.missingModels.length}</strong>
                    <p>Listings with missing model data.</p>
                  </div>

                  <div className="card danger">
                    <span>Protected Actions</span>
                    <h2>Ready To Wire</h2>
                    <button onClick={() => dangerousStub("Freeze all suspicious listings")}>
                      Stage Freeze Sweep
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "taxonomy" && (
                <div className="taxonomy-layout">
                  <div className="card">
                    <span>Taxonomy Manager</span>
                    <h2>Category Library</h2>

                    <select
                      value={activeCategory}
                      onChange={e => setSelectedCategory(e.target.value)}
                    >
                      {categoryKeys.map(category => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>

                    <input
                      value={taxonomySearch}
                      onChange={e => setTaxonomySearch(e.target.value)}
                      placeholder="Search this taxonomy group..."
                    />

                    <div className="chip-scroll">
                      {filteredCategoryKeywords.map(item => (
                        <button key={String(item)} type="button">
                          {String(item).toLowerCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="card">
                    <span>Bad Value Detector</span>
                    <h2>Hardwired Make Problems</h2>

                    {taxonomyAudit.badMakeFlags.length === 0 ? (
                      <p>No CAT-style hardwired make alerts found in loaded taxonomy object.</p>
                    ) : (
                      taxonomyAudit.badMakeFlags.map((flag, index) => (
                        <div className="issue" key={`${flag.category}-${index}`}>
                          <strong>{flag.category}</strong>
                          <p>{flag.problem}</p>
                          <small>{flag.fix}</small>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="card wide">
                    <span>Next Wire</span>
                    <h2>Add Make / Add Model / Export Patch</h2>
                    <p>
                      Next step is wiring controlled add-model forms here so Motor Grader missing models can be added from Admin Daddy instead of editing raw files by hand.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === "listings" && (
                <div className="card wide">
                  <span>Listings Control</span>
                  <h2>{loading ? "Loading..." : `${listings.length} Listings Loaded`}</h2>

                  <div className="table">
                    {listings.slice(0, 80).map(listing => (
                      <div className="row" key={getListingId(listing)}>
                        <strong>{listing.title || "Untitled"}</strong>
                        <span>{getListingCategory(listing) || "NO CATEGORY"}</span>
                        <span>{getListingMake(listing) || "NO MAKE"}</span>
                        <span>{getListingModel(listing) || "NO MODEL"}</span>
                        <small>{getListingStatus(listing)}</small>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "accounts" && (
                <ModuleStub
                  title="Account Control"
                  text="Freeze accounts, unfreeze accounts, inspect seller inventory, mark trusted sellers, and disable bad actors."
                  onStage={dangerousStub}
                />
              )}

              {activeTab === "messages" && (
                <ModuleStub
                  title="Admin Daddy Messages"
                  text="Send seller warnings, correction requests, broadcast updates, and buyer/seller support messages as Admin Daddy."
                  onStage={dangerousStub}
                />
              )}

              {activeTab === "moderation" && (
                <ModuleStub
                  title="Moderation Queue"
                  text="Bad photos, bad titles, missing hours, suspicious listings, duplicate listings, and incomplete seller profiles."
                  onStage={dangerousStub}
                />
              )}

              {activeTab === "analytics" && (
                <ModuleStub
                  title="Seller Intelligence"
                  text="Views, saves, inquiries, badge clicks, external-link clicks, WhatsApp launches, and PostHog-backed seller reporting."
                  onStage={dangerousStub}
                />
              )}

              {activeTab === "logs" && (
                <div className="card wide">
                  <span>Admin Log</span>
                  <h2>Recent Admin Daddy Actions</h2>

                  {adminLog.length === 0 ? (
                    <p>No admin actions logged this session yet.</p>
                  ) : (
                    adminLog.map(item => (
                      <div className={`log ${item.type}`} key={item.id}>
                        <strong>{item.message}</strong>
                        <small>{item.createdAt}</small>
                      </div>
                    ))
                  )}
                </div>
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
            radial-gradient(circle at top, rgba(255, 196, 0, 0.055), transparent 32%),
            #080808;
        }

        .admin-wrap {
          max-width: 1600px;
          margin: 0 auto;
          padding: 14px 2% 48px;
        }

        .hero,
        .admin-shell,
        .card {
          background:
            linear-gradient(180deg, rgba(255,255,255,.035), rgba(255,255,255,0)),
            #141414;
          border: 1px solid rgba(255,255,255,.07);
          border-radius: 16px;
          box-shadow:
            0 1px 0 rgba(255,255,255,.045) inset,
            0 20px 46px rgba(0,0,0,.30);
        }

        .hero {
          min-height: 112px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          padding: 18px 20px;
          margin-bottom: 12px;
        }

        .hero span,
        .card span {
          color: ${BRAND_YELLOW};
          font-size: 8px;
          font-weight: 950;
          letter-spacing: .8px;
          text-transform: uppercase;
        }

        .hero h1 {
          margin: 4px 0 4px;
          font-size: 38px;
          font-weight: 950;
          letter-spacing: -1.4px;
          text-transform: uppercase;
        }

        .hero p,
        .card p {
          margin: 0;
          color: rgba(255,255,255,.46);
          font-size: 12px;
          line-height: 1.45;
        }

        .hero-stats {
          display: grid;
          grid-template-columns: repeat(3, 120px);
          gap: 8px;
        }

        .hero-stats div {
          padding: 12px;
          border-radius: 14px;
          background: #0d0d0d;
          border: 1px solid rgba(255,255,255,.06);
          text-align: center;
        }

        .hero-stats strong {
          display: block;
          font-size: 26px;
          color: ${BRAND_YELLOW};
          font-weight: 950;
        }

        .hero-stats span {
          color: rgba(255,255,255,.50);
          font-size: 8px;
        }

        .admin-shell {
          display: grid;
          grid-template-columns: 210px 1fr;
          gap: 12px;
          padding: 12px;
        }

        .side-nav {
          display: grid;
          align-content: start;
          gap: 7px;
        }

        .side-nav button {
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

        .side-nav button.active {
          background: ${BRAND_YELLOW};
          color: #050505;
          border-color: ${BRAND_YELLOW};
        }

        .admin-panel {
          min-height: 640px;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        .taxonomy-layout {
          display: grid;
          grid-template-columns: 1.25fr .75fr;
          gap: 10px;
        }

        .card {
          padding: 15px;
        }

        .card.wide {
          grid-column: 1 / -1;
        }

        .card.danger {
          border-color: rgba(229,62,62,.32);
        }

        .card h2 {
          margin: 6px 0 8px;
          font-size: 18px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: -.35px;
        }

        .card strong {
          display: block;
          font-size: 34px;
          color: #f2f2f2;
          font-weight: 950;
        }

        select,
        input {
          width: 100%;
          height: 38px;
          margin-top: 9px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,.08);
          background: #0b0b0b;
          color: #f2f2f2;
          padding: 0 11px;
          outline: none;
          font-weight: 800;
        }

        .chip-scroll {
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

        .chip-scroll button {
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,.07);
          background: #151515;
          color: rgba(255,255,255,.62);
          padding: 6px 8px;
          font-size: 9px;
          font-weight: 850;
          text-transform: lowercase;
        }

        .issue,
        .log {
          margin-top: 8px;
          padding: 10px;
          border-radius: 11px;
          background: #0d0d0d;
          border: 1px solid rgba(255,255,255,.07);
        }

        .issue small,
        .log small {
          display: block;
          margin-top: 4px;
          color: rgba(255,255,255,.40);
          font-size: 9px;
        }

        .table {
          display: grid;
          gap: 6px;
          max-height: 520px;
          overflow-y: auto;
          margin-top: 10px;
        }

        .row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 80px;
          gap: 8px;
          align-items: center;
          padding: 9px;
          border-radius: 10px;
          background: #0d0d0d;
          border: 1px solid rgba(255,255,255,.055);
          font-size: 10px;
        }

        .row strong {
          font-size: 11px;
          color: #f2f2f2;
        }

        .row span,
        .row small {
          color: rgba(255,255,255,.48);
          font-weight: 850;
          text-transform: uppercase;
        }

        button {
          font-family: inherit;
        }

        .card button {
          height: 34px;
          margin-top: 10px;
          border-radius: 999px;
          border: 1px solid rgba(255,196,0,.35);
          background: #111;
          color: ${BRAND_YELLOW};
          padding: 0 14px;
          font-size: 8.5px;
          font-weight: 950;
          letter-spacing: .6px;
          text-transform: uppercase;
          cursor: pointer;
        }

        @media (max-width: 900px) {
          .hero,
          .admin-shell,
          .taxonomy-layout,
          .grid {
            grid-template-columns: 1fr;
          }

          .hero {
            display: grid;
          }

          .hero-stats {
            grid-template-columns: repeat(3, 1fr);
          }

          .row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}

function ModuleStub({ title, text, onStage }) {
  return (
    <div className="card wide">
      <span>Ready To Wire</span>
      <h2>{title}</h2>
      <p>{text}</p>

      <button type="button" onClick={() => onStage(title)}>
        Stage Protected Action
      </button>
    </div>
  );
}

import Head from "next/head";
import { useEffect, useMemo, useState } from "react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

/* -------------------- */
/* TAXONOMY IMPORTS */
/* -------------------- */

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

/* -------------------- */
/* DNA / BADGE IMPORT */
/* -------------------- */

import categoryDnaKeywords from "../lib/categoryDnaKeywords";

/* -------------------- */
/* CONSTANTS */
/* -------------------- */

const BRAND_YELLOW = "#FFC400";

const TAXONOMY_REGISTRY = {
  "AERIAL LIFTS": {
    key: "aerialTaxonomy",
    file: "lib/aerialTaxonomy.js",
    data: aerialTaxonomy
  },
  "AGGREGATE": {
    key: "aggregateTaxonomy",
    file: "lib/aggregateTaxonomy.js",
    data: aggregateTaxonomy
  },
  "AGRICULTURE HARVESTERS": {
    key: "agricultureHarvestersTaxonomy",
    file: "lib/agricultureHarvestersTaxonomy.js",
    data: agricultureHarvestersTaxonomy
  },
  "AGRICULTURE TRACTORS": {
    key: "agricultureTractorsTaxonomy",
    file: "lib/agricultureTractorsTaxonomy.js",
    data: agricultureTractorsTaxonomy
  },
  "ASPHALT EQUIPMENT": {
    key: "asphaltEquipmentTaxonomy",
    file: "lib/asphaltEquipmentTaxonomy.js",
    data: asphaltEquipmentTaxonomy
  },
  "ATTACHMENTS / PARTS": {
    key: "attachmentsPartsTaxonomy",
    file: "lib/attachmentsPartsTaxonomy.js",
    data: attachmentsPartsTaxonomy
  },
  "BACKHOE LOADERS": {
    key: "backhoeLoadersTaxonomy",
    file: "lib/backhoeLoadersTaxonomy.js",
    data: backhoeLoadersTaxonomy
  },
  "COMPACTION ROLLERS": {
    key: "compactionRollersTaxonomy",
    file: "lib/compactionRollersTaxonomy.js",
    data: compactionRollersTaxonomy
  },
  "CRANES": {
    key: "cranesTaxonomy",
    file: "lib/cranesTaxonomy.js",
    data: cranesTaxonomy
  },
  "CRAWLER CARRIERS": {
    key: "crawlerCarriersTaxonomy",
    file: "lib/crawlerCarriersTaxonomy.js",
    data: crawlerCarriersTaxonomy
  },
  "DOZERS": {
    key: "dozersTaxonomy",
    file: "lib/dozersTaxonomy.js",
    data: dozersTaxonomy
  },
  "DRILLS AND PILING": {
    key: "drillsAndPilingTaxonomy",
    file: "lib/drillsAndPilingTaxonomy.js",
    data: drillsAndPilingTaxonomy
  },
  "DUMP TRUCKS": {
    key: "dumpTrucksTaxonomy",
    file: "lib/dumpTrucksTaxonomy.js",
    data: dumpTrucksTaxonomy
  },
  "EXCAVATORS": {
    key: "excavatorsTaxonomy",
    file: "lib/excavatorsTaxonomy.js",
    data: excavatorsTaxonomy
  },
  "FORKLIFTS": {
    key: "forkliftsTaxonomy",
    file: "lib/forkliftsTaxonomy.js",
    data: forkliftsTaxonomy
  },
  "MOTOR GRADERS": {
    key: "motorGradersTaxonomy",
    file: "lib/motorGradersTaxonomy.js",
    data: motorGradersTaxonomy
  },
  "SCRAPERS": {
    key: "scraperTaxonomy",
    file: "lib/scraperTaxonomy.js",
    data: scraperTaxonomy
  },
  "SKID STEER / CTL": {
    key: "skidSteerCtlTaxonomy",
    file: "lib/skidSteerCtlTaxonomy.js",
    data: skidSteerCtlTaxonomy
  },
  "SUPPORT EQUIPMENT": {
    key: "supportEquipmentTaxonomy",
    file: "lib/supportEquipmentTaxonomy.js",
    data: supportEquipmentTaxonomy
  },
  "TELEHANDLERS": {
    key: "telehandlersTaxonomy",
    file: "lib/telehandlersTaxonomy.js",
    data: telehandlersTaxonomy
  },
  "TRAILERS": {
    key: "trailersTaxonomy",
    file: "lib/trailersTaxonomy.js",
    data: trailersTaxonomy
  },
  "TRENCHERS": {
    key: "trenchersTaxonomy",
    file: "lib/trenchersTaxonomy.js",
    data: trenchersTaxonomy
  },
  "TRUCKS": {
    key: "trucksTaxonomy",
    file: "lib/trucksTaxonomy.js",
    data: trucksTaxonomy
  },
  "UTILITY CARTS / UTV": {
    key: "utilityCartsTaxonomy",
    file: "lib/utilityCartsTaxonomy.js",
    data: utilityCartsTaxonomy
  },
  "WHEEL LOADERS": {
    key: "wheelLoadersTaxonomy",
    file: "lib/wheelLoadersTaxonomy.js",
    data: wheelLoadersTaxonomy
  }
};

const ADMIN_TABS = [
  "command",
  "taxonomy",
  "model resolver",
  "dna badges",
  "sharetribe sync",
  "listings",
  "accounts",
  "messages",
  "moderation",
  "analytics",
  "logs"
];

const KNOWN_BAD_MAKES = {
  CAT: "CATERPILLAR"
};

/* -------------------- */
/* HELPER FUNCTIONS */
/* -------------------- */

function clean(value) {
  return value ? String(value).trim() : "";
}

function upper(value) {
  return clean(value).toUpperCase();
}

function normalizeModel(value) {
  return upper(value)
    .replace(/\s+/g, "")
    .replace(/-/g, "")
    .replace(/_/g, "");
}

function getListingId(listing = {}) {
  return listing.id?.uuid || listing.id || listing.uuid || listing.listingId || "";
}

function getPublicData(listing = {}) {
  return listing.publicData || listing.attributes?.publicData || {};
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

function getListingMake(listing = {}) {
  const pd = getPublicData(listing);

  return upper(
    listing.make ||
      pd.make ||
      listing.metadata?.make ||
      listing.attributes?.metadata?.make ||
      ""
  );
}

function getListingModel(listing = {}) {
  const pd = getPublicData(listing);

  return upper(
    listing.model ||
      pd.model ||
      listing.metadata?.model ||
      listing.attributes?.metadata?.model ||
      ""
  );
}

function getListingStatus(listing = {}) {
  const pd = getPublicData(listing);

  return (
    listing.listingStatus ||
    pd.listingStatus ||
    listing.metadata?.listingStatus ||
    listing.attributes?.metadata?.listingStatus ||
    "live"
  );
}

/* -------------------- */
/* TAXONOMY SHAPE READERS */
/* -------------------- */

function getRowMake(row = {}) {
  return clean(
    row.make ||
      row.manufacturer ||
      row.brand ||
      row.label ||
      row.name ||
      row.value ||
      ""
  );
}

function getRowModel(row = {}) {
  return clean(
    row.model ||
      row.modelName ||
      row.series ||
      row.value ||
      row.label ||
      row.name ||
      ""
  );
}

function getTaxonomyRows(taxonomy) {
  if (!taxonomy) return [];

  if (Array.isArray(taxonomy)) {
    return taxonomy.flatMap((item, index) => {
      const make = getRowMake(item);

      if (Array.isArray(item?.models)) {
        return item.models.map((model, modelIndex) => ({
          id: `${index}-${modelIndex}`,
          sourceIndex: index,
          make,
          model: clean(model),
          raw: item
        }));
      }

      if (Array.isArray(item?.children)) {
        return item.children.map((model, modelIndex) => ({
          id: `${index}-${modelIndex}`,
          sourceIndex: index,
          make,
          model: clean(model),
          raw: item
        }));
      }

      return {
        id: `${index}`,
        sourceIndex: index,
        make,
        model: getRowModel(item),
        raw: item
      };
    });
  }

  if (typeof taxonomy === "object") {
    return Object.entries(taxonomy).flatMap(([make, models], makeIndex) => {
      if (Array.isArray(models)) {
        return models.map((model, modelIndex) => ({
          id: `${makeIndex}-${modelIndex}`,
          sourceIndex: makeIndex,
          make,
          model: clean(model),
          raw: { make, model }
        }));
      }

      if (models && typeof models === "object") {
        const nestedModels =
          models.models ||
          models.children ||
          models.options ||
          [];

        if (Array.isArray(nestedModels)) {
          return nestedModels.map((model, modelIndex) => ({
            id: `${makeIndex}-${modelIndex}`,
            sourceIndex: makeIndex,
            make,
            model: clean(model),
            raw: models
          }));
        }

        return Object.keys(models).map((model, modelIndex) => ({
          id: `${makeIndex}-${modelIndex}`,
          sourceIndex: makeIndex,
          make,
          model,
          raw: models[model]
        }));
      }

      return {
        id: `${makeIndex}`,
        sourceIndex: makeIndex,
        make,
        model: clean(models),
        raw: { make, model: models }
      };
    });
  }

  return [];
}

function getUniqueMakesFromRows(rows = []) {
  return Array.from(
    new Set(
      rows
        .map(row => upper(row.make))
        .filter(Boolean)
    )
  ).sort();
}

function getModelsForMake(rows = [], make = "") {
  const target = upper(make);

  return rows
    .filter(row => upper(row.make) === target)
    .map(row => clean(row.model))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function findBadMakeRows(rows = []) {
  return rows
    .filter(row => KNOWN_BAD_MAKES[upper(row.make)])
    .map(row => ({
      ...row,
      currentMake: upper(row.make),
      replacementMake: KNOWN_BAD_MAKES[upper(row.make)]
    }));
}

function findModelMatches(rows = [], rawModel = "") {
  const normalizedInput = normalizeModel(rawModel);

  if (!normalizedInput) {
    return {
      exact: [],
      normalized: [],
      loose: []
    };
  }

  const exact = [];
  const normalized = [];
  const loose = [];

  rows.forEach(row => {
    const model = clean(row.model);
    const normalizedModel = normalizeModel(model);

    if (!model) return;

    if (upper(model) === upper(rawModel)) {
      exact.push(row);
      return;
    }

    if (normalizedModel === normalizedInput) {
      normalized.push(row);
      return;
    }

    if (
      normalizedModel.includes(normalizedInput) ||
      normalizedInput.includes(normalizedModel)
    ) {
      loose.push(row);
    }
  });

  return { exact, normalized, loose };
}

function buildPatchId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
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

  const [adminKey, setAdminKey] = useState("");
const [commitBusy, setCommitBusy] = useState(false);
const [deployBusy, setDeployBusy] = useState(false);

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

 async function stageAddModel() {
  const model = upper(newModelName);

  if (!selectedCategory || !activeMake || !model) {
    alert("Select category, make, and enter model.");
    return;
  }

  if (modelsForMake.map(normalizeModel).includes(normalizeModel(model))) {
    alert(`${model} already exists under ${activeMake}.`);
    return;
  }

  const typed = window.prompt(
    `Commit model to taxonomy?\n\n${selectedCategory}\n${activeMake}\n${model}\n\nType ADD MODEL to confirm.`
  );

  if (typed !== "ADD MODEL") {
    addLog("Add model cancelled", "warn");
    return;
  }

  setCommitBusy(true);

  try {
    const res = await fetch("/api/admin/taxonomy/add-model", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": adminKey
      },
      body: JSON.stringify({
        category: selectedCategory,
        make: activeMake,
        model
      })
    });

    const data = await res.json();

    if (!data.ok) {
      throw new Error(data.error || "Add model failed");
    }

    stagePatch({
      type: "COMMIT_MODEL",
      category: selectedCategory,
      make: activeMake,
      model,
      file: selectedRegistryItem?.file,
      target: "GITHUB_TAXONOMY",
      sharetribeImpact: "REQUIRES_AWS_TAXONOMY_DEPLOY"
    });

    addLog(`Model committed: ${selectedCategory} / ${activeMake} / ${model}`, "success");
    setNewModelName("");
  } catch (error) {
    addLog(`Model commit failed: ${error.message}`, "danger");
    alert(error.message);
  } finally {
    setCommitBusy(false);
  }
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

  <button
    type="button"
    onClick={stageAddModel}
    disabled={commitBusy}
  >
    {commitBusy ? "Committing..." : "Commit Model"}
  </button>

  <input
    value={adminKey}
    onChange={e => setAdminKey(e.target.value)}
    placeholder="Admin Daddy Key"
  />
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

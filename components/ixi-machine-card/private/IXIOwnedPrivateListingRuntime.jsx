import { useEffect, useMemo, useState } from "react";

import PrivateListingCard from "./PrivateListingCard";
import IXITransactObjectConsole from "../../ixi-aos/transact/IXITransactObjectConsole";
import { IXI_MACHINE_MUTATION_COMMANDS } from "../../ixi-object-system/IXIMachineMutationCommandBus";
import { updateMachineFacts } from "../../ixi-object-system/IXIMachineMutationEngine";
import { getListingId } from "../../../lib/listingFormatters";

const SKINS = [
  ["v12", "V12"], ["default", "DEFAULT"], ["steel", "STEEL"],
  ["blueprint", "BLUE"], ["industrial", "INDUSTRIAL"], ["ledger", "LEDGER"],
  ["foundry", "FOUNDRY"], ["stock", "STOCK CERTIFICATE"], ["bond", "BOND CERTIFICATE"],
  ["modern-money", "MODERN MONEY"], ["old-currency", "OLD CURRENCY"]
];

function clean(value) {
  return String(value ?? "").trim();
}

function publicDataOf(listing = {}) {
  return listing?.publicData || listing?.attributes?.publicData || {};
}

function factsOf(listing = {}) {
  const publicData = publicDataOf(listing);
  return {
    price: listing?.price ?? publicData?.price ?? "",
    hours: listing?.hours ?? publicData?.hours ?? "",
    location: listing?.location ?? publicData?.location ?? publicData?.city ?? "",
    description: listing?.description ?? publicData?.description ?? publicData?.details ?? "",
    keywords: Array.isArray(listing?.keywords)
      ? listing.keywords
      : Array.isArray(publicData?.keywords)
        ? publicData.keywords
        : []
  };
}

function transactObjectFromListing(listing = {}) {
  const publicData = publicDataOf(listing);
  const passportId = clean(
    listing?.passportId ||
    publicData?.passportId ||
    listing?.ixiMedia?.passportId ||
    publicData?.ixiMedia?.passportId
  );
  const objectId = clean(
    listing?.objectId ||
    publicData?.objectId ||
    listing?.mosObjectId ||
    publicData?.mosObjectId ||
    getListingId(listing)
  );
  const entityPassportId = clean(
    listing?.entityPassportId ||
    publicData?.entityPassportId ||
    listing?.entity?.passportId ||
    publicData?.entity?.passportId
  );

  return {
    ...listing,
    objectId,
    id: objectId,
    objectType: clean(listing?.objectType || publicData?.objectType) || "machine",
    displayName: clean(listing?.title || listing?.attributes?.title) || "EQUIPMENT",
    passportId,
    entityPassportId,
    fields: {
      ...(listing?.fields || {}),
      entityPassportId,
      location: clean(listing?.location || publicData?.location || publicData?.city),
      serialNumber: clean(listing?.serialNumber || publicData?.serialNumber),
      stockNumber: clean(listing?.stockNumber || publicData?.stockNumber),
      year: listing?.year ?? publicData?.year ?? "",
      make: listing?.make ?? publicData?.make ?? "",
      model: listing?.model ?? publicData?.model ?? "",
      primaryMeter: listing?.hours ?? publicData?.hours ?? ""
    },
    capabilities: {
      ...(listing?.capabilities || {}),
      canCreate: true,
      canTransact: true,
      editable: true,
      hasConsole: true
    }
  };
}

function Editor({ listing, onCancel, onSaved }) {
  const base = useMemo(() => factsOf(listing), [listing]);
  const [draft, setDraft] = useState(base);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => setDraft(base), [base]);

  function field(name, value) {
    setDraft(current => ({ ...current, [name]: value }));
  }

  async function save() {
    const listingId = clean(getListingId(listing));
    if (!listingId || saving) return;
    setSaving(true);
    setError("");
    try {
      const result = await updateMachineFacts({
        commandBus: IXI_MACHINE_MUTATION_COMMANDS,
        listingId,
        title: clean(listing?.title || listing?.attributes?.title),
        before: base,
        after: draft,
        context: "owned-private-card-editor"
      });
      const next = result?.listing && typeof result.listing === "object"
        ? result.listing
        : {
            ...listing,
            ...draft,
            publicData: {
              ...publicDataOf(listing),
              price: draft.price,
              hours: draft.hours,
              location: draft.location,
              description: draft.description,
              details: draft.description,
              keywords: draft.keywords
            }
          };
      onSaved(next, result);
    } catch (saveError) {
      setError(saveError?.message || "SAVE FAILED");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="owned-editor" onPointerDown={event => event.stopPropagation()}>
      <header>
        <div><small>EQUIPMENT</small><strong>EDIT OBJECT</strong></div>
        <nav>
          <button type="button" className="save" disabled={saving} onClick={save}>{saving ? "SAVING" : "SAVE"}</button>
          <button type="button" disabled={saving} onClick={onCancel}>CANCEL</button>
        </nav>
      </header>
      <main>
        <label><span>HOURS</span><input inputMode="numeric" value={draft.hours ?? ""} onChange={e => field("hours", e.target.value.replace(/[^0-9]/g, ""))} /></label>
        <label><span>PRICE</span><input inputMode="numeric" value={draft.price ?? ""} onChange={e => field("price", e.target.value)} /></label>
        <label><span>LOCATION</span><input value={draft.location ?? ""} onChange={e => field("location", e.target.value)} /></label>
        <label className="description"><span>DESCRIPTION</span><textarea value={draft.description ?? ""} onChange={e => field("description", e.target.value.slice(0, 200))} maxLength={200} /></label>
        <label><span>KEYWORDS</span><input value={(draft.keywords || []).join(", ")} onChange={e => field("keywords", e.target.value.split(",").map(v => v.trim()).filter(Boolean))} /></label>
        {error ? <div className="error">{error}</div> : null}
      </main>
      <style jsx>{`
        .owned-editor{position:absolute;inset:0;z-index:400;border-radius:13px;overflow:hidden;background:#0b0d0c;color:#eef1ef;font-family:Inter,Arial,sans-serif}
        header{height:48px;display:flex;align-items:center;justify-content:space-between;padding:0 10px;border-bottom:1px solid #303531;background:#151815}
        header small{display:block;color:#ffc400;font-size:6px;font-weight:950;letter-spacing:.08em}header strong{display:block;margin-top:3px;font-size:11px}
        nav{display:flex;gap:4px}button{height:23px;padding:0 9px;border:1px solid #ffffff16;border-radius:4px;background:#111411;color:#dce0dd;font-size:6px;font-weight:950;cursor:pointer}.save{color:#ffc400}button:disabled{opacity:.45}
        main{position:absolute;top:48px;left:0;right:0;bottom:0;padding:9px;overflow:auto}label{display:block;margin-bottom:7px;padding:7px;border:1px solid #2b302c;border-radius:5px;background:#101310}label span{display:block;margin-bottom:5px;color:#8d958f;font-size:6px;font-weight:900}
        input,textarea{width:100%;box-sizing:border-box;padding:0 7px;border:1px solid #333934;border-radius:4px;background:#090b0a;color:#edf0ee;font:850 9px Inter,Arial,sans-serif;outline:none}input{height:27px}textarea{height:78px;padding-top:7px;resize:none}.error{padding:8px;border:1px solid #6e2929;color:#ff7979;font-size:7px;font-weight:900}
      `}</style>
    </div>
  );
}

export default function IXIOwnedPrivateListingRuntime({ cardContext = "inventory", presentation = "seller", ...props }) {
  const [runtimeListing, setRuntimeListing] = useState(props.listing || {});
  const [editing, setEditing] = useState(false);
  const [transactOpen, setTransactOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [skinId, setSkinId] = useState("v12");
  const [menuNotice, setMenuNotice] = useState("");

  useEffect(() => setRuntimeListing(props.listing || {}), [props.listing]);

  const transactObject = useMemo(() => transactObjectFromListing(runtimeListing), [runtimeListing]);

  function handleAdd() {
    setMenuOpen(false);
    if (typeof props.onAddObject === "function") {
      props.onAddObject(runtimeListing);
      return;
    }
    setMenuNotice("ADD IS AVAILABLE WHEN THIS OBJECT HAS A CANONICAL CONTAINER/CHILD-CREATION COMMAND.");
    setMenuOpen(true);
  }

  function handleSaved(nextListing, result) {
    setRuntimeListing(nextListing);
    setEditing(false);
    props.onOwnedObjectSaved?.(nextListing, result);
  }

  if (transactOpen) {
    return (
      <div className="owned-private-runtime transact-runtime">
        <IXITransactObjectConsole
          object={transactObject}
          entity={{ passportId: transactObject.entityPassportId, displayName: transactObject.entityName || "" }}
          ixiState={props.ixiState || {}}
          onIxiStateChange={props.onIxiStateChange}
          onClose={() => setTransactOpen(false)}
          onSendFront={props.onSendFront}
          onSendBack={props.onSendBack}
          armedDestination={props.armedDestination}
          onSendToArmedDestination={props.onSendToArmedDestination}
        />
        <style jsx>{`.owned-private-runtime{position:relative;width:298px;min-width:298px;height:471px;overflow:visible}`}</style>
      </div>
    );
  }

  return (
    <div
      className="owned-private-runtime"
      data-owned-card-skin={skinId}
      onFocusCapture={event => {
        if (!editing && event.target?.matches?.("input,textarea")) event.target.blur();
      }}
    >
      <PrivateListingCard
        {...props}
        listing={runtimeListing}
        cardContext={cardContext}
        presentation={presentation}
        onAddObject={handleAdd}
        onEdit={() => setEditing(true)}
        onOpenTransact={() => setTransactOpen(true)}
        onOpenActions={() => setMenuOpen(value => !value)}
      />

      {editing ? <Editor listing={runtimeListing} onCancel={() => setEditing(false)} onSaved={handleSaved} /> : null}

      {menuOpen ? (
        <div className="owned-menu" onPointerDown={event => event.stopPropagation()}>
          <div className="menu-label">SKIN</div>
          {SKINS.map(([id, label]) => (
            <button type="button" key={id} className={id === skinId ? "active" : ""} onClick={() => { setSkinId(id); setMenuNotice(""); setMenuOpen(false); }}>
              {label}<span>{id === skinId ? "✓" : ""}</span>
            </button>
          ))}
          {menuNotice ? <div className="notice">{menuNotice}</div> : null}
        </div>
      ) : null}

      <style jsx global>{`
        .owned-private-runtime{position:relative;width:100%;height:100%;overflow:visible}
        .owned-private-runtime:not(:has(.owned-editor)) .private-listing-card .hours-input,
        .owned-private-runtime:not(:has(.owned-editor)) .private-listing-card .price-input,
        .owned-private-runtime:not(:has(.owned-editor)) .private-listing-card .location-input,
        .owned-private-runtime:not(:has(.owned-editor)) .private-listing-card .seller-bio-editor textarea{pointer-events:none!important;border-color:transparent!important;background:transparent!important;box-shadow:none!important;cursor:default!important}
        .owned-private-runtime:not(:has(.owned-editor)) .private-listing-card .seller-bio-count{display:none!important}
        .owned-menu{position:absolute;right:9px;bottom:31px;z-index:450;width:154px;max-height:340px;overflow:auto;padding:6px;border:1px solid rgba(255,255,255,.10);border-radius:6px;background:rgba(8,8,8,.985);box-shadow:0 14px 30px rgba(0,0,0,.46)}
        .owned-menu .menu-label{padding:3px 6px;color:rgba(255,255,255,.28);font:950 5px Arial}.owned-menu button{width:100%;height:25px;display:flex;align-items:center;justify-content:space-between;margin-bottom:3px;padding:0 7px;border:1px solid rgba(255,255,255,.06);border-radius:4px;background:rgba(255,255,255,.02);color:rgba(255,255,255,.62);font:950 6px Arial;text-align:left;cursor:pointer}.owned-menu button:hover,.owned-menu button.active{border-color:rgba(255,196,0,.28);color:#ffc400}.owned-menu .notice{margin-top:5px;padding:7px;border-top:1px solid rgba(255,255,255,.06);color:#9aa3a0;font:850 6px/1.35 Arial}
      `}</style>
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";

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

export default function IXIOwnedPrivateListingRuntime({ cardContext = "inventory", presentation = "seller", ...props }) {
  const [runtimeListing, setRuntimeListing] = useState(props.listing || {});
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState(() => factsOf(props.listing || {}));
  const [actionNotice, setActionNotice] = useState(null);
  const [transactOpen, setTransactOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [skinId, setSkinId] = useState("v12");
  const [menuNotice, setMenuNotice] = useState("");
  const noticeTimerRef = useRef(null);

  useEffect(() => {
    setRuntimeListing(props.listing || {});
    if (!editing && !saving) {
      setDraft(factsOf(props.listing || {}));
    }
  }, [props.listing, editing, saving]);

  useEffect(() => () => {
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
  }, []);

  const transactObject = useMemo(() => transactObjectFromListing(runtimeListing), [runtimeListing]);

  function showNotice(message, tone) {
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    setActionNotice({ message, tone });
    noticeTimerRef.current = setTimeout(() => setActionNotice(null), 1450);
  }

  function patchDraft(name, value) {
    setDraft(current => ({ ...current, [name]: value }));
  }

  function beginEdit() {
    if (saving) return;
    setMenuOpen(false);
    setDraft(factsOf(runtimeListing));
    setEditing(true);
  }

  async function saveEdit() {
    const listingId = clean(getListingId(runtimeListing));
    if (!listingId || saving) return;

    setSaving(true);

    try {
      const before = factsOf(runtimeListing);
      const result = await updateMachineFacts({
        commandBus: IXI_MACHINE_MUTATION_COMMANDS,
        listingId,
        title: clean(runtimeListing?.title || runtimeListing?.attributes?.title),
        before,
        after: draft,
        context: "owned-private-card-inline-editor"
      });

      const nextListing = result?.listing && typeof result.listing === "object"
        ? result.listing
        : {
            ...runtimeListing,
            ...draft,
            publicData: {
              ...publicDataOf(runtimeListing),
              price: draft.price,
              hours: draft.hours,
              location: draft.location,
              description: draft.description,
              details: draft.description,
              keywords: draft.keywords
            }
          };

      setRuntimeListing(nextListing);
      setDraft(factsOf(nextListing));
      setEditing(false);
      props.onOwnedObjectSaved?.(nextListing, result);
      showNotice("SAVED", "success");
    } catch (error) {
      showNotice("NOT SAVED", "error");
    } finally {
      setSaving(false);
    }
  }

  function handleEditButton() {
    if (!editing) {
      beginEdit();
      return;
    }
    saveEdit();
  }

  function handleAdd() {
    setMenuOpen(false);
    if (typeof props.onAddObject === "function") {
      props.onAddObject(runtimeListing);
      return;
    }
    setMenuNotice("ADD IS AVAILABLE WHEN THIS OBJECT HAS A CANONICAL CONTAINER/CHILD-CREATION COMMAND.");
    setMenuOpen(true);
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
      className={`owned-private-runtime ${editing ? "editing" : "read-mode"} ${saving ? "saving" : ""}`}
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
        actionNotice={actionNotice || props.actionNotice}
        priceValue={draft.price}
        hoursValue={draft.hours}
        locationValue={draft.location}
        descriptionValue={draft.description}
        onPriceChange={value => editing && patchDraft("price", value)}
        onHoursChange={value => editing && patchDraft("hours", String(value ?? "").replace(/[^0-9]/g, ""))}
        onLocationChange={value => editing && patchDraft("location", value)}
        onDescriptionChange={value => editing && patchDraft("description", value)}
        onAddObject={handleAdd}
        onEdit={handleEditButton}
        onOpenTransact={() => !saving && setTransactOpen(true)}
        onOpenActions={() => !saving && setMenuOpen(value => !value)}
      />

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

        .owned-private-runtime.read-mode .private-listing-card .hours-input,
        .owned-private-runtime.read-mode .private-listing-card .price-input,
        .owned-private-runtime.read-mode .private-listing-card .location-input,
        .owned-private-runtime.read-mode .private-listing-card .seller-bio-editor textarea{
          pointer-events:none!important;
          border-color:transparent!important;
          background:transparent!important;
          box-shadow:none!important;
          cursor:default!important;
        }

        .owned-private-runtime.read-mode .private-listing-card .seller-bio-count{display:none!important}

        .owned-private-runtime.editing .private-listing-card .hours-input,
        .owned-private-runtime.editing .private-listing-card .price-input,
        .owned-private-runtime.editing .private-listing-card .location-input,
        .owned-private-runtime.editing .private-listing-card .seller-bio-editor textarea{
          pointer-events:auto!important;
          border-color:rgba(255,196,0,.34)!important;
          background:rgba(10,10,10,.82)!important;
          cursor:text!important;
        }

        .owned-private-runtime.editing .private-listing-card .owner-action.edit{
          font-size:0!important;
          color:#FFC400!important;
        }
        .owned-private-runtime.editing .private-listing-card .owner-action.edit::after{
          content:"SAVE";
          font-size:7px;
          font-weight:950;
        }
        .owned-private-runtime.saving .private-listing-card .owner-action.edit::after{content:"SAVING"}

        .owned-private-runtime .private-listing-card .ixi-action-card-notice.success{
          background:rgba(0,18,28,.88)!important;
          color:#6FE8FF!important;
          border-color:rgba(0,194,255,.86)!important;
          box-shadow:0 0 18px rgba(0,194,255,.34),inset 0 0 22px rgba(0,194,255,.10)!important;
        }
        .owned-private-runtime .private-listing-card .ixi-action-card-notice.error{
          background:rgba(28,0,0,.88)!important;
          color:#FF7B7B!important;
          border-color:rgba(229,62,62,.88)!important;
          box-shadow:0 0 18px rgba(229,62,62,.34),inset 0 0 22px rgba(229,62,62,.10)!important;
        }

        .owned-menu{position:absolute;right:9px;bottom:31px;z-index:450;width:154px;max-height:340px;overflow:auto;padding:6px;border:1px solid rgba(255,255,255,.10);border-radius:6px;background:rgba(8,8,8,.985);box-shadow:0 14px 30px rgba(0,0,0,.46)}
        .owned-menu .menu-label{padding:3px 6px;color:rgba(255,255,255,.28);font:950 5px Arial}.owned-menu button{width:100%;height:25px;display:flex;align-items:center;justify-content:space-between;margin-bottom:3px;padding:0 7px;border:1px solid rgba(255,255,255,.06);border-radius:4px;background:rgba(255,255,255,.02);color:rgba(255,255,255,.62);font:950 6px Arial;text-align:left;cursor:pointer}.owned-menu button:hover,.owned-menu button.active{border-color:rgba(255,196,0,.28);color:#ffc400}.owned-menu .notice{margin-top:5px;padding:7px;border-top:1px solid rgba(255,255,255,.06);color:#9aa3a0;font:850 6px/1.35 Arial}
      `}</style>
    </div>
  );
}

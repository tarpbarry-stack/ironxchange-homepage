import { formatHours, getListingHref, cleanMachineTitle } from "../../lib/listingFormatters";

export default function IXISellerMachineObjectFace2({
  listing = {},
  dragHandleProps,
  descriptionValue,
  onDescriptionChange,
  onDescriptionKeyDown,
  savingDescription = false
}) {
  const publicData = listing.publicData || listing.attributes?.publicData || {};

  const passportId = listing.passportId || publicData.passportId || "";
  const sellerLogo = listing.sellerLogo || listing.profileImage || publicData.sellerLogo || "";
  const sellerName = listing.sellerCompany || listing.companyName || listing.sellerName || listing.authorName || "IRONXCHANGE SELLER";
  const serial = listing.serialNumber || publicData.serialNumber || "—";
  const stock = listing.stockNumber || publicData.stockNumber || "—";
  const year = listing.year || publicData.year || "";
  const make = listing.make || publicData.make || "";
  const model = listing.model || publicData.model || "";
  const hours = listing.hours || publicData.hours || "";
  const price = listing.price || publicData.price || "Call for price";
  const description = listing.description || publicData.description || publicData.details || "Machine bio not listed.";
  const listingStatus = String(listing.listingStatus || publicData.listingStatus || "").toLowerCase();
  const isPaused = listingStatus === "paused";
  const ownerActions = listing.__ixiOwnerActions || {};

  const DESCRIPTION_LIMIT = 200;
  const sellerDescription = String(descriptionValue ?? description ?? "").slice(0, DESCRIPTION_LIMIT);

  function stop(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
  }

  function runOwnerAction(event, action) {
    stop(event);
    ownerActions?.[action]?.();
  }

  function viewListing(event) {
    stop(event);
    window.location.href = getListingHref(listing, "account");
  }

  function launchListing(event) {
    stop(event);
    window.open(getListingHref(listing, "browse"), "_blank", "noopener,noreferrer");
  }

  async function togglePause(event) {
    stop(event);

    if (!isPaused) {
      const ok = window.confirm(`Pause this listing?\n\n${cleanMachineTitle(listing.title)}`);
      if (!ok) return;
    }

    const endpoint = isPaused ? "/api/reactivate-listing" : "/api/pause-listing";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `${isPaused ? "Reactivate" : "Pause"} failed`);
      window.location.reload();
    } catch (error) {
      alert(`${isPaused ? "Reactivate" : "Pause"} failed: ${error.message}`);
    }
  }

  async function deleteListing(event) {
    stop(event);
    const ok = window.confirm(`Delete this listing?\n\n${cleanMachineTitle(listing.title)}\n\nThis cannot be undone.`);
    if (!ok) return;

    try {
      const response = await fetch("/api/delete-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Delete failed");
      window.location.reload();
    } catch (error) {
      alert(`Delete failed: ${error.message}`);
    }
  }

  return (
    <section className="mof2" {...(dragHandleProps || {})}>
      <div className="mof2-passport-wrap">
        <div className="mof2-passport-label">IXI Machine Passport</div>
        {passportId ? (
          <a
            href={`/p/${passportId}`}
            className="mof2-passport-id"
            onClick={event => event.stopPropagation()}
            onPointerDown={event => event.stopPropagation()}
          >
            {passportId}
          </a>
        ) : (
          <div className="mof2-passport-id mof2-passport-id-empty">&nbsp;</div>
        )}
      </div>

      <div className="mof2-logo-wrap">
        {sellerLogo ? <img src={sellerLogo} alt={sellerName} /> : <div className="mof2-logo-fallback">{sellerName}</div>}
      </div>

      <div className="mof2-plate">
        <div className="mof2-tag mof2-tag-serial">
          <div className="mof2-tag-label">SERIAL NUMBER</div>
          <div className="mof2-tag-value">{serial}</div>
        </div>
        <div className="mof2-tag mof2-tag-stock">
          <div className="mof2-tag-label">STOCK NUMBER</div>
          <div className="mof2-tag-value">{stock}</div>
        </div>
      </div>

      <div className="mof2-title-row">
        <h2>{[year, make, model].filter(Boolean).join(" ")}</h2>
        <div className="mof2-hours">{hours ? formatHours(hours) : ""}</div>
      </div>

      <div className="mof2-price">{price}</div>

      <div className="mof2-bio seller-bio-editor">
        <textarea
          {...(onDescriptionChange
            ? {
                value: sellerDescription,
                onChange: e => onDescriptionChange(e.target.value.slice(0, DESCRIPTION_LIMIT), listing)
              }
            : { defaultValue: sellerDescription })}
          onKeyDown={e => onDescriptionKeyDown?.(e, listing)}
          maxLength={DESCRIPTION_LIMIT}
          spellCheck={true}
          disabled={savingDescription}
        />
        <div className="seller-bio-count">{sellerDescription.length} / {DESCRIPTION_LIMIT}</div>
      </div>

      <div className="mof2-owner-toolbar" aria-label="Owner object controls" onPointerDown={event => event.stopPropagation()}>
        <button type="button" title="Add" onClick={event => runOwnerAction(event, "add")}>+</button>
        <button type="button" className="owner-edit" title={ownerActions.editing ? "Save" : "Edit"} onClick={event => runOwnerAction(event, "edit")}>
          {ownerActions.saving ? "SAVING" : ownerActions.editing ? "SAVE" : "EDIT"}
        </button>
        <button type="button" title="TRAN$ACT" onClick={event => runOwnerAction(event, "transact")}>$</button>
        <button type="button" title="Actions" onClick={event => runOwnerAction(event, "actions")}>:</button>
      </div>

      <div className="mof2-action-row mof2-contact-row" onPointerDown={event => event.stopPropagation()}>
        <button type="button">EMAIL</button>
        <button type="button">TEXT</button>
        <button type="button">PDF</button>
      </div>

      <div className="mof2-action-row mof2-lifecycle-row" onPointerDown={event => event.stopPropagation()}>
        <button type="button" onClick={viewListing}>VIEW</button>
        <button type="button" onClick={launchListing}>LAUNCH</button>
        <button type="button" onClick={togglePause}>{isPaused ? "REACTIVATE" : "PAUSE"}</button>
        <button type="button" className="danger" onClick={deleteListing}>DELETE</button>
      </div>

      <style jsx>{`
        .mof2{box-sizing:border-box;width:100%;max-width:100%;height:459px;min-height:459px;max-height:459px;position:relative;padding:10px 14px 10px;display:flex;flex-direction:column;align-items:center;text-align:center;background:radial-gradient(circle at top,rgba(255,196,0,.05),transparent 42%),linear-gradient(180deg,rgba(255,255,255,.028),rgba(255,255,255,0)),#141414;color:#f2f2f2}
        .mof2-passport-wrap{width:100%;display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 7px;padding:0 1px 6px;border-bottom:1px solid rgba(255,255,255,.055)}
        .mof2-passport-label{min-width:0;color:rgba(255,255,255,.32);font-size:6.5px;font-weight:950;line-height:1;letter-spacing:.86px;text-align:left;text-transform:uppercase;white-space:nowrap}
        .mof2-passport-id{display:block;min-width:0;margin:0;color:rgba(255,255,255,.68);font-size:8px;font-weight:950;line-height:1;letter-spacing:.82px;text-align:right;text-decoration:none;text-transform:uppercase;white-space:nowrap;transition:color .14s ease,text-shadow .14s ease}
        .mof2-passport-id:hover{color:#ffc400;text-shadow:0 0 12px rgba(255,196,0,.12)}
        .mof2-passport-id-empty{min-width:40px;min-height:8px;pointer-events:none}
        .mof2-logo-wrap{height:54px;display:flex;align-items:center;justify-content:center;margin-bottom:10px}
        .mof2-logo-wrap img{max-height:46px;max-width:150px;object-fit:contain}
        .mof2-logo-fallback{color:rgba(255,255,255,.68);font-size:11px;font-weight:950;letter-spacing:.8px;text-transform:uppercase}
        .mof2-plate{width:100%;min-height:52px;padding:8px 10px;margin-bottom:13px;display:flex;justify-content:center;align-items:center;gap:10px;border:1px solid rgba(255,255,255,.12);border-radius:5px;background:linear-gradient(90deg,rgba(255,255,255,.10),rgba(255,255,255,.025)),#1b1b1b;box-shadow:inset 0 1px 0 rgba(255,255,255,.12),inset 0 -1px 0 rgba(0,0,0,.38)}
        .mof2-tag{flex:1;min-width:0;text-align:center}.mof2-tag-label{font-size:9px;font-weight:950;letter-spacing:.22em;color:rgba(255,255,255,.48);text-transform:uppercase;text-align:center;margin-bottom:6px}.mof2-tag-value{width:100%;min-width:0;color:rgba(255,255,255,.94);font-family:"Roboto Condensed","Arial Narrow",sans-serif;font-size:clamp(8px,2.2vw,12px);font-weight:950;line-height:1.1;letter-spacing:.06em;text-align:center;white-space:nowrap;overflow:visible}.mof2-tag-serial{flex:1.65}.mof2-tag-stock{flex:.85}
        h2{margin:0;max-width:100%;color:#f2f2f2;font-size:14px;font-weight:950;line-height:1.05;letter-spacing:-.15px;text-transform:uppercase}.mof2-title-row{width:100%;display:flex;justify-content:space-between;align-items:center;gap:10px}.mof2-title-row h2{text-align:left;flex:1}.mof2-hours{white-space:nowrap;margin-top:5px;color:rgba(255,255,255,.52);font-size:11px;font-weight:850;letter-spacing:.38px;position:relative;top:-2px}.mof2-price{margin-top:9px;color:#FFC400;font-size:18px;font-weight:950;letter-spacing:-.25px}
        .mof2-bio{width:100%;flex:1;min-height:48px;margin:10px 0 112px;padding:0;overflow:hidden;color:rgba(255,255,255,.70);font-size:11px;font-weight:700;line-height:1.38;text-align:left;border-top:1px solid rgba(255,255,255,.055);border-bottom:1px solid rgba(255,255,255,.055)}.seller-bio-editor{position:relative}.seller-bio-editor textarea{width:100%;height:100%;min-height:100%;padding:8px 10px 16px;resize:none;outline:none;color:rgba(255,255,255,.72);font-size:11px;font-weight:700;line-height:1.38;text-align:left;border:0;background:transparent;font-family:inherit}.seller-bio-count{position:absolute;right:8px;bottom:4px;color:rgba(255,255,255,.32);font-size:7px;font-weight:900;letter-spacing:.08em}
        .mof2-owner-toolbar,.mof2-action-row{position:absolute;left:14px;right:14px;width:auto;display:grid;gap:8px;z-index:3}
        .mof2-owner-toolbar{bottom:76px;grid-template-columns:repeat(4,minmax(0,1fr));padding-bottom:7px;border-bottom:1px solid rgba(255,255,255,.09)}
        .mof2-contact-row{bottom:41px;grid-template-columns:repeat(3,minmax(0,1fr))}
        .mof2-lifecycle-row{bottom:15px;grid-template-columns:repeat(4,minmax(0,1fr))}
        .mof2-owner-toolbar button,.mof2-action-row button{height:20px;min-height:20px;padding:0 8px;border:1px solid rgba(255,255,255,.10);border-radius:3px;background:linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,.012)),rgba(8,8,8,.90);color:rgba(255,255,255,.60);font-size:6.7px;font-weight:950;line-height:1;letter-spacing:.55px;text-transform:uppercase;box-shadow:inset 0 1px 0 rgba(255,255,255,.03);transition:border-color .12s ease,background .12s ease,color .12s ease,transform .08s ease;cursor:pointer}
        .mof2-owner-toolbar button:hover,.mof2-action-row button:hover{border-color:rgba(255,196,0,.42);background:linear-gradient(180deg,rgba(255,196,0,.08),rgba(255,196,0,.02)),rgba(10,10,10,.95);color:#FFC400}.mof2-owner-toolbar button:active,.mof2-action-row button:active{transform:translateY(1px)}.mof2-action-row button.danger:hover{border-color:rgba(229,62,62,.45);color:#E53E3E;background:linear-gradient(180deg,rgba(229,62,62,.08),rgba(229,62,62,.02)),rgba(10,10,10,.95)}
        .mof2-owner-toolbar .owner-edit{color:${ownerActions.editing ? "#FFC400" : "rgba(255,255,255,.60)"}}
      `}</style>
    </section>
  );
}

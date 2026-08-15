function clean(value) {
  return String(value ?? "").trim();
}


export default function IXIAosInlineAddress({
  object = {},
  editing = false,
  onFieldChange = null
}) {
  const fields = object?.fields || {};

  const address1 = clean(fields.address1);
  const city = clean(fields.city);
  const state = clean(fields.state);
  const postalCode = clean(fields.postalCode);

  const cityLine = [city, state].filter(Boolean).join(", ");
  const displayValue = [
    address1,
    [cityLine, postalCode].filter(Boolean).join(" ")
  ].filter(Boolean).join("  •  ");

  if (editing) {
    return (
      <div className="ixi-aos-inline-address editing">
        <input value={fields.address1 || ""} placeholder="ADDRESS" onPointerDown={event => event.stopPropagation()} onChange={event => onFieldChange?.("address1", event.target.value)} />
        <input className="city" value={fields.city || ""} placeholder="CITY" onPointerDown={event => event.stopPropagation()} onChange={event => onFieldChange?.("city", event.target.value)} />
        <input className="state" value={fields.state || ""} placeholder="ST" onPointerDown={event => event.stopPropagation()} onChange={event => onFieldChange?.("state", event.target.value)} />
        <input className="zip" value={fields.postalCode || ""} placeholder="ZIP" onPointerDown={event => event.stopPropagation()} onChange={event => onFieldChange?.("postalCode", event.target.value)} />
        <style jsx>{`
          .ixi-aos-inline-address { width:100%; height:28px; display:grid; grid-template-columns:minmax(0,1.7fr) minmax(0,1fr) 34px 54px; gap:4px; align-items:center; }
          input { width:100%; min-width:0; height:23px; padding:0 5px; border:1px solid rgba(255,255,255,.10); border-radius:4px; background:rgba(0,0,0,.28); color:rgba(255,255,255,.88); font-size:9px; font-weight:850; outline:none; }
          input:focus { border-color:rgba(255,196,0,.48); }
        `}</style>
      </div>
    );
  }

  return (
    <div className="ixi-aos-inline-address">
      <strong>{displayValue || "—"}</strong>
      <style jsx>{`
        .ixi-aos-inline-address { width:100%; height:26px; min-height:26px; display:flex; align-items:center; padding:0 6px; overflow:hidden; }
        strong { min-width:0; overflow:hidden; color:rgba(255,255,255,.86); font-size:10px; font-weight:900; text-overflow:ellipsis; white-space:nowrap; }
      `}</style>
    </div>
  );
}

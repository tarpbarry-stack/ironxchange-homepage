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
  const displayLine2 = [cityLine, postalCode].filter(Boolean).join(" ");

  if (editing) {
    return (
      <div className="ixi-aos-inline-address editing">
        <input
          className="address-line"
          value={fields.address1 || ""}
          placeholder="STREET ADDRESS"
          onPointerDown={event => event.stopPropagation()}
          onChange={event => onFieldChange?.("address1", event.target.value)}
        />

        <div className="location-line">
          <input
            className="city"
            value={fields.city || ""}
            placeholder="CITY"
            onPointerDown={event => event.stopPropagation()}
            onChange={event => onFieldChange?.("city", event.target.value)}
          />
          <input
            className="state"
            value={fields.state || ""}
            placeholder="ST"
            maxLength={3}
            onPointerDown={event => event.stopPropagation()}
            onChange={event => onFieldChange?.("state", event.target.value)}
          />
          <input
            className="zip"
            value={fields.postalCode || ""}
            placeholder="ZIP"
            onPointerDown={event => event.stopPropagation()}
            onChange={event => onFieldChange?.("postalCode", event.target.value)}
          />
        </div>

        <style jsx>{`
          .ixi-aos-inline-address,
          .ixi-aos-inline-address * {
            box-sizing:border-box;
          }

          .ixi-aos-inline-address {
            width:100%;
            min-width:0;
            display:grid;
            grid-template-rows:24px 24px;
            gap:5px;
            align-content:center;
          }

          .location-line {
            min-width:0;
            display:grid;
            grid-template-columns:minmax(0,1fr) 38px 58px;
            gap:5px;
          }

          input {
            width:100%;
            min-width:0;
            height:24px;
            padding:0 7px;
            border:1px solid rgba(255,255,255,.14);
            border-radius:5px;
            background:rgba(0,0,0,.36);
            color:#f4f5f4;
            font-size:8.2px;
            font-weight:800;
            line-height:1;
            outline:none;
            box-shadow:inset 0 1px 0 rgba(255,255,255,.025);
          }

          input::placeholder {
            color:rgba(255,255,255,.32);
            font-size:6.6px;
            font-weight:850;
            letter-spacing:.04em;
          }

          input:focus {
            border-color:rgba(255,196,0,.72);
            box-shadow:0 0 0 1px rgba(255,196,0,.12), inset 0 1px 0 rgba(255,255,255,.025);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="ixi-aos-inline-address">
      <strong className="line1">{address1 || "—"}</strong>
      <strong className="line2">{displayLine2 || "—"}</strong>

      <style jsx>{`
        .ixi-aos-inline-address {
          width:100%;
          min-width:0;
          display:flex;
          flex-direction:column;
          justify-content:center;
          gap:2px;
          overflow:hidden;
        }

        strong {
          min-width:0;
          overflow:hidden;
          text-overflow:ellipsis;
          white-space:nowrap;
        }

        .line1 {
          color:rgba(255,255,255,.94);
          font-size:8.2px;
          font-weight:850;
          line-height:1.05;
        }

        .line2 {
          color:rgba(255,255,255,.66);
          font-size:7.2px;
          font-weight:760;
          line-height:1.05;
        }
      `}</style>
    </div>
  );
}

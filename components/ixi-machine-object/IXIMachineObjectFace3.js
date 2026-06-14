import { useMemo, useState } from "react";

export default function IXIMachineObjectFace3({ listing = {} }) {
  const publicData =
    listing.publicData ||
    listing.attributes?.publicData ||
    {};

  const ask =
    listing.price ||
    publicData.price ||
    "$148,000";
  const askNumber = Number(String(ask).replace(/[^0-9.]/g, "")) || 0;
const year = listing.year || publicData.year || "";
const make = listing.make || publicData.make || "";
const model = listing.model || publicData.model || "";
const hours = listing.hours || publicData.hours || "";
const [offer, setOffer] = useState(askNumber);
const [downDollar, setDownDollar] = useState(
  Math.round(askNumber * 0.15)
);
const [rate, setRate] = useState("7.50");

const downPercent = offer ? (downDollar / offer) * 100 : 0;

const financedAmount = Math.max(offer - downDollar, 0);
const rateNumber = Number(rate) || 0;
  
function payment(months) {
  const monthlyRate = rateNumber / 100 / 12;

  if (!monthlyRate) {
    return financedAmount / months;
  }

  return (
    financedAmount *
    (monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1)
  );
}

const pay36 = payment(36);
const pay48 = payment(48);
const pay60 = payment(60);

function money(value) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  });
}

  return (
    <section className="mof3">
      <header className="mof3-head">
        <span>CAT FINANCIAL™</span>
        <strong>IXI DEAL SHEET™</strong>
      </header>

    <div className="mof3-machine-line">
  {[year, make, model].filter(Boolean).join(" ")}
  {hours ? ` • ${hours} HRS` : ""}
</div>

      <div className="mof3-grid top-grid">
       <div className="mof3-panel">
  <Row label="ASK" value={ask} />

  <Row
    label="BID"
    input
    value={offer}
    onChange={(v) =>
      setOffer(Number(v.replace(/[^0-9.]/g, "")) || 0)
    }
  />

  <Row
    label="DIFF"
    value={money(offer - askNumber)}
    muted
  />

  <Row
    label=""
    value={`${askNumber ? (((offer - askNumber) / askNumber) * 100).toFixed(1) : "0.0"}%`}
    muted
  />
</div>
  label=""
  value={`${askNumber ? (((offer - askNumber) / askNumber) * 100).toFixed(1) : "0.0"}%`}
  muted
/>
        </div>

        <div className="mof3-panel">
          <Row
  label="DOWN $"
  input
  value={downDollar}
  onChange={(v) => setDownDollar(Number(v.replace(/[^0-9.]/g, "")) || 0)}
/>
          <Row
  label="DOWN %"
  input
  value={downPercent.toFixed(1)}
  onChange={(v) => {
    const pct = Number(v.replace(/[^0-9.]/g, "")) || 0;
    setDownDollar(Math.round(offer * (pct / 100)));
  }}
/>
          <Row label="TRADE" input defaultValue="15000" />
          <Row label="EST TAX" input defaultValue="11500" />
        </div>

      <div className="mof3-grid mid-grid">
        <div className="mof3-panel">
          <Row label="MILES" input defaultValue="850" />
          <Row label="$/MI" input defaultValue="4.50" />
          <Row label="FREIGHT" value="$3,825" />
        </div>

        <div className="mof3-panel">
          <Row label="REPAIRS" input defaultValue="5000" />
          <Row label="SLIP 1.5%" value="$1,881" />
        </div>
      </div>

      <section className="mof3-total">
        <span>TOTAL DEAL</span>
        <strong>$127,256</strong>
      </section>

     <section className="mof3-rate">
  <span>RATE</span>

  <input
    value={rate}
    inputMode="decimal"
    onChange={(e) => {
      const cleaned = e.target.value.replace(/[^0-9.]/g, "");
      setRate(cleaned);
    }}
  />

  <span>%</span>
</section>
    
      <section className="mof3-payments">
        <div>
          <span>36 MO</span>
          <strong>{money(pay36)}</strong>
        </div>

        <div>
          <span>48 MO</span>
          <strong>{money(pay48)}</strong>
        </div>

        <div>
          <span>60 MO</span>
          <strong>{money(pay60)}</strong>
        </div>
      </section>

      <footer className="mof3-actions">
        <button type="button">EMAIL</button>
        <button type="button">TEXT</button>
        <button type="button">PDF</button>
      </footer>

      <style jsx>{`
        .mof3 {
          box-sizing: border-box;
          width: 100%;
          max-width: 100%;
          height: 378px;
          min-height: 378px;
          max-height: 378px;

          padding: 10px 12px 30px;

          display: flex;
          flex-direction: column;
          gap: 7px;

          background:
            radial-gradient(circle at top, rgba(255,196,0,.055), transparent 42%),
            linear-gradient(180deg, rgba(255,255,255,.028), rgba(255,255,255,0)),
            #141414;

          color: #f2f2f2;
        }

        .mof3-head {
          height: 16px;

          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;

          color: rgba(255,255,255,.58);

          font-size: 7.8px;
          font-weight: 950;
          letter-spacing: .48px;
          text-transform: uppercase;
        }

        .mof3-head strong {
          color: #FFC400;
          font-size: 8px;
          font-weight: 950;
          letter-spacing: .55px;
        }

        .mof3-machine-line {
  margin-top: -3px;
  margin-bottom: 2px;
  color: rgba(255,255,255,.58);
  font-size: 7.8px;
  font-weight: 950;
  letter-spacing: .45px;
  text-align: center;
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

        .mof3-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 7px;
        }

        .mof3-panel {
          min-width: 0;
          padding: 8px 8px 7px;

          border: 1px solid rgba(255,255,255,.07);
          border-radius: 7px;

          background:
            linear-gradient(180deg, rgba(255,255,255,.025), rgba(255,255,255,0)),
            rgba(10,10,10,.46);

          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.035);
        }

        :global(.mof3-row) {
          min-height: 17px;

          display: grid;
          grid-template-columns: 54px minmax(0, 1fr);
          align-items: center;
          gap: 5px;

          border-bottom: 1px solid rgba(255,255,255,.035);
        }

        .mof3-row:last-child {
          border-bottom: 0;
        }

        :global(.mof3-label) {
          color: rgba(255,255,255,.43);
          font-size: 7.4px;
          font-weight: 950;
          letter-spacing: .38px;
          text-transform: uppercase;
          white-space: nowrap;
        }

        :global(.mof3-value) {
          color: rgba(255,255,255,.86);
          font-size: 8px;
          font-weight: 950;
          text-align: right;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        :global(.mof3-value.muted) {
          color: rgba(255,196,0,.86);
          font-size: 7.6px;
        }

      :global(.mof3-input) {
  width: 48px;
  min-width: 48px;
  max-width: 48px;
  height: 13px;
  background: #050505;
  font-size: 7.6px;
  padding: 0 3px;
  justify-self: end;
}

       :global(.mof3-input:focus) {
  border-bottom-color: rgba(255,196,0,.72);
  box-shadow: 0 3px 8px rgba(255,196,0,.10);
}

        :global(.mof3-input) {
  width: 48px;
  min-width: 48px;
  max-width: 48px;
  height: 14px;

  justify-self: end;

  border: 0;
  border-bottom: 2px solid rgba(255,255,255,.16);
  border-radius: 0;

  background: transparent;
  color: rgba(255,255,255,.86);

  padding: 0 2px;
  font-size: 7.8px;
  font-weight: 950;
  text-align: right;
  outline: none;
}

        .mof3-total {
          height: 25px;

          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;

          border: 1px solid rgba(255,196,0,.18);
          border-radius: 8px;

          background:
            linear-gradient(180deg, rgba(255,196,0,.07), rgba(255,196,0,.015)),
            rgba(0,0,0,.34);

          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.035),
            0 0 12px rgba(255,196,0,.055);
        }

        .mof3-total span {
          color: rgba(255,255,255,.48);
          font-size: 7.8px;
          font-weight: 950;
          letter-spacing: .55px;
        }

        .mof3-total strong {
          margin-top: 3px;
          color: #FFC400;
          font-size: 18px;
          font-weight: 950;
          letter-spacing: -.2px;
        }

        .mof3-rate {
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  margin-top: -2px;
}

.mof3-rate span {
  color: rgba(255,255,255,.48);
  font-size: 7.6px;
  font-weight: 950;
  letter-spacing: .4px;
}

.mof3-rate input {
  width: 38px;
  height: 13px;
  border: 0;
  border-bottom: 1px solid rgba(255,196,0,.42);
  background: transparent;
  color: #FFC400;
  padding: 0 2px;
  font-size: 8px;
  font-weight: 950;
  text-align: center;
  outline: none;
}

        .mof3-payments {
          height: 25px;

          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 7px;
        }

        .mof3-payments div {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;

          border: 1px solid rgba(255,255,255,.07);
          border-radius: 7px;

          background: rgba(9,9,9,.52);
        }

        .mof3-payments span {
          color: rgba(255,255,255,.46);
          font-size: 7.6px;
          font-weight: 950;
          letter-spacing: .45px;
        }

        .mof3-payments strong {
          margin-top: 3px;
          color: rgba(255,255,255,.9);
          font-size: 11.5px;
          font-weight: 950;
        }

        .mof3-actions {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 7px;
          margin-top: auto;
        }

        .mof3-actions button {
          height: 23px;

          border: 1px solid rgba(255,196,0,.22);
          border-radius: 6px;

          background:
            linear-gradient(180deg, rgba(255,196,0,.055), rgba(255,196,0,0)),
            #101010;

          color: #FFC400;

          font-size: 8px;
          font-weight: 950;
          letter-spacing: .5px;

          cursor: pointer;
        }
      `}</style>
    </section>
  );
}

function Row({
  label,
  value,
  input = false,
  defaultValue = "",
  muted = false,
  onChange
}) {
  return (
    <div className="mof3-row">
      <span className="mof3-label">{label}</span>

      {input ? (
        <input
          className="mof3-input"
          value={value ?? defaultValue}
          onChange={(e) => onChange?.(e.target.value)}
        />
      ) : (
        <strong className={`mof3-value ${muted ? "muted" : ""}`}>
          {value}
        </strong>
      )}
    </div>
  );
}

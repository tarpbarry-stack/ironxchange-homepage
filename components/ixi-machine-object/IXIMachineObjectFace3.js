export default function IXIMachineObjectFace3({ listing = {} }) {
  const publicData =
    listing.publicData ||
    listing.attributes?.publicData ||
    {};

  const ask =
    listing.price ||
    publicData.price ||
    "$148,000";

  return (
    <section className="mof3">
      <header className="mof3-head">
        <span>CAT FINANCIAL™</span>
        <strong>IXI DEAL SHEET™</strong>
      </header>

      <div className="mof3-grid top-grid">
        <div className="mof3-panel">
          <Row label="ASK" value={ask} />
          <Row label="OFFER" input defaultValue="140000" />
          <Row label="DIFF" value="-$8,000  -5.4%" muted />
        </div>

        <div className="mof3-panel">
          <Row label="DOWN $" input defaultValue="21000" />
          <Row label="DOWN %" value="15%" />
          <Row label="TRADE" input defaultValue="15000" />
          <Row label="EST TAX" input defaultValue="11500" />
        </div>
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

      <section className="mof3-payments">
        <div>
          <span>36 MO</span>
          <strong>$3,956</strong>
        </div>

        <div>
          <span>48 MO</span>
          <strong>$3,017</strong>
        </div>

        <div>
          <span>60 MO</span>
          <strong>$2,465</strong>
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

        .mof3-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 7px;
        }

        .mof3-panel {
          min-width: 0;
          padding: 7px 7px 6px;

          border: 1px solid rgba(255,255,255,.07);
          border-radius: 7px;

          background:
            linear-gradient(180deg, rgba(255,255,255,.025), rgba(255,255,255,0)),
            rgba(10,10,10,.46);

          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.035);
        }

        :global(.mof3-row) {
          min-height: 10px;

          display: grid;
          grid-template-columns: 52px minmax(0, 1fr);
          align-items: center;
          gap: 6px;

          border-bottom: 1px solid rgba(255,255,255,.035);
        }

        .mof3-row:last-child {
          border-bottom: 0;
        }

        :global(.mof3-label) {
          color: rgba(255,255,255,.43);
          font-size: 6px;
          font-weight: 950;
          letter-spacing: .38px;
          text-transform: uppercase;
          white-space: nowrap;
        }

        :global(.mof3-value) {
          color: rgba(255,255,255,.86);
          font-size: 6px;
          font-weight: 950;
          text-align: right;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        :global(.mof3-value.muted) {
          color: rgba(255,196,0,.86);
          font-size: 6px;
        }

       :global(.mof3-input) {
  width: 58px;
  min-width: 58px;
  max-width: 58px;

  height: 13px;

  background: #0b0b0b;

  border: 1px solid rgba(255,255,255,.06);

  color: rgba(255,255,255,.88);

  padding: 0 3px;

  font-size: 7px;
  font-weight: 900;

  text-align: right;

  justify-self: end;

  outline: none;
}

        :global(.mof3-input:focus) {
          border-color: rgba(255,196,0,.42);
          box-shadow: 0 0 0 1px rgba(255,196,0,.10);
        }
        :global(.mof3-input) {
  width: 44px;
  min-width: 44px;
  max-width: 44px;
  height: 10px;
  background: #050505;
  font-size: 7px;
  padding: 0 2px;
  justify-self: end;
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
  muted = false
}) {
  return (
    <div className="mof3-row">
      <span className="mof3-label">{label}</span>

      {input ? (
        <input
          className="mof3-input"
          defaultValue={defaultValue}
        />
      ) : (
        <strong className={`mof3-value ${muted ? "muted" : ""}`}>
          {value}
        </strong>
      )}
    </div>
  );
}

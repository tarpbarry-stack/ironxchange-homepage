export default function IXIMachineObjectFace3({ listing = {} }) {
  const publicData =
    listing.publicData ||
    listing.attributes?.publicData ||
    {};

  const ask =
    listing.price ||
    publicData.price ||
    "Call for Price";

  return (
    <section className="mof3">

      <div className="mof3-sponsor">
        CAT FINANCIAL™
      </div>

      <div className="mof3-title">
        IXI DEAL SHEET™
      </div>

      <div className="mof3-divider" />

      <div className="mof3-label">
        ASK
      </div>

      <div className="mof3-ask">
        {ask}
      </div>

      <div className="mof3-divider" />

      <div className="mof3-field">
        <label>MY OFFER</label>
        <input type="text" />
      </div>

      <div className="mof3-difference">
        $0
        <span>0.0%</span>
      </div>

      <div className="mof3-divider" />

      <div className="mof3-field">
        <label>DOWN</label>
        <input type="text" />
      </div>

      <div className="mof3-field">
        <label>TRADE</label>
        <input type="text" />
      </div>

      <div className="mof3-divider" />

      <div className="mof3-field">
        <label>STATE TAX</label>
        <input type="text" />
      </div>

      <div className="mof3-field">
        <label>COUNTY TAX</label>
        <input type="text" />
      </div>

      <div className="mof3-field">
        <label>CITY TAX</label>
        <input type="text" />
      </div>

      <div className="mof3-divider" />

      <div className="mof3-field">
        <label>MILES</label>
        <input type="text" />
      </div>

      <div className="mof3-field">
        <label>$/LOADED MILE</label>
        <input type="text" />
      </div>

      <div className="mof3-divider" />

      <div className="mof3-field">
        <label>REPAIRS / UPGRADES</label>
        <input type="text" />
      </div>

      <div className="mof3-divider" />

      <div className="mof3-slip">
        SLIPPAGE 1.5%
      </div>

      <div className="mof3-divider" />

      <div className="mof3-total-label">
        TOTAL DEAL
      </div>

      <div className="mof3-total">
        $0
      </div>

      <div className="mof3-divider" />

      <div className="mof3-rate">
        RATE
        <input
          defaultValue="7.50"
          type="text"
        />
      </div>

      <div className="mof3-payments">
        <div>
          <strong>36 MO</strong>
          <span>$0</span>
        </div>

        <div>
          <strong>48 MO</strong>
          <span>$0</span>
        </div>

        <div>
          <strong>60 MO</strong>
          <span>$0</span>
        </div>
      </div>

      <div className="mof3-actions">
        <button>EMAIL</button>
        <button>TEXT</button>
        <button>PDF</button>
      </div>

      <style jsx>{`
        .mof3 {
          box-sizing: border-box;
          width: 100%;
          height: 378px;
          padding: 14px;

          background:
            radial-gradient(circle at top, rgba(255,196,0,.05), transparent 42%),
            linear-gradient(180deg, rgba(255,255,255,.028), rgba(255,255,255,0)),
            #141414;

          color: #f2f2f2;
        }

        .mof3-sponsor,
        .mof3-title {
          text-align: center;
          font-weight: 950;
          letter-spacing: .6px;
        }

        .mof3-sponsor {
          color: #FFC400;
          font-size: 10px;
        }

        .mof3-title {
          margin-top: 4px;
          font-size: 12px;
        }

        .mof3-divider {
          height: 1px;
          margin: 8px 0;
          background: rgba(255,255,255,.06);
        }

        .mof3-label,
        .mof3-total-label {
          text-align: center;
          color: rgba(255,255,255,.5);
          font-size: 9px;
          font-weight: 950;
        }

        .mof3-ask,
        .mof3-total {
          text-align: center;
          color: #FFC400;
          font-size: 24px;
          font-weight: 950;
        }

        .mof3-field {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 5px;
        }

        .mof3-field label {
          font-size: 9px;
          font-weight: 900;
        }

        .mof3-field input,
        .mof3-rate input {
          width: 90px;
          height: 22px;
          background: #101010;
          border: 1px solid rgba(255,255,255,.08);
          color: #f2f2f2;
          text-align: right;
        }

        .mof3-difference {
          text-align: center;
          font-weight: 900;
        }

        .mof3-difference span {
          display: block;
          color: rgba(255,255,255,.5);
        }

        .mof3-slip {
          text-align: center;
          color: rgba(255,255,255,.55);
          font-size: 10px;
          font-weight: 900;
        }

        .mof3-rate {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .mof3-payments {
          display: flex;
          justify-content: space-between;
          margin-top: 8px;
        }

        .mof3-payments div {
          text-align: center;
        }

        .mof3-payments strong {
          display: block;
          font-size: 9px;
        }

        .mof3-payments span {
          display: block;
          margin-top: 2px;
          color: #FFC400;
        }

        .mof3-actions {
          display: grid;
          grid-template-columns: repeat(3,1fr);
          gap: 7px;
          margin-top: 10px;
        }

        .mof3-actions button {
          height: 26px;
          background: #101010;
          border: 1px solid rgba(255,196,0,.22);
          color: #FFC400;
          font-size: 9px;
          font-weight: 950;
        }
      `}</style>
    </section>
  );
}

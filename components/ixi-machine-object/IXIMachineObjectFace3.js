export default function IXIMachineObjectFace3({ listing = {} }) {
  const publicData =
    listing.publicData ||
    listing.attributes?.publicData ||
    {};

  const ask =
    listing.price ||
    publicData.price ||
    "Call for price";

  return (
    <section className="mof3">
      <div className="mof3-sponsor">
        IXI DEAL SHEET
      </div>

      <div className="mof3-ask">
        <span>ASK</span>
        <strong>{ask}</strong>
      </div>

      <div className="mof3-placeholder">
        MOF3 ACTIVE
      </div>

      <style jsx>{`
        .mof3 {
          box-sizing: border-box;
          width: 100%;
          max-width: 100%;
          height: 378px;
          min-height: 378px;
          max-height: 378px;
          padding: 14px;
          background: #141414;
          color: #f2f2f2;
        }

        .mof3-sponsor {
          text-align: center;
          color: #FFC400;
          font-size: 10px;
          font-weight: 950;
          letter-spacing: .7px;
        }

        .mof3-ask {
          margin-top: 20px;
          text-align: center;
        }

        .mof3-ask span {
          display: block;
          color: rgba(255,255,255,.45);
          font-size: 9px;
          font-weight: 950;
          letter-spacing: .6px;
        }

        .mof3-ask strong {
          display: block;
          margin-top: 5px;
          color: #f2f2f2;
          font-size: 22px;
          font-weight: 950;
        }

        .mof3-placeholder {
          margin-top: 28px;
          text-align: center;
          color: rgba(255,255,255,.45);
          font-size: 11px;
          font-weight: 900;
        }
      `}</style>
    </section>
  );
}

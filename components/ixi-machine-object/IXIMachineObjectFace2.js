import IXIMachineObjectActions from "./IXIMachineObjectActions";
import { formatHours } from "../../lib/listingFormatters";

export default function IXIMachineObjectFace2({
  listing = {},
  dragHandleProps
}) {
  const publicData = listing.publicData || listing.attributes?.publicData || {};

  const sellerLogo =
    listing.sellerLogo ||
    listing.profileImage ||
    publicData.sellerLogo ||
    "";

  const sellerName =
    listing.sellerCompany ||
    listing.companyName ||
    listing.sellerName ||
    listing.authorName ||
    "IRONXCHANGE SELLER";

  const serial =
    listing.serialNumber ||
    publicData.serialNumber ||
    "—";

  const stock =
    listing.stockNumber ||
    publicData.stockNumber ||
    "—";

  const year = listing.year || publicData.year || "";
  const make = listing.make || publicData.make || "";
  const model = listing.model || publicData.model || "";

  const hours =
    listing.hours ||
    publicData.hours ||
    "";

  const price =
    listing.price ||
    publicData.price ||
    "Call for price";

  const description =
    listing.description ||
    publicData.description ||
    publicData.details ||
    "Machine bio not listed.";

  return (
    <section
  className="mof2"
  {...(dragHandleProps || {})}
>
      <div className="mof2-logo-wrap">
        {sellerLogo ? (
          <img src={sellerLogo} alt={sellerName} />
        ) : (
          <div className="mof2-logo-fallback">{sellerName}</div>
        )}
      </div>

    <div className="mof2-plate">
  <div className="mof2-tag">
    <div className="mof2-tag-label">
      SERIAL NUMBER
    </div>

    <div className="mof2-tag-value">
      {serial}
    </div>
  </div>

  <div className="mof2-tag">
    <div className="mof2-tag-label">
      STOCK NUMBER
    </div>

    <div className="mof2-tag-value">
      {stock}
    </div>
  </div>
</div>

     <div className="mof2-title-row">
  <h2>
    {[year, make, model].filter(Boolean).join(" ")}
  </h2>

  <div className="mof2-hours">
    {hours ? formatHours(hours) : ""}
  </div>
</div>

<div className="mof2-price">{price}</div>
      <p className="mof2-bio">{description}</p>

     <IXIMachineObjectActions />

      <style jsx>{`
        .mof2 {
  box-sizing: border-box;

  width: 100%;
  max-width: 100%;

  height: 378px;
  min-height: 378px;
  max-height: 378px;

  position: relative;

  padding: 14px 14px 30px;

  display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          background:
            radial-gradient(circle at top, rgba(255,196,0,.05), transparent 42%),
            linear-gradient(180deg, rgba(255,255,255,.028), rgba(255,255,255,0)),
            #141414;
          color: #f2f2f2;
        }

        .mof2-logo-wrap {
          height: 54px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 10px;
        }

        .mof2-logo-wrap img {
          max-height: 46px;
          max-width: 150px;
          object-fit: contain;
        }

        .mof2-logo-fallback {
          color: rgba(255,255,255,.68);
          font-size: 11px;
          font-weight: 950;
          letter-spacing: .8px;
          text-transform: uppercase;
        }

     .mof2-plate {
  width: 100%;
  min-height: 52px;

  padding: 8px 10px;
  margin-bottom: 13px;

  display: flex;
  justify-content: center;
  align-items: center;

  gap: 26px;
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 5px;
          background:
            linear-gradient(90deg, rgba(255,255,255,.10), rgba(255,255,255,.025)),
            #1b1b1b;
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.12),
            inset 0 -1px 0 rgba(0,0,0,.38);
        }

        .mof2-plate span {
          color: rgba(255,255,255,.64);
          font-size: 8px;
          font-weight: 950;
          letter-spacing: .62px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

          .mof2-tag {
  flex: 1;
  min-width: 0;
  text-align: center;
}

.mof2-tag-label {
   font-size: 9px;
  font-weight: 950;

  letter-spacing: .22em;

  color: rgba(255,255,255,.48);

  text-transform: uppercase;
  text-align: center;
  margin-bottom: 2px;
}

.mof2-tag-value {
  font-size: 15px;
  font-weight: 950;

  letter-spacing: .16em;

  color: rgba(255,255,255,.94);

  font-family:
    "Roboto Condensed",
    "Arial Narrow",
    sans-serif;

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}


        h2 {
          margin: 0;
          max-width: 100%;
          color: #f2f2f2;
          font-size: 14px;
          font-weight: 950;
          line-height: 1.05;
          letter-spacing: -.15px;
          text-transform: uppercase;
        }

        .mof2-title-row {
  width: 100%;

  display: flex;
  justify-content: space-between;
  align-items: center;
  
  gap: 10px;
}

.mof2-title-row h2 {
  text-align: left;
  flex: 1;
}

.mof2-hours {
  white-space: nowrap;

  color: rgba(255,255,255,.48);

  font-size: 10px;
  font-weight: 800;

  position: relative;
  top: -2px;
}

        .mof2-hours {
          margin-top: 5px;
          color: rgba(255,255,255,.52);
          font-size: 11px;
          font-weight: 850;
          letter-spacing: .38px;
        }

        .mof2-price {
          margin-top: 9px;
          color: #FFC400;
          font-size: 18px;
          font-weight: 950;
          letter-spacing: -.25px;
        }

        .mof2-bio {
          width: 100%;
          flex: 1;
          margin: 12px 0 12px;
          padding: 12px 10px;
          overflow: hidden;
          color: rgba(255,255,255,.70);
          font-size: 11px;
          font-weight: 700;
          line-height: 1.38;
          text-align: left;
          border-top: 1px solid rgba(255,255,255,.055);
          border-bottom: 1px solid rgba(255,255,255,.055);
        }


      `}</style>
    </section>
  );
}

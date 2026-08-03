import IXIMachineObjectActions from "./IXIMachineObjectActions";
import { formatHours } from "../../lib/listingFormatters";

export default function IXIMachineObjectFace2({
  listing = {},
  dragHandleProps
}) {
  const publicData = listing.publicData || listing.attributes?.publicData || {};

  const passportId =
  listing.passportId ||
  publicData.passportId ||
  "";

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

 <div className="mof2-passport-wrap">
  <div className="mof2-passport-label">
    IXI Machine Passport
  </div>

  {passportId ? (
    <a
      href={`/p/${passportId}`}
      className="mof2-passport-id"
      onClick={event => {
        event.stopPropagation();
      }}
      onPointerDown={event => {
        event.stopPropagation();
      }}
    >
      {passportId}
    </a>
  ) : (
    <div className="mof2-passport-id mof2-passport-id-empty">
      &nbsp;
    </div>
  )}
</div>
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

  padding: 10px 14px 30px;

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

.mof2-passport-wrap {
  width: 100%;

  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;

  gap: 12px;

  margin: 0 0 7px;
  padding: 0 1px 6px;

  border-bottom: 1px solid rgba(255, 255, 255, 0.055);
}

.mof2-passport-label {
  min-width: 0;

  color: rgba(255, 255, 255, 0.32);

  font-size: 6.5px;
  font-weight: 950;
  line-height: 1;
  letter-spacing: 0.86px;

  text-align: left;
  text-transform: uppercase;
  white-space: nowrap;
}

.mof2-passport-id {
  display: block;
  min-width: 0;

  margin: 0;

  color: rgba(255, 255, 255, 0.68);

  font-size: 8px;
  font-weight: 950;
  line-height: 1;
  letter-spacing: 0.82px;

  text-align: right;
  text-decoration: none;
  text-transform: uppercase;
  white-space: nowrap;

  transition:
    color 0.14s ease,
    text-shadow 0.14s ease;
}

.mof2-passport-id:hover {
  color: #ffc400;

  text-shadow:
    0 0 12px rgba(255, 196, 0, 0.12);
}

.mof2-passport-id-empty {
  min-width: 40px;
  min-height: 8px;
  pointer-events: none;
}

        .mof2-logo-wrap {
  height: 38px;

  display: flex;
  align-items: center;
  justify-content: center;

  margin-top: -3px;
  margin-bottom: 3px;
}

.mof2-logo-wrap img {
  max-height: 34px;
  max-width: 145px;

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
  min-height: 34px;

  margin-top: -2px;
  margin-bottom: 7px;
  padding: 4px 7px;

  display: grid;
  grid-template-columns:
    minmax(0, 1fr)
    minmax(0, 1fr);

  align-items: center;
  gap: 12px;

  border:
    1px solid
    rgba(255,255,255,.065);

  border-radius: 5px;

  background:
    rgba(255,255,255,.018);

  box-shadow:
    inset 0 1px 0
    rgba(255,255,255,.025);

  overflow: hidden;
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
  min-width: 0;

  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;

  text-align: left;
}

.mof2-tag + .mof2-tag {
  align-items: flex-end;

  text-align: right;
}

.mof2-tag-label {
  width: 100%;

  margin-bottom: 3px;

  color:
    rgba(255,255,255,.3);

  font-size: 6.2px;
  font-weight: 950;
  line-height: 1;
  letter-spacing: .48px;

  text-transform: uppercase;
}

.mof2-tag-value {
  width: 100%;
  min-width: 0;

  color:
    rgba(255,255,255,.76);

  font-family:
    "Roboto Condensed",
    "Arial Narrow",
    sans-serif;

  font-size: 9.5px;
  font-weight: 950;
  line-height: 1;
  letter-spacing: .28px;

  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

  font-size: 14px;
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
  min-height: 0;

  flex: 1 1 auto;

  margin: 8px 0 4px;
  padding: 9px 9px 10px;

  overflow-x: hidden;
  overflow-y: auto;

  color:
    rgba(255,255,255,.72);

  font-size: 10.5px;
  font-weight: 700;
  line-height: 1.42;

  text-align: left;
  white-space: pre-wrap;
  overflow-wrap: anywhere;

  border-top:
    1px solid
    rgba(255,255,255,.05);

  border-bottom:
    1px solid
    rgba(255,255,255,.05);

  scrollbar-width: thin;
  scrollbar-color:
    rgba(255,196,0,.34)
    rgba(255,255,255,.025);
}

.mof2-bio::-webkit-scrollbar {
  width: 5px;
}

.mof2-bio::-webkit-scrollbar-track {
  background:
    rgba(255,255,255,.018);
}

.mof2-bio::-webkit-scrollbar-thumb {
  border-radius: 5px;

  background:
    rgba(255,196,0,.28);
}

.mof2-bio::-webkit-scrollbar-thumb:hover {
  background:
    rgba(255,196,0,.46);
}


      `}</style>
    </section>
  );
}

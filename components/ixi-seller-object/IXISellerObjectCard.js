import SellerLogoDecal from "../SellerLogoDecal";

function formatMoney(value) {
  const amount = Number(value || 0);

  if (!amount) return "CALL";

  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  });
}

function slugify(text = "") {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function IXISellerObjectCard({
  sellerObject,
  dragHandleProps
}) {
  const display = sellerObject?.sellerDisplay || {};
  const seed = sellerObject?.sellerSeedListing || {};
  const machines = sellerObject?.machines || [];

  const yardTitle =
    display.yardTitle ||
    sellerObject?.title ||
    "IronXchange Seller";

  const location =
    seed.sellerLocation ||
    seed.location ||
    "Location not listed";

  const logo =
    seed.sellerLogo ||
    seed.profileImage ||
    "";

  const categories = Array.from(
    new Set(
      machines
        .map(item => item.type || item.category)
        .filter(Boolean)
    )
  ).slice(0, 3);

  const yardSlug = slugify(yardTitle);

  return (
    <section
      className="seller-object-card"
      {...(dragHandleProps || {})}
    >
      <div className="seller-object-top">
        <SellerLogoDecal
          logo={logo}
          name={yardTitle}
          variant="card"
        />

        <div className="seller-object-title">
          <span>SELLER OBJECT</span>
          <h3>{yardTitle}</h3>
          <p>{location}</p>
        </div>
      </div>

      <div className="seller-object-stats">
        <div>
          <strong>{machines.length}</strong>
          <span>Machines</span>
        </div>

        <div>
          <strong>{formatMoney(sellerObject?.price)}</strong>
          <span>Inventory</span>
        </div>
      </div>

      <div className="seller-object-cats">
        {categories.length ? (
          categories.map(cat => <span key={cat}>{cat}</span>)
        ) : (
          <span>Mixed Iron</span>
        )}
      </div>

      <div className="seller-object-footer">
        <a
          href={`/yard/${yardSlug}`}
          onClick={event => event.stopPropagation()}
        >
          OPEN YARD
        </a>

        <button type="button">
          NEXT
        </button>
      </div>

      <style jsx>{`
        .seller-object-card {
  width: 298px;
  min-width: 298px;
  max-width: 298px;

  height: 391px;
  min-height: 391px;
  max-height: 391px;

          display: flex;
          flex-direction: column;

          padding: 14px;

          border: 1px solid rgba(255,255,255,.08);
          border-radius: 14px;

          background:
            radial-gradient(circle at 50% 0%, rgba(255,196,0,.08), transparent 38%),
            linear-gradient(180deg, rgba(255,255,255,.035), rgba(255,255,255,0)),
            #111;

          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.04),
            0 18px 34px rgba(0,0,0,.28);

          overflow: hidden;
          cursor: grab;
        }

        .seller-object-card,
.seller-object-card * {
  box-sizing: border-box;
}

        .seller-object-top {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .seller-object-title {
          min-width: 0;
        }

        .seller-object-title span {
          display: block;
          margin-bottom: 5px;

          color: #ffc400;
          font-size: 8px;
          font-weight: 950;
          letter-spacing: .08em;
        }

        .seller-object-title h3 {
          margin: 0;

          color: #f4f4f4;
          font-size: 16px;
          font-weight: 950;
          line-height: 1.05;
          text-transform: uppercase;
        }

        .seller-object-title p {
          margin: 6px 0 0;

          color: rgba(255,255,255,.45);
          font-size: 10px;
          font-weight: 800;
        }

        .seller-object-stats {
          margin-top: 28px;

          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }

        .seller-object-stats div {
          padding: 14px 12px;

          border: 1px solid rgba(255,255,255,.06);
          border-radius: 10px;

          background: rgba(0,0,0,.26);
        }

        .seller-object-stats strong {
          display: block;

          color: #f2f2f2;
          font-size: 24px;
          font-weight: 950;
          line-height: 1;
        }

        .seller-object-stats span {
          display: block;
          margin-top: 6px;

          color: rgba(255,255,255,.38);
          font-size: 8px;
          font-weight: 950;
          letter-spacing: .08em;
          text-transform: uppercase;
        }

        .seller-object-cats {
          margin-top: 18px;

          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .seller-object-cats span {
          padding: 5px 7px;

          border: 1px solid rgba(255,196,0,.18);
          border-radius: 999px;

          color: rgba(255,255,255,.62);
          font-size: 7px;
          font-weight: 950;
          letter-spacing: .05em;
          text-transform: uppercase;
        }

        .seller-object-footer {
          margin-top: auto;

          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .seller-object-footer a,
        .seller-object-footer button {
          height: 32px;

          display: flex;
          align-items: center;
          justify-content: center;

          border: 1px solid rgba(255,196,0,.25);
          border-radius: 8px;

          background: rgba(255,196,0,.08);
          color: #ffc400;

          font-size: 9px;
          font-weight: 950;
          letter-spacing: .08em;
          text-decoration: none;
          cursor: pointer;
        }

        .seller-object-footer button {
          font-family: inherit;
        }

        .seller-object-footer a:hover,
        .seller-object-footer button:hover {
          background: rgba(255,196,0,.18);
        }
      `}</style>
    </section>
  );
}

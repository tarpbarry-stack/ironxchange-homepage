function getPublicData(item = {}) {
  return (
    item?.publicData ||
    item?.attributes?.publicData ||
    {}
  );
}

function getMachinePrice(item = {}) {
  const publicData =
    getPublicData(item);

  const rawPrice =
    item?.price ??
    item?.attributes?.price ??
    publicData?.price ??
    0;

  /*
   * Sharetribe Money object:
   *
   * {
   *   amount: 14500000,
   *   currency: "USD"
   * }
   *
   * amount is cents.
   */
  if (
    rawPrice &&
    typeof rawPrice === "object" &&
    Number.isFinite(
      Number(rawPrice.amount)
    )
  ) {
    return (
      Number(rawPrice.amount) / 100
    );
  }

  if (
    typeof rawPrice === "number"
  ) {
    return rawPrice;
  }

  const numeric =
    Number(
      String(rawPrice || "")
        .replace(/[^0-9.-]/g, "")
    );

  return Number.isFinite(numeric)
    ? numeric
    : 0;
}

function formatCurrency(value) {
  return new Intl.NumberFormat(
    "en-US",
    {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }
  ).format(
    Number(value) || 0
  );
}

function normalizeObjectType(
  item = {}
) {
  return String(
    item?.objectType ||
    item?.type ||
    item?.publicData?.objectType ||
    item?.attributes
      ?.publicData
      ?.objectType ||
    ""
  )
    .trim()
    .toLowerCase();
}

function getObjectCount(
  objects = [],
  acceptedTypes = []
) {
  const accepted =
    acceptedTypes.map(
      value =>
        String(value)
          .toLowerCase()
    );

  return objects.filter(
    item =>
      accepted.includes(
        normalizeObjectType(item)
      )
  ).length;
}

function getMachineLocation(
  item = {}
) {
  const publicData =
    getPublicData(item);

  return String(
    item?.location ||
    publicData?.location ||
    publicData?.machineLocation ||
    ""
  ).trim();
}

function getEntityLogoUrl(
  currentUser
) {
  const imageId =
    currentUser
      ?.relationships
      ?.profileImage
      ?.data
      ?.id
      ?.uuid ||
    null;

  const profileImage =
    currentUser
      ?.included
      ?.find(
        item =>
          item?.type === "image" &&
          item?.id?.uuid ===
            imageId
      );

  const variants =
    profileImage
      ?.attributes
      ?.variants ||
    {};

  const nonSquareVariant =
    Object.entries(
      variants
    ).find(
      ([key, value]) =>
        value?.url &&
        !key
          .toLowerCase()
          .includes("square")
    );

  return (
    variants?.default?.url ||
    variants?.[
      "landscape-crop"
    ]?.url ||
    variants?.[
      "landscape-crop2x"
    ]?.url ||
    variants?.[
      "scaled-large"
    ]?.url ||
    variants?.[
      "scaled-medium"
    ]?.url ||
    variants?.[
      "scaled-small"
    ]?.url ||
    nonSquareVariant?.[1]?.url ||
    Object.values(
      variants
    ).find(
      value => value?.url
    )?.url ||
    null
  );
}

export default function IXIAosScoreboard({
  entity = null,
  currentUser = null,

  ownedListings = [],
  aosObjects = [],

  onAdd = null,
  onMore = null,
  moreExpanded = false
}) {
  const totalAssets =
    Array.isArray(ownedListings)
      ? ownedListings.length
      : 0;

  const assetValue =
    (
      Array.isArray(
        ownedListings
      )
        ? ownedListings
        : []
    ).reduce(
      (total, item) =>
        total +
        getMachinePrice(item),
      0
    );

  const people =
    getObjectCount(
      aosObjects,
      [
        "person",
        "employee"
      ]
    );

  const yards =
    getObjectCount(
      aosObjects,
      [
        "yard"
      ]
    );

  const machineLocations =
    new Set(
      (
        Array.isArray(
          ownedListings
        )
          ? ownedListings
          : []
      )
        .map(
          getMachineLocation
        )
        .filter(Boolean)
        .map(
          value =>
            value.toUpperCase()
        )
    ).size;

  const entityName =
    entity?.displayName ||
    currentUser
      ?.attributes
      ?.profile
      ?.displayName ||
    currentUser
      ?.profile
      ?.displayName ||
    "IXI ENTITY";

  const officeLocation =
    entity?.officeLocation ||
    entity?.location ||
    "";

  const initials =
    entityName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(
        word => word[0]
      )
      .join("")
      .toUpperCase();

  const logoUrl =
    getEntityLogoUrl(
      currentUser
    );

  return (
    <section className="aos-scorecard">
      <div className="aos-scorecard-identity">
        <div className="aos-scorecard-logo">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt=""
            />
          ) : (
            <span>
              {initials || "IXI"}
            </span>
          )}
        </div>

        <div className="aos-scorecard-name">
          <strong>
            {entityName}
          </strong>

          <span>
            {officeLocation ||
              "Office Location"}
          </span>
        </div>
      </div>

      <div className="aos-scorecard-metrics">
        <div className="aos-metric">
          <span>
            TOTAL ASSETS
          </span>

          <strong>
            {totalAssets}
          </strong>
        </div>

        <div className="aos-metric">
          <span>
            ASSET VALUE
          </span>

          <strong>
            {formatCurrency(
              assetValue
            )}
          </strong>
        </div>

        <div className="aos-metric">
          <span>
            PEOPLE
          </span>

          <strong>
            {people}
          </strong>
        </div>

        <div className="aos-metric">
          <span>
            YARDS
          </span>

          <strong>
            {yards}
          </strong>
        </div>

        <div className="aos-metric">
          <span>
            MACHINE LOCATIONS
          </span>

          <strong>
            {machineLocations}
          </strong>
        </div>
      </div>

      <div className="aos-scorecard-actions">
        <button
          type="button"
          className="aos-scorecard-action"
          aria-label="Add"
          title="Add"
          onClick={
            typeof onAdd === "function"
              ? onAdd
              : undefined
          }
        >
          <i className="fa-solid fa-plus" />
        </button>

        <button
          type="button"
          className="aos-scorecard-action"
          aria-label="More"
          aria-haspopup="dialog"
          aria-expanded={moreExpanded}
          title="More"
          onClick={
            typeof onMore === "function"
              ? onMore
              : undefined
          }
        >
          <i className="fa-solid fa-ellipsis" />
        </button>
      </div>

      <style jsx>{`
        .aos-scorecard, .aos-scorecard * { box-sizing: border-box; }
        .aos-scorecard { width: 100%; min-height: 76px; margin: 2px auto 18px; padding: 14px 16px; display: grid; grid-template-columns: minmax(210px, 1.2fr) minmax(0, 3fr) auto; gap: 22px; align-items: center; border: 1px solid #3a3a3a; border-radius: 10px; background: linear-gradient(110deg, #212121, #161616); }
        .aos-scorecard-identity { min-width: 0; display: flex; align-items: center; gap: 12px; }
        .aos-scorecard-logo { width: 44px; height: 44px; flex: 0 0 44px; display: grid; place-items: center; overflow: hidden; border: 1px solid #4c4c4c; border-radius: 6px; background: #2a2a2a; color: #ffc400; font-size: 12px; font-weight: 800; }
        .aos-scorecard-logo img { width: 100%; height: 100%; object-fit: contain; display: block; }
        .aos-scorecard-name { min-width: 0; display: flex; flex-direction: column; gap: 5px; }
        .aos-scorecard-name strong { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; color: #ececec; font-size: 12px; font-weight: 800; text-transform: uppercase; }
        .aos-scorecard-name span { color: #b5b5b5; font-size: 10px; text-transform: uppercase; }
        .aos-scorecard-metrics { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); align-items: center; min-width: 0; }
        .aos-metric { min-width: 0; display: flex; flex-direction: column; gap: 7px; border-left: 1px solid #414141; padding: 0 14px; }
        .aos-metric span { color: #b0b0b0; font-size: 9px; font-weight: 700; letter-spacing: .05em; line-height: 1.4; }
        .aos-metric strong { color: #f0edc1; font-size: 16px; font-weight: 750; line-height: 1.2; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
        .aos-scorecard-actions { display: flex; align-items: center; gap: 6px; }
        .aos-scorecard-action { width: 30px; height: 30px; display: grid; place-items: center; padding: 0; border: 1px solid #4c4c4c; border-radius: 5px; background: #2c2c2c; color: #e0c65b; font-size: 11px; cursor: pointer; }
        .aos-scorecard-action:hover { border-color: #ffc400; color: #ffc400; }
        .aos-scorecard-action:focus-visible { outline: 2px solid #ffc400; outline-offset: 2px; }
        @media (max-width: 1100px) {
          .aos-scorecard { grid-template-columns: minmax(0, 1fr) auto; gap: 16px; }
          .aos-scorecard-metrics { grid-column: 1 / -1; grid-row: 2; }
          .aos-scorecard-actions { grid-column: 2; grid-row: 1; }
          .aos-metric:first-child { border-left: 0; padding-left: 0; }
        }
        @media (max-width: 600px) {
          .aos-scorecard-metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px 0; }
          .aos-metric:nth-child(odd) { border-left: 0; padding-left: 0; }
          .aos-metric:last-child { grid-column: 1 / -1; }
        }
      `}</style>
    </section>
  );
}

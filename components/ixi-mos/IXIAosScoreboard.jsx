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
  onMore = null
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
        .aos-scorecard,
        .aos-scorecard * {
          box-sizing: border-box;
        }

        .aos-scorecard {
          width: min(
            100%,
            1320px
          );

          min-height: 92px;

          margin:
            2px
            auto
            26px;

          padding:
            14px
            18px;

          display: grid;

          grid-template-columns:
            minmax(260px, 1.25fr)
            minmax(620px, 3fr)
            auto;

          align-items: center;

          gap: 30px;

          border-top:
            1px solid
            rgba(
              255,
              255,
              255,
              .055
            );

          border-bottom:
            1px solid
            rgba(
              255,
              255,
              255,
              .07
            );

          background:
            linear-gradient(
              180deg,
              rgba(
                255,
                255,
                255,
                .018
              ),
              rgba(
                255,
                255,
                255,
                .004
              )
            );

          box-shadow:
            inset
            0
            1px
            0
            rgba(
              255,
              255,
              255,
              .018
            );
        }

        .aos-scorecard-identity {
          min-width: 0;

          display: flex;
          align-items: center;

          gap: 14px;
        }

        .aos-scorecard-logo {
          width: 54px;
          height: 54px;

          flex:
            0
            0
            54px;

          display: grid;
          place-items: center;

          overflow: hidden;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .08
            );

          border-radius: 6px;

          background:
            rgba(
              255,
              255,
              255,
              .025
            );

          color:
            rgba(
              255,
              196,
              0,
              .78
            );

          font-size: 12px;
          font-weight: 950;
          letter-spacing: .8px;
        }

        .aos-scorecard-logo img {
          width: 100%;
          height: 100%;

          object-fit: contain;

          display: block;
        }

        .aos-scorecard-name {
          min-width: 0;

          display: flex;
          flex-direction: column;

          gap: 6px;
        }

        .aos-scorecard-name strong {
          overflow: hidden;

          color:
            rgba(
              255,
              255,
              255,
              .9
            );

          font-size: 13px;
          font-weight: 950;

          letter-spacing: .25px;

          text-transform: uppercase;

          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .aos-scorecard-name span {
          color:
            rgba(
              255,
              255,
              255,
              .38
            );

          font-size: 9px;
          font-weight: 800;

          letter-spacing: .22px;

          text-transform: uppercase;
        }

        .aos-scorecard-metrics {
          min-width: 0;

          display: grid;

          grid-template-columns:
            repeat(
              5,
              minmax(90px, 1fr)
            );

          gap: 24px;

          align-items: center;
        }

        .aos-metric {
          min-width: 0;

          display: flex;
          flex-direction: column;

          gap: 7px;
        }

        .aos-metric span {
          color:
            rgba(
              255,
              255,
              255,
              .32
            );

          font-size: 7px;
          font-weight: 950;

          letter-spacing: .58px;

          text-transform: uppercase;

          white-space: nowrap;
        }

        .aos-metric strong {
          overflow: hidden;

          color:
            rgba(
              255,
              255,
              255,
              .84
            );

          font-size: 14px;
          font-weight: 950;

          line-height: 1;

          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .aos-scorecard-actions {
          display: flex;

          align-items: center;
          justify-content: flex-end;

          gap: 8px;
        }

        .aos-scorecard-action {
          width: 30px;
          height: 26px;

          display: grid;
          place-items: center;

          padding: 0;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .055
            );

          border-radius: 4px;

          background:
            rgba(
              255,
              255,
              255,
              .022
            );

          color:
            rgba(
              255,
              196,
              0,
              .72
            );

          font-size: 10px;

          cursor: pointer;
        }

        .aos-scorecard-action:hover {
          border-color:
            rgba(
              255,
              196,
              0,
              .18
            );

          background:
            rgba(
              255,
              196,
              0,
              .055
            );

          color: #ffc400;

          box-shadow:
            0
            0
            10px
            rgba(
              255,
              196,
              0,
              .08
            );
        }

        @media (
          max-width: 1100px
        ) {
          .aos-scorecard {
            grid-template-columns:
              1fr
              auto;

            gap:
              16px
              20px;
          }

          .aos-scorecard-metrics {
            grid-column:
              1 / -1;

            grid-row: 2;

            grid-template-columns:
              repeat(
                5,
                minmax(
                  80px,
                  1fr
                )
              );
          }

          .aos-scorecard-actions {
            grid-column: 2;
            grid-row: 1;
          }
        }

        @media (
          max-width: 850px
        ) {
          .aos-scorecard {
            grid-template-columns:
              1fr
              auto;

            padding: 12px;

            gap: 14px;
          }

          .aos-scorecard-logo {
            width: 46px;
            height: 46px;

            flex-basis: 46px;
          }

          .aos-scorecard-name strong {
            font-size: 11px;
          }

          .aos-scorecard-metrics {
            grid-template-columns:
              repeat(
                2,
                minmax(
                  0,
                  1fr
                )
              );

            gap:
              16px
              22px;
          }

          .aos-metric:last-child {
            grid-column:
              1 / -1;
          }
        }
      `}</style>
    </section>
  );
}

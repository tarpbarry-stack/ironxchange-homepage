import Head from "next/head";
import {
  useEffect,
  useMemo,
  useState
} from "react";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

import IXIEnvironmentRail
  from "../../components/IXIEnvironmentRail";

import IXIEntityObjectFace1
  from "../../components/ixi-entity-object/IXIEntityObjectFace1";

import IXIMachineRail
  from "../../components/IXIMachineRail";

import IXIAosCardRenderer
  from "../../components/ixi-aos/card-runtime/IXIAosCardRenderer";

import {
  loadIXIMosEnvironment
} from "../../lib/mos/loadIXIMosEnvironment";

import {
  backfillOwnedMachines
} from "../../lib/onboarding/ixiCommercialOnboardingClient";


/* =========================================
   IXI AOS ROOT HELPERS
   ========================================= */

function getPublicData(item = {}) {
  return (
    item?.publicData ||
    item?.attributes?.publicData ||
    {}
  );
}


function getListingStatus(item = {}) {
  const publicData = getPublicData(item);

  return String(
    item?.listingStatus ||
    publicData?.listingStatus ||
    item?.attributes?.state ||
    ""
  ).toLowerCase();
}


function isOwnedActiveMachine(item = {}) {
  if (!item) return false;

  const status = getListingStatus(item);

  const deleted =
    item?.deleted === true ||
    item?.attributes?.deleted === true;

  if (deleted) {
    return false;
  }

  if (
    status === "archived" ||
    status === "deleted"
  ) {
    return false;
  }

  /*
    IMPORTANT:

    We DO NOT filter on machineAccess here.

    ownedListings is already the ownership universe.

    Therefore both of these remain in AOS:

      LIVE owned machine
      PRIVATE owned machine

    Channel / visibility does not determine
    whether the Entity owns the machine.
  */

  return true;
}


function getMachinePrice(item = {}) {
  const publicData = getPublicData(item);

  const rawPrice =
    item?.price ??
    item?.attributes?.price ??
    publicData?.price ??
    0;

  /*
    Sharetribe Money object:
    {
      amount: 14500000,
      currency: "USD"
    }

    amount is cents.
  */
  if (
    rawPrice &&
    typeof rawPrice === "object" &&
    Number.isFinite(Number(rawPrice.amount))
  ) {
    return Number(rawPrice.amount) / 100;
  }

  if (typeof rawPrice === "number") {
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
  ).format(Number(value) || 0);
}


function normalizeObjectType(item = {}) {
  return String(
    item?.objectType ||
    item?.type ||
    item?.publicData?.objectType ||
    item?.attributes?.publicData?.objectType ||
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
    acceptedTypes.map(value =>
      String(value).toLowerCase()
    );

  return objects.filter(item =>
    accepted.includes(
      normalizeObjectType(item)
    )
  ).length;
}


function getMachineLocation(item = {}) {
  const publicData = getPublicData(item);

  return String(
    item?.location ||
    publicData?.location ||
    publicData?.machineLocation ||
    ""
  ).trim();
}



/* =========================================
   IXI AOS
   ========================================= */

export default function IXIAosPage() {
  const [aosEntity, setAosEntity] =
    useState(null);

  const [aosObjects, setAosObjects] =
    useState([]);

  const [ownedListings, setOwnedListings] =
    useState([]);

  const [currentUser, setCurrentUser] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

const [entityFace, setEntityFace] =
  useState(1);

const [entityBoardColor, setEntityBoardColor] =
  useState("none");

const [entityBoardOutline, setEntityBoardOutline] =
  useState(1);
  

  /* =========================================
     LOAD CANONICAL AOS ENVIRONMENT
     ========================================= */

  useEffect(() => {
    let cancelled = false;

    async function loadAos() {
      try {
        setLoading(true);
        setError("");

        try {
          await backfillOwnedMachines();
        } catch (backfillError) {
          console.error(
            "IXI AOS machine backfill failed:",
            backfillError
          );
        }

        const environment =
          await loadIXIMosEnvironment({
            includeObjects: true
          });

        if (cancelled) {
          return;
        }


const SharetribeSdk =
  await import(
    "sharetribe-flex-sdk"
  );

const sdk =
  SharetribeSdk.createInstance({
    clientId:
      process.env
        .NEXT_PUBLIC_SHARETRIBE_CLIENT_ID
  });

const currentUserResponse =
  await sdk.currentUser.show({
    include: ["profileImage"]
  });

const hydratedCurrentUser = {
  ...currentUserResponse.data.data,

  included:
    currentUserResponse
      .data
      .included || []
};

        
        if (!environment?.isAuthenticated) {
          window.location.href =
            `/login?returnTo=${encodeURIComponent(
              "/aos"
            )}`;

          return;
        }

        const listings =
          Array.isArray(
            environment?.ownedListings
          )
            ? environment.ownedListings
            : [];

        const ownedActiveMachines =
          listings.filter(
            isOwnedActiveMachine
          );

        setAosEntity(
          environment?.entity || null
        );

        setAosObjects(
          Array.isArray(
            environment?.objects
          )
            ? environment.objects
            : []
        );

        setOwnedListings(
          ownedActiveMachines
        );

       setCurrentUser(
  hydratedCurrentUser
);
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error(
          "IXI AOS load failed:",
          err
        );

        setAosEntity(null);
        setAosObjects([]);
        setOwnedListings([]);
        setCurrentUser(null);

        setError(
          err?.message ||
          "IXI AOS failed to load."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadAos();

    return () => {
      cancelled = true;
    };
  }, []);


  /* =========================================
     ENTITY SCORECARD
     ========================================= */

  const scoreboard = useMemo(() => {
    const totalAssets =
      ownedListings.length;

    const assetValue =
      ownedListings.reduce(
        (total, item) =>
          total + getMachinePrice(item),
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

    /*
      MACHINE LOCATIONS:
      actual distinct locations represented
      by the Entity's owned machine universe.
    */

    const machineLocations =
      new Set(
        ownedListings
          .map(getMachineLocation)
          .filter(Boolean)
          .map(value =>
            value.toUpperCase()
          )
      ).size;

    return {
      totalAssets,
      assetValue,
      people,
      yards,
      machineLocations
    };
  }, [
    ownedListings,
    aosObjects
  ]);


  const entityName =
    aosEntity?.displayName ||
    currentUser
      ?.attributes
      ?.profile
      ?.displayName ||
    currentUser
      ?.profile
      ?.displayName ||
    "IXI ENTITY";

  const ownerPeople = useMemo(
    () => aosObjects.filter(object =>
      ["person", "employee"].includes(
        normalizeObjectType(object)
      ) &&
      object?.metadata?.onboarding?.relationship === "owner"
    ),
    [aosObjects]
  );


 const officeLocation =
  aosEntity?.officeLocation || "";

  const initials =
    entityName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(word => word[0])
      .join("")
      .toUpperCase();

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

const logoUrl =
  variants?.default?.url ||
  variants?.["landscape-crop"]?.url ||
  variants?.["landscape-crop2x"]?.url ||
  variants?.["scaled-large"]?.url ||
  variants?.["scaled-medium"]?.url ||
  variants?.["scaled-small"]?.url ||
  nonSquareVariant?.[1]?.url ||
  Object.values(
    variants
  ).find(
    value => value?.url
  )?.url ||
  null;

  const entitySnapshotItems = [
  {
    key: "ytd-sales",
    type: "metric",
    label: "YTD Sales",
    value: 0,
    format: "currency"
  },
  {
    key: "ytd-gp",
    type: "metric",
    label: "YTD GP",
    value: 0,
    format: "currency"
  },
  {
    key: "ytd-gp-percent",
    type: "metric",
    label: "YTD GP %",
    value: 0,
    format: "percent"
  },
  {
    key: "equipment",
    type: "relationship",
    label: "Equipment",
    value: scoreboard.totalAssets
  },
  {
    key: "people",
    type: "relationship",
    label: "People",
    value: scoreboard.people
  },
  {
    key: "yards",
    type: "relationship",
    label: "Yards",
    value: scoreboard.yards
  },
  {
    key: "machine-locations",
    type: "relationship",
    label: "Machine Locations",
    value: scoreboard.machineLocations
  }
];

  function cycleEntityColor() {
  const colors = [
    "none",
    "green",
    "yellow",
    "red",
    "cyan",
    "white",
    "blue",
    "orange"
  ];

  setEntityBoardColor(current => {
    const index =
      colors.indexOf(current);

    return colors[
      (index + 1) %
      colors.length
    ];
  });
}

function cycleEntityOutline() {
  setEntityBoardOutline(current =>
    current === 1
      ? 3
      : current === 3
        ? 5
        : current === 5
          ? 0
          : 1
  );
}
  return (
    <>
      <Head>
        <title>
          IXI AOS | IronXchange
        </title>

        <link
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
          rel="stylesheet"
        />
      </Head>

      <Navbar />

      <main>
        <section className="aos-environment">
          <IXIEnvironmentRail
            activeEnvironment="AOS"
            hasAccount={!!aosEntity}
            hasRelationship={!!aosEntity}
            hasInventory={
              ownedListings.length > 0
            }
          />
        </section>


        {/* ===================================
            ENTITY SCORECARD
            =================================== */}

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
                {scoreboard.totalAssets}
              </strong>
            </div>

            <div className="aos-metric">
              <span>
                ASSET VALUE
              </span>

              <strong>
                {formatCurrency(
                  scoreboard.assetValue
                )}
              </strong>
            </div>

            <div className="aos-metric">
              <span>
                PEOPLE
              </span>

              <strong>
                {scoreboard.people}
              </strong>
            </div>

            <div className="aos-metric">
              <span>
                YARDS
              </span>

              <strong>
                {scoreboard.yards}
              </strong>
            </div>

            <div className="aos-metric">
              <span>
                MACHINE LOCATIONS
              </span>

              <strong>
                {
                  scoreboard
                    .machineLocations
                }
              </strong>
            </div>
          </div>


          <div className="aos-scorecard-actions">
            <button
              type="button"
              className="aos-scorecard-action"
              aria-label="Add"
              title="Add"
            >
              <i className="fa-solid fa-plus" />
            </button>

            <button
              type="button"
              className="aos-scorecard-action"
              aria-label="More"
              title="More"
            >
              <i className="fa-solid fa-ellipsis" />
            </button>
          </div>
        </section>


        {/* ===================================
            AOS OBJECT FIELD

            ENTITY FACE GOES HERE NEXT.
            NO CHASSIS ON ROOT.
            =================================== */}

        <section className="aos-object-field">
          {loading ? (
            <div className="aos-status">
              Loading AOS...
            </div>
          ) : null}

          {!loading && error ? (
            <div className="aos-status error">
              {error}
            </div>
          ) : null}

         {!loading &&
!error &&
aosEntity ? (
  <div
    className="aos-entity-face-mount"
    data-entity-id={
      aosEntity?.entityId || ""
    }
  >
    <div
  className={[
    "aos-entity-card",
    `board-color-${entityBoardColor}`,
    `board-outline-${entityBoardOutline}`
  ].join(" ")}
>
  <IXIEntityObjectFace1
    entity={{
      ...aosEntity,

      displayName:
        entityName,

      officeLocation:
        officeLocation,

      logoUrl:
        logoUrl
    }}

    snapshotItems={
      entitySnapshotItems
    }

    faceSize="tall"

    onAddSnapshot={() => {
      console.log(
        "AOS ADD ENTITY SNAPSHOT"
      );
    }}

    onRemoveSnapshot={item => {
      console.log(
        "AOS REMOVE ENTITY SNAPSHOT",
        item
      );
    }}

    onSnapshotOpen={item => {
      console.log(
        "AOS OPEN ENTITY SNAPSHOT",
        item
      );
    }}
  />

  <IXIMachineRail
    listing={{
      id: {
        uuid:
          aosEntity?.entityId ||
          "ixi-entity"
      },

      title:
        entityName
    }}

    saved={false}

    boardColor={
      entityBoardColor
    }

    boardOutline={
      entityBoardOutline
    }

    machineFace={
      entityFace
    }

    onCycleMachineFace={() => {
      setEntityFace(current =>
        current === 1
          ? 1
          : 1
      );
    }}

    onSendFront={() => {}}

    onSendBack={() => {}}

    onCycleColor={
      cycleEntityColor
    }

    onCycleOutline={
      cycleEntityOutline
    }

    onToggleSaved={() => {}}

    armedDestination=""

    onSendToArmedDestination={() => {}}
  />
</div>

  {ownerPeople.map(person => (
    <div
      key={person.objectId}
      className="aos-person-card"
      data-person-object-id={person.objectId}
    >
      <IXIAosCardRenderer
        object={person}
        objects={aosObjects}
        parentLabel={entityName}
      />
    </div>
  ))}
  </div>
) : null}
        </section>
      </main>

      <Footer />


      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        :global(body) {
          margin: 0;

          font-family:
            Arial,
            sans-serif;

          background: #0b0b0b;
          color: #d6d6d6;
        }


        main {
          min-height: 72vh;

          padding:
            14px
            5%
            160px;

          background:
            radial-gradient(
              circle at 50% 0%,
              rgba(255,196,0,.05),
              transparent 34%
            ),
            linear-gradient(
              180deg,
              rgba(255,255,255,.014),
              rgba(255,255,255,0)
            ),
            #0b0b0b;
        }


        .aos-environment {
          width: 100%;
          margin: 0 auto;
        }


        /* ===================================
           ENTITY SCORECARD
           =================================== */

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
            rgba(255,255,255,.055);

          border-bottom:
            1px solid
            rgba(255,255,255,.07);

          background:
            linear-gradient(
              180deg,
              rgba(255,255,255,.018),
              rgba(255,255,255,.004)
            );

          box-shadow:
            inset 0 1px 0
            rgba(255,255,255,.018);
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
            rgba(255,255,255,.08);

          border-radius: 6px;

          background:
            rgba(255,255,255,.025);

          color:
            rgba(255,196,0,.78);

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
            rgba(255,255,255,.9);

          font-size: 13px;
          font-weight: 950;

          letter-spacing: .25px;

          text-transform: uppercase;

          white-space: nowrap;
          text-overflow: ellipsis;
        }


        .aos-scorecard-name span {
          color:
            rgba(255,255,255,.38);

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
            rgba(255,255,255,.32);

          font-size: 7px;
          font-weight: 950;

          letter-spacing: .58px;

          text-transform: uppercase;

          white-space: nowrap;
        }


        .aos-metric strong {
          overflow: hidden;

          color:
            rgba(255,255,255,.84);

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
            rgba(255,255,255,.055);

          border-radius: 4px;

          background:
            rgba(255,255,255,.022);

          color:
            rgba(255,196,0,.72);

          font-size: 10px;

          cursor: pointer;
        }


        .aos-scorecard-action:hover {
          border-color:
            rgba(255,196,0,.18);

          background:
            rgba(255,196,0,.055);

          color: #FFC400;

          box-shadow:
            0 0 10px
            rgba(255,196,0,.08);
        }


        /* ===================================
           ROOT OBJECT FIELD
           =================================== */

        .aos-object-field {
          width: min(
            100%,
            1600px
          );

          min-height: 520px;

          margin: 0 auto;

          padding-top: 20px;

          position: relative;
        }


.aos-entity-face-mount {
  width: 100%;

  display: flex;

  justify-content: center;
  align-items: flex-start;

  gap: 28px;
  flex-wrap: wrap;
}

.aos-person-card {
  width: 300px;
  min-width: 300px;
  height: 475px;
}

.aos-entity-card {
  position: relative;

  width: 298px;
  min-width: 298px;
  max-width: 298px;

  height: 470px;
  min-height: 470px;
  max-height: 470px;

  border:
    1px solid
    rgba(255,255,255,.06);

  outline:
    1px solid
    rgba(255,255,255,.018);

  border-radius: 13px;

  overflow: hidden;

  background:
    linear-gradient(
      180deg,
      rgba(255,255,255,.028),
      rgba(255,255,255,0)
    ),
    #141414;

  box-shadow:
    0 1px 0
      rgba(255,255,255,.045)
      inset,
    0 18px 44px
      rgba(0,0,0,.22);
}


.aos-entity-card.board-outline-1 {
  outline-width: 1px;
}

.aos-entity-card.board-outline-3 {
  outline-width: 3px;
}

.aos-entity-card.board-outline-5 {
  outline-width: 5px;
}

.aos-entity-card.board-outline-0 {
  outline-width: 0;
}

.aos-entity-card.board-color-none {
  outline-color:
    rgba(255,255,255,.018);
}

.aos-entity-card.board-color-green {
  outline-color:
    rgba(56,161,105,.95);
}

.aos-entity-card.board-color-yellow {
  outline-color:
    rgba(255,196,0,.95);
}

.aos-entity-card.board-color-red {
  outline-color:
    rgba(229,62,62,.95);
}

.aos-entity-card.board-color-cyan {
  outline-color:
    rgba(0,194,255,.95);
}

.aos-entity-card.board-color-white {
  outline-color:
    rgba(255,255,255,.85);
}

.aos-entity-card.board-color-blue {
  outline-color:
    rgba(49,130,206,.95);
}

.aos-entity-card.board-color-orange {
  outline-color:
    rgba(249,133,18,.95);
}
        .aos-status {
          padding: 40px 20px;

          text-align: center;

          color:
            rgba(255,255,255,.38);

          font-size: 10px;
          font-weight: 800;

          letter-spacing: .4px;

          text-transform: uppercase;
        }


        .aos-status.error {
          color:
            rgba(255,110,110,.8);
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
                minmax(80px, 1fr)
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
          main {
            padding:
              18px
              4%
              60px;
          }

          .aos-scorecard {
            grid-template-columns:
              1fr
              auto;

            padding:
              12px;

            gap:
              14px;
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
                minmax(0, 1fr)
              );

            gap:
              16px
              22px;
          }

          .aos-metric:last-child {
            grid-column:
              1 / -1;
          }

          .aos-object-field {
            min-height: 400px;
          }
        }
      `}</style>
    </>
  );
}

import IXIAuctionObjectFace1
  from "../ixi-auction-object/IXIAuctionObjectFace1";

import IXIAuctionObjectFace2
  from "../ixi-auction-object/IXIAuctionObjectFace2";

import IXIAuctionObjectFace3
  from "../ixi-auction-object/IXIAuctionObjectFace3";

import IXIAuctionObjectFace4
  from "../ixi-auction-object/IXIAuctionObjectFace4";

import IXIMachineObjectFace2
  from "../ixi-machine-object/IXIMachineObjectFace2";

import IXISellerMachineObjectFace2
  from "../ixi-machine-object/IXISellerMachineObjectFace2";

import IXIMachineObjectFace3
  from "../ixi-machine-object/IXIMachineObjectFace3";

import IXIMachineObjectFace4
  from "../ixi-machine-object/IXIMachineObjectFace4";

import IXIEntityObjectFace1
  from "../ixi-entity-object/IXIEntityObjectFace1";

import IXIMachineRail
  from "../IXIMachineRail";

const COMPACT_CARD_HEIGHT = 391;
const TALL_CARD_HEIGHT = 470;
const MACHINE_RAIL_HEIGHT = 19;

const previewListing = {
  id: {
    uuid:
      "ixi-face-lab-preview"
  },

  title:
    "2021 CATERPILLAR 320 EXCAVATOR",

  year:
    "2021",

  make:
    "CATERPILLAR",

  model:
    "320",

  hours:
    "2485",

  price:
    "$185,000",

  location:
    "MIDLAND, TX",

  passportId:
    "IXI-000001",

  serialNumber:
    "CAT00320ABC123",

  stockNumber:
    "IXI-320-001",

  description:
    "Clean late-model excavator with documented hours, strong undercarriage, auxiliary hydraulics, and no known major mechanical issues.",

  sellerCompany:
    "IRONXCHANGE EQUIPMENT",

  auctionCompanyName:
    "RITCHIE BROS.",

  auctionEventName:
    "FORT WORTH REGIONAL EQUIPMENT AUCTION",

  auctionLocation:
    "FORT WORTH, TX",

  auctionDate:
    "2026-08-15",

  lotNumber:
    "1842",

  imageUrls: [
    "/images/hero-equipment-yard.jpg"
  ],

  publicData: {
    passportId:
      "IXI-000001",

    year:
      "2021",

    make:
      "CATERPILLAR",

    model:
      "320",

    hours:
      "2485",

    price:
      "$185,000",

    location:
      "MIDLAND, TX",

    serialNumber:
      "CAT00320ABC123",

    stockNumber:
      "IXI-320-001",

    description:
      "Clean late-model excavator with documented hours, strong undercarriage, auxiliary hydraulics, and no known major mechanical issues.",

    machineAccess:
      "private",

    machineChannel:
      "auction",

    lotNumber:
      "1842",

    imageUrls: [
      "/images/hero-equipment-yard.jpg"
    ]
  },

  auctionObject: {
    company: {
      name:
        "RITCHIE BROS."
    },

    event: {
      name:
        "FORT WORTH REGIONAL EQUIPMENT AUCTION",

      eventId:
        "RB-FW-081526",

      format:
        "timed-auction",

      participation:
        "online",

      startsAt:
        "2026-08-15T09:00:00-05:00",

      dateText:
        "SATURDAY, AUGUST 15, 2026",

      timeText:
        "9:00 AM CDT",

      location: {
        label:
          "FORT WORTH, TEXAS"
      }
    },

    machine: {
      year:
        "2021",

      make:
        "CATERPILLAR",

      model:
        "320",

      hours:
        "2485",

      serialNumber:
        "CAT00320ABC123",

      machineAuctionId:
        "15518062",

      lotNumber:
        "1842",

      openingBid:
        125000,

      currentBid:
        142500
    },

    lot: {
      lotNumber:
        "1842",

      machineLocation: {
        label:
          "MIDLAND, TX"
      },

      openingBid:
        125000,

      currentBid:
        142500
    },

    deadlines: {
      auctionDate:
        "2026-08-15",

      paymentDueDate:
        "5 BUSINESS DAYS",

      removalDate:
        "7 DAYS",

      scheduledCloseAt:
        "2026-08-15T14:00:00-05:00"
    },

    auctionRules: {
      buyerPremium: {
        purchaseTiers: [
          {
            minAmount:
              0,

            maxAmount:
              25000,

            cashCheckWireRatePercent:
              10,

            minimumFee:
              100
          },

          {
            minAmountExclusive:
              25000,

            maxAmount:
              75000,

            cashCheckWireRatePercent:
              5,

            minimumFee:
              2500
          },

          {
            minAmountExclusive:
              75000,

            maxAmount:
              null,

            flatFee:
              3750
          }
        ]
      },

      tax: {
        taxable:
          true
      },

      paymentDue: {
        relativeBusinessDays:
          5,

        dueText:
          "Full payment is due within 5 business days."
      },

      removal: {
        relativeDays:
          7,

        deadlineText:
          "Purchases must be removed within 7 days.",

        storageFeePerDay:
          200,

        storageFeePerItem:
          true
      }
    },

    terms: {
      basicTerms: [
        {
          code:
            "AS_IS",

          label:
            "ALL ITEMS SOLD AS IS, WHERE IS",

          confirmed:
            true
        },

        {
          code:
            "PAYMENT",

          label:
            "FULL PAYMENT REQUIRED BEFORE REMOVAL",

          confirmed:
            true
        }
      ]
    }
  }
};

const previewEntity = {
  entityId:
    "ixi-entity-preview",

  displayName:
    "STAR & SONS UNLIMITED LLC",

  officeLocation:
    "ABILENE, TX"
};

const previewEntityRelationships = [
  {
    id: "equipment",
    label: "EQUIPMENT",
    count: 19
  },
  {
    id: "people",
    label: "PEOPLE",
    count: 0
  },
  {
    id: "locations",
    label: "LOCATIONS",
    count: 3
  },
  {
    id: "attachments",
    label: "ATTACHMENTS",
    count: 6
  },
  {
    id: "jobs",
    label: "JOBS",
    count: 0
  },
  {
    id: "loans",
    label: "LOANS",
    count: 0
  }
];

const previewDealerBidPack = {
  estimatedSalePrice:
    195000,

  lowAdvertised:
    182500,

  averageAdvertised:
    205000,

  myBid:
    145000,

  freight1:
    5500,

  freight2:
    0,

  tech:
    1200,

  clean:
    850,

  parts:
    2500,

  labor:
    1800,

  preDelivery:
    750
};

function getFaceNumber(
  face = ""
) {
  const value =
    Number(
      String(face)
        .replace(
          /[^0-9]/g,
          ""
        )
    );

  return Number.isFinite(value) &&
    value > 0
    ? value
    : 1;
}


function FaceNotRegistered({
  face
}) {
  return (
    <div className="face-not-registered">
      {face} IS NOT REGISTERED

      <style jsx>{`
        .face-not-registered {
          width: 100%;
          height: 100%;

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 20px;

          color:
            rgba(
              255,
              255,
              255,
              .42
            );

          font-size: 10px;
          font-weight: 900;
          letter-spacing: .08em;

          text-align: center;
          text-transform: uppercase;
        }
      `}</style>
    </div>
  );
}

export default function IXIFacePreview({
  face = "AOF2",
  previewSize = "tall"
}) {
  const isCompact =
    previewSize === "compact";

  const cardHeight =
    isCompact
      ? COMPACT_CARD_HEIGHT
      : TALL_CARD_HEIGHT;

  const faceHeight =
    cardHeight -
    MACHINE_RAIL_HEIGHT;

  const machineFace =
    getFaceNumber(face);

  function renderSelectedFace() {
    if (face === "AOF1") {
      return (
        <IXIAuctionObjectFace1
          listing={
            previewListing
          }

          from="facelab"

          sellerMode={
            true
          }

          lotNumberValue={
            "1842"
          }

          onLotNumberChange={() => {}}
          onLotNumberKeyDown={() => {}}

          hoursValue={
            "2485"
          }

          onHoursChange={() => {}}
          onHoursKeyDown={() => {}}

          priceValue={
            "142500"
          }

          onPriceChange={() => {}}
          onPriceKeyDown={() => {}}

          locationValue={
            "MIDLAND, TX"
          }

          onLocationChange={() => {}}
          onLocationKeyDown={() => {}}
        />
      );
    }

    if (face === "AOF2") {
      return (
        <IXIAuctionObjectFace2
  listing={
    previewListing
  }

  faceSize={
    previewSize
  }

  sourceListingUrl={
    "https://example.com/auction-listing"
  }

  sellerMode={
    true
  }

  lotNumberValue={
    "1842"
  }

  onLotNumberChange={() => {}}
  onLotNumberKeyDown={() => {}}

  hoursValue={
    "2485"
  }

  onHoursChange={() => {}}
  onHoursKeyDown={() => {}}

  openingBidValue={
    "125000"
  }

  onOpeningBidChange={() => {}}
  onOpeningBidKeyDown={() => {}}
/>
      );
    }

    if (face === "AOF3") {
      return (
        <IXIAuctionObjectFace3
  listing={
    previewListing
  }

  faceSize={
    previewSize
  }

  dealerBidPack={
    previewDealerBidPack
  }

  onSaveDealerBidPack={
    nextBidPack => {
      console.log(
        "FACE LAB BID PACK",
        nextBidPack
      );
    }
  }
/>
      );
    }

    if (face === "AOF4") {
      return (
        <IXIAuctionObjectFace4
          listing={
            previewListing
          }

          dispositionBusy=""

          onAuctionDisposition={(
            listing,
            disposition
          ) => {
            console.log(
              "FACE LAB AUCTION DISPOSITION",
              {
                listing,
                disposition
              }
            );
          }}
        />
      );
    }

    if (face === "MOF2") {
      return (
        <IXIMachineObjectFace2
          listing={
            previewListing
          }
        />
      );
    }

if (face === "MOF3") {
  return (
    <IXIMachineObjectFace3
      listing={
        previewListing
      }
    />
  );
}

if (face === "MOF4") {
  return (
    <IXIMachineObjectFace4
      listing={
        previewListing
      }
    />
  );
}

    
    if (face === "PMOF2") {
      return (
        <IXISellerMachineObjectFace2
          listing={
            previewListing
          }

          descriptionValue={
            previewListing.description
          }

          onDescriptionChange={() => {}}
          onDescriptionKeyDown={() => {}}

          savingDescription={
            false
          }
        />
      );
    }

if (face === "EOF1") {
  return (
    <IXIEntityObjectFace1
      entity={previewEntity}

      snapshotItems={[
        {
          key: "equipment",
          type: "relationship",
          label: "Equipment",
          value: 19
        },
        {
          key:
    
    return (
      <FaceNotRegistered
        face={
          face
        }
      />
    );
  }

  return (
    <div
      className={[
        "face-preview-card",

        isCompact
          ? "face-preview-compact"
          : "face-preview-tall"
      ]
        .filter(Boolean)
        .join(" ")}

      style={{
        height:
          `${cardHeight}px`
      }}
    >
      <div
        className="face-preview-content"

        style={{
          height:
            `${faceHeight}px`,

          minHeight:
            `${faceHeight}px`,

          maxHeight:
            `${faceHeight}px`
        }}
      >
        {renderSelectedFace()}
      </div>

      <div className="face-preview-rail">
        <IXIMachineRail
          listing={
            previewListing
          }

          saved={
            false
          }

          boardColor="none"
          boardOutline={
            1
          }

          machineFace={
            machineFace
          }

          onCycleMachineFace={() => {}}

          onSendFront={() => {}}
          onSendBack={() => {}}

          onCycleColor={() => {}}
          onCycleOutline={() => {}}

          onToggleSaved={() => {}}

          armedDestination=""

          onSendToArmedDestination={() => {}}
        />
      </div>

      <style jsx global>{`
        .face-preview-card {
          box-sizing: border-box;

          position: relative;

          width: 298px;
          min-width: 298px;
          max-width: 298px;

          display: flex;
          flex-direction: column;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .08
            );

          border-radius:
            13px;

          background:
            linear-gradient(
              180deg,
              rgba(
                255,
                255,
                255,
                .028
              ),
              rgba(
                255,
                255,
                255,
                0
              )
            ),
            #141414;

          overflow: hidden;

          box-shadow:
            0 18px 40px
            rgba(
              0,
              0,
              0,
              .42
            );
        }

        .face-preview-content {
          box-sizing: border-box;

          position: relative;

          width: 100%;
          min-width: 0;

          flex: 0 0 auto;

          overflow: hidden;
        }

        /*
         * Face Lab controls the preview datum.
         * Production faces remain unchanged.
         *
         * Every registered face is forced to fill
         * the selected preview content chassis.
         */
        .face-preview-content > section,
        .face-preview-content > div {
          width: 100% !important;
          max-width: 100% !important;

          height: 100% !important;
          min-height: 100% !important;
          max-height: 100% !important;
        }

        .face-preview-content .aof2,
        .face-preview-content .aof3,
        .face-preview-content .aof4,
        .face-preview-content .mof2 {
          height: 100% !important;
          min-height: 100% !important;
          max-height: 100% !important;
        }

        .face-preview-rail {
          position: relative;

          width: 100%;
          height:
            ${MACHINE_RAIL_HEIGHT}px;

          min-height:
            ${MACHINE_RAIL_HEIGHT}px;

          max-height:
            ${MACHINE_RAIL_HEIGHT}px;

          margin-top: auto;

          flex:
            0 0
            ${MACHINE_RAIL_HEIGHT}px;

          z-index: 30;
        }

        .face-preview-rail > * {
          width: 100%;
        }
      `}</style>
    </div>
  );
}

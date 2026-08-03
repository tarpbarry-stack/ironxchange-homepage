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

const previewListing = {
  id: {
    uuid: "ixi-face-lab-preview"
  },

  title:
    "2021 CATERPILLAR 320 EXCAVATOR",

  year: "2021",
  make: "CATERPILLAR",
  model: "320",

  hours: "2485",
  price: "$185,000",

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
      "1842"
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

function FaceNotRegistered({
  face
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",

        display: "flex",
        alignItems: "center",
        justifyContent: "center",

        padding: "20px",

        color:
          "rgba(255,255,255,.42)",

        fontSize: "10px",
        fontWeight: 900,
        letterSpacing: ".08em",

        textAlign: "center",
        textTransform: "uppercase"
      }}
    >
      {face} is not registered
    </div>
  );
}

export default function IXIFacePreview({
  face = "AOF2"
}) {
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

        hoursValue={
          "2485"
        }

        priceValue={
          "142500"
        }

        locationValue={
          "MIDLAND, TX"
        }
      />
    );
  }

  if (face === "AOF2") {
    return (
      <IXIAuctionObjectFace2
        listing={
          previewListing
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

        hoursValue={
          "2485"
        }

        openingBidValue={
          "125000"
        }
      />
    );
  }

  if (face === "AOF3") {
    return (
      <IXIAuctionObjectFace3
        listing={
          previewListing
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

  if (face === "PMOF2") {
    return (
      <IXISellerMachineObjectFace2
        listing={
          previewListing
        }

        descriptionValue={
          previewListing.description
        }
      />
    );
  }

  return (
    <FaceNotRegistered
      face={
        face
      }
    />
  );
}

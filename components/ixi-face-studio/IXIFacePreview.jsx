import IXIAuctionObjectFace2
  from "../ixi-auction-object/IXIAuctionObjectFace2";

import IXIAuctionObjectFace3
  from "../ixi-auction-object/IXIAuctionObjectFace3";

import IXIAuctionObjectFace4
  from "../ixi-auction-object/IXIAuctionObjectFace4";

import IXIMachineObjectFace2
  from "../ixi-machine-object/IXIMachineObjectFace2";

const previewListing = {
  id: {
    uuid: "preview"
  },

  title:
    "2021 CATERPILLAR 320",

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
    "CAT00320ABC",

  publicData: {
    passportId:
      "IXI-000001",

    machineAccess:
      "private",

    machineChannel:
      "private"
  }
};

export default function IXIFacePreview({
  face = "AOF2"
}) {

  switch (face) {

    case "AOF2":

      return (
        <IXIAuctionObjectFace2
          listing={previewListing}
          sellerMode={true}
        />
      );

    case "AOF3":

      return (
        <IXIAuctionObjectFace3
          listing={previewListing}
        />
      );

    case "AOF4":

      return (
        <IXIAuctionObjectFace4
          listing={previewListing}
        />
      );

    case "MOF2":

      return (
        <IXIMachineObjectFace2
          listing={previewListing}
        />
      );

    default:

      return (
        <div
          style={{
            color: "#888",
            padding: 20
          }}
        >
          Face not registered
        </div>
      );
  }
}

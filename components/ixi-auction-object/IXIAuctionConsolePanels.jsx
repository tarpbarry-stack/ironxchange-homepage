import IXIAuctionObjectFace1
  from "./IXIAuctionObjectFace1";

import IXIAuctionObjectFace2
  from "./IXIAuctionObjectFace2";

import IXIAuctionObjectFace3
  from "./IXIAuctionObjectFace3";

import IXIAuctionObjectFace4
  from "./IXIAuctionObjectFace4";

export function renderAuctionPanel({
  face = 1,

  listing = {},
  sourceListingUrl = "",
  from = "browse",

  handleCardClick,

  dragHandleProps,

  lotNumberValue,
  onLotNumberChange,
  onLotNumberKeyDown,

  hoursValue,
  onHoursChange,
  onHoursKeyDown,

  priceValue,
  onPriceChange,
  onPriceKeyDown,

  locationValue,
  onLocationChange,
  onLocationKeyDown,

  dealerBidPack = {},
  onSaveDealerBidPack,

  auctionDispositionBusy = "",
  onAuctionDisposition
}) {
  const normalizedFace =
    Number(face) === 4
      ? 4
      : Number(face) === 3
        ? 3
        : Number(face) === 2
          ? 2
          : 1;

  if (normalizedFace === 4) {
    return (
      <IXIAuctionObjectFace4
        listing={listing}
        dispositionBusy={
          auctionDispositionBusy
        }
        onAuctionDisposition={
          onAuctionDisposition
        }
        dragHandleProps={
          dragHandleProps
        }
      />
    );
  }

  if (normalizedFace === 3) {
    return (
      <IXIAuctionObjectFace3
        listing={listing}
        dealerBidPack={
          dealerBidPack
        }
        onSaveDealerBidPack={
          onSaveDealerBidPack
        }
        dragHandleProps={
          dragHandleProps
        }
      />
    );
  }

  if (normalizedFace === 2) {
    return (
      <IXIAuctionObjectFace2
        listing={listing}
        sourceListingUrl={
          sourceListingUrl
        }
        dragHandleProps={
          dragHandleProps
        }

        sellerMode={true}

        lotNumberValue={
          lotNumberValue
        }
        onLotNumberChange={
          onLotNumberChange
        }
        onLotNumberKeyDown={
          onLotNumberKeyDown
        }

        hoursValue={
          hoursValue
        }
        onHoursChange={
          onHoursChange
        }
        onHoursKeyDown={
          onHoursKeyDown
        }

        openingBidValue={
          priceValue
        }
        onOpeningBidChange={
          onPriceChange
        }
        onOpeningBidKeyDown={
          onPriceKeyDown
        }
      />
    );
  }

  return (
    <IXIAuctionObjectFace1
      listing={listing}
      from={from}
      onListingClick={
        handleCardClick
      }

      sellerMode={true}

      lotNumberValue={
        lotNumberValue
      }
      onLotNumberChange={
        onLotNumberChange
      }
      onLotNumberKeyDown={
        onLotNumberKeyDown
      }

      hoursValue={
        hoursValue
      }
      onHoursChange={
        onHoursChange
      }
      onHoursKeyDown={
        onHoursKeyDown
      }

      priceValue={
        priceValue
      }
      onPriceChange={
        onPriceChange
      }
      onPriceKeyDown={
        onPriceKeyDown
      }

      locationValue={
        locationValue
      }
      onLocationChange={
        onLocationChange
      }
      onLocationKeyDown={
        onLocationKeyDown
      }
    />
  );
}

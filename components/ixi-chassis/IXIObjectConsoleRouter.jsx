import IXIAuctionObjectConsole
  from "../ixi-auction-object/IXIAuctionObjectConsole";

import IXIMarketplaceObjectConsole
  from "../ixi-machine-object/IXIMarketplaceObjectConsole";

export default function IXIObjectConsoleRouter({
  cardFamily = "marketplace",
  ...props
}) {
  if (
    cardFamily === "auction"
  ) {
    return (
      <IXIAuctionObjectConsole
        {...props}
      />
    );
  }

  return (
    <IXIMarketplaceObjectConsole
      {...props}
    />
  );
}

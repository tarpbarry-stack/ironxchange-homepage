import IXIAuctionObjectConsole
  from "../ixi-auction-object/IXIAuctionObjectConsole";

import IXIMarketplaceObjectConsole
  from "../ixi-machine-object/IXIMarketplaceObjectConsole";

import IXIPrivateObjectConsole
  from "../ixi-private-object/IXIPrivateObjectConsole";

export default function IXIObjectConsoleRouter({
  cardFamily = "marketplace",
  cardContext = "workspace",
  ...props
}) {
  /*
   * Inventory / Enterprise always uses
   * the Private console regardless of
   * marketplace family.
   */
  if (
    cardContext === "inventory" ||
    cardContext === "enterprise"
  ) {
    return (
      <IXIPrivateObjectConsole
        {...props}
      />
    );
  }

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

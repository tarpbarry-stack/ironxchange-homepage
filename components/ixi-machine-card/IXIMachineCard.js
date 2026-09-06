import dynamic from "next/dynamic";
import MarketplaceListingCard
  from "./marketplace/MarketplaceListingCard";

import {
  getMachineCardFamily
} from "./getMachineCardFamily";

import resolveMachineCardPresentation
  from "./resolveMachineCardPresentation";

function MachineCardBundleFallback() {
  return (
    <div
      aria-label="Loading machine card"
      style={{
        width: "100%",
        height: "100%",
        minHeight: 400,
        border: "1px solid rgba(255,255,255,.08)",
        borderRadius: 8,
        background: "#080808"
      }}
    />
  );
}

const AuctionListingCard = dynamic(
  () => import("./auction/AuctionListingCard"),
  { ssr: false, loading: MachineCardBundleFallback }
);

const PrivateListingCard = dynamic(
  () => import("./private/PrivateListingCard"),
  { ssr: false, loading: MachineCardBundleFallback }
);

const IXIOwnedPrivateListingRuntime = dynamic(
  () => import("./private/IXIOwnedPrivateListingRuntime"),
  { ssr: false, loading: MachineCardBundleFallback }
);

export default function IXIMachineCard({
  cardContext = "workspace",
  ...props
}) {
  const cardFamily =
    getMachineCardFamily(props.listing);

  const presentation =
    resolveMachineCardPresentation({
      cardFamily,
      cardContext,
      sellerMode: props.sellerMode
    });

  if (!props.suppressFamilyLog) {
    console.log(
      "IXI MACHINE CARD FAMILY",
      {
        listingId:
          props.listing?.id?.uuid ||
          props.listing?.id ||
          "",
        cardFamily,
        cardContext,
        presentation,
        showMachineRail:
          props.showMachineRail
      }
    );
  }

  if (cardFamily === "auction") {
    return (
      <AuctionListingCard
        {...props}
        cardContext={cardContext}
        presentation={presentation}
      />
    );
  }

  if (cardFamily === "private") {
    if (presentation === "seller") {
      return (
        <IXIOwnedPrivateListingRuntime
          {...props}
          cardContext={cardContext}
          presentation={presentation}
        />
      );
    }

    return (
      <PrivateListingCard
        {...props}
        cardContext={cardContext}
        presentation={presentation}
      />
    );
  }

  return (
    <MarketplaceListingCard
      {...props}
      cardContext={cardContext}
      presentation={presentation}
    />
  );
}

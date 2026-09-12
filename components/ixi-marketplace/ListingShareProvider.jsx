import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";

import {
  getMarketplaceDistributionListingId
} from "../../lib/marketplace/distributionLinks";
import {
  captureMarketplaceIntelligence
} from "../../lib/marketplace/cardIntelligence";
import {
  IXI_PASSPORT_EMAIL_EVENT
} from "../../lib/marketplace/passportEmailEvents";

const PassportEmailDialog = dynamic(
  () => import("../passport/PassportEmailDialog"),
  { ssr: false }
);

function snapshotListing(listing = {}) {
  const publicData =
    listing.publicData || listing.attributes?.publicData || {};

  return {
    id: getMarketplaceDistributionListingId(listing),
    title:
      listing.title || listing.attributes?.title || "Equipment listing",
    passportId: listing.passportId || publicData.passportId || ""
  };
}

export default function ListingShareProvider({ children }) {
  const [listing, setListing] = useState(null);

  const closeDialog = useCallback(() => {
    setListing(null);
  }, []);

  useEffect(() => {
    function handlePassportEmailOpen(event) {
      const nextListing = snapshotListing(event?.detail?.listing || {});
      if (!nextListing.id) return;

      setListing(nextListing);
      captureMarketplaceIntelligence("listing_share_composer_opened", {
        listing_id: nextListing.id,
        channel: "email",
        result: "opened"
      });
    }

    window.addEventListener(
      IXI_PASSPORT_EMAIL_EVENT,
      handlePassportEmailOpen
    );

    return () => {
      window.removeEventListener(
        IXI_PASSPORT_EMAIL_EVENT,
        handlePassportEmailOpen
      );
    };
  }, []);

  return (
    <>
      {children}
      <PassportEmailDialog
        open={Boolean(listing)}
        onClose={closeDialog}
        listingId={listing?.id || ""}
        passportId={listing?.passportId || ""}
        title={listing?.title || "Equipment listing"}
      />
    </>
  );
}

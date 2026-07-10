// /scripts/backfillPassports.mjs

import { createRequire } from "module";
import { loadEnvConfig } from "@next/env";

import {
  attachPassportToIntegrationListing
} from "../lib/passport/attachPassportToIntegrationListing.js";

/*
 * Load .env.local, .env.production, and the normal Next.js environment files.
 */
loadEnvConfig(process.cwd());

const require = createRequire(import.meta.url);

const integrationSdk = require(
  "sharetribe-flex-integration-sdk"
);

const CLIENT_ID =
  process.env.SHARETRIBE_CLIENT_ID;

const CLIENT_SECRET =
  process.env.SHARETRIBE_CLIENT_SECRET;

if (!CLIENT_ID) {
  throw new Error(
    "Missing SHARETRIBE_CLIENT_ID"
  );
}

if (!CLIENT_SECRET) {
  throw new Error(
    "Missing SHARETRIBE_CLIENT_SECRET"
  );
}

const sdk = integrationSdk.createInstance({
  clientId: CLIENT_ID,
  clientSecret: CLIENT_SECRET
});

const PAGE_SIZE = 100;

function getListingId(listing = {}) {
  return (
    listing?.id?.uuid ||
    listing?.id ||
    listing?.attributes?.id?.uuid ||
    ""
  );
}

function getListingTitle(listing = {}) {
  return (
    listing?.attributes?.title ||
    listing?.title ||
    "Untitled Listing"
  );
}

function getPublicData(listing = {}) {
  return (
    listing?.attributes?.publicData ||
    listing?.publicData ||
    {}
  );
}

function extractError(error) {
  return (
    error?.data?.errors?.[0]?.title ||
    error?.data?.errors?.[0]?.detail ||
    error?.data?.errors?.[0]?.code ||
    error?.message ||
    "Unknown Passport backfill error"
  );
}

async function fetchAllListings() {
  const listings = [];

  let page = 1;

  while (true) {
    console.log(
      `Fetching Sharetribe listings page ${page}...`
    );

    const response = await sdk.listings.query({
      page,
      perPage: PAGE_SIZE
    });

    const pageListings =
      response?.data?.data || [];

    if (!Array.isArray(pageListings)) {
      throw new Error(
        `Unexpected listings response on page ${page}`
      );
    }

    listings.push(...pageListings);

    console.log(
      `Page ${page}: ${pageListings.length} listings`
    );

    /*
     * Stop when the returned page contains fewer records
     * than the requested page size.
     */
    if (pageListings.length < PAGE_SIZE) {
      break;
    }

    page += 1;
  }

  return listings;
}

async function backfillPassports() {
  console.log("");
  console.log("========================================");
  console.log("IRONXCHANGE PASSPORT BACKFILL");
  console.log("========================================");
  console.log("");

  const listings = await fetchAllListings();

  console.log("");
  console.log(`Listings discovered: ${listings.length}`);
  console.log("");

  const report = {
    discovered: listings.length,
    processed: 0,
    existing: 0,
    attached: 0,
    failed: 0,
    failures: []
  };

  for (let index = 0; index < listings.length; index += 1) {
    const listing = listings[index];

    const listingId = getListingId(listing);
    const title = getListingTitle(listing);
    const publicData = getPublicData(listing);

    const existingPassportId =
      publicData?.passportId || "";

    console.log("----------------------------------------");
    console.log(
      `[${index + 1}/${listings.length}] ${title}`
    );
    console.log(`Listing: ${listingId || "NO ID"}`);

    if (!listingId) {
      const error =
        "Listing did not contain a usable listing ID";

      console.error(`FAILED: ${error}`);

      report.failed += 1;
      report.processed += 1;

      report.failures.push({
        listingId: null,
        title,
        error
      });

      continue;
    }

    try {
      /*
       * This is the existing authority path.
       *
       * The adapter:
       * 1. Calls the Passport Ensure engine.
       * 2. Receives the permanent Passport.
       * 3. Writes passportId and passportUrl to Sharetribe.
       *
       * Ensure is idempotent, so rerunning this script is safe.
       */
      const passport =
        await attachPassportToIntegrationListing({
          sdk,
          listingId
        });

      const passportId =
        passport?.passportId || "";

      const passportUrl =
        passport?.passportUrl || "";

      const status =
        existingPassportId
          ? "EXISTING"
          : "ATTACHED";

      if (existingPassportId) {
        report.existing += 1;
      } else {
        report.attached += 1;
      }

      report.processed += 1;

      console.log(`Passport: ${passportId}`);
      console.log(`URL: ${passportUrl}`);
      console.log(`Status: ${status}`);
    } catch (error) {
      const message = extractError(error);

      report.failed += 1;
      report.processed += 1;

      report.failures.push({
        listingId,
        title,
        error: message
      });

      console.error(`FAILED: ${message}`);
    }
  }

  console.log("");
  console.log("========================================");
  console.log("PASSPORT BACKFILL COMPLETE");
  console.log("========================================");
  console.log(`Discovered: ${report.discovered}`);
  console.log(`Processed:  ${report.processed}`);
  console.log(`Attached:   ${report.attached}`);
  console.log(`Existing:   ${report.existing}`);
  console.log(`Failed:     ${report.failed}`);

  if (report.failures.length > 0) {
    console.log("");
    console.log("FAILURES");
    console.log("----------------------------------------");

    for (const failure of report.failures) {
      console.log(
        JSON.stringify(failure, null, 2)
      );
    }
  }

  console.log("");

  /*
   * Return a failing process status only after every listing
   * has been attempted.
   */
  if (report.failed > 0) {
    process.exitCode = 1;
  }
}

backfillPassports().catch(error => {
  console.error("");
  console.error("PASSPORT BACKFILL FATAL ERROR");
  console.error(extractError(error));
  console.error("");

  process.exitCode = 1;
});

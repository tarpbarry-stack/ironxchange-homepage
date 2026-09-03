import {
  createInstance,
  types as sdkTypes
} from "sharetribe-flex-integration-sdk";

const { UUID } = sdkTypes;

function clean(value = "") {
  return String(value || "").trim();
}

function normalizePassportId(value = "") {
  return clean(value)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function getIXCoreBase() {
  return (
    process.env.IX_CORE_BASE_URL ||
    "http://3.131.46.49:4100"
  ).replace(/\/+$/, "");
}

function createIntegrationSdk() {
  const clientId =
    process.env.SHARETRIBE_CLIENT_ID;

  const clientSecret =
    process.env.SHARETRIBE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing Sharetribe Integration API credentials"
    );
  }

  return createInstance({
    clientId,
    clientSecret
  });
}

function getListingResource(response) {
  return (
    response?.data?.data ||
    response?.data ||
    null
  );
}

async function readJsonResponse(response) {
  const text =
    await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      rawText: text
    };
  }
}

async function loadPassport(passportId) {
  const response =
    await fetch(
      `${getIXCoreBase()}/passport/${encodeURIComponent(
        passportId
      )}`
    );

  const payload =
    await readJsonResponse(
      response
    );

  if (!response.ok) {
    const error =
      new Error(
        payload?.error ||
        "Passport not found"
      );

    error.status =
      response.status;

    throw error;
  }

  const passport =
    payload?.passport ||
    null;

  if (!passport) {
    const error =
      new Error(
        "Passport response did not contain a Passport"
      );

    error.status = 404;

    throw error;
  }

  return passport;
}

async function loadMachineListing(
  listingId
) {
  const integrationSdk =
    createIntegrationSdk();

  const response =
    await integrationSdk
      .listings
      .show({
        id: new UUID(
          String(listingId)
        ),
        include: [
          "author",
          "author.profileImage",
          "images"
        ]
      });

  const listing =
    getListingResource(
      response
    );

  if (!listing) {
    const error =
      new Error(
        "Machine listing not found"
      );

    error.status = 404;

    throw error;
  }

  return {
    listing,
    included:
      response?.data?.included ||
      []
  };
}

function getMachineMediaKey({
  listing,
  passport
}) {
  const publicData =
    listing?.attributes?.publicData ||
    {};

  return clean(
    publicData?.ixiMedia?.machineKey ||
    publicData?.ixiMediaMachineKey ||
    publicData?.machineKey ||
    passport?.passportId ||
    passport?.sourceId
  );
}

async function loadMachineMediaManifest(
  machineKey
) {
  if (!machineKey) {
    return null;
  }

  try {
    const response =
      await fetch(
        `${getIXCoreBase()}/media/machines/${encodeURIComponent(
          machineKey
        )}`
      );

    const payload =
      await readJsonResponse(
        response
      );

    if (!response.ok) {
      return null;
    }

    return (
      payload?.manifest ||
      payload?.machine ||
      null
    );
  } catch (error) {
    console.warn(
      "MACHINE FILE MEDIA MANIFEST UNAVAILABLE:",
      machineKey,
      error?.message || error
    );

    return null;
  }
}

export default async function handler(
  req,
  res
) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({
        ok: false,
        error:
          "Method not allowed"
      });
  }

  const passportId =
    normalizePassportId(
      req.query.passportId
    );

  if (!passportId) {
    return res
      .status(400)
      .json({
        ok: false,
        error:
          "Passport ID is required"
      });
  }

  try {
    /*
     * 1. Resolve permanent machine identity.
     */
    const passport =
      await loadPassport(
        passportId
      );

    const listingId =
      clean(
        passport.sourceId
      );

    if (!listingId) {
      return res
        .status(409)
        .json({
          ok: false,
          error:
            "Passport does not contain a sourceId"
        });
    }

    /*
     * 2. Resolve exact Sharetribe Machine Object.
     *
     * IMPORTANT:
     * This is NOT a marketplace query.
     *
     * No search.
     * No title matching.
     * No channel filtering.
     */
    const {
      listing,
      included
    } =
      await loadMachineListing(
        listingId
      );

    /*
     * 3. Resolve IXI Media independently.
     *
     * Machine identity remains Passport-authoritative.
     * Sharetribe remains the listing source.
     * IXI Media is the preferred photo manifest when present.
     * Failure to load media is non-fatal; Sharetribe images remain fallback.
     */
    const mediaMachineKey =
      getMachineMediaKey({
        listing,
        passport
      });

    const mediaManifest =
      await loadMachineMediaManifest(
        mediaMachineKey
      );

    return res
      .status(200)
      .json({
        ok: true,

        machine: {
          passportId:
            passport.passportId,

          passport,

          listing,
          included,

          mediaMachineKey,
          mediaManifest
        }
      });
  } catch (error) {
    console.error(
      "MACHINE FILE RESOLVER ERROR:",
      error
    );

    return res
      .status(
        Number(
          error?.status
        ) || 500
      )
      .json({
        ok: false,
        error:
          error?.message ||
          "Machine could not be resolved"
      });
  }
}

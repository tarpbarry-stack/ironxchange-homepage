import {
  createInstance,
  types as sdkTypes
} from "sharetribe-flex-integration-sdk";

const { UUID } = sdkTypes;

const ALLOWED_ACTIONS = new Set([
  "move-private",
  "archive",
  "hard-delete"
]);

function clean(value = "") {
  return String(value || "").trim();
}

function getOrigin(req) {
  const forwardedProtocol =
    clean(
      req.headers["x-forwarded-proto"]
    )
      .split(",")[0]
      .trim();

  const protocol =
    forwardedProtocol ||
    (
      process.env.NODE_ENV ===
      "production"
        ? "https"
        : "http"
    );

  const host =
    clean(
      req.headers["x-forwarded-host"]
    )
      .split(",")[0]
      .trim() ||
    clean(req.headers.host);

  if (!host) {
    throw new Error(
      "Unable to determine application host"
    );
  }

  return `${protocol}://${host}`;
}

function getIXCoreBase() {
  return (
    process.env.IX_CORE_INTERNAL_URL ||
    process.env.IX_CORE_BASE_URL ||
    "http://127.0.0.1:4100"
  ).replace(/\/+$/, "");
}

  return String(baseUrl)
    .replace(/\/+$/, "");
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

function getListingResource(
  response
) {
  return (
    response?.data?.data ||
    response?.data ||
    null
  );
}

function getListingPublicData(
  listing = {}
) {
  return (
    listing?.attributes?.publicData ||
    listing?.publicData ||
    {}
  );
}

function getListingMetadata(
  listing = {}
) {
  return (
    listing?.attributes?.metadata ||
    listing?.metadata ||
    {}
  );
}

function getMachineKey({
  listing,
  publicData,
  body
}) {
  return clean(
    body?.machineKey ||
    body?.passportId ||
    publicData?.passportId ||
    publicData?.ixiPassportId ||
    publicData?.machineKey ||
    publicData?.ixiMachineKey ||
    publicData?.mediaMachineKey ||
    listing?.passportId ||
    listing?.machineKey
  );
}

async function readJsonResponse(
  response
) {
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

async function fetchJson(
  url,
  options = {}
) {
  const response =
    await fetch(url, options);

  const data =
    await readJsonResponse(
      response
    );

  if (!response.ok) {
    throw new Error(
      data?.error ||
      data?.message ||
      `Request failed with status ${response.status}`
    );
  }

  return data;
}

async function loadListing({
  integrationSdk,
  listingId
}) {
  const response =
    await integrationSdk
      .listings
      .show({
        id: new UUID(listingId)
      });

  const listing =
    getListingResource(
      response
    );

  if (!listing) {
    throw new Error(
      "Auction listing not found"
    );
  }

  return listing;
}

async function updateListingDisposition({
  integrationSdk,
  listingId,
  action,
  listing
}) {
  const currentPublicData =
    getListingPublicData(listing);

  const currentMetadata =
    getListingMetadata(listing);

  const changedAt =
    new Date().toISOString();

  let patch;

  if (
    action === "move-private"
  ) {
    patch = {
      machineAccess: "private",
      machineChannel: "private",

      listingStatus: "active",

      auctionWorkStatus:
        "purchased",

      auctionDisposition:
        "move-private",

      auctionDispositionAt:
        changedAt,

      purchasedFromAuction:
        true
    };
  } else {
    patch = {
      machineAccess: "private",
      machineChannel:
        "auction-archive",

      listingStatus:
        "archived",

      auctionWorkStatus:
        "archived",

      auctionDisposition:
        "archive",

      auctionDispositionAt:
        changedAt,

      auctionArchive: {
        ...(
          currentPublicData
            ?.auctionArchive ||
          {}
        ),

        archivedAt:
          changedAt,

        mediaPolicy:
          "hero-only"
      }
    };
  }

  await integrationSdk
    .listings
    .update({
      id:
        new UUID(listingId),

      publicData: {
        ...currentPublicData,
        ...patch
      },

      metadata: {
        ...currentMetadata,
        ...patch,

        machinePlacementVersion:
          Number(
            currentMetadata
              ?.machinePlacementVersion ||
            0
          ) + 1
      }
    });

  return {
    listingId,
    action,
    changedAt,
    machineAccess:
      patch.machineAccess,
    machineChannel:
      patch.machineChannel,
    listingStatus:
      patch.listingStatus
  };
}

async function getMachineManifest(
  machineKey
) {
  if (!machineKey) {
    return null;
  }

  const url =
    `${getIXCoreBase()}` +
    `/media/machines/` +
    `${encodeURIComponent(machineKey)}`;

  const response =
    await fetch(url);

  if (
    response.status === 404
  ) {
    return null;
  }

  const data =
    await readJsonResponse(
      response
    );

  if (!response.ok) {
    throw new Error(
      data?.error ||
      "Unable to read IXI media manifest"
    );
  }

  return (
    data?.manifest ||
    data?.machine ||
    data
  );
}

function getManifestMedia(
  manifest = {}
) {
  return Array.isArray(
    manifest?.media
  )
    ? manifest.media
    : [];
}

function getHeroMediaId(
  manifest = {}
) {
  return clean(
    manifest?.heroMediaId ||
    manifest?.hero?.mediaId ||
    manifest?.hero?.id
  );
}

async function retireMedia({
  machineKey,
  mediaId
}) {
  const url =
    `${getIXCoreBase()}` +
    `/media/machines/` +
    `${encodeURIComponent(machineKey)}` +
    `/media/` +
    `${encodeURIComponent(mediaId)}`;

  return fetchJson(url, {
    method: "DELETE",

    headers: {
      "Content-Type":
        "application/json"
    }
  });
}

async function permanentlyDeleteRetiredMedia({
  machineKey,
  mediaId,
  reason
}) {
  const url =
    `${getIXCoreBase()}` +
    `/admin/media/machines/` +
    `${encodeURIComponent(machineKey)}` +
    `/retired/` +
    `${encodeURIComponent(mediaId)}` +
    `/permanent-delete`;

  return fetchJson(url, {
    method: "POST",

    headers: {
      "Content-Type":
        "application/json"
    },

    body: JSON.stringify({
      confirmation:
        "PERMANENT_DELETE",

      reason,

      deletedBy:
        "auction-object-disposition"
    })
  });
}

async function reduceMediaToHero({
  machineKey
}) {
  const manifest =
    await getMachineManifest(
      machineKey
    );

  if (!manifest) {
    return {
      machineKey,
      found: false,
      retainedMediaId: "",
      deletedMediaIds: []
    };
  }

  const media =
    getManifestMedia(
      manifest
    );

  if (media.length <= 1) {
    return {
      machineKey,
      found: true,
      retainedMediaId:
        getHeroMediaId(
          manifest
        ) ||
        clean(
          media[0]?.mediaId
        ),
      deletedMediaIds: []
    };
  }

  const heroMediaId =
    getHeroMediaId(
      manifest
    ) ||
    clean(
      media[0]?.mediaId
    );

  if (!heroMediaId) {
    throw new Error(
      "Media manifest has no valid hero"
    );
  }

  const mediaToDelete =
    media.filter(item => {
      return (
        clean(item?.mediaId) &&
        clean(item?.mediaId) !==
          heroMediaId
      );
    });

  const deletedMediaIds = [];

  for (
    const item of mediaToDelete
  ) {
    const mediaId =
      clean(item.mediaId);

    await retireMedia({
      machineKey,
      mediaId
    });

    await permanentlyDeleteRetiredMedia({
      machineKey,
      mediaId,
      reason:
        "Auction result archived with hero-only media policy"
    });

    deletedMediaIds.push(
      mediaId
    );
  }

  return {
    machineKey,
    found: true,
    retainedMediaId:
      heroMediaId,
    deletedMediaIds
  };
}

async function permanentlyDeleteAllMedia({
  machineKey
}) {
  const manifest =
    await getMachineManifest(
      machineKey
    );

  if (!manifest) {
    return {
      machineKey,
      found: false,
      deletedMediaIds: []
    };
  }

  const media =
    getManifestMedia(
      manifest
    );

  const deletedMediaIds = [];

  for (const item of media) {
    const mediaId =
      clean(item?.mediaId);

    if (!mediaId) {
      continue;
    }

    await retireMedia({
      machineKey,
      mediaId
    });

    await permanentlyDeleteRetiredMedia({
      machineKey,
      mediaId,
      reason:
        "Auction object permanently deleted"
    });

    deletedMediaIds.push(
      mediaId
    );
  }

  return {
    machineKey,
    found: true,
    deletedMediaIds
  };
}

async function permanentlyDeletePassport({
  listingId
}) {
  const url =
    `${getIXCoreBase()}` +
    `/passport/by-source/` +
    `sharetribe-listing/` +
    `${encodeURIComponent(listingId)}`;

  return fetchJson(url, {
    method: "DELETE",

    headers: {
      "Content-Type":
        "application/json"
    },

    body: JSON.stringify({
      confirmation:
        "PERMANENT_DELETE"
    })
  });
}

async function callExistingDeleteRoute({
  req,
  listingId
}) {
  const origin =
    getOrigin(req);

  const response =
    await fetch(
      `${origin}/api/delete-listing`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          cookie:
            req.headers.cookie ||
            "",

          authorization:
            req.headers
              .authorization ||
            ""
        },

        body: JSON.stringify({
          listingId
        })
      }
    );

 const result =
  await response.json();

if (!response.ok) {
  const message =
    result?.error ||
    "Auction disposition failed";

  throw new Error(
    result?.stage
      ? `${result.stage}: ${message}`
      : message
  );
}

  return result;
}

export default async function handler(
  req,
  res
) {
  if (
    req.method !== "POST"
  ) {
    res.setHeader(
      "Allow",
      "POST"
    );

    return res.status(405).json({
      ok: false,
      error:
        "Method not allowed"
    });
  }

  const listingId =
    clean(
      req.body?.listingId
    );

  const action =
    clean(
      req.body?.action
    );

  if (!listingId) {
    return res.status(400).json({
      ok: false,
      error:
        "Missing listingId"
    });
  }

  if (
    !ALLOWED_ACTIONS.has(
      action
    )
  ) {
    return res.status(400).json({
      ok: false,
      error:
        "Invalid auction disposition action"
    });
  }

  try {
    const integrationSdk =
      createIntegrationSdk();

    const listing =
      await loadListing({
        integrationSdk,
        listingId
      });

    const publicData =
      getListingPublicData(
        listing
      );

    const machineKey =
      getMachineKey({
        listing,
        publicData,
        body: req.body
      });

    if (
      action === "move-private"
    ) {
      const disposition =
        await updateListingDisposition({
          integrationSdk,
          listingId,
          action,
          listing
        });

      return res.status(200).json({
        ok: true,
        action,
        listingId,
        machineKey:
          machineKey || null,
        disposition,
        message:
          "Moved to private inventory"
      });
    }

    if (
      action === "archive"
    ) {
      const mediaResult =
        machineKey
          ? await reduceMediaToHero({
              machineKey
            })
          : {
              found: false,
              skipped: true,
              reason:
                "Listing has no IXI media identity"
            };

      const disposition =
        await updateListingDisposition({
          integrationSdk,
          listingId,
          action,
          listing
        });

      return res.status(200).json({
        ok: true,
        action,
        listingId,
        machineKey:
          machineKey || null,
        disposition,
        media:
          mediaResult,
        message:
          "Auction result archived"
      });
    }

    const mediaResult =
      machineKey
        ? await permanentlyDeleteAllMedia({
            machineKey
          })
        : {
            found: false,
            skipped: true,
            reason:
              "Listing has no IXI media identity"
          };

const passportDelete =
  await permanentlyDeletePassport({
    listingId
  });
    
    const listingDelete =
      await callExistingDeleteRoute({
        req,
        listingId
      });

    return res.status(200).json({
  ok: true,
  action,
  listingId,

  machineKey:
    machineKey || null,

  media:
    mediaResult,

  passport:
    passportDelete,

  listing:
    listingDelete,

  message:
    "Auction machine deleted"
});
    
  } catch (error) {
    console.error(
      "AUCTION OBJECT DISPOSITION FAILED:",
      {
        listingId,
        action,
        error
      }
    );

    return res.status(500).json({
      ok: false,
      error:
        error?.message ||
        "Auction disposition failed"
    });
  }
}

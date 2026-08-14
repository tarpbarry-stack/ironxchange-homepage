/* =========================================================
   IXI AOS
   SYSTEM INDEX PRESENTATION ENGINE
   =========================================================

   PURPOSE

   This file adapts persisted AOS objects into the small,
   generic presentation contract required by the
   IXI System Index Smart Container.

   IT DOES NOT OWN:

   - object truth
   - containment
   - relationships
   - workspace placement
   - persistence
   - business nomenclature
   - business rules
   - card layout
   - CSS
   - skins

   The customer/AWS owns the truth.

   This engine only answers:

   "What did the persisted object tell us to display?"
   ========================================================= */


/* =========================================================
   BASIC HELPERS
   ========================================================= */

function clean(value) {
  return String(
    value ?? ""
  ).trim();
}


function firstClean(...values) {
  for (const value of values) {
    const resolved =
      clean(value);

    if (resolved) {
      return resolved;
    }
  }

  return "";
}


function firstFiniteNumber(
  ...values
) {
  for (const value of values) {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      continue;
    }

    const normalized =
      typeof value === "string"
        ? value.replace(
            /[^0-9.-]/g,
            ""
          )
        : value;

    const number =
      Number(normalized);

    if (
      Number.isFinite(number)
    ) {
      return number;
    }
  }

  return null;
}


function asArray(value) {
  return Array.isArray(value)
    ? value
    : [];
}


/* =========================================================
   COMMON OBJECT SURFACES

   AOS is currently in transition, so persisted values can
   arrive on the root object, fields, metadata, publicData,
   attributes, etc.

   The presentation layer may READ these shapes.

   It must never manufacture business meaning from them.
   ========================================================= */

function getObjectFields(
  object = {}
) {
  return (
    object?.fields &&
    typeof object.fields === "object"
      ? object.fields
      : {}
  );
}


function getObjectMetadata(
  object = {}
) {
  return (
    object?.metadata &&
    typeof object.metadata === "object"
      ? object.metadata
      : {}
  );
}


function getObjectPublicData(
  object = {}
) {
  return (
    object?.publicData ||
    object?.attributes?.publicData ||
    {}
  );
}


function getObjectDefinition(
  object = {}
) {
  const fields =
    getObjectFields(object);

  const metadata =
    getObjectMetadata(object);

  return (
    object?.definition ||
    fields?.definition ||
    metadata?.definition ||
    {}
  );
}


/* =========================================================
   IDENTITY
   ========================================================= */

export function getAosObjectId(
  object = {}
) {
  return firstClean(
    object?.objectId,
    object?.id?.uuid,
    object?.id
  );
}


export function getAosObjectDisplayName(
  object = {}
) {
  const fields =
    getObjectFields(object);

  const publicData =
    getObjectPublicData(object);

  return firstClean(
    object?.displayName,
    object?.label,
    object?.name,

    fields?.displayName,
    fields?.name,
    fields?.title,

    object?.title,
    object?.attributes?.title,

    publicData?.displayName,
    publicData?.name,
    publicData?.title,

    "OBJECT"
  );
}


/* =========================================================
   USER / DEFINITION NOMENCLATURE

   IMPORTANT:

   We NEVER infer this from words such as:

   PEOPLE
   JOBS
   LOCATIONS
   MACHINES

   We only use nomenclature that was actually persisted.

   ========================================================= */

export function getAosObjectSingularLabel(
  object = {}
) {
  const fields =
    getObjectFields(object);

  const metadata =
    getObjectMetadata(object);

  const definition =
    getObjectDefinition(object);

  return firstClean(
    object?.singularLabel,

    fields?.singularLabel,

    definition?.singularLabel,
    definition?.nomenclature
      ?.singular,

    metadata?.singularLabel,
    metadata?.nomenclature
      ?.singular
  );
}


export function getAosObjectPluralLabel(
  object = {}
) {
  const fields =
    getObjectFields(object);

  const metadata =
    getObjectMetadata(object);

  const definition =
    getObjectDefinition(object);

  return firstClean(
    object?.pluralLabel,

    fields?.pluralLabel,

    definition?.pluralLabel,
    definition?.nomenclature
      ?.plural,

    metadata?.pluralLabel,
    metadata?.nomenclature
      ?.plural
  );
}


/* =========================================================
   MEDIA
   ========================================================= */

function getImageUrlFromMediaItem(
  mediaItem
) {
  if (!mediaItem) {
    return "";
  }

  if (
    typeof mediaItem === "string"
  ) {
    return clean(mediaItem);
  }

  return firstClean(
    mediaItem?.url,
    mediaItem?.src,
    mediaItem?.imageUrl,

    mediaItem?.attributes
      ?.variants
      ?.default
      ?.url,

    mediaItem?.attributes
      ?.variants
      ?.landscapeCrop
      ?.url,

    mediaItem?.attributes
      ?.variants
      ?.squareSmall
      ?.url
  );
}


export function getAosObjectPrimaryImage(
  object = {}
) {
  const fields =
    getObjectFields(object);

  const metadata =
    getObjectMetadata(object);

  const publicData =
    getObjectPublicData(object);

  /*
   * Preferred generic AOS media contract.
   */
  const directPrimary =
    firstClean(
      object?.primaryImage,
      object?.primaryImageUrl,

      fields?.primaryImage,
      fields?.primaryImageUrl,

      object?.media?.primaryImage,
      object?.media?.primaryImageUrl,

      fields?.media?.primaryImage,
      fields?.media?.primaryImageUrl,

      metadata?.primaryImage,
      metadata?.primaryImageUrl
    );

  if (directPrimary) {
    return directPrimary;
  }

  /*
   * Generic media arrays.
   */
  const genericMediaArrays = [
    object?.media?.images,
    fields?.media?.images,
    object?.images,
    fields?.images
  ];

  for (
    const mediaArray
    of genericMediaArrays
  ) {
    const first =
      asArray(mediaArray)[0];

    const imageUrl =
      getImageUrlFromMediaItem(
        first
      );

    if (imageUrl) {
      return imageUrl;
    }
  }

  /*
   * Existing IXI / Sharetribe compatibility.
   *
   * This is intentionally READ compatibility only.
   * It does not make the System Index a Machine card.
   */
  const compatibilityCandidates = [
    asArray(
      object?.imageUrls
    )[0],

    asArray(
      fields?.imageUrls
    )[0],

    asArray(
      publicData?.imageUrls
    )[0],

    asArray(
      object?.ixiMedia
        ?.imageUrls
    )[0],

    asArray(
      publicData?.ixiMedia
        ?.imageUrls
    )[0]
  ];

  for (
    const candidate
    of compatibilityCandidates
  ) {
    const imageUrl =
      getImageUrlFromMediaItem(
        candidate
      );

    if (imageUrl) {
      return imageUrl;
    }
  }

  const legacyImages = [
    ...asArray(object?.images),
    ...asArray(
      object?.imageObjects
    )
  ];

  for (
    const image
    of legacyImages
  ) {
    const imageUrl =
      getImageUrlFromMediaItem(
        image
      );

    if (imageUrl) {
      return imageUrl;
    }
  }

  return "";
}


/* =========================================================
   GENERIC DESCRIPTORS

   The object/definition chooses what it wants the container
   preview to say.

   Preferred persisted contract:

   presentation: {
     primaryDescriptor: "...",
     secondaryDescriptor: "..."
   }

   or fields.presentation.

   We do NOT guess business semantics.
   ========================================================= */

export function getAosObjectPrimaryDescriptor(
  object = {}
) {
  const fields =
    getObjectFields(object);

  const metadata =
    getObjectMetadata(object);

  const definition =
    getObjectDefinition(object);

  const publicData =
    getObjectPublicData(object);

  return firstClean(
    object?.presentation
      ?.primaryDescriptor,

    fields?.presentation
      ?.primaryDescriptor,

    definition?.presentation
      ?.primaryDescriptor,

    metadata?.presentation
      ?.primaryDescriptor,

    object?.primaryDescriptor,
    fields?.primaryDescriptor,

    /*
     * Generic persisted description is a safe fallback.
     * It is user/object data, not inferred nomenclature.
     */
    fields?.shortDescription,
    object?.shortDescription,

    fields?.description,
    object?.description,

    publicData?.shortDescription
  );
}


export function getAosObjectSecondaryDescriptor(
  object = {}
) {
  const fields =
    getObjectFields(object);

  const metadata =
    getObjectMetadata(object);

  const definition =
    getObjectDefinition(object);

  return firstClean(
    object?.presentation
      ?.secondaryDescriptor,

    fields?.presentation
      ?.secondaryDescriptor,

    definition?.presentation
      ?.secondaryDescriptor,

    metadata?.presentation
      ?.secondaryDescriptor,

    object?.secondaryDescriptor,
    fields?.secondaryDescriptor
  );
}


/* =========================================================
   VALUE CAPABILITY

   IMPORTANT:

   null means:
   "this object did not expose a usable value"

   0 means:
   "this object exposed a real value of zero"

   Those are NOT the same thing.
   ========================================================= */

export function getAosObjectValue(
  object = {}
) {
  const fields =
    getObjectFields(object);

  const metadata =
    getObjectMetadata(object);

  const definition =
    getObjectDefinition(object);

  const publicData =
    getObjectPublicData(object);

  /*
   * Explicit capability can disable
   * value aggregation entirely.
   */
  const valueCapability =
    definition?.capabilities?.value ??
    fields?.capabilities?.value ??
    metadata?.capabilities?.value ??
    object?.capabilities?.value;

  if (
    valueCapability === false
  ) {
    return null;
  }

  return firstFiniteNumber(
    object?.value,
    fields?.value,

    object?.financialValue,
    fields?.financialValue,

    object?.marketValue,
    fields?.marketValue,

    object?.assetValue,
    fields?.assetValue,

    publicData?.value,
    publicData?.price,

    object?.price
  );
}


/* =========================================================
   CONTAINER MEDIA

   HERO RULE:

   1. container's own primary image
   2. selected direct child's primary image
   3. empty

   ========================================================= */

export function getAosContainerHeroImage({
  container,
  selectedChild
} = {}) {
  return (
    getAosObjectPrimaryImage(
      container
    ) ||
    getAosObjectPrimaryImage(
      selectedChild
    ) ||
    ""
  );
}


/* =========================================================
   DIRECT CHILD NOMENCLATURE

   The engine may use a shared persisted plural label when
   every direct child agrees.

   It NEVER derives this from the container's displayName.

   ========================================================= */

export function getDirectChildCollectionLabel(
  children = []
) {
  const resolvedChildren =
    asArray(children)
      .filter(Boolean);

  if (!resolvedChildren.length) {
    return "CHILDREN";
  }

  const labels =
    resolvedChildren
      .map(child =>
        getAosObjectPluralLabel(
          child
        )
      )
      .filter(Boolean);

  if (
    labels.length ===
    resolvedChildren.length
  ) {
    const normalized =
      labels.map(label =>
        label.toLowerCase()
      );

    const first =
      normalized[0];

    const allMatch =
      normalized.every(
        label =>
          label === first
      );

    if (allMatch) {
      return labels[0];
    }
  }

  /*
   * We deliberately do not guess a plural
   * from objectType or displayName.
   */
  return "CHILDREN";
}


/* =========================================================
   DIRECT CHILD VALUE AGGREGATION
   ========================================================= */

export function getDirectChildAggregateValue(
  children = []
) {
  const resolvedChildren =
    asArray(children)
      .filter(Boolean);

  if (!resolvedChildren.length) {
    return {
      applicable: false,
      value: null,
      contributingCount: 0,
      childCount: 0
    };
  }

  const values =
    resolvedChildren
      .map(child =>
        getAosObjectValue(
          child
        )
      );

  const usableValues =
    values.filter(value =>
      value !== null &&
      Number.isFinite(value)
    );

  /*
   * V12 rule:
   *
   * Do not manufacture a total from a partially-valued
   * collection and present it as though it represents
   * the whole direct-child deck.
   *
   * For the standard aggregate to be valid, every direct
   * child must expose a compatible value.
   */
  const applicable =
    usableValues.length ===
    resolvedChildren.length;

  if (!applicable) {
    return {
      applicable: false,
      value: null,
      contributingCount:
        usableValues.length,
      childCount:
        resolvedChildren.length
    };
  }

  const value =
    usableValues.reduce(
      (
        total,
        itemValue
      ) =>
        total + itemValue,
      0
    );

  return {
    applicable: true,
    value,
    contributingCount:
      usableValues.length,
    childCount:
      resolvedChildren.length
  };
}


/* =========================================================
   SMART CONTAINER PRESENTATION SNAPSHOT

   This is the ONE object the V12 card can consume.

   It contains no durable state.

   ========================================================= */

export function getSmartContainerPresentation({
  container = {},
  children = [],
  selectedChildIndex = 0
} = {}) {
  const resolvedChildren =
    asArray(children)
      .filter(Boolean);

  const safeSelectedIndex =
    resolvedChildren.length
      ? Math.min(
          Math.max(
            Number(
              selectedChildIndex || 0
            ),
            0
          ),
          resolvedChildren.length - 1
        )
      : -1;

  const selectedChild =
    safeSelectedIndex >= 0
      ? resolvedChildren[
          safeSelectedIndex
        ]
      : null;

  const aggregateValue =
    getDirectChildAggregateValue(
      resolvedChildren
    );

  return {
    containerId:
      getAosObjectId(
        container
      ),

    containerName:
      getAosObjectDisplayName(
        container
      ),

    heroImage:
      getAosContainerHeroImage({
        container,
        selectedChild
      }),

    directChildCount:
      resolvedChildren.length,

    directChildLabel:
      getDirectChildCollectionLabel(
        resolvedChildren
      ),

    valueApplicable:
      aggregateValue.applicable,

    aggregateValue:
      aggregateValue.value,

    valueContributingCount:
      aggregateValue
        .contributingCount,

    selectedChildIndex:
      safeSelectedIndex,

    selectedChild,

    selectedChildId:
      selectedChild
        ? getAosObjectId(
            selectedChild
          )
        : "",

    selectedChildName:
      selectedChild
        ? getAosObjectDisplayName(
            selectedChild
          )
        : "",

    selectedChildPrimaryDescriptor:
      selectedChild
        ? getAosObjectPrimaryDescriptor(
            selectedChild
          )
        : "",

    selectedChildSecondaryDescriptor:
      selectedChild
        ? getAosObjectSecondaryDescriptor(
            selectedChild
          )
        : "",

    selectedChildImage:
      selectedChild
        ? getAosObjectPrimaryImage(
            selectedChild
          )
        : "",

    children:
      resolvedChildren
  };
}


/* =========================================================
   MONEY DISPLAY

   Presentation helper only.

   null stays blank.
   zero displays as $0.
   ========================================================= */

export function formatAosContainerMoney(
  value
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "";
  }

  const amount =
    Number(value);

  if (
    !Number.isFinite(amount)
  ) {
    return "";
  }

  return amount.toLocaleString(
    "en-US",
    {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }
  );
}

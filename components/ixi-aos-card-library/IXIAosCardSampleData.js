const SAMPLE_LOCATION_OBJECT =
  Object.freeze({
    objectId:
      "aos-card-preview-location-001",

    entityId:
      "aos-card-preview-entity",

    displayName:
      "MIDLAND YARD",

    status:
      "active",

    value:
      8750000,

    currency:
      "USD",

    fields: {
      address1:
        "4100 INDUSTRIAL AVE",

      address2:
        "",

      city:
        "MIDLAND",

      state:
        "TX",

      postalCode:
        "79701"
    },

    media: [],

    metadata: {
      creationState:
        ""
    }
  });


const SAMPLE_LOCATION_PROJECTION =
  Object.freeze({
    assetCount:
      47,

    employeeCount:
      18,

    childLocationCount:
      3,

    totalAssetValue:
      8750000
  });


const SAMPLE_LOCATION_ITEMS =
  Object.freeze([
    {
      objectId:
        "preview-machine-001",

      objectType:
        "machine"
    },

    {
      objectId:
        "preview-vehicle-001",

      objectType:
        "vehicle"
    },

    {
      objectId:
        "preview-tool-001",

      objectType:
        "tool"
    }
  ]);


export function getAosCardSampleData(
  templateSlug = ""
) {
  const slug =
    String(
      templateSlug || ""
    ).trim();

  if (
    slug ===
    "location-standard"
  ) {
    return {
      sampleData:
        SAMPLE_LOCATION_OBJECT,

      projection:
        SAMPLE_LOCATION_PROJECTION,

      directItems:
        SAMPLE_LOCATION_ITEMS
    };
  }

  return {
    sampleData: {
      displayName:
        "AOS OBJECT",

      status:
        "active",

      value:
        null,

      currency:
        "USD",

      fields: {},

      media: [],

      metadata: {}
    },

    projection:
      null,

    directItems: []
  };
}


export {
  SAMPLE_LOCATION_OBJECT,
  SAMPLE_LOCATION_PROJECTION,
  SAMPLE_LOCATION_ITEMS
};

const SAMPLE_LOCATION_OBJECT =
  Object.freeze({
    objectId:
      "aos-card-preview-location-001",

    entityId:
      "aos-card-preview-entity",

    displayName:
      "YARD NAME",

    status:
      "active",

    value:
      8750000,

    currency:
      "USD",

    fields: {
      address1:
        "2400 AVIATION DRIVE",

      address2:
        "",

      city:
        "DFW AIRPORT",

      state:
        "TX",

      postalCode:
        "75261",

      yardHours:
        "MON–SAT 6:00 AM–6:00 PM",

      yardContact:
        "JOHN CARTER",

      yardPhone:
        "432-555-0186"
    },

    relationships: [
      {
        id: "rel-equipment",
        label: "EQUIPMENT",
        value: "47 ASSETS",
        status: "ACTIVE"
      },
      {
        id: "rel-shop",
        label: "SHOP",
        value: "1 SHOP",
        status: "ACTIVE"
      },
      {
        id: "rel-employees",
        label: "EMPLOYEES",
        value: "18 PEOPLE",
        status: "ACTIVE"
      },
      {
        id: "rel-ramp",
        label: "RAMP",
        value: "2 RAMPS",
        status: "ACTIVE"
      }
    ],

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

      entityId:
        "aos-card-preview-entity",

      objectType:
        "machine",

      displayName:
        "2022 CATERPILLAR 336",

      directContainerId:
        "aos-card-preview-location-001",

      value:
        285000,

      currency:
        "USD",

      fields: {
        year:
          2022,

        make:
          "CATERPILLAR",

        model:
          "336",

        hours:
          3842
      },

      media: [],

      metadata: {}
    },

    {
      objectId:
        "preview-vehicle-001",

      entityId:
        "aos-card-preview-entity",

      objectType:
        "vehicle",

      displayName:
        "2024 FORD F-350",

      directContainerId:
        "aos-card-preview-location-001",

      value:
        72000,

      currency:
        "USD",

      fields: {
        year:
          2024,

        make:
          "FORD",

        model:
          "F-350"
      },

      media: [],

      metadata: {}
    },

    {
      objectId:
        "preview-tool-001",

      entityId:
        "aos-card-preview-entity",

      objectType:
        "tool",

      displayName:
        "FIELD TOOL SET",

      directContainerId:
        "aos-card-preview-location-001",

      value:
        8500,

      currency:
        "USD",

      fields: {},

      media: [],

      metadata: {}
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
      "location-standard" ||
    slug ===
      "location-standard-002" ||
    slug ===
      "location-standard-003"
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

/*
 * =========================================================
 * IXI AOS
 * SYSTEM CARD PRESENTATION REGISTRY
 * =========================================================
 *
 * Card-specific meaning belongs here, not in the generic
 * renderer or console.
 *
 * The generic runtime knows how to render modules.
 * This registry defines what an IXI-owned system Card is.
 *
 * AWS remains authoritative for template identity, fields,
 * capabilities, numbering and versioning. This registry is
 * the frontend presentation contract consumed by the shared
 * AOS runtime in Face Lab, Object Studio and AOS Work.
 * =========================================================
 */


function clean(value) {
  return String(value || "").trim();
}


const LOCATION_STANDARD_PRESENTATION =
  Object.freeze({
    faceLayouts: {
      1: [
        /* HEADER is card chrome and is injected by the adapter. */

        {
          slotId: "location-photo",
          moduleType: "primary-media-panel",
          config: {
            height: 90
          },
          presentation: {
            role: "hero",
            width: "full"
          }
        },

        {
          slotId: "address-line",
          moduleType: "editable-field-group",
          config: {
            fields: [
              {
                fieldId: "address1",
                label: "ADDRESS",
                width: "1fr"
              }
            ]
          },
          presentation: {
            role: "summary",
            width: "full"
          }
        },

        {
          slotId: "city-state-zip",
          moduleType: "weighted-field-row",
          config: {
            fields: [
              {
                fieldId: "city",
                label: "CITY",
                width: "1fr"
              },
              {
                fieldId: "state",
                label: "ST",
                width: 42
              },
              {
                fieldId: "postalCode",
                label: "ZIP",
                width: 66
              }
            ]
          },
          presentation: {
            role: "summary",
            width: "full"
          }
        },

        {
          slotId: "location-snapshot",
          moduleType: "inline-metric-strip",
          config: {
            metrics: [
              {
                metricId: "asset-count",
                label: "ASSETS",
                source: "projection",
                key: "assetCount",
                type: "number"
              },
              {
                metricId: "location-value",
                label: "VALUE",
                source: "projection",
                key: "totalAssetValue",
                type: "money"
              },
              {
                metricId: "employee-count",
                label: "EMPLOYEES",
                source: "projection",
                key: "employeeCount",
                type: "number"
              }
            ]
          },
          presentation: {
            role: "inline",
            width: "full"
          }
        },

        {
          slotId: "yard-quick-facts",
          moduleType: "weighted-field-row",
          config: {
            fields: [
              {
                fieldId: "yardHours",
                label: "YARD HOURS",
                width: "1fr"
              },
              {
                fieldId: "yardContact",
                label: "YARD CONTACT",
                width: "1fr"
              },
              {
                fieldId: "yardPhone",
                label: "PHONE",
                width: 82
              }
            ]
          },
          presentation: {
            role: "summary",
            width: "full"
          }
        },

        {
          slotId: "relationships-infrastructure",
          moduleType: "relationship-infrastructure-panel",
          config: {
            title: "RELATIONSHIPS & INFRASTRUCTURE"
          },
          presentation: {
            role: "summary",
            width: "full"
          }
        },

        {
          slotId: "container-command-strip",
          moduleType: "container-command-strip",
          presentation: {
            role: "compact",
            width: "full"
          }
        },

        {
          slotId: "container-viewer",
          moduleType: "container-collection-preview",
          presentation: {
            role: "viewer-bottom",
            width: "full"
          }
        }
      ]
    }
  });


const SYSTEM_PRESENTATIONS =
  Object.freeze({
    "location-standard":
      LOCATION_STANDARD_PRESENTATION
  });


export function getSystemCardPresentation(
  templateSlug = ""
) {
  return (
    SYSTEM_PRESENTATIONS[
      clean(templateSlug)
        .toLowerCase()
    ] ||
    null
  );
}


export {
  LOCATION_STANDARD_PRESENTATION,
  SYSTEM_PRESENTATIONS
};

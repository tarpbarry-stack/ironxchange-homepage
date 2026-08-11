import {
  createIXICardTemplate,
  IXI_CARD_FACE_TYPES
} from "../card-runtime/IXICardDefinitionEngine";


/*
 * IXI SYSTEM INDEX CARD TEMPLATE
 *
 * SYSTEM INDEX is a protected IXI Card Template.
 *
 * It is NOT:
 * - Equipment
 * - Locations
 * - People
 * - Jobs
 * - a taxonomy
 *
 * It is simply a Card Definition with
 * container capabilities and IXI collection
 * operating modules.
 *
 * The Object using this template supplies
 * its own name and relationships.
 */


export const IXI_SYSTEM_INDEX_TEMPLATE_ID =
  "ixi-system-index-v1";


export const IXI_SYSTEM_INDEX_MODULES =
  Object.freeze({

    IDENTITY:
      "system-index-identity",

    COLLECTION_PREVIEW:
      "container-collection-preview",

    CONTAINER_SUMMARY:
      "container-summary",

    CONTAINER_ACTIONS:
      "container-actions",

    RELATIONSHIPS:
      "relationship-summary",

    HISTORY:
      "object-history"

  });


/* =========================================================
   FACE 1
   PRIMARY CARD
   ========================================================= */

const faceOne = {
  faceId:
    "face-1",

  faceIndex:
    1,

  faceType:
    IXI_CARD_FACE_TYPES.PRIMARY,

  label:
    "PRIMARY",

  layout: [

    /*
     * Object name / identity.
     *
     * Example:
     *
     * SYSTEM INDEX
     * EQUIPMENT
     *
     * or:
     *
     * SYSTEM INDEX
     * LOCATIONS
     *
     * The template DOES NOT supply
     * the word EQUIPMENT or LOCATIONS.
     */
    {
      slotId:
        "identity",

      moduleType:
        IXI_SYSTEM_INDEX_MODULES.IDENTITY
    },


    /*
     * Large selected/on-deck child.
     *
     * This module must display the
     * child's OWN Card identity.
     *
     * It must never substitute
     * ListingCard or another card.
     */
    {
      slotId:
        "collection-preview",

      moduleType:
        IXI_SYSTEM_INDEX_MODULES
          .COLLECTION_PREVIEW
    },


    /*
     * Direct contents count/value
     * and other projection information.
     */
    {
      slotId:
        "container-summary",

      moduleType:
        IXI_SYSTEM_INDEX_MODULES
          .CONTAINER_SUMMARY
    },


    /*
     * +
     * BOARD
     * RECALL
     * OUT / related container commands
     */
    {
      slotId:
        "container-actions",

      moduleType:
        IXI_SYSTEM_INDEX_MODULES
          .CONTAINER_ACTIONS
    }

  ],

  metadata: {
    systemFace:
      true,

    purpose:
      "primary-container-card"
  }
};


/* =========================================================
   FACE 2
   RELATIONSHIPS
   ========================================================= */

const faceTwo = {
  faceId:
    "face-2",

  faceIndex:
    2,

  faceType:
    IXI_CARD_FACE_TYPES.RELATIONSHIPS,

  label:
    "RELATIONSHIPS",

  layout: [
    {
      slotId:
        "relationships",

      moduleType:
        IXI_SYSTEM_INDEX_MODULES
          .RELATIONSHIPS
    }
  ],

  metadata: {
    systemFace:
      true
  }
};


/* =========================================================
   FACE 3
   HISTORY
   ========================================================= */

const faceThree = {
  faceId:
    "face-3",

  faceIndex:
    3,

  faceType:
    IXI_CARD_FACE_TYPES.HISTORY,

  label:
    "HISTORY",

  layout: [
    {
      slotId:
        "history",

      moduleType:
        IXI_SYSTEM_INDEX_MODULES
          .HISTORY
    }
  ],

  metadata: {
    systemFace:
      true
  }
};


/* =========================================================
   TEMPLATE
   ========================================================= */

export const IXI_SYSTEM_INDEX_CARD_TEMPLATE =
  createIXICardTemplate({

    templateId:
      IXI_SYSTEM_INDEX_TEMPLATE_ID,

    displayName:
      "IXI SYSTEM INDEX",

    protectedTemplate:
      true,

    faces: [
      faceOne,
      faceTwo,
      faceThree
    ],

    capabilities: {

      /*
       * CARD LAWS
       */
      draggable:
        true,

      sortable:
        true,

      hasRail:
        true,

      hasNotices:
        true,

      hasConsole:
        true,

      hasRelationships:
        true,

      hasMedia:
        true,

      editable:
        true,


      /*
       * CONTAINER CAPABILITY
       *
       * This is what makes a System Index
       * Card ALSO a Container.
       */
      canContain:
        true,

      canReceiveDrop:
        true

    },

    metadata: {

      systemOwned:
        true,

      protectedTemplate:
        true,

      templateVersion:
        1,

      /*
       * Template identity is protected.
       *
       * Object names are NOT.
       *
       * An Object using this template
       * may be named EQUIPMENT, LOCATIONS,
       * EAST TEXAS, WHATEVER, etc.
       */
      objectNameIsCustomerControlled:
        true

    }

  });


export function getIXISystemIndexCardTemplate() {
  return IXI_SYSTEM_INDEX_CARD_TEMPLATE;
}


export default IXI_SYSTEM_INDEX_CARD_TEMPLATE;

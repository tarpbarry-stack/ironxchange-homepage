import {
  useState
} from "react";

import useIXIObjectStudio
  from "./useIXIObjectStudio";

import IXIObjectStudioHeader
  from "./IXIObjectStudioHeader";

import IXIObjectStudioCardBench
  from "./IXIObjectStudioCardBench";

import IXIObjectStudioDesignBench
  from "./IXIObjectStudioDesignBench";

import IXIObjectStudioCanvas
  from "./IXIObjectStudioCanvas";

import IXIObjectStudioInspector
  from "./IXIObjectStudioInspector";

import IXIObjectStudioFaceOrderBench
  from "./IXIObjectStudioFaceOrderBench";

import {
  createIXIObjectStudioDraft
} from "./IXIObjectStudioDraftEngine";

import {
  installIXIStudioCardDesign
} from "./libraries/IXIStudioDraftLibraryBridge";

import {
  getIXIStudioCardDesign
} from "./libraries/IXIStudioDesignLibrary";


const PROOF_OBJECT = {
  objectId:
    "studio:proof-object",

  displayName:
    "2020 FORD F350",

  fields: {
    year:
      "2020",

    make:
      "FORD",

    model:
      "F350",

    vin:
      "1FT8W3BT0LEC12345",

    miles:
      82500,

    price:
      44500,

    location:
      "WICHITA FALLS, TX"
  },

  fieldDefinitions: [
    {
      fieldId:
        "year",

      label:
        "YEAR",

      fieldType:
        "number"
    },

    {
      fieldId:
        "make",

      label:
        "MAKE",

      fieldType:
        "text"
    },

    {
      fieldId:
        "model",

      label:
        "MODEL",

      fieldType:
        "text"
    },

    {
      fieldId:
        "vin",

      label:
        "VIN",

      fieldType:
        "text"
    },

    {
      fieldId:
        "miles",

      label:
        "MILES",

      fieldType:
        "number"
    },

    {
      fieldId:
        "price",

      label:
        "PRICE",

      fieldType:
        "money"
    },

    {
      fieldId:
        "location",

      label:
        "LOCATION",

      fieldType:
        "text"
    }
  ]
};


const DEFAULT_VEHICLE_DESIGN =
  getIXIStudioCardDesign(
    "ixi:card:vehicle"
  );


function createDefaultStudioDraft() {

  const baseDraft =
    createIXIObjectStudioDraft({
      object:
        PROOF_OBJECT,

      mode:
        "create"
    });


  if (
    !DEFAULT_VEHICLE_DESIGN
  ) {
    return baseDraft;
  }


  return installIXIStudioCardDesign({
    draft:
      baseDraft,

    design:
      DEFAULT_VEHICLE_DESIGN
  });
}


export default function IXIObjectStudio() {

  const studio =
    useIXIObjectStudio({
      initialDraft:
        createDefaultStudioDraft()
    });


  export default function IXIObjectStudio() {

  const studio =
    useIXIObjectStudio({
      initialDraft:
        createDefaultStudioDraft()
    });


  const [
    previewCardState,
    setPreviewCardState
  ] =
    useState({
      color:
        "none",

      outline:
        1,

      face:
        1
    });


  const [
    previewScaleMode,
    setPreviewScaleMode
  ] =
    useState(
      "xl"
    );


  function updatePreviewCardState(
    objectId,
    patch
  ) {

    setPreviewCardState(
      current => ({
        ...current,

        ...(
          patch ||
          {}
        )
      })
    );
  }


  return (
    <main className="ixi-object-studio">

      {/* ================================================
          HEADER
          ================================================ */}

      <div className="studio-header-slot">

        <IXIObjectStudioHeader
          studio={
            studio
          }
        />

      </div>


      {/* ================================================
          TOP WORKBENCH
          ================================================ */}

      <section className="studio-top-row">

        {/* CARD BENCH */}

        <div className="studio-bench-shell">

          <IXIObjectStudioCardBench
            studio={
              studio
            }
          />

        </div>


        {/* PHOTO BENCH */}

        <div className="studio-bench-shell">

          <div className="studio-photo-bench">

            <div className="studio-photo-heading">

              <strong>
                PHOTO BENCH
              </strong>

              <span>
                OBJECT MEDIA
              </span>

            </div>


            <div className="studio-photo-rail">

              <button
                type="button"
                className="studio-photo-add"
              >
                +
              </button>


              <div className="studio-photo-empty">
                DROP OR ADD PHOTOS
              </div>

            </div>

          </div>

        </div>

      </section>


      {/* ================================================
          MAIN WORKSTATION
          ================================================ */}

      <section className="studio-workstation">

        {/* LEFT */}

        <aside className="studio-tool-column">

          <div className="studio-scroll-surface">

            <IXIObjectStudioDesignBench
              studio={
                studio
              }
            />

          </div>

        </aside>


        {/* CENTER */}

        <section className="studio-center-column">

          <IXIObjectStudioCanvas
            studio={
              studio
            }

            previewCardState={
              previewCardState
            }

            updatePreviewCardState={
              updatePreviewCardState
            }

            enableCardScaling={
  true
}

cardScaleMode={
  previewScaleMode
}
          />

        </section>


        {/* RIGHT */}

        <aside className="studio-tool-column">

          <div className="studio-scroll-surface">

            <IXIObjectStudioInspector
              studio={
                studio
              }
            />

          </div>

        </aside>

      </section>


      {/* ================================================
          BOTTOM FACE BENCH
          ================================================ */}

      <footer className="studio-bottom-row">

        <IXIObjectStudioFaceOrderBench
          studio={
            studio
          }
        />

      </footer>


      <style jsx>{`

        /*
         * ===============================================
         * HARD PAGE BOUNDARY
         * ===============================================
         */

        .ixi-object-studio,
        .ixi-object-studio * {
          box-sizing:
            border-box;
        }

/*
 * Child components use separate
 * styled-jsx scope classes.
 *
 * Force the workstation descendants
 * onto the same physical sizing model.
 */

.studio-bench-shell :global(*),
.studio-tool-column :global(*),
.studio-center-column :global(*),
.studio-bottom-row :global(*) {
  box-sizing:
    border-box !important;
}

        .ixi-object-studio {
          width: 100%;
          max-width: 100%;

          height: 100vh;
          height: 100dvh;

          min-width: 0;
          min-height: 680px;

          margin: 0;

          padding:
            10px;

          display: grid;

          grid-template-rows:
            auto
            124px
            minmax(
              0,
              1fr
            )
            78px;

          gap:
            8px;

          overflow:
            hidden;

          background:
            #090909;

          color:
            white;
        }


        /*
         * ===============================================
         * HEADER
         * ===============================================
         */

        .studio-header-slot {
          min-width: 0;

          overflow: hidden;
        }


        /*
         * ===============================================
         * TOP — EXACT 50 / 50
         * ===============================================
         */

        .studio-top-row {
          width: 100%;

          min-width: 0;
          min-height: 0;

          display: grid;

          grid-template-columns:
            minmax(
              0,
              1fr
            )
            minmax(
              0,
              1fr
            );

          gap:
            8px;

          overflow:
            hidden;
        }


        /*
         * ONE PHYSICAL SHELL.
         *
         * Card Bench and Photo Bench live
         * inside identical containers.
         */

        .studio-bench-shell {
          width: 100%;
          height: 124px;

          min-width: 0;
          min-height: 0;

          overflow: hidden;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .05
            );

          border-radius:
            9px;

          background:
            rgba(
              255,
              255,
              255,
              .01
            );
        }


        /*
         * Remove Card Bench's second shell.
         */

        .studio-bench-shell :global(
          .card-bench
        ) {
          width: 100% !important;
          height: 100% !important;

          margin: 0 !important;

          padding:
            11px
            12px !important;

          border:
            0 !important;

          border-radius:
            0 !important;

          background:
            transparent !important;

          overflow:
            hidden !important;
        }


        /*
         * Card tiles must FIT the bench.
         *
         * Old:
         * 78px card + heading + padding
         * inside a 102px row = clipping.
         */

        .studio-bench-shell :global(
          .card-bench-rail
        ) {
          width: 100%;

          min-width: 0;

          display: flex;

          gap:
            7px;

          overflow-x:
            auto !important;

          overflow-y:
            hidden !important;

          padding:
            0 0 4px !important;

          scrollbar-width:
            none !important;
        }


        .studio-bench-shell :global(
          .card-bench-rail::-webkit-scrollbar
        ) {
          display:
            none;
        }


        .studio-bench-shell :global(
          .design-card
        ) {
          height:
            76px !important;

          min-height:
            76px !important;
        }


        /*
         * ===============================================
         * PHOTO BENCH
         * ===============================================
         */

        .studio-photo-bench {
          width: 100%;
          height: 100%;

          min-width: 0;

          padding:
            11px
            12px;

          overflow:
            hidden;
        }


        .studio-photo-heading {
          height:
            18px;

          margin-bottom:
            8px;

          display: flex;

          align-items: center;

          gap:
            9px;
        }


        .studio-photo-heading strong {
          color:
            #ffc400;

          font-size:
            7px;

          font-weight:
            950;
        }


        .studio-photo-heading span {
          color:
            rgba(
              255,
              255,
              255,
              .20
            );

          font-size:
            6px;

          font-weight:
            900;
        }


        .studio-photo-rail {
          width: 100%;

          min-width: 0;

          height:
            76px;

          display: flex;

          align-items:
            stretch;

          gap:
            7px;

          overflow-x:
            auto;

          overflow-y:
            hidden;

          scrollbar-width:
            none;
        }


        .studio-photo-rail::-webkit-scrollbar {
          display:
            none;
        }


        .studio-photo-add {
          width:
            76px;

          min-width:
            76px;

          height:
            76px;

          border:
            1px dashed
            rgba(
              255,
              196,
              0,
              .28
            );

          border-radius:
            7px;

          background:
            rgba(
              255,
              196,
              0,
              .025
            );

          color:
            #ffc400;

          font-size:
            20px;

          font-weight:
            950;

          cursor:
            pointer;
        }


        .studio-photo-empty {
          height:
            76px;

          min-width:
            150px;

          display: flex;

          align-items:
            center;

          padding:
            0 10px;

          color:
            rgba(
              255,
              255,
              255,
              .17
            );

          font-size:
            6px;

          font-weight:
            900;
        }


        /*
         * ===============================================
         * MAIN WORKSTATION
         * ===============================================
         *
         * Equal side columns are deliberate.
         *
         * The actual center column therefore
         * stays mathematically centered.
         */

        .studio-workstation {
          width: 100%;

          min-width: 0;
          min-height: 0;

          display: grid;

          grid-template-columns:
            240px
            minmax(
              0,
              1fr
            )
            240px;

          gap:
            8px;

          overflow:
            hidden;
        }


        /*
         * LEFT / RIGHT PHYSICAL TOOL COLUMNS
         */

        .studio-tool-column {
          width: 240px;

          min-width: 0;
          min-height: 0;

          overflow:
            hidden;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .045
            );

          border-radius:
            9px;

          background:
            rgba(
              255,
              255,
              255,
              .008
            );
        }


        /*
         * Actual scrolling surface.
         *
         * Scroll still works with wheel /
         * trackpad, but there is NO scrollbar
         * sitting on top of labels/buttons.
         */

        .studio-scroll-surface {
          width: 100%;
          height: 100%;

          min-width: 0;
          min-height: 0;

          overflow-x:
            hidden;

          overflow-y:
            auto;

          scrollbar-width:
            none;

          overscroll-behavior:
            contain;
        }


        .studio-scroll-surface::-webkit-scrollbar {
          display:
            none;
        }


        /*
         * ===============================================
         * LEFT FACE / MODULE BENCH
         * ===============================================
         */

        .studio-tool-column :global(
          .design-bench
        ) {
          width: 100% !important;

          min-width: 0 !important;
          min-height: 100% !important;

          padding:
            20px
            18px
            30px !important;

          border:
            0 !important;

          border-radius:
            0 !important;

          background:
            transparent !important;
        }


        .studio-tool-column :global(
          .design-bench .bench-title
        ) {
          margin-bottom:
            14px !important;
        }


        .studio-tool-column :global(
          .design-bench .face-list
        ) {
          gap:
            8px !important;
        }


        .studio-tool-column :global(
          .design-bench .face-list button
        ) {
          width: 100%;

          min-width: 0;

          height:
            42px !important;
        }


        .studio-tool-column :global(
          .design-bench .divider
        ) {
          margin:
            26px 0 !important;
        }


        .studio-tool-column :global(
          .design-bench .module-grid
        ) {
          gap:
            8px !important;
        }


        .studio-tool-column :global(
          .design-bench .module-grid button
        ) {
          min-width: 0;

          min-height:
            40px !important;
        }


        /*
         * ===============================================
         * CENTER
         * ===============================================
         *
         * Leave the Card/Canvas alone.
         */

        .studio-center-column {
          width: 100%;

          min-width: 0;
          min-height: 0;

          overflow:
            hidden;
        }


        .studio-center-column :global(
          .studio-canvas
        ) {
          width: 100% !important;
          height: 100% !important;

          min-width: 0 !important;
          min-height: 0 !important;

          margin: 0 !important;
        }


        /*
         * ===============================================
         * INSPECTOR
         * ===============================================
         */

        .studio-tool-column :global(
          .studio-inspector
        ) {
          width: 100% !important;

          min-width: 0 !important;
          max-width: 100% !important;

          min-height: 100% !important;

          padding:
            20px
            16px
            30px !important;

          border:
            0 !important;

          border-radius:
            0 !important;

          background:
            transparent !important;

          overflow:
            visible !important;
        }


        /*
         * Add button can NEVER leave panel.
         */

        .studio-tool-column :global(
          .studio-inspector .section-heading
        ) {
          width: 100%;

          min-width: 0;

          display: flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap:
            8px;
        }


        .studio-tool-column :global(
          .studio-inspector .section-heading button
        ) {
          flex:
            0 0 25px;

          width:
            25px !important;

          min-width:
            25px !important;
        }


        /*
         * THIS fixes the ridiculous field
         * spanning.
         *
         * LABEL = 66px
         * VALUE = everything useful.
         */

        .studio-tool-column :global(
          .studio-inspector .field-row
        ) {
          width: 100%;

          min-width: 0;

          display: grid !important;

          grid-template-columns:
            66px
            minmax(
              0,
              1fr
            ) !important;

          gap:
            6px !important;
        }


        .studio-tool-column :global(
          .studio-inspector .field-row input
        ) {
          width: 100% !important;

          min-width: 0 !important;

          height:
            30px !important;
        }


        .studio-tool-column :global(
          .studio-inspector .field-label
        ) {
          padding:
            0 7px !important;

          font-size:
            6px !important;
        }


        .studio-tool-column :global(
          .studio-inspector .field-value
        ) {
          padding:
            0 8px !important;

          font-size:
            6.5px !important;
        }


        /*
         * Every Inspector control must stay
         * inside the Inspector.
         */

        .studio-tool-column :global(
          .studio-inspector input
        ),
        .studio-tool-column :global(
          .studio-inspector select
        ),
        .studio-tool-column :global(
          .studio-inspector button
        ) {
          max-width:
            100%;
        }


        /*
         * ===============================================
         * BOTTOM FACE BENCH
         * ===============================================
         */

        .studio-bottom-row {
          width: 100%;

          min-width: 0;
          min-height: 0;

          overflow:
            hidden;
        }


        .studio-bottom-row :global(
          .face-order-bench
        ) {
          width: 100% !important;
          height: 100% !important;

          min-width: 0;

          margin:
            0 !important;

          padding:
            8px
            10px !important;

          overflow:
            hidden !important;
        }


        .studio-bottom-row :global(
          .face-order-bench .bench-heading
        ) {
          margin-bottom:
            5px !important;
        }


        .studio-bottom-row :global(
          .face-order-rail
        ) {
          width: 100%;

          min-width: 0;

          overflow-x:
            auto !important;

          overflow-y:
            hidden !important;

          scrollbar-width:
            none !important;
        }


        .studio-bottom-row :global(
          .face-order-rail::-webkit-scrollbar
        ) {
          display:
            none;
        }


        .studio-bottom-row :global(
          .face-tile
        ) {
          height:
            44px !important;
        }


        /*
         * ===============================================
         * ABSOLUTE NO PAGE-SCALE HORIZONTAL OVERFLOW
         * ===============================================
         */

        :global(html),
        :global(body),
        :global(#__next) {
          width: 100%;
          max-width: 100%;

          min-width: 0;

          margin: 0;

          overflow-x:
            hidden;
        }


        /*
         * ===============================================
         * SMALLER DESKTOP
         * ===============================================
         *
         * Keep both sidebars EQUAL so the
         * center stays centered.
         */

        @media (
          max-width: 1400px
        ) {

          .studio-workstation {
            grid-template-columns:
              220px
              minmax(
                0,
                1fr
              )
              220px;
          }


          .studio-tool-column {
            width:
              220px;
          }


          .studio-tool-column :global(
            .studio-inspector .field-row
          ) {
            grid-template-columns:
              62px
              minmax(
                0,
                1fr
              ) !important;
          }

        }


        @media (
          max-width: 1100px
        ) {

          .studio-workstation {
            grid-template-columns:
              190px
              minmax(
                0,
                1fr
              )
              190px;
          }


          .studio-tool-column {
            width:
              190px;
          }


          .studio-tool-column :global(
            .design-bench
          ),
          .studio-tool-column :global(
            .studio-inspector
          ) {
            padding:
              16px
              12px
              26px !important;
          }


          .studio-tool-column :global(
            .studio-inspector .field-row
          ) {
            grid-template-columns:
              58px
              minmax(
                0,
                1fr
              ) !important;
          }

        }

      `}</style>

    </main>
  );
}

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

      <div className="studio-header-slot">

        <IXIObjectStudioHeader
          studio={
            studio
          }
        />

      </div>


      <section className="studio-top-bench">

        <div className="top-bench-half">

          <IXIObjectStudioCardBench
            studio={
              studio
            }
          />

        </div>


        <div className="top-bench-half photo-bench-shell">

          <div className="photo-bench-heading">

            <strong>
              PHOTO BENCH
            </strong>

            <span>
              OBJECT MEDIA
            </span>

          </div>


          <div className="photo-bench-rail">

            <button
              type="button"
              className="photo-add"
            >
              +
            </button>


            <div className="photo-empty">
              DROP OR ADD PHOTOS
            </div>

          </div>

        </div>

      </section>


      <section className="studio-work-area">

        <aside className="studio-left-toolbar">

          <IXIObjectStudioDesignBench
            studio={
              studio
            }
          />

        </aside>


        <div className="studio-center-stage">

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
          />

        </div>


        <aside className="studio-right-toolbar">

          <IXIObjectStudioInspector
            studio={
              studio
            }
          />

        </aside>

      </section>


      <footer className="studio-bottom-bench">

        <IXIObjectStudioFaceOrderBench
          studio={
            studio
          }
        />

      </footer>


      <style jsx>{`

        .ixi-object-studio,
        .ixi-object-studio * {
          box-sizing:
            border-box;
        }


        .ixi-object-studio {
          width: 100%;

          height: 100vh;
          min-height: 720px;

          margin: 0;

          padding: 12px;

          display: grid;

          grid-template-rows:
            auto
            102px
            minmax(
              0,
              1fr
            )
            92px;

          gap: 10px;

          overflow: hidden;

          background:
            radial-gradient(
              circle at 50% 0%,
              rgba(
                0,
                194,
                255,
                .028
              ),
              transparent 36%
            ),
            #090909;

          color: white;
        }


        .studio-header-slot {
          min-width: 0;
        }


        .studio-top-bench {
          min-width: 0;

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

          gap: 10px;

          overflow: hidden;
        }


        .top-bench-half {
          min-width: 0;
          height: 100%;

          overflow: hidden;
        }


        .top-bench-half :global(
          .card-bench
        ) {
          height: 100%;

          margin-top: 0;
        }


       .photo-bench-shell {
  width: 100%;
  height: 100%;

  margin: 0;
  padding: 10px;

  overflow: hidden;

  border:
    1px solid
    rgba(
      255,
      255,
      255,
      .05
    );

  border-radius: 9px;

  background:
    rgba(
      255,
      255,
      255,
      .01
    );
}


        .photo-bench-heading {
          height: 16px;

          display: flex;

          align-items: center;

          gap: 9px;
        }


        .photo-bench-heading strong {
          color: #ffc400;

          font-size: 7px;
          font-weight: 950;
        }


        .photo-bench-heading span {
          color:
            rgba(
              255,
              255,
              255,
              .20
            );

          font-size: 6px;
          font-weight: 900;
        }


        .photo-bench-rail {
          height:
            calc(
              100% - 16px
            );

          display: flex;

          align-items: center;

          gap: 7px;

          overflow-x: auto;
          overflow-y: hidden;

          overscroll-behavior-x:
            contain;

          scrollbar-width: thin;
scrollbar-color:
  rgba(
    255,
    255,
    255,
    .08
  )
  transparent;
        }


        .photo-add {
          width: 66px;
          min-width: 66px;

          height: 58px;

          border:
            1px dashed
            rgba(
              255,
              196,
              0,
              .26
            );

          border-radius: 6px;

          background:
            rgba(
              255,
              196,
              0,
              .02
            );

          color: #ffc400;

          font-size: 18px;
          font-weight: 900;

          cursor: pointer;
        }


        .photo-empty {
          min-width: 130px;

          color:
            rgba(
              255,
              255,
              255,
              .16
            );

          font-size: 6px;
          font-weight: 900;
        }


        .studio-work-area {
          position: relative;

          min-width: 0;
          min-height: 0;

          overflow: hidden;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .035
            );

          border-radius: 10px;
        }


        .studio-left-toolbar,
        .studio-right-toolbar {
          position: absolute;

          top: 0;
          bottom: 0;

          z-index: 30;

          min-height: 0;

          overflow-x: hidden;
          overflow-y: auto;

          overscroll-behavior:
            contain;

          scrollbar-width: thin;
scrollbar-color:
  rgba(
    255,
    255,
    255,
    .08
  )
  transparent;
        }


        .studio-left-toolbar {
          left: 0;

          width: 200px;

          border-right:
            1px solid
            rgba(
              255,
              255,
              255,
              .035
            );
        }


        .studio-right-toolbar {
  right: 0;

  width: 250px;

          border-left:
            1px solid
            rgba(
              255,
              255,
              255,
              .035
            );
        }


        .studio-center-stage {
          position: absolute;

          inset: 0;

          z-index: 10;

          min-width: 0;
          min-height: 0;

          overflow: hidden;

          padding:
            12px
            324px
            12px
            242px;

          display: flex;

          align-items: stretch;
          justify-content: stretch;
        }


        .studio-center-stage :global(
          .studio-canvas
        ) {
          width: 100%;
          height: 100%;

          min-height: 0;
        }


        .studio-center-stage :global(
          .canvas-stage
        ) {
          min-width: 0;
          min-height: 0;

          display: flex;

          align-items: center;
          justify-content: center;

          overflow: auto;
        }


        .studio-left-toolbar :global(
          .design-bench
        ),
        .studio-right-toolbar :global(
          .studio-inspector
        ) {
          width: 100%;

          min-height: 100%;

          border: 0;

          border-radius: 0;
        }


        .studio-bottom-bench {
          min-width: 0;

          overflow: hidden;
        }


        .studio-bottom-bench :global(
          .face-order-bench
        ) {
          height: 100%;

          margin-top: 0;

          overflow: hidden;
        }


        .studio-bottom-bench :global(
          .face-order-rail
        ) {
          overflow-x: auto;
          overflow-y: hidden;

          overscroll-behavior-x:
            contain;

          scrollbar-width: thin;
scrollbar-color:
  rgba(
    255,
    255,
    255,
    .08
  )
  transparent;
        }


        :global(html),
        :global(body) {
          max-width: 100%;

          overflow-x: hidden;
        }


        :global(body) {
          margin: 0;
        }

.studio-left-toolbar::-webkit-scrollbar,
.studio-right-toolbar::-webkit-scrollbar,
.card-bench-rail::-webkit-scrollbar,
.photo-bench-rail::-webkit-scrollbar,
.face-order-rail::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}


.studio-left-toolbar::-webkit-scrollbar-track,
.studio-right-toolbar::-webkit-scrollbar-track,
.card-bench-rail::-webkit-scrollbar-track,
.photo-bench-rail::-webkit-scrollbar-track,
.face-order-rail::-webkit-scrollbar-track {
  background: transparent;
}


.studio-left-toolbar::-webkit-scrollbar-thumb,
.studio-right-toolbar::-webkit-scrollbar-thumb,
.card-bench-rail::-webkit-scrollbar-thumb,
.photo-bench-rail::-webkit-scrollbar-thumb,
.face-order-rail::-webkit-scrollbar-thumb {
  border-radius: 999px;

  background:
    rgba(
      255,
      255,
      255,
      .08
    );
}

        @media (
          max-width: 1200px
        ) {

          .studio-left-toolbar {
            width: 205px;
          }


          .studio-right-toolbar {
            width: 280px;
          }


          .studio-center-stage {
            padding-left: 217px;
            padding-right: 292px;
          }

        }


        @media (
          max-width: 900px
        ) {

          .studio-left-toolbar {
            width: 175px;
          }


          .studio-right-toolbar {
            width: 230px;
          }


          .studio-center-stage {
            padding-left: 187px;
            padding-right: 242px;
          }

        }

      `}</style>

    </main>
  );
}

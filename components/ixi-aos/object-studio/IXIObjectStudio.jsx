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


export default function IXIObjectStudio() {

  const studio =
    useIXIObjectStudio({
      object:
        PROOF_OBJECT,

      mode:
        "create"
    });


  /*
   * LIVE CARD PRESENTATION STATE
   *
   * This is workspace/presentation state.
   * It is NOT Object truth and it is NOT
   * Card Definition truth.
   */
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


  function cyclePreviewFace() {

    const faceCount =
      Math.max(
        1,

        studio
          ?.previewCardDefinition
          ?.faces
          ?.length ||
        1
      );


    setPreviewCardState(
      current => {

        const currentFace =
          Math.max(
            1,

            Number(
              current.face ||
              1
            )
          );


        return {
          ...current,

          face:
            currentFace >=
              faceCount
              ? 1
              : currentFace + 1
        };
      }
    );
  }


  return (
    <main className="ixi-object-studio">

      <IXIObjectStudioHeader
        studio={
          studio
        }
      />


      <IXIObjectStudioCardBench
        studio={
          studio
        }
      />


      <section className="ixi-object-studio-workspace">

        <IXIObjectStudioDesignBench
          studio={
            studio
          }
        />


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

          cyclePreviewFace={
            cyclePreviewFace
          }
        />


        <IXIObjectStudioInspector
          studio={
            studio
          }
        />

      </section>


      <IXIObjectStudioFaceOrderBench
        studio={
          studio
        }
      />


      <style jsx>{`
        .ixi-object-studio {
          width: 100%;
          min-height: 100vh;

          padding:
            20px 24px 80px;

          background:
            radial-gradient(
              circle at 50% 0%,
              rgba(
                0,
                194,
                255,
                0.035
              ),
              transparent 34%
            ),
            #090909;

          color: white;
        }

        .ixi-object-studio-workspace {
          width: 100%;
          min-height: 590px;

          margin-top: 12px;

          display: grid;

          grid-template-columns:
            230px
            minmax(
              400px,
              1fr
            )
            312px;

          gap: 12px;

          align-items: stretch;
        }

        @media (max-width: 1100px) {
          .ixi-object-studio-workspace {
            grid-template-columns:
              210px
              minmax(
                360px,
                1fr
              )
              280px;
          }
        }

        @media (max-width: 850px) {
          .ixi-object-studio {
            padding: 12px;
          }

          .ixi-object-studio-workspace {
            grid-template-columns:
              1fr;
          }
        }
      `}</style>

    </main>
  );
}

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

import IXIObjectStudioSkinBench
  from "./IXIObjectStudioSkinBench";

import IXIObjectStudioDefinitionBench
  from "./IXIObjectStudioDefinitionBench";

import {
  IXI_AOS_DEFAULT_SKIN_ID
} from "../skin-runtime/IXIAosSkinLibrary";

import {
  createIXIObjectStudioDraft
} from "./IXIObjectStudioDraftEngine";


function createCommercialDraft() {
  return createIXIObjectStudioDraft({
    object: {
      objectId:
        "studio:new-object",

      displayName:
        "UNTITLED OBJECT",

      fields: {},
      fieldDefinitions: [],
      media: [],

      metadata: {
        objectStudio: {
          shell:
            "commercial-v1"
        }
      }
    },

    mode:
      "create"
  });
}


export default function IXIObjectStudioCommercial() {
  const studio =
    useIXIObjectStudio({
      initialDraft:
        createCommercialDraft()
    });

  const [
    previewCardState,
    setPreviewCardState
  ] = useState({
    color: "none",
    outline: 1,
    face: 1
  });

  const [
    previewScaleMode,
    setPreviewScaleMode
  ] = useState("xl");

  const [
    selectedSkinId,
    setSelectedSkinId
  ] = useState(
    IXI_AOS_DEFAULT_SKIN_ID
  );

  function cyclePreviewScaleMode() {
    const order = [
      "xl",
      "large",
      "medium",
      "compact",
      "micro"
    ];

    setPreviewScaleMode(
      current => {
        const index =
          order.indexOf(current);

        return order[
          index === -1 ||
          index === order.length - 1
            ? 0
            : index + 1
        ];
      }
    );
  }

  function updatePreviewCardState(
    objectId,
    patch
  ) {
    setPreviewCardState(
      current => ({
        ...current,
        ...(patch || {})
      })
    );
  }

  return (
    <main className="ixi-object-studio-commercial">
      <div className="header-slot">
        <IXIObjectStudioHeader
          studio={studio}
        />
      </div>

      <section className="top-row">
        <div className="bench-shell">
          <IXIObjectStudioCardBench
            studio={studio}
          />
        </div>

        <IXIObjectStudioDefinitionBench
          studio={studio}
        />
      </section>

      <section className="workstation">
        <aside className="tool-column">
          <div className="scroll-surface">
            <IXIObjectStudioDesignBench
              studio={studio}
            />

            <div className="skin-slot">
              <IXIObjectStudioSkinBench
                selectedSkinId={
                  selectedSkinId
                }
                onSelectSkin={
                  setSelectedSkinId
                }
              />
            </div>
          </div>
        </aside>

        <section className="center-column">
          <IXIObjectStudioCanvas
            studio={studio}
            previewCardState={
              previewCardState
            }
            updatePreviewCardState={
              updatePreviewCardState
            }
            enableCardScaling={true}
            cardScaleMode={
              previewScaleMode
            }
            onCycleCardScale={
              cyclePreviewScaleMode
            }
            skinId={selectedSkinId}
          />
        </section>

        <aside className="tool-column inspector-column">
          <div className="scroll-surface">
            <IXIObjectStudioInspector
              studio={studio}
            />
          </div>
        </aside>
      </section>

      <footer className="bottom-row">
        <IXIObjectStudioFaceOrderBench
          studio={studio}
        />
      </footer>

      <style jsx>{`
        .ixi-object-studio-commercial,
        .ixi-object-studio-commercial * {
          box-sizing: border-box;
        }

        .ixi-object-studio-commercial {
          width: 100%;
          max-width: 100%;
          height: 100vh;
          height: 100dvh;
          min-width: 0;
          min-height: 700px;
          margin: 0;
          padding: 10px;
          display: grid;
          grid-template-rows:
            auto
            146px
            minmax(0, 1fr)
            78px;
          gap: 8px;
          overflow: hidden;
          background: #090909;
          color: white;
        }

        .header-slot,
        .top-row,
        .workstation,
        .bottom-row,
        .tool-column,
        .center-column,
        .scroll-surface {
          min-width: 0;
          min-height: 0;
        }

        .top-row {
          display: grid;
          grid-template-columns:
            minmax(0, 1fr)
            minmax(0, 1fr);
          gap: 8px;
          overflow: hidden;
        }

        .bench-shell {
          min-width: 0;
          height: 100%;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,.05);
          border-radius: 9px;
          background: rgba(255,255,255,.01);
        }

        .bench-shell :global(.card-bench) {
          width: 100% !important;
          height: 100% !important;
          margin: 0 !important;
          border: 0 !important;
          border-radius: 0 !important;
          background: transparent !important;
        }

        .workstation {
          display: grid;
          grid-template-columns:
            250px
            minmax(0, 1fr)
            300px;
          gap: 8px;
          overflow: hidden;
        }

        .tool-column,
        .center-column {
          height: 100%;
          overflow: hidden;
        }

        .scroll-surface {
          width: 100%;
          height: 100%;
          overflow-x: hidden;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color:
            rgba(255,255,255,.12)
            transparent;
        }

        .skin-slot {
          margin-top: 8px;
        }

        .inspector-column {
          border-left:
            1px solid rgba(255,255,255,.025);
        }

        .bottom-row {
          overflow: hidden;
        }

        .top-row :global(*),
        .workstation :global(*),
        .bottom-row :global(*) {
          box-sizing: border-box !important;
        }

        @media (max-width: 1180px) {
          .workstation {
            grid-template-columns:
              220px
              minmax(0, 1fr)
              270px;
          }
        }

        @media (max-width: 980px) {
          .ixi-object-studio-commercial {
            min-height: 840px;
            height: auto;
            overflow: visible;
            grid-template-rows:
              auto
              auto
              auto
              auto;
          }

          .top-row,
          .workstation {
            grid-template-columns: 1fr;
            overflow: visible;
          }

          .top-row {
            min-height: 300px;
          }

          .workstation {
            min-height: 1200px;
          }

          .tool-column,
          .center-column,
          .scroll-surface {
            height: auto;
            overflow: visible;
          }
        }
      `}</style>
    </main>
  );
}

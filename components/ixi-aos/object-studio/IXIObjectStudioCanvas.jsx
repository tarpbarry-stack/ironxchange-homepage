import IXIAosObjectConsole
  from "../console-runtime/IXIAosObjectConsole";


export default function IXIObjectStudioCanvas({
  studio,

  previewCardState,
  updatePreviewCardState,
  cyclePreviewFace,

  enableCardScaling = true,
  cardScaleMode = "xl",

  onCycleCardScale = null
}) {

  const object =
    studio?.previewObject;


  const objectId =
    String(
      object?.objectId ||
      ""
    );


  const cardDefinition =
    studio
      ?.previewCardDefinition ||
    {};


  /*
   * Console state uses the same Object
   * state contract as the rest of IXI.
   *
   * The Canvas owns the local Studio
   * preview state. The console simply
   * consumes it.
   */
  const ixiCardState = {
    [objectId]:
      previewCardState ||
      {}
  };


  return (
    <section className="studio-canvas">

      <header>

  <div className="canvas-header-copy">

    <strong>
      LIVE OBJECT
    </strong>

    <span>
      ACTUAL CARD + CONSOLE RUNTIME
    </span>

  </div>


  <button
    type="button"
    className="canvas-scale-button"

    onClick={
      onCycleCardScale
    }
  >
    SIZE — {
      String(
        cardScaleMode ||
        "xl"
      ).toUpperCase()
    }
  </button>

</header>


      <div className="canvas-stage">

        <IXIAosObjectConsole
          object={
            object
          }

          objectId={
            objectId
          }

          cardDefinition={
            cardDefinition
          }

          onCreateFace={
  slotId => {

    const currentFaces =
      Array.isArray(
        cardDefinition?.faces
      )
        ? cardDefinition.faces
        : [];


    const nextFaceNumber =
      currentFaces.length + 1;


    const faceId =
      `face-${nextFaceNumber}`;


    studio?.addFace?.({
      faceId,

      name:
        `FACE ${nextFaceNumber}`,

      label:
        `FACE ${nextFaceNumber}`,

      modules: []
    });


    studio?.selectFace?.(
      faceId
    );


    return {
      faceId,

      faceIndex:
        nextFaceNumber,

      slotId
    };
  }
}

          parentLabel=""

          ixiCardState={
            ixiCardState
          }

          updateIxiCardState={
            updatePreviewCardState
          }

          previewCardState={
            previewCardState
          }

          updatePreviewCardState={
            updatePreviewCardState
          }

          studioEditing={
            true
          }

          selectedModuleId={
            studio
              ?.selection
              ?.moduleId ||
            ""
          }

          onSelectModule={({
            faceId,
            moduleId
          }) => {

            studio
              ?.selectModule?.(
                faceId,
                moduleId
              );
          }}

          enableCardScaling={
  enableCardScaling
}

cardScaleMode={
  cardScaleMode
}
        />

      </div>


      <div className="canvas-status">

        <span>
          FACE {
            previewCardState
              ?.face ||
            1
          }
        </span>

        <span>
          {
            cardDefinition
              ?.faces
              ?.length ||
            1
          } FACES
        </span>

        <span>
          OBJECT {objectId}
        </span>

      </div>


      <style jsx>{`

        .studio-canvas {
          position: relative;

          width: 100%;
          height: 100%;

          min-width: 0;
          min-height: 0;

          display: flex;
          flex-direction: column;

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
            radial-gradient(
              circle at center,
              rgba(
                255,
                255,
                255,
                .016
              ),
              transparent 58%
            ),
            rgba(
              0,
              0,
              0,
              .18
            );
        }


        header {
          height: 42px;
          flex: 0 0 42px;

          padding:
            0 12px;

          display: flex;

          align-items: center;

          gap: 9px;

justify-content:
  space-between;
  
          border-bottom:
            1px solid
            rgba(
              255,
              255,
              255,
              .04
            );
        }

.canvas-header-copy {
  min-width: 0;

  display: flex;

  align-items: center;

  gap: 9px;
}


.canvas-scale-button {
  flex: none;

  height: 24px;

  padding:
    0 9px;

  border:
    1px solid
    rgba(
      255,
      196,
      0,
      .18
    );

  border-radius: 4px;

  background:
    rgba(
      255,
      196,
      0,
      .025
    );

  color:
    rgba(
      255,
      196,
      0,
      .66
    );

  font-size: 6px;
  font-weight: 950;

  cursor: pointer;
}


.canvas-scale-button:hover {
  border-color:
    rgba(
      255,
      196,
      0,
      .42
    );

  color:
    #ffc400;
}

        header strong {
          color: #ffc400;

          font-size: 7px;
          font-weight: 950;
        }


        header span {
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


        /*
         * Console assembly is centered as
         * one physical object.
         *
         * When it exceeds the available
         * work surface, THIS surface scrolls.
         * The page does not.
         */
        .canvas-stage {
          flex: 1;

          min-width: 0;
          min-height: 0;

          display: flex;

          align-items: center;
          justify-content: center;

          overflow: auto;

          padding:
            28px;

          scrollbar-width:
            thin;

          scrollbar-color:
            rgba(
              255,
              255,
              255,
              .08
            )
            transparent;
        }


        .canvas-stage::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }


        .canvas-stage::-webkit-scrollbar-track {
          background:
            transparent;
        }


        .canvas-stage::-webkit-scrollbar-thumb {
          border-radius:
            999px;

          background:
            rgba(
              255,
              255,
              255,
              .08
            );
        }


        .canvas-status {
          height: 30px;
          flex: 0 0 30px;

          display: flex;

          align-items: center;

          justify-content: center;

          gap: 16px;

          border-top:
            1px solid
            rgba(
              255,
              255,
              255,
              .035
            );

          color:
            rgba(
              255,
              255,
              255,
              .19
            );

          font-size: 5.5px;
          font-weight: 900;
        }

      `}</style>

    </section>
  );
}

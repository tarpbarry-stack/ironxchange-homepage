import IXIAosObjectConsole
  from "../console-runtime/IXIAosObjectConsole";


export default function IXIObjectStudioCanvas({
  studio,

  previewCardState,
  updatePreviewCardState,
  cyclePreviewFace
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

        <strong>
          LIVE OBJECT
        </strong>

        <span>
          ACTUAL CARD + CONSOLE RUNTIME
        </span>

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
            false
          }

          cardScaleMode="xl"
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

          border-bottom:
            1px solid
            rgba(
              255,
              255,
              255,
              .04
            );
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

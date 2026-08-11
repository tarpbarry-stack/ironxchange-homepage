import IXIAosCardRenderer
  from "../card-runtime/IXIAosCardRenderer";


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


  return (
    <section className="studio-canvas">

      <header>

        <strong>
          LIVE OBJECT
        </strong>

        <span>
          ACTUAL CARD RUNTIME
        </span>

      </header>


      <div className="canvas-stage">

        <IXIAosCardRenderer

          object={
            object
          }

          cardDefinition={
            studio
              ?.previewCardDefinition
          }

          objects={[
            object
          ]}

          ixiState={
            previewCardState
          }

          onIxiStateChange={
            updatePreviewCardState
          }

          onCycleColor={
            () => {}
          }

          onCycleOutline={
            () => {}
          }

          onSendFront={
            () => {}
          }

          onSendBack={
            () => {}
          }

          onSendToArmedDestination={
            () => {}
          }

          onOpenConsole={
            () => {}
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
            studio
              ?.previewCardDefinition
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
          min-height: 590px;

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


        .canvas-stage {
          flex: 1;

          min-height: 510px;

          display: flex;

          align-items: center;
          justify-content: center;

          overflow: auto;

          padding:
            28px;
        }


        .canvas-status {
          height: 30px;

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

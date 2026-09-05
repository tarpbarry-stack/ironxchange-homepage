import IXIObjectRail from "../../../ixi-object-system/IXIObjectRail";
import { IXIAosCardCommandProvider } from "../../card-runtime/IXIAosCardCommandContext";

export default function IXIAosGenericCardRailShell({
  object = {},
  children,
  face = 1,
  saved = false,
  boardColor = "none",
  boardOutline = 1,
  ixiState = {},
  onIxiStateChange = null,
  onOpenTransact = null,
  onSendFront = null,
  onSendBack = null,
  onCycleColor = null,
  onCycleOutline = null,
  onCycleFace = null,
  onRailSend = null,
  armedDestination = "",
  onSendToArmedDestination = null
}) {
  const objectId = String(object?.objectId || object?.id?.uuid || object?.id || "").trim();

  return (
    <IXIAosCardCommandProvider
      object={object}
      objectId={objectId}
      ixiState={ixiState}
      onIxiStateChange={onIxiStateChange}
      onOpenTransact={onOpenTransact}
    >
      <div className="ixi-generic-card-rail-shell">
        {children}

        <IXIObjectRail
          object={object}
          saved={saved}
          color={boardColor}
          outline={boardOutline}
          face={face}
          onSendFront={onSendFront}
          onSendBack={onSendBack}
          onCycleColor={onCycleColor}
          onCycleOutline={onCycleOutline}
          onCycleFace={onCycleFace}
          onRailSend={onRailSend}
          armedDestination={armedDestination}
          onSendToArmedDestination={onSendToArmedDestination}
        />

        <style jsx>{`
          .ixi-generic-card-rail-shell {
            position: relative;
            width: 298px;
            height: 471px;
          }

          .ixi-generic-card-rail-shell :global(.board-command-rail) {
            bottom: 0;
          }
        `}</style>
      </div>
    </IXIAosCardCommandProvider>
  );
}

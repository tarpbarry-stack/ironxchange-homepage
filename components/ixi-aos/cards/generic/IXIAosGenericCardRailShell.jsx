import IXIObjectRail from "../../../ixi-object-system/IXIObjectRail";

export default function IXIAosGenericCardRailShell({
  object = {},
  children,
  face = 1,
  saved = false,
  boardColor = "none",
  boardOutline = 1,
  onSendFront = null,
  onSendBack = null,
  onCycleColor = null,
  onCycleOutline = null,
  onCycleFace = null,
  onRailSend = null,
  armedDestination = "",
  onSendToArmedDestination = null
}) {
  return (
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
      `}</style>
    </div>
  );
}

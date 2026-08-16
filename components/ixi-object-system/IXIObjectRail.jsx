import IXIMachineRail from "../IXIMachineRail";

/*
 * Generic AOS rail contract.
 *
 * The existing rail component still owns the proven visual/interaction
 * physics. This adapter prevents new AOS cards from adopting machine-domain
 * vocabulary in their own APIs. It can be swapped to a fully renamed rail
 * implementation later without changing card layouts.
 */
export default function IXIObjectRail({
  object,
  saved = false,
  color = "none",
  outline = 1,
  face = 1,
  onSendFront = null,
  onSendBack = null,
  onCycleColor = null,
  onCycleOutline = null,
  onCycleFace = null,
  onRailSend = null,
  railMode = "",
  armedDestination = "",
  onSendToArmedDestination = null
}) {
  return (
    <IXIMachineRail
      listing={object}
      saved={saved}
      boardColor={color}
      boardOutline={outline}
      machineFace={face}
      onSendFront={onSendFront}
      onSendBack={onSendBack}
      onCycleColor={onCycleColor}
      onCycleOutline={onCycleOutline}
      onCycleMachineFace={onCycleFace}
      onRailSend={onRailSend}
      railMode={railMode}
      armedDestination={armedDestination}
      onSendToArmedDestination={onSendToArmedDestination}
    />
  );
}

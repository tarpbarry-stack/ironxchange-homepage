import IXISystemIndexCard from "../../../ixi-mos/IXISystemIndexCard";
import IXIAosDataContractCardAdapter from "../../card-runtime/IXIAosDataContractCardAdapter";
import { useIXIAosEditorCommands } from "../../card-runtime/IXIAosEditorCommandContext";
import IXIAosCardHeaderControls from "../../card-runtime/modules/IXIAosCardHeaderControls";
import IXIAosCardHeaderIdentity from "../../card-runtime/modules/IXIAosCardHeaderIdentity";
import IXIAosCommercialEditorBridge from "../../card-runtime/modules/IXIAosCommercialEditorBridge";
import IXIAosFace1CardRuntime from "../../card-runtime/modules/IXIAosFace1CardRuntime";

export const CARD_018 = Object.freeze({
  cardNumber: 18,
  templateSlug: "aos-card-018",
  nativeWidth: 298,
  nativeHeight: 471,
  railReserve: 23,
  version: 12,
  renderer: "system-index-equipment-container"
});

function clean(value) {
  return String(value ?? "").trim();
}

function IXIAosCard018Presentation({
  object = {},
  children = [],
  objects = [],
  ixiState = {},
  ixiCardState = {},
  onIxiStateChange = null,
  onSaveObject = null,
  onAddObject = null,
  onHideObject = null,
  onDeleteObject = null,
  onExposeObject = null,
  onOpenTransact = null,
  onRecall = null,
  onBoard = null,
  onReturn = null,
  onSendFront = null,
  onSendBack = null,
  onCycleColor = null,
  onCycleOutline = null,
  onSendToArmedDestination = null,
  armedDestination = "",
  dragHandleProps = null,
  cardDefinition = CARD_018,
  defaultDisplayName = "EQUIPMENT",
  editHeading = "EDIT EQUIPMENT INDEX",
  childCardMode = "machine",
  loopChildDeck = true
}) {
  const objectId = clean(object?.objectId || object?.id?.uuid || object?.id);
  const editorCommands = useIXIAosEditorCommands();
  const items = Array.isArray(children) && children.length ? children : (Array.isArray(objects) ? objects : []);
  const storedFace = Math.max(1, Number(ixiState?.face || 1));
  const isContainerFace =
    storedFace === 1 ||
    (loopChildDeck && storedFace > items.length + 1);

  return (
    <IXIAosCardHeaderIdentity object={object}>
    <div className="ixi-card-018" data-card-number={String(cardDefinition.cardNumber).padStart(3, "0")} data-card-skin="v12">
      <IXISystemIndexCard
        index={{ ...object, items }}
        objectId={objectId}
        dragHandleProps={dragHandleProps}
        ixiState={ixiState}
        ixiCardState={ixiCardState}
        onIxiStateChange={onIxiStateChange}
        armedDestination={armedDestination}
        onSendFront={onSendFront}
        onSendBack={onSendBack}
        onCycleColor={onCycleColor}
        onCycleOutline={onCycleOutline}
        onSendToArmedDestination={onSendToArmedDestination}
        onExposeObject={onExposeObject}
        onOpenConsole={onOpenTransact}
        onExposeContents={() => onBoard?.(object)}
        onGatherContents={() => onRecall?.(object)}
        onReturnContents={() => onReturn?.(object)}
        onAddObject={onAddObject}
        childCardMode={childCardMode}
        loopChildDeck={loopChildDeck}
        onSavePresentation={(_, action = {}) => {
          if (action?.intent === "edit-face-1") {
            editorCommands?.openEditor?.({ faceNumber: 1 });
          }
        }}
      />

      {isContainerFace ? (
        <header className="c018-head">
          <div className="c018-identity">
            <span>SYSTEM INDEX</span>
            <h2>{clean(object?.displayName) || defaultDisplayName}</h2>
          </div>
          <IXIAosCardHeaderControls
            canAdd={typeof onAddObject === "function"}
            canEdit
            canTransact={typeof onOpenTransact === "function"}
            onAdd={() => onAddObject?.(object)}
            onTransact={() => onOpenTransact?.(object)}
            onHide={onHideObject}
            onDelete={onDeleteObject}
            onOpenConsole={onOpenTransact}
            skinId="v12"
          />
      </header>
      ) : null}

      <style jsx>{`
        .ixi-card-018{position:relative;width:298px;height:471px;overflow:hidden;border-radius:13px;background:#090b0a;font-family:'Inter Variable',Inter,Arial,Helvetica,sans-serif;box-shadow:inset 0 1px rgba(255,255,255,.045),0 18px 42px rgba(0,0,0,.46)}
        .ixi-card-018:before{content:"";position:absolute;inset:0;z-index:250;border:1px solid #454b47;border-radius:13px;box-shadow:inset 0 1px rgba(255,255,255,.055),inset 0 -1px rgba(0,194,255,.09);pointer-events:none}
        .ixi-card-018:after{content:"";position:absolute;inset:7px 7px 24px;z-index:80;border:1px solid rgba(255,255,255,.075);border-radius:9px;box-shadow:inset 0 1px rgba(255,255,255,.025);pointer-events:none}
        :global(.ixi-card-018 .system-index-card){border-color:#454b47!important;border-radius:13px!important;background:radial-gradient(circle at 84% 12%,rgba(23,73,94,.11),transparent 26%),linear-gradient(180deg,#111412,#080a09)!important;box-shadow:inset 0 1px rgba(255,255,255,.07),0 18px 40px rgba(0,0,0,.53)!important}
        :global(.ixi-card-018 .index-topline){display:none!important}
        :global(.ixi-card-018 .system-index-identity){padding-top:49px!important}
        .c018-head{position:absolute;inset:0 0 auto;height:43px;padding:7px 10px;border-bottom:1px solid #303531;background:linear-gradient(180deg,#181b19,#101210);z-index:120}.c018-identity{max-width:188px}.c018-identity>span{display:block;color:#ffc400;font-size:6px;font-weight:950;letter-spacing:.07em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.c018-identity h2{margin:4px 0 0;color:#f7f8f7;font-size:14px;font-weight:950;line-height:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      `}</style>
    </div>
    </IXIAosCardHeaderIdentity>
  );
}

export default function IXIAosCard018(props) {
  const cardDefinition = props.cardDefinition || CARD_018;

  return (
    <IXIAosDataContractCardAdapter {...props} showBusinessIdentifier={false}>
      {contractProps => (
        <IXIAosCommercialEditorBridge
          object={contractProps.object}
          onSaveObject={contractProps.onSaveObject}
          persistenceAdapter={contractProps.hasPersistenceAdapter ? contractProps.onSaveObject : null}
          onCancelDraft={contractProps.onDeleteObject}
          mediaEnabled
        >
          {({ object: runtimeObject }) => (
            <IXIAosFace1CardRuntime
              cardNumber={cardDefinition.cardNumber}
              object={runtimeObject}
              onSaveObject={contractProps.onSaveObject}
              includeBusinessIdentifier
              allowAddFields
            >
              {face1 => (
                <IXIAosCard018Presentation
                  {...contractProps}
                  {...props}
                  object={face1.object}
                  onSaveObject={face1.onSaveObject}
                  cardDefinition={cardDefinition}
                />
              )}
            </IXIAosFace1CardRuntime>
          )}
        </IXIAosCommercialEditorBridge>
      )}
    </IXIAosDataContractCardAdapter>
  );
}

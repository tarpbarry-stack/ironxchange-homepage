import dynamic from "next/dynamic";

import { resolveIXIAosOperatingCardNumber } from "./IXIAosOperatingCardResolver.mjs";
import IXIAosCardIdentityFace from "./IXIAosCardIdentityFace";

function CardLoading() {
  return <div className="ixi-aos-operating-card-loading" aria-label="Loading AOS card" />;
}

const dynamicCard = loader => dynamic(loader, { loading: CardLoading });
const IXIAosLocationObjectConsole = dynamicCard(() => import("../console-runtime/IXIAosLocationObjectConsole"));
const IXIAosCard004Personnel = dynamicCard(() => import("../cards/004/IXIAosCard004Personnel"));
const IXIAosCard005Personnel = dynamicCard(() => import("../cards/005/IXIAosCard005Personnel"));
const IXIAosCard006Personnel = dynamicCard(() => import("../cards/006/IXIAosCard006Personnel"));
const IXIAosCard007EmployeeApplication = dynamicCard(() => import("../cards/007/IXIAosCard007EmployeeApplication"));
const IXIAosCard008Profile = dynamicCard(() => import("../cards/008/IXIAosCard008Profile"));
const IXIAosCard009 = dynamicCard(() => import("../cards/009/IXIAosCard009"));
const IXIAosCard010 = dynamicCard(() => import("../cards/010/IXIAosCard010"));
const IXIAosCard011 = dynamicCard(() => import("../cards/011/IXIAosCard011"));
const IXIAosCard012 = dynamicCard(() => import("../cards/012/IXIAosCard012"));
const IXIAosCard013 = dynamicCard(() => import("../cards/013/IXIAosCard013"));
const IXIAosCard014 = dynamicCard(() => import("../cards/014/IXIAosCard014"));
const IXIAosCard015 = dynamicCard(() => import("../cards/015/IXIAosCard015"));
const IXIAosCard016 = dynamicCard(() => import("../cards/016/IXIAosCard016"));
const IXIAosCard017 = dynamicCard(() => import("../cards/017/IXIAosCard017"));
const IXIAosCard018 = dynamicCard(() => import("../cards/018/IXIAosCard018"));
const IXIAosCard019 = dynamicCard(() => import("../cards/019/IXIAosCard019"));

const NUMBERED_CARDS = Object.freeze({
  4: IXIAosCard004Personnel,
  5: IXIAosCard005Personnel,
  6: IXIAosCard006Personnel,
  7: IXIAosCard007EmployeeApplication,
  8: IXIAosCard008Profile,
  9: IXIAosCard009,
  10: IXIAosCard010,
  11: IXIAosCard011,
  12: IXIAosCard012,
  13: IXIAosCard013,
  14: IXIAosCard014,
  15: IXIAosCard015,
  16: IXIAosCard016,
  17: IXIAosCard017,
  18: IXIAosCard018,
  19: IXIAosCard019
});

function clean(value) {
  return String(value ?? "").trim();
}

export default function IXIAosOperatingCardRuntime({
  object = {},
  items = [],
  projection = null,
  parentLabel = "",
  ixiState = {},
  onIxiStateChange = null,
  onSaveObject = null,
  onAddObject = null,
  onHideObject = null,
  onDeleteObject = null,
  onRecall = null,
  onBoard = null,
  onReturn = null,
  onExposeObject = null,
  onOpenTransact = null,
  onSendFront = null,
  onSendBack = null,
  onCycleColor = null,
  onCycleOutline = null,
  onRailSend = null,
  armedDestination = "",
  onSendToArmedDestination = null,
  dragHandleProps = null
}) {
  const cardNumber = resolveIXIAosOperatingCardNumber(object);
  const objectId = clean(object?.objectId || object?.id?.uuid || object?.id);
  const children = Array.isArray(items) ? items : [];
  const currentFace = Math.max(1, Number(ixiState?.face) || 1);
  const setFace = face => {
    if (objectId) onIxiStateChange?.(objectId, { face });
  };
  const cycleFace = () => setFace(currentFace === 1 ? 2 : 1);
  const shared = {
    object,
    projection,
    children,
    objects: children,
    parentLabel,
    ixiState,
    onIxiStateChange,
    onSaveObject,
    onAddObject,
    onHideObject,
    onDeleteObject,
    onRecall,
    onBoard,
    onReturn,
    onExposeObject,
    onOpenTransact,
    onCycleFace: cycleFace,
    onSendFront,
    onSendBack,
    onCycleColor,
    onCycleOutline,
    onRailSend,
    armedDestination,
    onSendToArmedDestination,
    skinId: "v12"
  };

  let rendered;
  if (cardNumber <= 3) {
    rendered = (
      <IXIAosLocationObjectConsole
        {...shared}
        cardNumber={cardNumber}
        primaryFace={Math.min(5, currentFace)}
        onPrimaryFaceChange={face => {
          if (objectId) onIxiStateChange?.(objectId, { face });
        }}
      />
    );
  } else {
    const Card = NUMBERED_CARDS[cardNumber] || IXIAosCard007EmployeeApplication;
    rendered = currentFace === 2
      ? <IXIAosCardIdentityFace cardNumber={cardNumber} {...shared} />
      : <Card {...shared} />;
  }

  return (
    <div
      className="ixi-aos-operating-card-runtime"
      data-aos-operating-card
      data-aos-card-number={cardNumber}
      data-aos-object-id={objectId}
      {...(dragHandleProps || {})}
    >
      {rendered}

      <style jsx>{`
        .ixi-aos-operating-card-runtime {
          position: relative;
          width: 300px;
          height: 475px;
          padding: 1px;
          overflow: visible;
          box-sizing: border-box;
          touch-action: none;
        }

        :global(.ixi-aos-operating-card-loading) {
          width: 298px;
          height: 471px;
          border: 1px solid rgba(255, 255, 255, .08);
          border-radius: 13px;
          background: #0b0d0c;
        }
      `}</style>
    </div>
  );
}

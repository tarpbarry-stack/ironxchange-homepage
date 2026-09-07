import {
  useState
} from "react";

import IXIObjectDropTarget
  from "./IXIObjectDropTarget";


export default function IXIContainerDropTarget({
  object = {},
  objectId = "",
  workspaceDropPolicy = null,
  workspaceDropSurface = "",
  children
}) {
  const [isDropAccepting, setIsDropAccepting] =
    useState(false);

  const targetObject = {
    ...object,

    objectId:
      String(
        objectId ||
        object?.objectId ||
        ""
      ),

    workspaceDropPolicy:
      workspaceDropPolicy ||
      object?.workspaceDropPolicy ||
      null
  };

  return (
    <div
      className={[
        "ixi-container-drop-target",

        isDropAccepting
          ? "ixi-container-drop-accepting"
          : ""
      ]
        .filter(Boolean)
        .join(" ")}

      data-ixi-container-drop-accepting={
        isDropAccepting
          ? "true"
          : "false"
      }
    >
      <IXIObjectDropTarget
        targetObject={targetObject}
        targetObjectId={targetObject.objectId}
        targetSurface={workspaceDropSurface}
        className="ixi-container-drop-zone"
        onDropStateChange={({ accepting }) => {
          setIsDropAccepting(accepting);
        }}
      />

      {children}

      <style jsx>{`
        .ixi-container-drop-target {
          position: relative;
          width: max-content;
          height: max-content;
          border-radius: 13px;
        }

        :global(.ixi-container-drop-zone) {
          position: absolute;
          left: 4%;
          right: 4%;
          top: 8%;
          bottom: 8%;
          z-index: 260;
          pointer-events: none;
          background: transparent;
        }

        .ixi-container-drop-target.ixi-container-drop-accepting::after {
          content: "";
          position: absolute;
          inset: 0;
          z-index: 300;
          pointer-events: none;
          border: 1px solid rgba(255, 196, 0, .92);
          border-radius: 13px;
          outline: 1px solid rgba(255, 196, 0, .36);
          box-shadow:
            0 0 0 1px rgba(255, 196, 0, .20),
            0 0 18px rgba(255, 196, 0, .24),
            0 0 36px rgba(255, 196, 0, .10),
            inset 0 0 18px rgba(255, 196, 0, .035),
            inset 0 1px 0 rgba(255, 255, 255, .05);
        }
      `}</style>
    </div>
  );
}

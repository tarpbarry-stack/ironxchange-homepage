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
          border: 1px solid rgba(255, 196, 0, 1);
          border-radius: 13px;
          outline: 2px solid rgba(255, 196, 0, .80);
          background: rgba(255, 196, 0, .055);
          box-shadow:
            0 0 0 2px rgba(255, 196, 0, .42),
            0 0 24px rgba(255, 196, 0, .68),
            0 0 56px rgba(255, 196, 0, .38),
            inset 0 0 28px rgba(255, 196, 0, .12),
            inset 0 1px 0 rgba(255, 255, 255, .12);
        }
      `}</style>
    </div>
  );
}

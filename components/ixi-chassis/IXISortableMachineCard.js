import IXISortableObject
  from "./IXISortableObject";

export default function IXISortableMachineCard({
  objectType = "machine",
  objectFamily = "machine",
  dragData = {},

  reorderBehavior = "normal",

  dataWorkspaceFootprint = null,

  ...props
}) {
  return (
    <IXISortableObject
      {...props}

reorderBehavior={
  reorderBehavior
}
  
      objectType={
        objectType ||
        "machine"
      }

      objectFamily={
        objectFamily ||
        "machine"
      }

      dataWorkspaceFootprint={
        dataWorkspaceFootprint
      }

      dragData={{
        /*
         * Compatibility marker.
         * Existing pages may still
         * identify these as legacy
         * machine-sortable objects.
         */
        legacySortableMachine:
          objectType ===
          "machine",

        ...dragData
      }}
    />
  );
}

import IXISortableObject
  from "./IXISortableObject";

export default function IXISortableMachineCard({
  objectType = "machine",
  objectFamily = "machine",
  dragData = {},
  ...props
}) {
  return (
    <IXISortableObject
      {...props}

      objectType={
        objectType ||
        "machine"
      }

      objectFamily={
        objectFamily ||
        "machine"
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

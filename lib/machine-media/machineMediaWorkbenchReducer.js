import { createMachineMediaModel } from "./createMachineMediaModel";

export function machineMediaWorkbenchReducer(state, action) {
  const current = createMachineMediaModel(state);

  switch (action.type) {
    case "SET_MEDIA":
      return createMachineMediaModel(action.items);

    case "ADD_MEDIA":
      return createMachineMediaModel([
        ...current,
        ...(Array.isArray(action.items) ? action.items : [action.item])
      ]);

    case "DELETE_MEDIA":
      return createMachineMediaModel(
        current.filter(item => String(item.id) !== String(action.id))
      );

    case "SET_HERO":
      return createMachineMediaModel(
        current.map(item => ({
          ...item,
          isHero: String(item.id) === String(action.id)
        }))
      );

    case "REORDER_MEDIA": {
      const { fromIndex, toIndex } = action;

      if (
        fromIndex === toIndex ||
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= current.length ||
        toIndex >= current.length
      ) {
        return current;
      }

      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);

      return createMachineMediaModel(next);
    }

    case "SET_VARIANT":
      return createMachineMediaModel(
        current.map(item =>
          String(item.id) === String(action.id)
            ? { ...item, variant: action.variant || "original" }
            : item
        )
      );

    default:
      return current;
  }
}

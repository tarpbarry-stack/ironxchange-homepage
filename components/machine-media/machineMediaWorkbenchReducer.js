import { createMachineMediaModel } from "./createMachineMediaModel";

export function machineMediaWorkbenchReducer(state, action) {
  const current = createMachineMediaModel(state);

  switch (action.type) {
    case "SET_MEDIA": {
      return createMachineMediaModel(action.items || []);
    }

    case "ADD_MEDIA": {
      const incoming = Array.isArray(action.items)
        ? action.items
        : [action.item].filter(Boolean);

      return createMachineMediaModel([...current, ...incoming]);
    }

    case "DELETE_MEDIA": {
      return createMachineMediaModel(
        current.filter(item => String(item.mediaKey) !== String(action.mediaKey))
      );
    }

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

    case "SET_HERO": {
      const targetKey = String(action.mediaKey);

      const selected = current.find(
        item => String(item.mediaKey) === targetKey
      );

      if (!selected) return current;

      const remaining = current.filter(
        item => String(item.mediaKey) !== targetKey
      );

      return createMachineMediaModel([selected, ...remaining]);
    }

    case "SET_VARIANT": {
      return createMachineMediaModel(
        current.map(item =>
          String(item.mediaKey) === String(action.mediaKey)
            ? {
                ...item,
                activeMode: action.variant || "original",
                variant: action.variant || "original"
              }
            : item
        )
      );
    }

    default:
      return current;
  }
}

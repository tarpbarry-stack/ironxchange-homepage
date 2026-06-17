import {
  closestCenter,
  pointerWithin
} from "@dnd-kit/core";

export function workspaceCollisionDetection(args) {
  const pointerHits = pointerWithin(args);

  if (pointerHits.length) {
    return pointerHits;
  }

  return closestCenter(args);
}

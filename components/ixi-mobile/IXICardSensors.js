import { PointerSensor, TouchSensor } from "@dnd-kit/core";

const isInteractive = event => Boolean(event.target?.closest?.(
  "button,input,textarea,select,a,[contenteditable='true'],[data-ixi-no-drag]"
));

// A touch scroll must not activate the mouse/pen distance sensor first.
export class IXICardPointerSensor extends PointerSensor {
  static activators = PointerSensor.activators.map(activator => ({
    ...activator,
    handler: (event, options, context) =>
      event.nativeEvent.pointerType !== "touch" &&
      !isInteractive(event) && activator.handler(event, options, context)
  }));
}

export class IXICardTouchSensor extends TouchSensor {
  static activators = TouchSensor.activators.map(activator => ({
    ...activator,
    handler: (event, options, context) =>
      !isInteractive(event) && activator.handler(event, options, context)
  }));
}

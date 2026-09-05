import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const HEADER_TOOL_SELECTOR =
  '[data-ixi-header-tools="true"]';

export default function IXIHeaderToolPortal({
  children
}) {
  const [target, setTarget] = useState(null);

  useEffect(() => {
    let frameId = 0;

    function syncTarget() {
      const nextTarget =
        document.querySelector(
          HEADER_TOOL_SELECTOR
        );

      setTarget(current =>
        current === nextTarget
          ? current
          : nextTarget
      );
    }

    syncTarget();

    const observer = new MutationObserver(() => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(syncTarget);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
    };
  }, []);

  return target
    ? createPortal(children, target)
    : children;
}

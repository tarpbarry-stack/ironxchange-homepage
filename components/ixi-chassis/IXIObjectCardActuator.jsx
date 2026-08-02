export default function IXIObjectCardActuator({
  side = "right",
  position = "price-row",
  label = "",
  title = "",
  onClick
}) {
  function stopAndRun(event) {
    event.preventDefault();
    event.stopPropagation();

    onClick?.(event);
  }

  return (
    <button
      type="button"
      className={`ixi-object-card-actuator ${side} ${position}`}
      aria-label={label || title}
      title={title || label}
      onPointerDown={event => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onClick={stopAndRun}
    >
      <style jsx>{`
  .ixi-object-card-actuator {
    position: absolute;

    width: 5px;
    height: 34px;

    padding: 0;
    border: 0;

    background: rgba(255,255,255,.18);

    cursor: pointer;
    z-index: 999;
    pointer-events: auto;

    box-shadow:
      inset 1px 0 0 rgba(255,255,255,.12),
      1px 0 3px rgba(0,0,0,.32);
  }

  .ixi-object-card-actuator.right {
    right: -1px;
    border-radius: 3px 1px 1px 3px;
  }

  .ixi-object-card-actuator.left {
    left: -1px;
    border-radius: 1px 3px 3px 1px;
  }

  .ixi-object-card-actuator.state-row {
    top: 414px;
  }

  .ixi-object-card-actuator.price-row {
    top: 414px;
  }

  .ixi-object-card-actuator:hover {
    background: rgba(255,196,0,.95);

    box-shadow:
      0 0 8px rgba(255,196,0,.38);
  }
`}</style>
    </button>
  );
}

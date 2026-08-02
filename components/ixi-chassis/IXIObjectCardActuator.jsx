export default function IXIObjectCardActuator({
  side = "right",
  label = "",
  title = "",
  active = false,
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
      className={`ixi-object-card-actuator ${side} ${
        active ? "is-active" : ""
      }`}
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

          top: 50%;

          width: 4px;
          height: 34px;

          transform: translateY(-50%);

          padding: 0;

          border:
            1px solid
            rgba(255, 255, 255, .22);

          border-radius: 1px;

          background:
            rgba(255, 255, 255, .12);

          cursor: pointer;

          z-index: 999;
          pointer-events: auto;

          box-shadow:
            inset 1px 0 0
              rgba(255, 255, 255, .10),
            1px 0 3px
              rgba(0, 0, 0, .32);
        }

        .ixi-object-card-actuator.right {
          right: -2px;
        }

        .ixi-object-card-actuator.left {
          left: -2px;
        }

        .ixi-object-card-actuator:hover,
        .ixi-object-card-actuator.is-active {
          border-color:
            rgba(255, 196, 0, .62);

          background:
            rgba(255, 196, 0, .72);

          box-shadow:
            0 0 8px
            rgba(255, 196, 0, .28);
        }
      `}</style>
    </button>
  );
}

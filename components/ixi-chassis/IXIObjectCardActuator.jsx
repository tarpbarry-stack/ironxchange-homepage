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

          width: 4px;
          height: 14px;

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

          box-shadow: none;
        }

        /*
         * Same vertical level as the auction
         * price and state fields.
         *
         * Adjust this one value only if the
         * actual row is a pixel or two off.
         */
        .ixi-object-card-actuator.price-row {
          top: 319px;
        }

        .ixi-object-card-actuator.state-row {
          top: 319px;
        }

        .ixi-object-card-actuator.right {
          right: -2px;
        }

        .ixi-object-card-actuator.left {
          left: -2px;
        }

        .ixi-object-card-actuator:hover {
          border-color:
            rgba(255, 196, 0, .62);

          background:
            rgba(255, 196, 0, .72);

          box-shadow:
            0 0 8px
            rgba(255, 196, 0, .20);
        }
      `}</style>
    </button>
  );
}

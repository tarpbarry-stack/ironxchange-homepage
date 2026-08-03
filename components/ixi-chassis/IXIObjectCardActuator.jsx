export default function IXIObjectCardActuator({
  side = "right",
  label = "",
  title = "",
  onClick
}) {
  function handleClick(event) {
    event.preventDefault();
    event.stopPropagation();

    onClick?.(event);
  }

  return (
    <button
      type="button"
      className={`ixi-object-card-actuator ${side}`}
      aria-label={label || title}
      title={title || label}
      onPointerDown={event => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onClick={handleClick}
    >
      <style jsx>{`
        .ixi-object-card-actuator {
          position: absolute;

          /*
           * Listing-card control level:
           * aligned with the price/state area,
           * below the photo and away from drag controls.
           */
          top: 362px;

          width: 3px;
          height: 17px;

          padding: 0;
          border: 0;

          background:
            rgba(255,255,255,.18);

          cursor: pointer;

          z-index: 120;
          pointer-events: auto;

          box-shadow:
            inset 1px 0 0
              rgba(255,255,255,.12),
            1px 0 3px
              rgba(0,0,0,.32);
        }

        .ixi-object-card-actuator.right {
          right: -1px;

          border-radius:
            3px 1px 1px 3px;
        }

        .ixi-object-card-actuator.left {
          left: -1px;

          border-radius:
            1px 3px 3px 1px;
        }

        .ixi-object-card-actuator:hover {
          background:
            rgba(255,196,0,.95);

          box-shadow:
            0 0 8px
            rgba(255,196,0,.38);
        }
      `}</style>
    </button>
  );
}

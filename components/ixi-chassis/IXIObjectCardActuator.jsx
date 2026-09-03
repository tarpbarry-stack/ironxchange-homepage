export default function IXIObjectCardActuator({
  side = "right",
  label = "",
  title = "",
  onClick,

  variant = "compact"
}) {
  const isTall =
    variant === "tall";

  const actuatorTop =
    isTall
      ? 402
      : 352;

  const actuatorHeight =
    isTall
      ? 34
      : 17;

  function handleClick(event) {
    event.preventDefault();
    event.stopPropagation();

    onClick?.(event);
  }

  return (
    <button
      type="button"

      className={`ixi-object-card-actuator ${side}`}

      aria-label={
        label || title
      }

      title={
        title || label
      }

      onPointerDown={event => {
        event.preventDefault();
        event.stopPropagation();
      }}

      onClick={
        handleClick
      }
    >
      <style jsx>{`
        .ixi-object-card-actuator {
          position: absolute;

          top:
            ${actuatorTop}px;

          width: 5px;

          height:
            ${actuatorHeight}px;

          padding: 0;
          border: 0;

          background:
            rgba(
              255,
              255,
              255,
              .18
            );

          cursor: pointer;

          z-index: 120;
          pointer-events: auto;

          box-shadow:
            inset 1px 0 0
              rgba(
                255,
                255,
                255,
                .12
              ),
            1px 0 3px
              rgba(
                0,
                0,
                0,
                .32
              );
        }

        :global(.marketplace-listing-card) .ixi-object-card-actuator {
          top: 335px;
          height: 34px;
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
            rgba(
              255,
              196,
              0,
              .95
            );

          box-shadow:
            0 0 8px
              rgba(
                255,
                196,
                0,
                .38
              );
        }
      `}</style>
    </button>
  );
}

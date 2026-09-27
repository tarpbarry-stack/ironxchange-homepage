export default function IXIObjectCardActuator({
  side = "right",
  label = "",
  title = "",
  onClick,

  variant = "compact"
}) {
  const isTall =
    variant === "tall";

  const isMarketplace =
    variant === "marketplace";

  const actuatorTop =
    isTall
      ? 402
      : isMarketplace
      ? 335
      : 352;

  const actuatorHeight =
    isTall || isMarketplace
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
        event.stopPropagation();
      }}

      style={{ "--ixi-actuator-center": `${actuatorTop + actuatorHeight / 2}px`, "--ixi-actuator-height": `${actuatorHeight}px` }}
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
          --ixi-actuator-center: 352px !important;
          --ixi-actuator-height: 34px !important;
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
        :global([data-ixi-mobile-assembly="true"]) .ixi-object-card-actuator {
          top: calc(var(--ixi-actuator-center) - 22px * var(--ixi-mobile-inverse-scale));
          width: calc(44px * var(--ixi-mobile-inverse-scale));
          height: calc(44px * var(--ixi-mobile-inverse-scale));
          background: transparent;
          box-shadow: none;
          touch-action: manipulation;
        }
        :global([data-ixi-mobile-assembly="true"]) .ixi-object-card-actuator.left { left: 0; }
        :global([data-ixi-mobile-assembly="true"]) .ixi-object-card-actuator.right { right: 0; }
        :global([data-ixi-mobile-assembly="true"]) .ixi-object-card-actuator::after {
          content: "";
          position: absolute;
          top: 50%;
          width: 5px;
          height: var(--ixi-actuator-height);
          transform: translateY(-50%);
          background: rgba(255,255,255,.3);
          border-radius: 3px;
        }
        :global([data-ixi-mobile-assembly="true"]) .ixi-object-card-actuator.left::after { left: 0; }
        :global([data-ixi-mobile-assembly="true"]) .ixi-object-card-actuator.right::after { right: 0; }
        :global([data-ixi-mobile-assembly="true"]) .ixi-object-card-actuator:focus-visible { outline: 2px solid #ffc400; outline-offset: -2px; }
      `}</style>
    </button>
  );
}

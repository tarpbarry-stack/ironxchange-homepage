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

        :global(.ixi-fit-width-object-plane)
        :global(.marketplace-listing-card)
        .ixi-object-card-actuator {
          top:
            calc(
              352px -
              (
                44px *
                var(
                  --ixi-fit-width-inverse-scale,
                  1
                ) /
                2
              )
            );

          width:
            calc(
              44px *
              var(
                --ixi-fit-width-inverse-scale,
                1
              )
            );

          height:
            calc(
              44px *
              var(
                --ixi-fit-width-inverse-scale,
                1
              )
            );

          background: transparent;
          box-shadow: none;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }

        :global(.ixi-fit-width-object-plane)
        :global(.private-listing-card)
        .ixi-object-card-actuator {
          top:
            calc(
              419px -
              (
                44px *
                var(
                  --ixi-fit-width-inverse-scale,
                  1
                ) /
                2
              )
            );

          width:
            calc(
              44px *
              var(
                --ixi-fit-width-inverse-scale,
                1
              )
            );

          height:
            calc(
              44px *
              var(
                --ixi-fit-width-inverse-scale,
                1
              )
            );

          background: transparent;
          box-shadow: none;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }

        :global(.ixi-fit-width-object-plane)
        :global(.marketplace-listing-card)
        .ixi-object-card-actuator::after {
          content: "";
          position: absolute;
          top: 50%;
          width: 5px;
          height: 34px;
          transform: translateY(-50%);
          background: rgba(255, 255, 255, .18);
          box-shadow:
            inset 1px 0 0 rgba(255, 255, 255, .12),
            1px 0 3px rgba(0, 0, 0, .32);
        }

        :global(.ixi-fit-width-object-plane)
        :global(.private-listing-card)
        .ixi-object-card-actuator::after {
          content: "";
          position: absolute;
          top: 50%;
          width: 5px;
          height: 34px;
          transform: translateY(-50%);
          background: rgba(255, 255, 255, .18);
          box-shadow:
            inset 1px 0 0 rgba(255, 255, 255, .12),
            1px 0 3px rgba(0, 0, 0, .32);
        }

        .ixi-object-card-actuator.right {
          right: -1px;

          border-radius:
            3px 1px 1px 3px;
        }

        :global(.ixi-fit-width-object-plane)
        :global(.marketplace-listing-card)
        .ixi-object-card-actuator.right::after {
          right: 0;
          border-radius: 3px 1px 1px 3px;
        }

        :global(.ixi-fit-width-object-plane)
        :global(.private-listing-card)
        .ixi-object-card-actuator.right::after {
          right: 0;
          border-radius: 3px 1px 1px 3px;
        }

        .ixi-object-card-actuator.left {
          left: -1px;

          border-radius:
            1px 3px 3px 1px;
        }

        :global(.ixi-fit-width-object-plane)
        :global(.marketplace-listing-card)
        .ixi-object-card-actuator.left::after {
          left: 0;
          border-radius: 1px 3px 3px 1px;
        }

        :global(.ixi-fit-width-object-plane)
        :global(.private-listing-card)
        .ixi-object-card-actuator.left::after {
          left: 0;
          border-radius: 1px 3px 3px 1px;
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

        :global(.ixi-fit-width-object-plane)
        :global(.marketplace-listing-card)
        .ixi-object-card-actuator:hover {
          background: transparent;
          box-shadow: none;
        }

        :global(.ixi-fit-width-object-plane)
        :global(.private-listing-card)
        .ixi-object-card-actuator:hover {
          background: transparent;
          box-shadow: none;
        }

        :global(.ixi-fit-width-object-plane)
        :global(.marketplace-listing-card)
        .ixi-object-card-actuator:hover::after,
        :global(.ixi-fit-width-object-plane)
        :global(.marketplace-listing-card)
        .ixi-object-card-actuator:focus-visible::after {
          background: rgba(255, 196, 0, .95);
          box-shadow: 0 0 8px rgba(255, 196, 0, .38);
        }

        :global(.ixi-fit-width-object-plane)
        :global(.private-listing-card)
        .ixi-object-card-actuator:hover::after,
        :global(.ixi-fit-width-object-plane)
        :global(.private-listing-card)
        .ixi-object-card-actuator:focus-visible::after {
          background: rgba(255, 196, 0, .95);
          box-shadow: 0 0 8px rgba(255, 196, 0, .38);
        }
      `}</style>
    </button>
  );
}

export default function IXIFaceRow({
  label = "",
  value = "",
  children = null,

  emphasized = false,
  muted = false,
  editable = false,

  className = ""
}) {
  return (
    <div
      className={[
        "ixi-face-row",

        emphasized
          ? "ixi-face-row-emphasized"
          : "",

        muted
          ? "ixi-face-row-muted"
          : "",

        editable
          ? "ixi-face-row-editable"
          : "",

        className
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="ixi-face-row-label">
        {label}
      </span>

      <div className="ixi-face-row-value">
        {children || value || "—"}
      </div>

      <style jsx>{`
        .ixi-face-row,
        .ixi-face-row * {
          box-sizing: border-box;
        }

        .ixi-face-row {
          width: 100%;
          min-width: 0;

          min-height: 22px;

          display: grid;
          grid-template-columns:
            minmax(72px, .8fr)
            minmax(0, 1.2fr);

          align-items: center;

          gap: 8px;

          padding: 3px 0;

          border-bottom:
            1px solid
            rgba(
              255,
              255,
              255,
              .04
            );
        }

        .ixi-face-row:last-child {
          border-bottom: 0;
        }

        .ixi-face-row-label {
          min-width: 0;

          color:
            rgba(
              255,
              255,
              255,
              .42
            );

          font-size:
            var(
              --ixi-face-font-label,
              7px
            );

          font-weight: 950;
          line-height: 1.15;
          letter-spacing: .34px;

          text-transform: uppercase;

          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .ixi-face-row-value {
          min-width: 0;

          color:
            rgba(
              255,
              255,
              255,
              .84
            );

          font-size:
            var(
              --ixi-face-font-value,
              9px
            );

          font-weight: 950;
          line-height: 1.15;

          text-align: right;

          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .ixi-face-row-emphasized
          .ixi-face-row-value {
          color: #ffc400;
        }

        .ixi-face-row-muted
          .ixi-face-row-value {
          color:
            rgba(
              255,
              255,
              255,
              .56
            );
        }

        .ixi-face-row-editable
          .ixi-face-row-value {
          overflow: visible;
        }

        .ixi-face-row-value
          :global(input),
        .ixi-face-row-value
          :global(select),
        .ixi-face-row-value
          :global(textarea) {
          box-sizing: border-box;

          width: 100%;
          min-width: 0;

          border: 0;
          border-bottom:
            1px solid
            rgba(
              255,
              255,
              255,
              .18
            );

          border-radius: 0;

          background: transparent;

          color:
            rgba(
              255,
              255,
              255,
              .9
            );

          padding: 2px 3px;

          font: inherit;
          font-weight: 950;

          text-align: right;

          outline: none;
        }

        .ixi-face-row-emphasized
          .ixi-face-row-value
          :global(input),
        .ixi-face-row-emphasized
          .ixi-face-row-value
          :global(select),
        .ixi-face-row-emphasized
          .ixi-face-row-value
          :global(textarea) {
          color: #ffc400;

          border-bottom-color:
            rgba(
              255,
              196,
              0,
              .48
            );
        }

        .ixi-face-row-value
          :global(input:focus),
        .ixi-face-row-value
          :global(select:focus),
        .ixi-face-row-value
          :global(textarea:focus) {
          border-bottom-color:
            rgba(
              255,
              196,
              0,
              .78
            );

          box-shadow:
            0 3px 8px
              rgba(
                255,
                196,
                0,
                .1
              );
        }
      `}</style>
    </div>
  );
}

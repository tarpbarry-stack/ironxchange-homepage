export default function IXIFaceSummaryCard({
  label = "",
  value = "—",
  detail = "",

  tone = "default",

  align = "center",

  compact = false,

  children = null,

  className = ""
}) {
  const safeTone =
    [
      "default",
      "accent",
      "positive",
      "negative",
      "warning",
      "muted"
    ].includes(tone)
      ? tone
      : "default";

  const safeAlign =
    [
      "left",
      "center",
      "right"
    ].includes(align)
      ? align
      : "center";

  return (
    <div
      className={[
        "ixi-face-summary-card",
        `ixi-face-summary-${safeTone}`,
        `ixi-face-summary-align-${safeAlign}`,

        compact
          ? "ixi-face-summary-compact"
          : "",

        className
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {label ? (
        <span className="ixi-face-summary-label">
          {label}
        </span>
      ) : null}

      <strong className="ixi-face-summary-value">
        {children || value}
      </strong>

      {detail ? (
        <em className="ixi-face-summary-detail">
          {detail}
        </em>
      ) : null}

      <style jsx>{`
        .ixi-face-summary-card,
        .ixi-face-summary-card * {
          box-sizing: border-box;
        }

        .ixi-face-summary-card {
          width: 100%;
          min-width: 0;
          min-height: 58px;

          display: flex;
          flex-direction: column;
          justify-content: center;

          gap: 4px;

          padding: 8px 10px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .07
            );

          border-radius: 7px;

          background:
            linear-gradient(
              180deg,
              rgba(
                255,
                255,
                255,
                .026
              ),
              rgba(
                255,
                255,
                255,
                0
              )
            ),
            rgba(
              8,
              8,
              8,
              .5
            );

          box-shadow:
            inset 0 1px 0
              rgba(
                255,
                255,
                255,
                .035
              );

          overflow: hidden;
        }

        .ixi-face-summary-align-left {
          align-items: flex-start;

          text-align: left;
        }

        .ixi-face-summary-align-center {
          align-items: center;

          text-align: center;
        }

        .ixi-face-summary-align-right {
          align-items: flex-end;

          text-align: right;
        }

        .ixi-face-summary-label {
          width: 100%;
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
          line-height: 1;
          letter-spacing: .44px;

          text-transform: uppercase;

          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .ixi-face-summary-value {
          width: 100%;
          min-width: 0;

          color:
            rgba(
              255,
              255,
              255,
              .92
            );

          font-size:
            var(
              --ixi-face-font-display,
              18px
            );

          font-weight: 950;
          line-height: 1;
          letter-spacing: -.2px;

          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .ixi-face-summary-detail {
          width: 100%;
          min-width: 0;

          color:
            rgba(
              255,
              255,
              255,
              .5
            );

          font-size:
            var(
              --ixi-face-font-micro,
              6.5px
            );

          font-weight: 900;
          font-style: normal;
          line-height: 1.15;
          letter-spacing: .28px;

          text-transform: uppercase;

          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .ixi-face-summary-accent {
          border-color:
            rgba(
              255,
              196,
              0,
              .2
            );

          background:
            linear-gradient(
              180deg,
              rgba(
                255,
                196,
                0,
                .075
              ),
              rgba(
                255,
                196,
                0,
                .012
              )
            ),
            rgba(
              5,
              5,
              5,
              .55
            );
        }

        .ixi-face-summary-accent
          .ixi-face-summary-value {
          color: #ffc400;
        }

        .ixi-face-summary-positive {
          border-color:
            rgba(
              62,
              207,
              142,
              .2
            );

          background:
            linear-gradient(
              180deg,
              rgba(
                62,
                207,
                142,
                .07
              ),
              rgba(
                62,
                207,
                142,
                .01
              )
            ),
            rgba(
              5,
              5,
              5,
              .55
            );
        }

        .ixi-face-summary-positive
          .ixi-face-summary-value {
          color:
            rgba(
              104,
              232,
              166,
              .96
            );
        }

        .ixi-face-summary-negative {
          border-color:
            rgba(
              255,
              83,
              83,
              .22
            );

          background:
            linear-gradient(
              180deg,
              rgba(
                255,
                83,
                83,
                .07
              ),
              rgba(
                255,
                83,
                83,
                .01
              )
            ),
            rgba(
              5,
              5,
              5,
              .55
            );
        }

        .ixi-face-summary-negative
          .ixi-face-summary-value {
          color:
            rgba(
              255,
              111,
              111,
              .96
            );
        }

        .ixi-face-summary-warning {
          border-color:
            rgba(
              255,
              157,
              0,
              .22
            );

          background:
            linear-gradient(
              180deg,
              rgba(
                255,
                157,
                0,
                .07
              ),
              rgba(
                255,
                157,
                0,
                .01
              )
            ),
            rgba(
              5,
              5,
              5,
              .55
            );
        }

        .ixi-face-summary-warning
          .ixi-face-summary-value {
          color:
            rgba(
              255,
              181,
              64,
              .96
            );
        }

        .ixi-face-summary-muted {
          opacity: .72;
        }

        .ixi-face-summary-compact {
          min-height: 46px;

          gap: 3px;

          padding: 6px 8px;
        }

        .ixi-face-summary-compact
          .ixi-face-summary-value {
          font-size:
            var(
              --ixi-face-font-title,
              13px
            );
        }
      `}</style>
    </div>
  );
}

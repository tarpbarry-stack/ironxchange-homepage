export default function IXIAosFaceSummary({
  label = "",

  value = "—",

  detail = "",

  tone = "default",

  align = "left",

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
    ].includes(
      tone
    )
      ? tone
      : "default";


  const safeAlign =
    [
      "left",
      "center",
      "right"
    ].includes(
      align
    )
      ? align
      : "left";


  return (
    <div
      className={[
        "ixi-aos-face-summary",

        `tone-${safeTone}`,

        `align-${safeAlign}`,

        className
      ]
        .filter(Boolean)
        .join(" ")}
    >

      {label ? (
        <span className="summary-label">
          {label}
        </span>
      ) : null}


      <strong className="summary-value">
        {children || value}
      </strong>


      {detail ? (
        <span className="summary-detail">
          {detail}
        </span>
      ) : null}


      <style jsx>{`

        .ixi-aos-face-summary,
        .ixi-aos-face-summary * {
          box-sizing:
            border-box;
        }


        .ixi-aos-face-summary {
          width:
            100%;

          min-width:
            0;

          min-height:
            58px;

          display:
            flex;

          flex-direction:
            column;

          justify-content:
            center;

          gap:
            var(
              --ixi-face-gap-xs,
              3px
            );

          padding:
            var(
              --ixi-face-module-pad,
              7px
            );

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .07
            );

          border-radius:
            7px;

          background:
            rgba(
              8,
              8,
              8,
              .5
            );

          overflow:
            hidden;
        }


        .align-left {
          align-items:
            flex-start;

          text-align:
            left;
        }


        .align-center {
          align-items:
            center;

          text-align:
            center;
        }


        .align-right {
          align-items:
            flex-end;

          text-align:
            right;
        }


        .summary-label {
          width:
            100%;

          color:
            rgba(
              255,
              255,
              255,
              .48
            );

          font-size:
            var(
              --ixi-face-font-label,
              9px
            );

          font-weight:
            950;

          line-height:
            1;

          text-transform:
            uppercase;

          overflow:
            hidden;

          text-overflow:
            ellipsis;

          white-space:
            nowrap;
        }


        .summary-value {
          width:
            100%;

          color:
            rgba(
              255,
              255,
              255,
              .94
            );

          font-size:
            var(
              --ixi-face-font-display,
              18px
            );

          font-weight:
            950;

          line-height:
            1;

          overflow:
            hidden;

          text-overflow:
            ellipsis;

          white-space:
            nowrap;
        }


        .summary-detail {
          width:
            100%;

          color:
            rgba(
              255,
              255,
              255,
              .52
            );

          font-size:
            var(
              --ixi-face-font-micro,
              8px
            );

          font-weight:
            900;

          line-height:
            1.15;

          text-transform:
            uppercase;

          overflow:
            hidden;

          text-overflow:
            ellipsis;

          white-space:
            nowrap;
        }


        .tone-accent {
          border-color:
            rgba(
              255,
              196,
              0,
              .2
            );

          background:
            rgba(
              255,
              196,
              0,
              .055
            );
        }


        .tone-accent
          .summary-value {

          color:
            #ffc400;
        }


        .tone-positive
          .summary-value {

          color:
            rgba(
              104,
              232,
              166,
              .96
            );
        }


        .tone-negative
          .summary-value {

          color:
            rgba(
              255,
              111,
              111,
              .96
            );
        }


        .tone-warning
          .summary-value {

          color:
            rgba(
              255,
              181,
              64,
              .96
            );
        }


        .tone-muted {
          opacity:
            .72;
        }

      `}</style>

    </div>
  );
}

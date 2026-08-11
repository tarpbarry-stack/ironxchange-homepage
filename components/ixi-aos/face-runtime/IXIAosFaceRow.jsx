import {
  getIXIAosCharacterWidth,
  getIXIAosFieldCharacterContract
} from "../presentation-runtime/IXIAosPresentationMetrics";


export default function IXIAosFaceRow({
  label = "",

  value = "",

  children = null,

  fieldId = "",

  valueChars = null,

  flexible = false,

  emphasized = false,

  muted = false,

  editable = false,

  className = ""
}) {

  const contract =
    getIXIAosFieldCharacterContract(
      fieldId
    );


  const chars =
    Number(
      valueChars
    ) ||
    Number(
      contract?.chars
    ) ||
    14;


  const valueWidth =
    flexible
      ? "minmax(0, 1fr)"
      : `minmax(
          0,
          ${getIXIAosCharacterWidth({
            chars,
            paddingChars:
              2
          })}
        )`;


  return (
    <div
      className={[
        "ixi-aos-face-row",

        emphasized
          ? "is-emphasized"
          : "",

        muted
          ? "is-muted"
          : "",

        editable
          ? "is-editable"
          : "",

        className
      ]
        .filter(Boolean)
        .join(" ")}

      style={{
        gridTemplateColumns:
          `max-content ${valueWidth}`
      }}
    >

      <span className="ixi-aos-face-row-label">
        {label}
      </span>


      <div className="ixi-aos-face-row-value">

        {children ||
        value ||
        "—"}

      </div>


      <style jsx>{`

        .ixi-aos-face-row,
        .ixi-aos-face-row * {
          box-sizing:
            border-box;
        }


        .ixi-aos-face-row {
          width:
            100%;

          min-width:
            0;

          min-height:
            var(
              --ixi-face-row-min-height,
              25px
            );

          display:
            grid;

          align-items:
            center;

          justify-content:
            space-between;

          gap:
            var(
              --ixi-face-gap-sm,
              6px
            );

          padding:
            3px 0;

          border-bottom:
            1px solid
            rgba(
              255,
              255,
              255,
              .04
            );
        }


        .ixi-aos-face-row:last-child {
          border-bottom:
            0;
        }


        .ixi-aos-face-row-label {
          min-width:
            0;

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
            1.15;

          letter-spacing:
            .28px;

          text-transform:
            uppercase;

          white-space:
            nowrap;
        }


        .ixi-aos-face-row-value {
          min-width:
            0;

          color:
            rgba(
              255,
              255,
              255,
              .9
            );

          font-size:
            var(
              --ixi-face-font-value,
              10.5px
            );

          font-weight:
            950;

          line-height:
            1.15;

          text-align:
            right;

          overflow:
            hidden;

          text-overflow:
            ellipsis;

          white-space:
            nowrap;
        }


        .is-emphasized
          .ixi-aos-face-row-value {
          color:
            #ffc400;
        }


        .is-muted
          .ixi-aos-face-row-value {
          color:
            rgba(
              255,
              255,
              255,
              .58
            );
        }


        .is-editable
          .ixi-aos-face-row-value {
          overflow:
            visible;
        }


        .ixi-aos-face-row-value
          :global(input),
        .ixi-aos-face-row-value
          :global(select) {

          box-sizing:
            border-box;

          width:
            100%;

          min-width:
            0;

          height:
            27px;

          border:
            0;

          border-bottom:
            1px solid
            rgba(
              255,
              255,
              255,
              .18
            );

          border-radius:
            0;

          background:
            transparent;

          color:
            inherit;

          padding:
            2px 3px;

          font:
            inherit;

          font-weight:
            950;

          text-align:
            right;

          outline:
            none;
        }


        .ixi-aos-face-row-value
          :global(input:focus),
        .ixi-aos-face-row-value
          :global(select:focus) {

          border-bottom-color:
            rgba(
              255,
              196,
              0,
              .78
            );
        }

      `}</style>

    </div>
  );
}

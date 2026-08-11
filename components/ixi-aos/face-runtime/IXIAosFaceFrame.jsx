import {
  getIXIAosPresentationCssVars,
  getIXIAosPresentationMetrics,
  normalizeIXIAosPresentationMode
} from "../presentation-runtime/IXIAosPresentationMetrics";


export default function IXIAosFaceFrame({
  children,

  footer = null,

  presentationMode =
    "medium",

  className = "",

  contentClassName = "",

  footerClassName = "",

  dragHandleProps,

  ...sectionProps
}) {

  const mode =
    normalizeIXIAosPresentationMode(
      presentationMode
    );


  const metrics =
    getIXIAosPresentationMetrics(
      mode
    );


  const cssVars =
    getIXIAosPresentationCssVars(
      mode
    );


  const footerHeight =
    footer
      ? metrics
          .geometry
          .actionFooterHeight
      : 0;


  return (
    <section
      {...sectionProps}
      {...(
        dragHandleProps ||
        {}
      )}

      className={[
        "ixi-aos-face-frame",

        `ixi-aos-face-${mode}`,

        className
      ]
        .filter(Boolean)
        .join(" ")}

      style={{
        ...cssVars,

        height:
          `${metrics.panel.height}px`,

        minHeight:
          `${metrics.panel.height}px`,

        maxHeight:
          `${metrics.panel.height}px`
      }}
    >

      <div
        className={[
          "ixi-aos-face-content",

          contentClassName
        ]
          .filter(Boolean)
          .join(" ")}
      >

        {children}

      </div>


      {footer ? (
        <div
          className={[
            "ixi-aos-face-footer",

            footerClassName
          ]
            .filter(Boolean)
            .join(" ")}

          style={{
            height:
              `${footerHeight}px`,

            minHeight:
              `${footerHeight}px`,

            maxHeight:
              `${footerHeight}px`,

            flexBasis:
              `${footerHeight}px`
          }}
        >

          {footer}

        </div>
      ) : null}


      <style jsx>{`

        .ixi-aos-face-frame,
        .ixi-aos-face-frame * {
          box-sizing:
            border-box;
        }


        .ixi-aos-face-frame {
          position:
            relative;

          width:
            100%;

          min-width:
            0;

          max-width:
            100%;

          display:
            flex;

          flex-direction:
            column;

          border-radius:
            13px;

          background:
            radial-gradient(
              circle at top,
              rgba(
                255,
                196,
                0,
                .045
              ),
              transparent
                42%
            ),
            linear-gradient(
              180deg,
              rgba(
                255,
                255,
                255,
                .028
              ),
              rgba(
                255,
                255,
                255,
                0
              )
            ),
            #141414;

          color:
            #f2f2f2;

          overflow:
            hidden;
        }


        .ixi-aos-face-content {
          width:
            100%;

          min-width:
            0;

          min-height:
            0;

          flex:
            1 1 auto;

          padding:
            var(
              --ixi-face-pad-top
            )
            var(
              --ixi-face-pad-x
            )
            0;

          overflow:
            hidden;
        }


        .ixi-aos-face-footer {
          width:
            100%;

          margin-top:
            auto;

          padding:
            6px
            var(
              --ixi-face-pad-x
            );

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          flex:
            0 0 auto;

          border-top:
            1px solid
            rgba(
              255,
              255,
              255,
              .065
            );

          background:
            linear-gradient(
              180deg,
              rgba(
                20,
                20,
                20,
                0
              ),
              #141414
                24%
            );

          overflow:
            hidden;
        }

      `}</style>

    </section>
  );
}

export default function IXIAosFaceSection({
  title = "",
  meta = "",

  children,

  accent = false,
  dense = false,

  className = ""
}) {

  return (
    <section
      className={[
        "ixi-aos-face-section",

        accent
          ? "is-accent"
          : "",

        dense
          ? "is-dense"
          : "",

        className
      ]
        .filter(Boolean)
        .join(" ")}
    >

      {title || meta ? (
        <header className="ixi-aos-face-section-head">

          {title ? (
            <span className="ixi-aos-face-section-title">
              {title}
            </span>
          ) : null}


          {meta ? (
            <strong className="ixi-aos-face-section-meta">
              {meta}
            </strong>
          ) : null}

        </header>
      ) : null}


      <div className="ixi-aos-face-section-body">
        {children}
      </div>


      <style jsx>{`

        .ixi-aos-face-section,
        .ixi-aos-face-section * {
          box-sizing:
            border-box;
        }


        .ixi-aos-face-section {
          width:
            100%;

          min-width:
            0;

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
            linear-gradient(
              180deg,
              rgba(
                255,
                255,
                255,
                .025
              ),
              rgba(
                255,
                255,
                255,
                0
              )
            ),
            rgba(
              10,
              10,
              10,
              .46
            );

          overflow:
            hidden;
        }


        .is-accent {
          border-color:
            rgba(
              255,
              196,
              0,
              .16
            );

          background:
            linear-gradient(
              180deg,
              rgba(
                255,
                196,
                0,
                .065
              ),
              rgba(
                255,
                196,
                0,
                .012
              )
            ),
            rgba(
              0,
              0,
              0,
              .32
            );
        }


        .is-dense {
          padding:
            calc(
              var(
                --ixi-face-module-pad,
                7px
              ) * .75
            );
        }


        .ixi-aos-face-section-head {
          width:
            100%;

          min-width:
            0;

          min-height:
            var(
              --ixi-face-section-header-height,
              22px
            );

          display:
            flex;

          align-items:
            center;

          justify-content:
            space-between;

          gap:
            var(
              --ixi-face-gap-sm,
              6px
            );

          margin-bottom:
            var(
              --ixi-face-gap-sm,
              6px
            );

          padding-bottom:
            5px;

          border-bottom:
            1px solid
            rgba(
              255,
              255,
              255,
              .045
            );
        }


        .ixi-aos-face-section-title {
          min-width:
            0;

          color:
            rgba(
              255,
              255,
              255,
              .52
            );

          font-size:
            var(
              --ixi-face-font-section,
              10px
            );

          font-weight:
            950;

          line-height:
            1;

          letter-spacing:
            .38px;

          text-transform:
            uppercase;

          overflow:
            hidden;

          text-overflow:
            ellipsis;

          white-space:
            nowrap;
        }


        .ixi-aos-face-section-meta {
          min-width:
            0;

          color:
            #ffc400;

          font-size:
            var(
              --ixi-face-font-label,
              9px
            );

          font-weight:
            950;

          line-height:
            1;

          white-space:
            nowrap;
        }


        .ixi-aos-face-section-body {
          width:
            100%;

          min-width:
            0;
        }

      `}</style>

    </section>
  );
}

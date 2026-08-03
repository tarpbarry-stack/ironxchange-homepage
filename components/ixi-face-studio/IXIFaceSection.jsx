export default function IXIFaceSection({
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
        "ixi-face-section",

        accent
          ? "ixi-face-section-accent"
          : "",

        dense
          ? "ixi-face-section-dense"
          : "",

        className
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {title || meta ? (
        <header className="ixi-face-section-head">
          {title ? (
            <span className="ixi-face-section-title">
              {title}
            </span>
          ) : null}

          {meta ? (
            <strong className="ixi-face-section-meta">
              {meta}
            </strong>
          ) : null}
        </header>
      ) : null}

      <div className="ixi-face-section-body">
        {children}
      </div>

      <style jsx>{`
        .ixi-face-section,
        .ixi-face-section * {
          box-sizing: border-box;
        }

        .ixi-face-section {
          width: 100%;
          min-width: 0;

          padding: 8px;

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

        .ixi-face-section-accent {
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

        .ixi-face-section-dense {
          padding: 6px;
        }

        .ixi-face-section-head {
          width: 100%;
          min-width: 0;

          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 8px;

          margin-bottom: 6px;
          padding-bottom: 5px;

          border-bottom:
            1px solid
            rgba(
              255,
              255,
              255,
              .045
            );
        }

        .ixi-face-section-title {
          min-width: 0;

          color:
            rgba(
              255,
              255,
              255,
              .46
            );

          font-size:
            var(
              --ixi-face-font-section,
              9px
            );

          font-weight: 950;
          line-height: 1;
          letter-spacing: .48px;

          text-transform: uppercase;

          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .ixi-face-section-meta {
          min-width: 0;

          color: #ffc400;

          font-size:
            var(
              --ixi-face-font-label,
              7px
            );

          font-weight: 950;
          line-height: 1;
          letter-spacing: .36px;

          text-transform: uppercase;

          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .ixi-face-section-body {
          width: 100%;
          min-width: 0;
        }
      `}</style>
    </section>
  );
}

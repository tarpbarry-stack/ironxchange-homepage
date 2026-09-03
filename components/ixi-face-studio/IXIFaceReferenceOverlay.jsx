export default function IXIFaceReferenceOverlay({
  previewSize = "tall",
  railHeight = 19
}) {
  const isCompact =
    previewSize === "compact";

  const cardHeight =
    isCompact
      ? 400
      : 475;

  const contentHeight =
    cardHeight - railHeight;

  return (
    <div
      className="face-reference-overlay"
      aria-hidden="true"
    >
      <div className="reference-label reference-top">
        0
      </div>

      <div
        className="reference-line reference-content-bottom"
        style={{
          top: `${contentHeight}px`
        }}
      >
        <span>
          FACE / RAIL DATUM · {contentHeight}px
        </span>
      </div>

      <div
        className="reference-label reference-bottom"
        style={{
          top: `${cardHeight - 10}px`
        }}
      >
        {cardHeight}px
      </div>

      <div className="reference-center-line" />

      <div className="reference-third-line reference-third-left" />

      <div className="reference-third-line reference-third-right" />

      <style jsx>{`
        .face-reference-overlay {
          position: absolute;
          inset: 0;

          z-index: 9999;

          pointer-events: none;

          overflow: visible;
        }

        .reference-line {
          position: absolute;
          left: -34px;
          right: -34px;

          height: 1px;

          border-top:
            1px dashed
            rgba(
              0,
              194,
              255,
              .72
            );
        }

        .reference-line span {
          position: absolute;
          right: 0;
          top: -12px;

          padding: 2px 4px;

          border-radius: 3px;

          background:
            rgba(
              0,
              0,
              0,
              .78
            );

          color:
            rgba(
              0,
              194,
              255,
              .88
            );

          font-size: 6px;
          font-weight: 950;
          letter-spacing: .38px;

          white-space: nowrap;
        }

        .reference-label {
          position: absolute;
          left: -29px;

          color:
            rgba(
              255,
              196,
              0,
              .68
            );

          font-size: 6px;
          font-weight: 950;
          letter-spacing: .24px;
        }

        .reference-top {
          top: 2px;
        }

        .reference-center-line {
          position: absolute;
          top: 0;
          bottom: 0;
          left: 50%;

          width: 1px;

          border-left:
            1px dashed
            rgba(
              255,
              255,
              255,
              .10
            );
        }

        .reference-third-line {
          position: absolute;
          top: 0;
          bottom: 0;

          width: 1px;

          border-left:
            1px dashed
            rgba(
              255,
              255,
              255,
              .055
            );
        }

        .reference-third-left {
          left: 33.333%;
        }

        .reference-third-right {
          left: 66.666%;
        }
      `}</style>
    </div>
  );
}

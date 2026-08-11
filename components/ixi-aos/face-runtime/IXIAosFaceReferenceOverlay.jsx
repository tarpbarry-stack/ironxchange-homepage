import {
  getIXIAosPresentationMetrics
} from "../presentation-runtime/IXIAosPresentationMetrics";


export default function IXIAosFaceReferenceOverlay({
  presentationMode =
    "medium",

  railHeight = 0
}) {

  const metrics =
    getIXIAosPresentationMetrics(
      presentationMode
    );


  const panelHeight =
    metrics.panel.height;


  const contentHeight =
    panelHeight -
    Math.max(
      0,
      Number(
        railHeight
      ) || 0
    );


  return (
    <div className="ixi-aos-face-reference-overlay">

      <div
        className="
          reference-line
          content-bottom
        "

        style={{
          top:
            `${contentHeight}px`
        }}
      >

        <span>
          CONTENT DATUM · {
            contentHeight
          }PX
        </span>

      </div>


      <div className="center-line" />

      <div className="third-line left" />

      <div className="third-line right" />


      <div
        className="height-label"

        style={{
          top:
            `${
              panelHeight -
              12
            }px`
        }}
      >

        {panelHeight}PX

      </div>


      <style jsx>{`

        .ixi-aos-face-reference-overlay {
          position:
            absolute;

          inset:
            0;

          z-index:
            9999;

          pointer-events:
            none;

          overflow:
            visible;
        }


        .reference-line {
          position:
            absolute;

          left:
            -34px;

          right:
            -34px;

          height:
            1px;

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
          position:
            absolute;

          right:
            0;

          top:
            -14px;

          padding:
            2px 4px;

          border-radius:
            3px;

          background:
            rgba(
              0,
              0,
              0,
              .82
            );

          color:
            rgba(
              0,
              194,
              255,
              .9
            );

          font-size:
            8px;

          font-weight:
            950;

          white-space:
            nowrap;
        }


        .center-line,
        .third-line {
          position:
            absolute;

          top:
            0;

          bottom:
            0;

          width:
            1px;

          border-left:
            1px dashed
            rgba(
              255,
              255,
              255,
              .09
            );
        }


        .center-line {
          left:
            50%;
        }


        .third-line.left {
          left:
            33.333%;
        }


        .third-line.right {
          left:
            66.666%;
        }


        .height-label {
          position:
            absolute;

          left:
            -30px;

          color:
            rgba(
              255,
              196,
              0,
              .74
            );

          font-size:
            8px;

          font-weight:
            950;
        }

      `}</style>

    </div>
  );
}

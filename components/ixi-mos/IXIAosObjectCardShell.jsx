import IXIMachineRail
  from "../IXIMachineRail";


function clean(value) {
  return String(
    value || ""
  ).trim();
}


export default function IXIAosObjectCardShell({
  object = {},

  parentLabel = "",
  displayName = "",

  ixiState = {},

  dragHandleProps = null,

  canContain = false,

  onAddChild = null,

  railMode = "",

  onSendFront = null,
  onSendBack = null,

  onCycleFace = null,

  onRailSend = null,

  armedDestination = "",

  onSendToArmedDestination =
    null,

  children
}) {
  const objectId =
    clean(
      object?.objectId ||
      object?.id
    );

  const resolvedParentLabel =
    clean(parentLabel) ||
    "SYSTEM INDEX";

  const resolvedDisplayName =
    clean(displayName) ||
    clean(object?.displayName) ||
    "OBJECT";

  const actionNotice =
    ixiState?.actionNotice ||
    null;

  const boardColor =
    ixiState?.color ||
    "none";

  const boardOutline =
    Number(
      ixiState?.outline ?? 1
    );

  return (
    <article
      className={[
        "ixi-aos-object-card",
        "card",

        `board-color-${
          boardColor
        }`,

        `board-outline-${
          boardOutline
        }`
      ]
        .filter(Boolean)
        .join(" ")}

      data-object-id={
        objectId
      }
    >

      {/* ===============================
          STANDARD AOS IDENTITY HEADER
          =============================== */}

      <header
        className="ixi-aos-card-header"

        {...(
          dragHandleProps ||
          {}
        )}
      >
        <div
          className="ixi-aos-heading"
        >
          <span>
            {resolvedParentLabel}
          </span>

          <strong>
            {resolvedDisplayName}
          </strong>
        </div>


        {canContain &&
        typeof onAddChild ===
          "function" ? (
          <button
            type="button"

            className={`
              ixi-aos-add-child
            `}

            title="Add child object"

            onPointerDown={
              event => {
                event.preventDefault();
                event.stopPropagation();
              }
            }

            onClick={
              event => {
                event.preventDefault();
                event.stopPropagation();

                onAddChild(
                  object
                );
              }
            }
          >
            +
          </button>
        ) : null}
      </header>


      {/* ===============================
          STANDARD ACTION NOTICE
          =============================== */}

      {actionNotice?.message ? (
        <div
          className={[
            "ixi-aos-action-notice",

            `tone-${
              clean(
                actionNotice.tone
              ) ||
              "success"
            }`
          ].join(" ")}
        >
          {actionNotice.message}
        </div>
      ) : null}


      {/* ===============================
          OBJECT FAMILY FACE STUDIO
          =============================== */}

      <div
        className={`
          ixi-aos-face-window
        `}
      >
        {children}
      </div>


      {/* ===============================
          MANDATORY IXI RAIL
          =============================== */}

      <IXIMachineRail
        listing={
          object
        }

        saved={
          false
        }

        boardColor={
          boardColor
        }

        boardOutline={
          boardOutline
        }

        railMode={
          railMode
        }

        onSendFront={
          onSendFront
        }

        onSendBack={
          onSendBack
        }

        onCycleMachineFace={
          onCycleFace
        }

        onRailSend={
          onRailSend
        }

        armedDestination={
          armedDestination
        }

        onSendToArmedDestination={
          onSendToArmedDestination
        }
      />


      <style jsx>{`
        .ixi-aos-object-card,
        .ixi-aos-object-card * {
          box-sizing:
            border-box;
        }


        .ixi-aos-object-card {
          position: relative;

          width: 298px;
          min-width: 298px;
          max-width: 298px;

          height: 471px;
          min-height: 471px;
          max-height: 471px;

          overflow: hidden;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .08
            );

          border-radius:
            14px;

          background:
            linear-gradient(
              180deg,
              rgba(
                255,
                255,
                255,
                .035
              ),
              rgba(
                255,
                255,
                255,
                .006
              )
            ),
            radial-gradient(
              circle
              at top left,
              rgba(
                255,
                196,
                0,
                .055
              ),
              transparent
              55%
            ),
            #101010;

          color: #d6d6d6;

          box-shadow:
            inset
              0 1px 0
              rgba(
                255,
                255,
                255,
                .04
              ),
            0 18px 34px
              rgba(
                0,
                0,
                0,
                .42
              );
        }


        .ixi-aos-card-header {
          height: 52px;
          min-height: 52px;

          padding:
            10px 12px 7px;

          display: flex;
          align-items:
            flex-start;
          justify-content:
            space-between;

          border-bottom:
            1px solid
            rgba(
              255,
              255,
              255,
              .045
            );

          cursor: grab;

          position: relative;

          z-index: 40;
        }


        .ixi-aos-heading {
          min-width: 0;
        }


        .ixi-aos-heading span {
          display: block;

          color: #ffc400;

          font-size: 6.5px;
          font-weight: 950;

          letter-spacing:
            .09em;

          text-transform:
            uppercase;

          overflow: hidden;
          text-overflow:
            ellipsis;
          white-space: nowrap;
        }


        .ixi-aos-heading strong {
          display: block;

          margin-top: 4px;

          max-width: 225px;

          overflow: hidden;

          color: #f4f4f4;

          font-size: 17px;
          font-weight: 950;

          line-height: 1;

          text-overflow:
            ellipsis;

          white-space: nowrap;

          text-transform:
            uppercase;
        }


        .ixi-aos-add-child {
          width: 20px;
          height: 20px;

          flex: 0 0 20px;

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 0;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .10
            );

          border-radius: 4px;

          background:
            rgba(
              255,
              255,
              255,
              .025
            );

          color:
            rgba(
              255,
              255,
              255,
              .52
            );

          font-size: 15px;
          font-weight: 900;
          line-height: 1;

          cursor: pointer;
        }


        .ixi-aos-add-child:hover {
          color: #ffc400;

          border-color:
            rgba(
              255,
              196,
              0,
              .38
            );

          background:
            rgba(
              255,
              196,
              0,
              .06
            );
        }


        .ixi-aos-face-window {
          position: absolute;

          left: 0;
          right: 0;

          top: 52px;

          /*
           * Mandatory 16px IXI Rail
           * remains untouched.
           */
          bottom: 16px;

          overflow: hidden;
        }


        .ixi-aos-action-notice {
          position: absolute;

          left: 10px;
          right: 10px;

          top: 58px;

          min-height: 25px;

          padding:
            6px 9px;

          display: flex;
          align-items: center;
          justify-content: center;

          border:
            1px solid
            rgba(
              0,
              194,
              255,
              .22
            );

          border-radius: 5px;

          background:
            rgba(
              6,
              16,
              20,
              .94
            );

          color:
            rgba(
              0,
              194,
              255,
              .92
            );

          font-size: 7px;
          font-weight: 950;

          letter-spacing:
            .07em;

          text-align: center;

          z-index: 80;

          pointer-events: none;
        }


        .ixi-aos-action-notice.tone-success {
          border-color:
            rgba(
              56,
              161,
              105,
              .42
            );

          color:
            rgba(
              82,
              210,
              133,
              .94
            );
        }


        .ixi-aos-action-notice.tone-warning {
          border-color:
            rgba(
              255,
              196,
              0,
              .42
            );

          color: #ffc400;
        }


        .ixi-aos-action-notice.tone-error {
          border-color:
            rgba(
              229,
              62,
              62,
              .48
            );

          color:
            rgba(
              255,
              100,
              100,
              .96
            );
        }
      `}</style>
    </article>
  );
}

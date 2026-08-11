export default function IXIAosFaceActionFooter({
  actions = [],

  children = null,

  className = ""
}) {

  const safeActions =
    Array.isArray(
      actions
    )
      ? actions
      : [];


  return (
    <div
      className={[
        "ixi-aos-face-action-footer",

        className
      ]
        .filter(Boolean)
        .join(" ")}
    >

      {children || (
        <div className="action-list">

          {safeActions.map(
            (
              action,
              index
            ) => {

              const actionId =
                String(
                  action?.actionId ||
                  action?.id ||
                  `action-${index + 1}`
                );


              return (
                <button
                  key={
                    actionId
                  }

                  type="button"

                  disabled={
                    action?.disabled ===
                    true
                  }

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

                      action
                        ?.onClick
                        ?.(event);
                    }
                  }
                >

                  {
                    action?.label ||
                    "ACTION"
                  }

                </button>
              );
            }
          )}

        </div>
      )}


      <style jsx>{`

        .ixi-aos-face-action-footer,
        .ixi-aos-face-action-footer * {
          box-sizing:
            border-box;
        }


        .ixi-aos-face-action-footer {
          width:
            100%;

          height:
            100%;

          min-width:
            0;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          overflow:
            hidden;
        }


        .action-list {
          width:
            100%;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          flex-wrap:
            wrap;

          gap:
            var(
              --ixi-face-gap-sm,
              6px
            );
        }


        button {
          min-width:
            max-content;

          height:
            27px;

          padding:
            0 12px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .11
            );

          border-radius:
            4px;

          background:
            rgba(
              8,
              8,
              8,
              .9
            );

          color:
            rgba(
              255,
              255,
              255,
              .7
            );

          font-size:
            var(
              --ixi-face-font-label,
              9px
            );

          font-weight:
            950;

          text-transform:
            uppercase;

          cursor:
            pointer;
        }


        button:hover:not(:disabled) {
          border-color:
            rgba(
              255,
              196,
              0,
              .48
            );

          color:
            #ffc400;
        }


        button:disabled {
          opacity:
            .35;

          cursor:
            default;
        }

      `}</style>

    </div>
  );
}

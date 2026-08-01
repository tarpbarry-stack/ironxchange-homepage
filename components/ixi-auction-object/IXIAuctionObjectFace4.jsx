import {
  useState
} from "react";

import {
  cleanMachineTitle
} from "../../lib/listingFormatters";

const ACTIONS = {
  PRIVATE: "move-private",
  ARCHIVE: "archive",
  DELETE: "hard-delete"
};

export default function IXIAuctionObjectFace4({
  listing = {},
  dispositionBusy = "",
  onAuctionDisposition,
  dragHandleProps
}) {
  const [
    pendingAction,
    setPendingAction
  ] = useState("");

  const title =
    cleanMachineTitle(
      listing?.title || ""
    ) ||
    "AUCTION MACHINE";

  const isBusy =
    Boolean(dispositionBusy);

  function selectAction(action) {
    if (isBusy) return;

    setPendingAction(action);
  }

  function cancelAction() {
    if (isBusy) return;

    setPendingAction("");
  }

  async function confirmAction() {
    if (
      !pendingAction ||
      typeof onAuctionDisposition !==
        "function"
    ) {
      return;
    }

    await onAuctionDisposition(
      listing,
      pendingAction
    );

    setPendingAction("");
  }

  const confirmation =
    getConfirmationCopy(
      pendingAction
    );

  return (
    <section
      className="aof4"
      {...(dragHandleProps || {})}
    >
      <header className="aof4-head">
        <span>
          AUCTION OBJECT DISPOSITION
        </span>

        <strong>
          IXI CLOSEOUT™
        </strong>
      </header>

      <div className="aof4-machine-line">
        {title}
      </div>

      {!pendingAction ? (
        <>
          <section className="aof4-intro">
            <span>
              AUCTION COMPLETE
            </span>

            <strong>
              WHAT HAPPENED TO THIS
              MACHINE?
            </strong>

            <p>
              Choose its permanent
              destination.
            </p>
          </section>

          <section className="aof4-actions">
            <DispositionButton
              title="BOUGHT"
              subtitle="MOVE TO PRIVATE INVENTORY"
              detail="Keep Passport, media, auction history and dealer bid pack."
              tone="private"
              disabled={isBusy}
              onClick={() =>
                selectAction(
                  ACTIONS.PRIVATE
                )
              }
            />

            <DispositionButton
              title="ARCHIVE RESULT"
              subtitle="MOVE TO AUCTION ARCHIVE"
              detail="Keep the result, worksheet and one hero image."
              tone="archive"
              disabled={isBusy}
              onClick={() =>
                selectAction(
                  ACTIONS.ARCHIVE
                )
              }
            />

            <DispositionButton
              title="DELETE FOREVER"
              subtitle="PERMANENT HARD DELETE"
              detail="Destroy the auction object and all related private work."
              tone="delete"
              disabled={isBusy}
              onClick={() =>
                selectAction(
                  ACTIONS.DELETE
                )
              }
            />
          </section>
        </>
      ) : (
        <section
          className={[
            "aof4-confirm",
            `tone-${confirmation.tone}`
          ].join(" ")}
        >
          <span>
            {confirmation.eyebrow}
          </span>

          <strong>
            {confirmation.title}
          </strong>

          <p>
            {confirmation.description}
          </p>

          <div className="aof4-confirm-list">
            {confirmation.items.map(
              item => (
                <div key={item}>
                  {item}
                </div>
              )
            )}
          </div>

          <div className="aof4-confirm-actions">
            <button
              type="button"
              className="aof4-cancel"
              disabled={isBusy}
              onPointerDown={event =>
                event.stopPropagation()
              }
              onClick={cancelAction}
            >
              CANCEL
            </button>

            <button
              type="button"
              className="aof4-confirm-button"
              disabled={isBusy}
              onPointerDown={event =>
                event.stopPropagation()
              }
              onClick={confirmAction}
            >
              {isBusy
                ? "PROCESSING..."
                : confirmation.button}
            </button>
          </div>
        </section>
      )}

      {dispositionBusy ? (
        <div className="aof4-busy">
          {getBusyLabel(
            dispositionBusy
          )}
        </div>
      ) : null}

      <style jsx>{`
        .aof4,
        .aof4 * {
          box-sizing: border-box;
        }

        .aof4 {
          width: 100%;
          max-width: 100%;

          height: 470px;
min-height: 470px;
max-height: 470px;

          position: relative;

          padding: 10px 10px 30px;

          display: flex;
          flex-direction: column;
          gap: 7px;

          background: transparent;
        }

        .aof4-head {
          height: 16px;

          position: relative;
          top: -2px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 8px;

          color:
            rgba(
              255,
              255,
              255,
              .48
            );

          font-size: 7.2px;
          font-weight: 950;
          letter-spacing: .44px;

          text-transform: uppercase;
        }

        .aof4-head strong {
          color: #ffc400;

          font-size: 7.8px;
          font-weight: 950;
          letter-spacing: .54px;
        }

        .aof4-machine-line {
          min-height: 18px;

          color:
            rgba(
              255,
              255,
              255,
              .58
            );

          font-size: 7.4px;
          font-weight: 950;
          line-height: 1.15;
          letter-spacing: .28px;

          text-align: center;
          text-transform: uppercase;

          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .aof4-intro {
          min-height: 72px;

          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;

          border:
            1px solid
            rgba(
              255,
              196,
              0,
              .16
            );

          border-radius: 8px;

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
            rgba(0,0,0,.32);
        }

        .aof4-intro span {
          color:
            rgba(
              255,
              255,
              255,
              .42
            );

          font-size: 6.6px;
          font-weight: 950;
          letter-spacing: .58px;
        }

        .aof4-intro strong {
          margin-top: 4px;

          color: #ffc400;

          font-size: 12px;
          font-weight: 950;
          letter-spacing: .22px;

          text-align: center;
        }

        .aof4-intro p {
          margin: 4px 0 0;

          color:
            rgba(
              255,
              255,
              255,
              .38
            );

          font-size: 7px;
          font-weight: 850;
        }

        .aof4-actions {
          display: grid;
          grid-template-columns: 1fr;
          gap: 7px;
        }

        .aof4-confirm {
          flex: 1;

          min-height: 0;

          padding: 12px;

          display: flex;
          flex-direction: column;
          align-items: center;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .08
            );

          border-radius: 8px;

          background:
            linear-gradient(
              180deg,
              rgba(
                255,
                255,
                255,
                .025
              ),
              transparent
            ),
            rgba(8,8,8,.62);
        }

        .aof4-confirm.tone-private {
          border-color:
            rgba(
              0,
              194,
              255,
              .24
            );
        }

        .aof4-confirm.tone-archive {
          border-color:
            rgba(
              255,
              196,
              0,
              .24
            );
        }

        .aof4-confirm.tone-delete {
          border-color:
            rgba(
              229,
              62,
              62,
              .34
            );
        }

        .aof4-confirm > span {
          color:
            rgba(
              255,
              255,
              255,
              .38
            );

          font-size: 6.5px;
          font-weight: 950;
          letter-spacing: .55px;
        }

        .aof4-confirm > strong {
          margin-top: 7px;

          color:
            rgba(
              255,
              255,
              255,
              .9
            );

          font-size: 12px;
          font-weight: 950;

          text-align: center;
        }

        .tone-delete > strong {
          color:
            rgba(
              229,
              62,
              62,
              .96
            );
        }

        .aof4-confirm > p {
          max-width: 250px;

          margin: 8px 0 0;

          color:
            rgba(
              255,
              255,
              255,
              .44
            );

          font-size: 7.4px;
          font-weight: 800;
          line-height: 1.35;

          text-align: center;
        }

        .aof4-confirm-list {
          width: 100%;

          margin-top: 11px;
          padding: 8px 10px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .055
            );

          border-radius: 7px;

          background:
            rgba(
              0,
              0,
              0,
              .25
            );
        }

        .aof4-confirm-list div {
          min-height: 17px;

          display: flex;
          align-items: center;

          border-bottom:
            1px solid
            rgba(
              255,
              255,
              255,
              .035
            );

          color:
            rgba(
              255,
              255,
              255,
              .53
            );

          font-size: 6.8px;
          font-weight: 900;
          letter-spacing: .2px;

          text-transform: uppercase;
        }

        .aof4-confirm-list div:last-child {
          border-bottom: 0;
        }

        .aof4-confirm-actions {
          width: 100%;

          display: grid;
          grid-template-columns:
            minmax(0, 1fr)
            minmax(0, 1.4fr);

          gap: 7px;

          margin-top: auto;
        }

        .aof4-confirm-actions button {
          height: 27px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .10
            );

          border-radius: 6px;

          background:
            rgba(
              10,
              10,
              10,
              .8
            );

          color:
            rgba(
              255,
              255,
              255,
              .58
            );

          font-size: 7px;
          font-weight: 950;
          letter-spacing: .34px;

          cursor: pointer;
        }

        .aof4-confirm-button {
          border-color:
            rgba(
              255,
              196,
              0,
              .34
            ) !important;

          color: #ffc400 !important;
        }

        .tone-delete
        .aof4-confirm-button {
          border-color:
            rgba(
              229,
              62,
              62,
              .45
            ) !important;

          color:
            rgba(
              229,
              62,
              62,
              .96
            ) !important;
        }

        .aof4-confirm-actions
        button:disabled {
          opacity: .34;
          cursor: default;
        }

        .aof4-busy {
          position: absolute;
          left: 10px;
          right: 10px;
          bottom: 30px;

          height: 18px;

          display: flex;
          align-items: center;
          justify-content: center;

          border:
            1px solid
            rgba(
              0,
              194,
              255,
              .2
            );

          border-radius: 5px;

          background:
            rgba(
              0,
              194,
              255,
              .08
            );

          color:
            rgba(
              0,
              194,
              255,
              .9
            );

          font-size: 6.6px;
          font-weight: 950;
          letter-spacing: .44px;

          z-index: 20;
        }
      `}</style>
    </section>
  );
}

function DispositionButton({
  title,
  subtitle,
  detail,
  tone,
  disabled,
  onClick
}) {
  return (
    <button
      type="button"
      className={[
        "aof4-option",
        `tone-${tone}`
      ].join(" ")}
      disabled={disabled}
      onPointerDown={event =>
        event.stopPropagation()
      }
      onClick={onClick}
    >
      <span>
        <strong>{title}</strong>
        <em>{subtitle}</em>
      </span>

      <small>{detail}</small>

      <style jsx>{`
        .aof4-option {
          min-height: 60px;

          padding: 8px 10px;

          display: grid;
          grid-template-columns:
            96px
            minmax(0, 1fr);

          align-items: center;
          gap: 9px;

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
              transparent
            ),
            rgba(10,10,10,.48);

          cursor: pointer;
          text-align: left;
        }

        .aof4-option:hover {
          border-color:
            rgba(
              255,
              196,
              0,
              .34
            );

          transform:
            translateY(-1px);
        }

        .aof4-option:disabled {
          opacity: .34;
          cursor: default;
        }

        .aof4-option span {
          min-width: 0;

          display: flex;
          flex-direction: column;
        }

        .aof4-option strong {
          color:
            rgba(
              255,
              255,
              255,
              .84
            );

          font-size: 8px;
          font-weight: 950;
          letter-spacing: .24px;
        }

        .aof4-option em {
          margin-top: 3px;

          color:
            rgba(
              255,
              255,
              255,
              .34
            );

          font-size: 5.8px;
          font-weight: 950;
          font-style: normal;
          letter-spacing: .24px;
        }

        .aof4-option small {
          color:
            rgba(
              255,
              255,
              255,
              .41
            );

          font-size: 6.7px;
          font-weight: 800;
          line-height: 1.3;
        }

        .tone-private strong {
          color:
            rgba(
              0,
              194,
              255,
              .9
            );
        }

        .tone-archive strong {
          color: #ffc400;
        }

        .tone-delete strong {
          color:
            rgba(
              229,
              62,
              62,
              .94
            );
        }
      `}</style>
    </button>
  );
}

function getConfirmationCopy(
  action
) {
  if (
    action === ACTIONS.PRIVATE
  ) {
    return {
      tone: "private",
      eyebrow:
        "PURCHASED MACHINE",
      title:
        "MOVE TO PRIVATE INVENTORY?",
      description:
        "The auction object will leave Auction Work and become a private owned machine.",
      button:
        "MOVE TO PRIVATE",
      items: [
        "KEEP FULL MEDIA GALLERY",
        "KEEP PASSPORT AND AUCTION HISTORY",
        "KEEP DEALER BID PACK",
        "MOVE MACHINE INTO INVENTORY"
      ]
    };
  }

  if (
    action === ACTIONS.ARCHIVE
  ) {
    return {
      tone: "archive",
      eyebrow:
        "AUCTION RESULT",
      title:
        "ARCHIVE THIS RESULT?",
      description:
        "The machine will leave Auction Work and move into the private Auction Archive.",
      button:
        "ARCHIVE RESULT",
      items: [
        "KEEP AUCTION FACTS AND RESULT",
        "KEEP DEALER BID PACK",
        "KEEP ONE HERO IMAGE",
        "DELETE REMAINING MEDIA"
      ]
    };
  }

  return {
    tone: "delete",
    eyebrow:
      "PERMANENT DESTRUCTION",
    title:
      "DELETE THIS MACHINE FOREVER?",
    description:
      "The auction object and its related private working data will be permanently destroyed. This cannot be undone.",
    button:
      "DELETE FOREVER",
    items: [
      "DELETE LISTING",
      "DELETE WORKSPACE STATE",
      "DELETE DEALER BID PACK",
      "DELETE PASSPORT AND MEDIA"
    ]
  };
}

function getBusyLabel(action) {
  if (
    action === ACTIONS.PRIVATE
  ) {
    return "MOVING TO PRIVATE INVENTORY...";
  }

  if (
    action === ACTIONS.ARCHIVE
  ) {
    return "ARCHIVING AUCTION RESULT...";
  }

  return "PERMANENTLY DELETING...";
}

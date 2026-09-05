import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  getLotNumber,
  getScheduledCloseAt
} from "./auctionObjectSelectors";

function getUserTimezone() {
  try {
    return (
      Intl.DateTimeFormat()
        .resolvedOptions()
        .timeZone ||
      "UTC"
    );
  } catch {
    return "UTC";
  }
}

function formatCloseTime(value, timeZone = "UTC") {
  if (!value) return "";

  const closeDate = new Date(value);

  if (
    Number.isNaN(
      closeDate.getTime()
    )
  ) {
    return "";
  }

  try {
    return new Intl.DateTimeFormat(
      "en-US",
      {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZone,
        timeZoneName: "short"
      }
    ).format(closeDate);
  } catch {
    return "";
  }
}

function formatCountdown(milliseconds) {
  if (
    !Number.isFinite(milliseconds) ||
    milliseconds <= 0
  ) {
    return "CLOSED";
  }

  const totalSeconds =
    Math.floor(
      milliseconds / 1000
    );

  const days =
    Math.floor(
      totalSeconds / 86400
    );

  const hours =
    Math.floor(
      (totalSeconds % 86400) /
      3600
    );

  const minutes =
    Math.floor(
      (totalSeconds % 3600) /
      60
    );

  const seconds =
    totalSeconds % 60;

  if (days > 0) {
    return `${days}D ${String(hours)
      .padStart(2, "0")}H`;
  }

  return [
    hours,
    minutes,
    seconds
  ]
    .map(value =>
      String(value).padStart(
        2,
        "0"
      )
    )
    .join(":");
}

export default function IXIAuctionDeadlineRail({
  listing = {},

  sellerMode = false,

  lotNumberValue,
  onLotNumberChange,

  alertsEnabled = false,
  onAlertClick
}) {
  const lotNumber =
    lotNumberValue ??
    getLotNumber(listing);

  const scheduledCloseAt =
    getScheduledCloseAt(listing);

  const closeTimestamp =
    useMemo(() => {
      if (!scheduledCloseAt) {
        return null;
      }

      const parsedTimestamp =
        new Date(
          scheduledCloseAt
        ).getTime();

      return Number.isFinite(
        parsedTimestamp
      )
        ? parsedTimestamp
        : null;
    }, [scheduledCloseAt]);

  const [
    remainingMs,
    setRemainingMs
  ] = useState(null);

  const [
    displayTimezone,
    setDisplayTimezone
  ] = useState("UTC");

  useEffect(() => {
    setDisplayTimezone(
      getUserTimezone()
    );
  }, []);

  useEffect(() => {
    if (!closeTimestamp) {
      setRemainingMs(null);
      return undefined;
    }

    function updateCountdown() {
      setRemainingMs(
        closeTimestamp -
        Date.now()
      );
    }

    updateCountdown();

    const intervalId =
      window.setInterval(
        updateCountdown,
        1000
      );

    return () => {
      window.clearInterval(
        intervalId
      );
    };
  }, [closeTimestamp]);

  const formattedCloseTime =
    formatCloseTime(
      scheduledCloseAt,
      displayTimezone
    );

  const formattedCountdown =
    remainingMs === null
      ? ""
      : formatCountdown(
          remainingMs
        );

  const isUrgent =
    remainingMs !== null &&
    remainingMs > 0 &&
    remainingMs <=
      10 * 60 * 1000;

  function stopCardClick(event) {
    event.preventDefault();
    event.stopPropagation();
  }

  return (
    <div className="auction-deadline-rail">
      <div className="auction-lot-control">
        <span className="auction-lot-label">
          LOT
        </span>

        {sellerMode ? (
          <input
            className="auction-lot-input"
            value={lotNumber || ""}
            onChange={event =>
              onLotNumberChange?.(
                event.target.value,
                listing
              )
            }
            onClick={stopCardClick}
            placeholder="#"
            maxLength={12}
          />
        ) : (
          <strong className="auction-lot-value">
            {lotNumber || "—"}
          </strong>
        )}
      </div>

      {formattedCloseTime ? (
        <div className="auction-deadline-data">
          <span className="auction-close-time">
            CLOSES {formattedCloseTime}
          </span>

          <span className="auction-deadline-divider">
            |
          </span>

          <span
            className={[
              "auction-countdown",
              isUrgent
                ? "urgent"
                : ""
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {formattedCountdown}
          </span>
        </div>
      ) : (
        <div />
      )}

      {formattedCloseTime &&
      typeof onAlertClick ===
        "function" ? (
        <button
          type="button"
          className={[
            "auction-alert-control",
            alertsEnabled
              ? "active"
              : ""
          ]
            .filter(Boolean)
            .join(" ")}
          onClick={event => {
            stopCardClick(event);
            onAlertClick(
              listing
            );
          }}
          aria-label={
            alertsEnabled
              ? "Auction alert enabled"
              : "Set auction alert"
          }
          title={
            alertsEnabled
              ? "Auction alert enabled"
              : "Set auction alert"
          }
        >
          ●
        </button>
      ) : null}

      <style jsx>{`
        .auction-deadline-rail {
          min-height: 25px;
          width: 100%;
          min-width: 0;

          display: grid;
          grid-template-columns:
            auto
            minmax(0, 1fr)
            auto;

          align-items: center;
          column-gap: 8px;

          margin-bottom: 5px;
        }

        .auction-lot-control {
          min-width: 0;

          display: flex;
          align-items: center;

          gap: 4px;
        }

        .auction-lot-label,
        .auction-lot-value {
          color: #ffc400;

          font-size: 7.8px;
          font-weight: 950;
          line-height: 1;
          letter-spacing: .52px;

          text-transform: uppercase;
          white-space: nowrap;
        }

        .auction-lot-input {
          width: 48px;
          height: 18px;

          border: 1px solid
            rgba(
              255,
              255,
              255,
              .12
            );

          border-radius: 4px;

          background:
            rgba(
              8,
              8,
              8,
              .78
            );

          color: #ffc400;

          padding: 0 5px;

          font-size: 8px;
          font-weight: 950;
          line-height: 18px;
          letter-spacing: .26px;

          outline: none;

          transition:
            border-color .14s ease,
            background .14s ease,
            box-shadow .14s ease;
        }

        .auction-lot-input:hover {
          border-color:
            rgba(
              255,
              255,
              255,
              .2
            );
        }

        .auction-lot-input:focus {
          border-color:
            rgba(
              255,
              196,
              0,
              .52
            );

          background:
            rgba(
              16,
              16,
              16,
              .96
            );

          box-shadow:
            0 0 0 1px
            rgba(
              255,
              196,
              0,
              .08
            );
        }

        .auction-deadline-data {
          min-width: 0;

          display: flex;
          align-items: center;
          justify-content: flex-end;

          gap: 6px;

          white-space: nowrap;
          overflow: hidden;
        }

        .auction-close-time {
          min-width: 0;

          color:
            rgba(
              255,
              255,
              255,
              .48
            );

          font-size: 7.7px;
          font-weight: 900;
          letter-spacing: .25px;

          overflow: hidden;
          text-overflow: ellipsis;

          text-transform: uppercase;
        }

        .auction-deadline-divider {
          color:
            rgba(
              255,
              255,
              255,
              .14
            );

          font-size: 8px;
          font-weight: 700;
        }

        .auction-countdown {
          color: #ffc400;

          font-size: 8.3px;
          font-weight: 950;
          letter-spacing: .38px;

          font-variant-numeric:
            tabular-nums;

          text-align: right;
          white-space: nowrap;
        }

        .auction-countdown.urgent {
          color: #ffd84d;

          text-shadow:
            0 0 10px
            rgba(
              255,
              196,
              0,
              .18
            );
        }

        .auction-alert-control {
          width: 16px;
          height: 16px;

          display: grid;
          place-items: center;

          border: 1px solid
            rgba(
              255,
              255,
              255,
              .09
            );

          border-radius: 50%;

          background:
            rgba(
              255,
              255,
              255,
              .015
            );

          color:
            rgba(
              255,
              255,
              255,
              .18
            );

          padding: 0;

          font-size: 5px;
          line-height: 1;

          cursor: pointer;

          transition:
            color .14s ease,
            border-color .14s ease,
            background .14s ease,
            box-shadow .14s ease,
            transform .14s ease;
        }

        .auction-alert-control:hover {
          transform:
            translateY(-1px);

          color:
            rgba(
              255,
              196,
              0,
              .72
            );

          border-color:
            rgba(
              255,
              196,
              0,
              .32
            );
        }

        .auction-alert-control.active {
          color: #ffc400;

          border-color:
            rgba(
              255,
              196,
              0,
              .48
            );

          background:
            rgba(
              255,
              196,
              0,
              .06
            );

          box-shadow:
            0 0 8px
            rgba(
              255,
              196,
              0,
              .12
            );
        }
      `}</style>
    </div>
  );
}

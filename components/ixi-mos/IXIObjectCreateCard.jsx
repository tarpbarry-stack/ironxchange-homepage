import { useMemo } from "react";

const OBJECT_TYPE_OPTIONS = [
  {
    value: "job",
    label: "JOB"
  },
  {
    value: "location",
    label: "LOCATION / YARD"
  },
  {
    value: "real-estate",
    label: "REAL ESTATE"
  },
  {
    value: "building",
    label: "BUILDING / SHOP"
  },
  {
    value: "room",
    label: "ROOM / BAY"
  },
  {
    value: "person",
    label: "PERSON"
  },
  {
    value: "vehicle",
    label: "VEHICLE"
  },
  {
    value: "tool",
    label: "TOOL"
  },
  {
    value: "generic",
    label: "OTHER"
  }
];

function getTypeLabel(objectType) {
  return (
    OBJECT_TYPE_OPTIONS.find(
      option =>
        option.value === objectType
    )?.label || "OBJECT"
  );
}

export default function IXIObjectCreateCard({
  form,
  working = false,
  error = "",
  onChange,
  onSubmit,
  onCancel
}) {
  const typeLabel = useMemo(
    () =>
      getTypeLabel(
        form?.objectType
      ),
    [form?.objectType]
  );

  function update(field, value) {
    onChange?.(field, value);
  }

  function submit(event) {
    event.preventDefault();
    onSubmit?.(event);
  }

  return (
    <form
      className="ixi-object-create-card"
      onSubmit={submit}
    >
      <div className="ixi-object-create-card__top">
        <div>
          <span className="ixi-object-create-card__eyebrow">
            CREATE
          </span>

          <strong>
            {typeLabel}
          </strong>
        </div>

        <button
          type="button"
          className="ixi-object-create-card__close"
          onClick={onCancel}
          disabled={working}
          aria-label="Close object creator"
        >
          ×
        </button>
      </div>

      <label>
        <span>TYPE</span>

        <select
          value={
            form?.objectType ||
            "job"
          }
          onChange={event =>
            update(
              "objectType",
              event.target.value
            )
          }
          disabled={working}
        >
          {OBJECT_TYPE_OPTIONS.map(
            option => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            )
          )}
        </select>
      </label>

      <label>
        <span>NAME</span>

        <input
          value={
            form?.displayName || ""
          }
          onChange={event =>
            update(
              "displayName",
              event.target.value
            )
          }
          placeholder="JOB 41"
          disabled={working}
          autoFocus
          required
        />
      </label>

      <label>
        <span>CATEGORY</span>

        <input
          value={
            form?.customerCategory ||
            ""
          }
          onChange={event =>
            update(
              "customerCategory",
              event.target.value
            )
          }
          placeholder="CUSTOMER CATEGORY"
          disabled={working}
        />
      </label>

      <label>
        <span>ASSET / UNIT ID</span>

        <input
          value={
            form?.customerAssetId ||
            ""
          }
          onChange={event =>
            update(
              "customerAssetId",
              event.target.value
            )
          }
          placeholder="UNIT 18"
          disabled={working}
        />
      </label>

      <label>
        <span>FACTUAL TITLE</span>

        <input
          value={
            form?.factualTitle || ""
          }
          onChange={event =>
            update(
              "factualTitle",
              event.target.value
            )
          }
          placeholder="2018 FORD F-350 SERVICE TRUCK"
          disabled={working}
        />
      </label>

      <div className="ixi-object-create-card__split">
        <label>
          <span>VALUE</span>

          <input
            type="number"
            min="0"
            step="0.01"
            value={
              form?.value || ""
            }
            onChange={event =>
              update(
                "value",
                event.target.value
              )
            }
            placeholder="48500"
            disabled={working}
          />
        </label>

        <label>
          <span>LOCATION</span>

          <input
            value={
              form?.location || ""
            }
            onChange={event =>
              update(
                "location",
                event.target.value
              )
            }
            placeholder="ODESSA, TX"
            disabled={working}
          />
        </label>
      </div>

      {error ? (
        <div className="ixi-object-create-card__error">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        className="ixi-object-create-card__submit"
        disabled={working}
      >
        {working
          ? "CREATING..."
          : `CREATE ${typeLabel}`}
      </button>

      <style jsx>{`
        .ixi-object-create-card {
          width: 320px;
          min-height: 470px;
          padding: 14px;

          display: flex;
          flex-direction: column;
          gap: 11px;

          border:
            1px solid rgba(
              255,
              196,
              0,
              0.22
            );

          border-radius: 12px;

          background:
            linear-gradient(
              180deg,
              rgba(
                255,
                196,
                0,
                0.035
              ),
              transparent 28%
            ),
            #101010;

          box-shadow:
            0 14px 30px
              rgba(0, 0, 0, 0.28);
        }

        .ixi-object-create-card__top {
          display: flex;
          align-items: center;
          justify-content:
            space-between;

          padding-bottom: 9px;

          border-bottom:
            1px solid
              rgba(
                255,
                255,
                255,
                0.06
              );
        }

        .ixi-object-create-card__eyebrow {
          display: block;
          margin-bottom: 3px;

          color:
            rgba(
              255,
              196,
              0,
              0.82
            );

          font-size: 7px;
          font-weight: 950;
          letter-spacing: 0.7px;
        }

        .ixi-object-create-card__top
          strong {
          color:
            rgba(
              255,
              255,
              255,
              0.86
            );

          font-size: 13px;
          font-weight: 950;
          letter-spacing: 0.4px;
        }

        .ixi-object-create-card__close {
          width: 24px;
          height: 24px;
          padding: 0;

          display: grid;
          place-items: center;

          border: 0;
          border-radius: 4px;

          background:
            rgba(
              255,
              255,
              255,
              0.025
            );

          color:
            rgba(
              255,
              255,
              255,
              0.42
            );

          font-size: 17px;
          line-height: 1;

          cursor: pointer;
        }

        label {
          display: block;
        }

        label span {
          display: block;
          margin-bottom: 5px;

          color:
            rgba(
              255,
              255,
              255,
              0.34
            );

          font-size: 7px;
          font-weight: 950;
          letter-spacing: 0.45px;
        }

        input,
        select {
          width: 100%;
          height: 36px;
          padding: 0 10px;

          border:
            1px solid
              rgba(
                255,
                255,
                255,
                0.09
              );

          border-radius: 6px;

          background: #0b0b0b;

          color:
            rgba(
              255,
              255,
              255,
              0.74
            );

          outline: none;

          font-size: 9px;
          font-weight: 850;
        }

        input:focus,
        select:focus {
          border-color:
            rgba(
              255,
              196,
              0,
              0.44
            );
        }

        .ixi-object-create-card__split {
          display: grid;
          grid-template-columns:
            1fr 1fr;
          gap: 9px;
        }

        .ixi-object-create-card__error {
          padding: 8px;

          border:
            1px solid
              rgba(
                229,
                62,
                62,
                0.28
              );

          border-radius: 6px;

          background:
            rgba(
              229,
              62,
              62,
              0.05
            );

          color:
            rgba(
              255,
              130,
              130,
              0.86
            );

          font-size: 8px;
          font-weight: 850;
        }

        .ixi-object-create-card__submit {
          height: 36px;
          margin-top: auto;

          border:
            1px solid
              rgba(
                255,
                196,
                0,
                0.42
              );

          border-radius: 7px;

          background:
            rgba(
              255,
              196,
              0,
              0.035
            );

          color: #ffc400;

          font-size: 8px;
          font-weight: 950;
          letter-spacing: 0.55px;

          cursor: pointer;
        }

        button:disabled,
        input:disabled,
        select:disabled {
          opacity: 0.5;
          cursor: default;
        }
      `}</style>
    </form>
  );
}

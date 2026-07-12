// /components/ixi-machine-placement/IXIMachinePlacementControl.js

import {
  IXI_MACHINE_ACCESS,
  IXI_MACHINE_CHANNELS
} from "../../lib/machine-access/IXIMachineAccess";

const PLACEMENT_OPTIONS = [
  {
    key: "marketplace",
    label: "LIVE",
    access: IXI_MACHINE_ACCESS.PUBLIC,
    channel: IXI_MACHINE_CHANNELS.MARKETPLACE
  },
  {
    key: "private",
    label: "PRIV",
    access: IXI_MACHINE_ACCESS.PRIVATE,
    channel: IXI_MACHINE_CHANNELS.NONE
  },
  {
    key: "auction",
    label: "AUCT",
    access: IXI_MACHINE_ACCESS.PUBLIC,
    channel: IXI_MACHINE_CHANNELS.AUCTION
  }
];

function getActivePlacementKey({
  machineAccess,
  machineChannel
}) {
  if (
    machineAccess === IXI_MACHINE_ACCESS.PRIVATE &&
    machineChannel === IXI_MACHINE_CHANNELS.NONE
  ) {
    return "private";
  }

  if (
    machineAccess === IXI_MACHINE_ACCESS.PUBLIC &&
    machineChannel === IXI_MACHINE_CHANNELS.AUCTION
  ) {
    return "auction";
  }

  return "marketplace";
}

export default function IXIMachinePlacementControl({
  machineAccess = IXI_MACHINE_ACCESS.PUBLIC,
  machineChannel = IXI_MACHINE_CHANNELS.MARKETPLACE,
  disabled = false,
  onChange
}) {
  const activeKey = getActivePlacementKey({
    machineAccess,
    machineChannel
  });

  return (
    <div
      className="ixi-machine-placement-control"
      role="group"
      aria-label="Machine placement"
    >
      {PLACEMENT_OPTIONS.map(option => {
        const active =
          option.key === activeKey;

        return (
          <button
            key={option.key}
            type="button"
            className={active ? "active" : ""}
            disabled={disabled}
            onClick={event => {
              event.preventDefault();
              event.stopPropagation();

              if (active || disabled) {
                return;
              }

              onChange?.({
                machineAccess: option.access,
                machineChannel: option.channel
              });
            }}
          >
            {option.label}
          </button>
        );
      })}

      <style jsx>{`
       .ixi-machine-placement-control {
  width: 100%;

  display: grid;
  grid-template-columns: repeat(3, 1fr);

  gap: 3px;
}
        button {
          height: 17px;

          border: 1px solid rgba(255,255,255,.08);
          border-radius: 4px;

          background:
            linear-gradient(
              180deg,
              rgba(255,255,255,.018),
              rgba(255,255,255,0)
            ),
            #101010;

          color: rgba(255,255,255,.48);

          font-size: 6px;
          font-weight: 950;
          letter-spacing: .38px;

          cursor: pointer;

          transition:
            color .14s ease,
            border-color .14s ease,
            background .14s ease,
            transform .14s ease;
        }

        button:hover:not(:disabled):not(.active) {
          transform: translateY(-1px);

          color: #ffc400;
          border-color: rgba(255,196,0,.34);
        }

        button.active {
          color: #050505;

          border-color: #ffc400;

          background:
            linear-gradient(
              180deg,
              rgba(255,255,255,.18),
              rgba(255,255,255,0)
            ),
            #ffc400;
        }

        button:disabled {
          cursor: wait;
          opacity: .46;
        }
      `}</style>
    </div>
  );
}

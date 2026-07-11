import {
  useEffect,
  useRef,
  useState
} from "react";

const DEFAULT_CONTROL_SETTINGS = {
  railRevealed: false,
  parkBrakeOn: false,
  activeStackTarget: ""
};

export default function IXIWorkspaceEngine({
  children,
  workspaceSettings = {},
  onSaveWorkspaceSettings = null
}) {
  const [leftPocketMode, setLeftPocketMode] =
    useState("peek");

  const [rightPocketMode, setRightPocketMode] =
    useState("peek");

  const [leftPocket2Mode, setLeftPocket2Mode] =
    useState("peek");

  const [rightPocket2Mode, setRightPocket2Mode] =
    useState("peek");

  const [armedDestination, setArmedDestination] =
    useState("");

  const [railRevealed, setRailRevealed] =
    useState(DEFAULT_CONTROL_SETTINGS.railRevealed);

  const [parkBrakeOn, setParkBrakeOn] =
    useState(DEFAULT_CONTROL_SETTINGS.parkBrakeOn);

  const hasHydratedControlSettingsRef =
    useRef(false);

  /*
   * HYDRATE SHARED CONTROL SETTINGS
   *
   * Runs once when the authenticated or anonymous
   * workspace settings arrive from IX Core.
   */
  useEffect(() => {
    if (hasHydratedControlSettingsRef.current) {
      return;
    }

    if (
      !workspaceSettings ||
      typeof workspaceSettings !== "object"
    ) {
      return;
    }

    const hasRemoteSettings =
      Object.keys(workspaceSettings).length > 0;

    if (!hasRemoteSettings) {
      return;
    }

    if (
      typeof workspaceSettings.railRevealed ===
      "boolean"
    ) {
      setRailRevealed(
        workspaceSettings.railRevealed
      );
    }

    if (
      typeof workspaceSettings.parkBrakeOn ===
      "boolean"
    ) {
      setParkBrakeOn(
        workspaceSettings.parkBrakeOn
      );
    }

    hasHydratedControlSettingsRef.current = true;
  }, [workspaceSettings]);

  function persistControlSettings(patch = {}) {
    if (
      typeof onSaveWorkspaceSettings !==
      "function"
    ) {
      return;
    }

    onSaveWorkspaceSettings(patch);
  }

  function toggleArmedDestination(target) {
    if (parkBrakeOn) {
      console.info(
        "IXI COMMAND BLOCKED — PARK BRAKE ENGAGED"
      );

      return;
    }

    setArmedDestination(current =>
      current === target ? "" : target
    );
  }

  function cycleActiveStackTarget() {
    if (parkBrakeOn) {
      console.info(
        "IXI ACTIVE STACK ARM BLOCKED — PARK BRAKE ENGAGED"
      );

      return;
    }

    setArmedDestination(current => {
      if (current === "stackTop") {
        return "stackBottom";
      }

      if (current === "stackBottom") {
        return "";
      }

      return "stackTop";
    });
  }

  function toggleRailRevealed() {
    setRailRevealed(current => {
      const next = !current;

      persistControlSettings({
        railRevealed: next
      });

      return next;
    });
  }

  function toggleParkBrake() {
    setParkBrakeOn(current => {
      const next = !current;

      /*
       * When the Park Brake engages,
       * clear any armed destination.
       */
      if (next) {
        setArmedDestination("");
      }

      persistControlSettings({
        parkBrakeOn: next
      });

      return next;
    });
  }

  return children({
    leftPocketMode,
    setLeftPocketMode,

    rightPocketMode,
    setRightPocketMode,

    leftPocket2Mode,
    setLeftPocket2Mode,

    rightPocket2Mode,
    setRightPocket2Mode,

    armedDestination,
    setArmedDestination,
    toggleArmedDestination,

    railRevealed,
    setRailRevealed,
    toggleRailRevealed,

    parkBrakeOn,
    setParkBrakeOn,
    toggleParkBrake,

    cycleActiveStackTarget
  });
}

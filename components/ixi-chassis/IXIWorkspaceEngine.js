import {
  useEffect,
  useRef,
  useState
} from "react";

const DEFAULT_CONTROL_SETTINGS = {
  railRevealed: false
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

  const hasHydratedControlSettingsRef =
    useRef(false);

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
    setArmedDestination(current =>
      current === target ? "" : target
    );
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
    toggleRailRevealed
  });
}

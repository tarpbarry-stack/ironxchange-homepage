import {
  useState
} from "react";

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

  const railRevealed =
    workspaceSettings?.railRevealed === true;

  function toggleArmedDestination(target) {
    setArmedDestination(current =>
      current === target ? "" : target
    );
  }

  function toggleRailRevealed() {
    if (
      typeof onSaveWorkspaceSettings !==
      "function"
    ) {
      return;
    }

    onSaveWorkspaceSettings({
      railRevealed: !railRevealed
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
    toggleRailRevealed
  });
}

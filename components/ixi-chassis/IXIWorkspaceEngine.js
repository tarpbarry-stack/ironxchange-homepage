import { useState } from "react";

export default function IXIWorkspaceEngine({
  children
}) {
  const [leftPocketMode, setLeftPocketMode] = useState("peek");
  const [rightPocketMode, setRightPocketMode] = useState("peek");
  const [leftPocket2Mode, setLeftPocket2Mode] = useState("peek");
  const [rightPocket2Mode, setRightPocket2Mode] = useState("peek");

  return children({
    leftPocketMode,
    setLeftPocketMode,
    rightPocketMode,
    setRightPocketMode,
    leftPocket2Mode,
    setLeftPocket2Mode,
    rightPocket2Mode,
    setRightPocket2Mode
  });
}

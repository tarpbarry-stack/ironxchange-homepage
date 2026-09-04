import { createContext, useContext, useMemo } from "react";

const IXIAosEditorCommandContext = createContext(null);

export function IXIAosEditorCommandProvider({ openEditor, faceNumber = 1, children }) {
  const resolvedFaceNumber = Number(faceNumber) || 1;
  const value = useMemo(
    () => typeof openEditor === "function"
      ? { openEditor, faceNumber: resolvedFaceNumber }
      : null,
    [openEditor, resolvedFaceNumber]
  );

  return (
    <IXIAosEditorCommandContext.Provider value={value}>
      {children}
    </IXIAosEditorCommandContext.Provider>
  );
}

export function useIXIAosEditorCommands() {
  return useContext(IXIAosEditorCommandContext);
}

export default IXIAosEditorCommandContext;

import {
  createContext,
  useContext,
  useMemo
} from "react";

const IXIAosCardCommandContext = createContext({
  onOpenTransact: null
});

export function IXIAosCardCommandProvider({
  onOpenTransact = null,
  children
}) {
  const value = useMemo(
    () => ({
      onOpenTransact:
        typeof onOpenTransact === "function"
          ? onOpenTransact
          : null
    }),
    [onOpenTransact]
  );

  return (
    <IXIAosCardCommandContext.Provider value={value}>
      {children}
    </IXIAosCardCommandContext.Provider>
  );
}

export function useIXIAosCardCommands() {
  return useContext(IXIAosCardCommandContext);
}

export default IXIAosCardCommandContext;

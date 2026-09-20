import { createContext, useContext } from "react";

// An explicit presentation capability, never inferred from an Object or Passport ID.
const IXIMachineDemoContext = createContext(null);
export const IXIMachineDemoProvider = IXIMachineDemoContext.Provider;
export function useIXIMachineDemo() { return useContext(IXIMachineDemoContext); }

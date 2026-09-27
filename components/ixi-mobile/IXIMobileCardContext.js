import { createContext, useContext } from "react";

// Presentation only. Never write card, Object, Passport, or session state here.
export const IXIMobileCardContext = createContext(false);
export const useIXIMobileCards = () => useContext(IXIMobileCardContext);

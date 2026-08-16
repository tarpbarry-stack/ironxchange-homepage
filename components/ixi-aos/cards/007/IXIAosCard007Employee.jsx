import IXIAosGenericUniversalLayout007 from "../generic/IXIAosGenericUniversalLayout007";
import IXIAosCard007MediaGeometry from "./IXIAosCard007MediaGeometry";

/*
 * Compatibility export: older imports still reference this file name.
 * Card 007 itself is now the universal, noun-agnostic AOS card.
 */
export default function IXIAosCard007Employee(props) {
  return (
    <>
      <IXIAosGenericUniversalLayout007 {...props} />
      <IXIAosCard007MediaGeometry />
    </>
  );
}

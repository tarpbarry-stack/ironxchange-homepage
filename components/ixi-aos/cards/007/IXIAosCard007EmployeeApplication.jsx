import IXIAosGenericUniversalLayout007 from "../generic/IXIAosGenericUniversalLayout007";
import IXIAosCard007MediaGeometry from "./IXIAosCard007MediaGeometry";

/*
 * Compatibility export for existing Face Lab/runtime imports.
 * Card 007 is now the universal AOS card.
 */
export default function IXIAosCard007EmployeeApplication(props) {
  return (
    <>
      <IXIAosGenericUniversalLayout007 {...props} />
      <IXIAosCard007MediaGeometry />
    </>
  );
}

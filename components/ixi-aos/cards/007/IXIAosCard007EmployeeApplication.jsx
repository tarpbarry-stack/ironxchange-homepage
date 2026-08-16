import IXIAosGenericUniversalLayout007 from "../generic/IXIAosGenericUniversalLayout007";
import IXIAosDataContractCardAdapter from "../../card-runtime/IXIAosDataContractCardAdapter";

/*
 * Compatibility export for existing Face Lab/runtime imports.
 * Card 007 is the universal AOS card. The legacy filename carries no business meaning.
 */
export default function IXIAosCard007EmployeeApplication(props) {
  return (
    <IXIAosDataContractCardAdapter {...props} minimumCustomFields={8}>
      {contractProps => <IXIAosGenericUniversalLayout007 {...contractProps} />}
    </IXIAosDataContractCardAdapter>
  );
}

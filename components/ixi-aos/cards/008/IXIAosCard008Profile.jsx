import IXIAosGenericObjectLayout007 from "../generic/IXIAosGenericObjectLayout007";
import IXIAosGenericCardRailShell from "../generic/IXIAosGenericCardRailShell";
import IXIAosDataContractCardAdapter from "../../card-runtime/IXIAosDataContractCardAdapter";

/*
 * Card 008 — profile / identity presentation recipe.
 * The renderer remains noun-agnostic; sample content never defines runtime meaning.
 * Parent identity is supplied by the shared numbered-card data-contract adapter.
 */
export default function IXIAosCard008Profile(props) {
  return (
    <IXIAosDataContractCardAdapter {...props}>
      {contractProps => (
        <IXIAosGenericCardRailShell object={contractProps.object} {...contractProps} face={1}>
          <IXIAosGenericObjectLayout007 {...contractProps} />
        </IXIAosGenericCardRailShell>
      )}
    </IXIAosDataContractCardAdapter>
  );
}

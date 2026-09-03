import IXIAosGenericObjectLayout007 from "../generic/IXIAosGenericObjectLayout007";
import IXIAosGenericCardRailShell from "../generic/IXIAosGenericCardRailShell";
import IXIAosDataContractCardAdapter from "../../card-runtime/IXIAosDataContractCardAdapter";
import IXIAosFace1CardRuntime from "../../card-runtime/modules/IXIAosFace1CardRuntime";
import IXIAosCardHeaderIdentity from "../../card-runtime/modules/IXIAosCardHeaderIdentity";
export default function IXIAosCard008Profile(props){return <IXIAosDataContractCardAdapter {...props}>{contractProps=><IXIAosFace1CardRuntime cardNumber={8} object={contractProps.object} onSaveObject={contractProps.onSaveObject}>{face1=><IXIAosCardHeaderIdentity object={face1.object}><IXIAosGenericCardRailShell {...contractProps} object={face1.object} face={1}><IXIAosGenericObjectLayout007 {...contractProps} object={face1.object} onSaveObject={face1.onSaveObject}/></IXIAosGenericCardRailShell></IXIAosCardHeaderIdentity>}</IXIAosFace1CardRuntime>}</IXIAosDataContractCardAdapter>}

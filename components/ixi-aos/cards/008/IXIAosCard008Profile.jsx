import IXIAosGenericObjectLayout007 from "../generic/IXIAosGenericObjectLayout007";
import IXIAosGenericCardRailShell from "../generic/IXIAosGenericCardRailShell";
import IXIAosDataContractCardAdapter from "../../card-runtime/IXIAosDataContractCardAdapter";
import IXIAosV12LibraryReadability from "../../card-runtime/modules/IXIAosV12LibraryReadability";
import IXIAosV12Face1EditPatch from "../../card-runtime/modules/IXIAosV12Face1EditPatch";
import IXIAosCardHeaderIdentity from "../../card-runtime/modules/IXIAosCardHeaderIdentity";
export default function IXIAosCard008Profile(props){return <IXIAosDataContractCardAdapter {...props}>{contractProps=><IXIAosCardHeaderIdentity object={contractProps.object} className="ixi-v12-library-readable ixi-v12-face1-edit"><IXIAosGenericCardRailShell {...contractProps} object={contractProps.object} face={1}><IXIAosGenericObjectLayout007 {...contractProps} object={contractProps.object}/></IXIAosGenericCardRailShell><IXIAosV12LibraryReadability/><IXIAosV12Face1EditPatch/></IXIAosCardHeaderIdentity>}</IXIAosDataContractCardAdapter>}

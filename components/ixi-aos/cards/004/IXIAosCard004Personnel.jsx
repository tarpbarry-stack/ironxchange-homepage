import IXIAosGenericContainerLayoutV12 from "../generic/IXIAosGenericContainerLayoutV12";
import IXIAosGenericCardRailShell from "../generic/IXIAosGenericCardRailShell";
import IXIAosV12CardPolish from "../../card-runtime/modules/IXIAosV12CardPolish";
import IXIAosDataContractCardAdapter from "../../card-runtime/IXIAosDataContractCardAdapter";
import IXIAosFace1CardRuntime from "../../card-runtime/modules/IXIAosFace1CardRuntime";
import IXIAosCardHeaderIdentity from "../../card-runtime/modules/IXIAosCardHeaderIdentity";
import IXIAosCard004CommercialFace1 from "./IXIAosCard004CommercialFace1";

export const AOS_CARD_004_PERSONNEL = Object.freeze({cardNumber:4,cardId:"004-generic-container-v12",templateSlug:"personnel-container-004",label:"Container Layout 004",version:12,variant:"summary"});

export default function IXIAosCard004Personnel(props){return <IXIAosDataContractCardAdapter {...props}>{contractProps=><IXIAosFace1CardRuntime object={contractProps.object} onSaveObject={contractProps.onSaveObject} maxFields={0}>{face1=><IXIAosCardHeaderIdentity object={face1.object}><IXIAosCard004CommercialFace1 object={face1.object} children={contractProps.children} onSaveObject={face1.onSaveObject} childrenRenderer={runtimeObject=><><IXIAosGenericCardRailShell {...contractProps} object={runtimeObject} face={1}><IXIAosGenericContainerLayoutV12 {...contractProps} object={runtimeObject} onSaveObject={face1.onSaveObject} variant={1}/></IXIAosGenericCardRailShell><IXIAosV12CardPolish/></>}/></IXIAosCardHeaderIdentity>}</IXIAosFace1CardRuntime>}</IXIAosDataContractCardAdapter>}

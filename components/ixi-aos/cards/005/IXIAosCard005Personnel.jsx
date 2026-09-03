import IXIAosGenericContainerLayoutV12 from "../generic/IXIAosGenericContainerLayoutV12";
import IXIAosGenericCardRailShell from "../generic/IXIAosGenericCardRailShell";
import IXIAosV12CardPolish from "../../card-runtime/modules/IXIAosV12CardPolish";
import IXIAosDataContractCardAdapter from "../../card-runtime/IXIAosDataContractCardAdapter";
import IXIAosFace1CardRuntime from "../../card-runtime/modules/IXIAosFace1CardRuntime";
import IXIAosCardHeaderIdentity from "../../card-runtime/modules/IXIAosCardHeaderIdentity";
export const AOS_CARD_005_PERSONNEL=Object.freeze({cardNumber:5,cardId:"005-generic-container-v12",templateSlug:"personnel-container-005",label:"Container Layout 005",version:12,variant:"analytic"});
export default function IXIAosCard005Personnel(props){return <IXIAosDataContractCardAdapter {...props}>{contractProps=><IXIAosFace1CardRuntime object={contractProps.object} onSaveObject={contractProps.onSaveObject} maxFields={0}>{face1=><IXIAosCardHeaderIdentity object={face1.object}><IXIAosGenericCardRailShell {...contractProps} object={face1.object} face={1}><IXIAosGenericContainerLayoutV12 {...contractProps} object={face1.object} onSaveObject={face1.onSaveObject} variant={2}/></IXIAosGenericCardRailShell><IXIAosV12CardPolish/></IXIAosCardHeaderIdentity>}</IXIAosFace1CardRuntime>}</IXIAosDataContractCardAdapter>}

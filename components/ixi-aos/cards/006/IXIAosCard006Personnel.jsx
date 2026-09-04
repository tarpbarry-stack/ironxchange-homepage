import IXIAosGenericContainerLayoutV12 from "../generic/IXIAosGenericContainerLayoutV12";
import IXIAosGenericCardRailShell from "../generic/IXIAosGenericCardRailShell";
import IXIAosV12CardPolish from "../../card-runtime/modules/IXIAosV12CardPolish";
import IXIAosDataContractCardAdapter from "../../card-runtime/IXIAosDataContractCardAdapter";
import IXIAosFace1CardRuntime from "../../card-runtime/modules/IXIAosFace1CardRuntime";
import IXIAosCardHeaderIdentity from "../../card-runtime/modules/IXIAosCardHeaderIdentity";
export const AOS_CARD_006_PERSONNEL=Object.freeze({cardNumber:6,cardId:"006-generic-container-v12",templateSlug:"personnel-container-006",label:"Container Layout 006",version:12,variant:"dashboard"});
export default function IXIAosCard006Personnel(props){return <IXIAosDataContractCardAdapter {...props}>{contractProps=><IXIAosFace1CardRuntime cardNumber={6} object={contractProps.object} onSaveObject={contractProps.onSaveObject}>{face1=><IXIAosCardHeaderIdentity object={face1.object}><IXIAosGenericCardRailShell {...contractProps} object={face1.object} face={1}><IXIAosGenericContainerLayoutV12 {...contractProps} object={face1.object} onSaveObject={face1.onSaveObject} variant={3} stretchRelationships/></IXIAosGenericCardRailShell><IXIAosV12CardPolish/></IXIAosCardHeaderIdentity>}</IXIAosFace1CardRuntime>}</IXIAosDataContractCardAdapter>}

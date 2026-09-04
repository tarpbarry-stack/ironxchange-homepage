import IXIAosGenericContentDominant013 from "../generic/IXIAosGenericContentDominant013";
import IXIAosDataContractCardAdapter from "../../card-runtime/IXIAosDataContractCardAdapter";
import IXIAosFace1CardRuntime from "../../card-runtime/modules/IXIAosFace1CardRuntime";
import IXIAosCardHeaderIdentity from "../../card-runtime/modules/IXIAosCardHeaderIdentity";
export const CARD_013=Object.freeze({cardNumber:13,templateSlug:"aos-card-013",nativeWidth:298,nativeHeight:471,railReserve:23,version:12,renderer:"schema-driven-generic"});
export default function IXIAosCard013(props){return <IXIAosDataContractCardAdapter {...props} minimumCustomFields={9}>{contractProps=><IXIAosFace1CardRuntime cardNumber={13} object={contractProps.object} onSaveObject={contractProps.onSaveObject} maxFields={9}>{face1=><IXIAosCardHeaderIdentity object={face1.object}><IXIAosGenericContentDominant013 {...contractProps} object={face1.object} onSaveObject={face1.onSaveObject}/></IXIAosCardHeaderIdentity>}</IXIAosFace1CardRuntime>}</IXIAosDataContractCardAdapter>}

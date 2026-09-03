import IXIAosGenericMediaDominant009 from "../generic/IXIAosGenericMediaDominant009";
import IXIAosDataContractCardAdapter from "../../card-runtime/IXIAosDataContractCardAdapter";
import IXIAosFace1CardRuntime from "../../card-runtime/modules/IXIAosFace1CardRuntime";
import IXIAosCardHeaderIdentity from "../../card-runtime/modules/IXIAosCardHeaderIdentity";
export const CARD_009=Object.freeze({cardNumber:9,templateSlug:"aos-card-009",nativeWidth:298,nativeHeight:471,railReserve:23,version:12,renderer:"schema-driven-generic"});
export default function IXIAosCard009(props){return <IXIAosDataContractCardAdapter {...props} minimumCustomFields={7}>{contractProps=><IXIAosFace1CardRuntime cardNumber={9} object={contractProps.object} onSaveObject={contractProps.onSaveObject} maxFields={6}>{face1=><IXIAosCardHeaderIdentity object={face1.object}><IXIAosGenericMediaDominant009 {...contractProps} object={face1.object} onSaveObject={face1.onSaveObject}/></IXIAosCardHeaderIdentity>}</IXIAosFace1CardRuntime>}</IXIAosDataContractCardAdapter>}

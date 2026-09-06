import IXIAosGenericContainerLayoutV12 from "../generic/IXIAosGenericContainerLayoutV12";
import IXIAosGenericCardRailShell from "../generic/IXIAosGenericCardRailShell";
import IXIAosV12CardPolish from "../../card-runtime/modules/IXIAosV12CardPolish";
import IXIAosDataContractCardAdapter from "../../card-runtime/IXIAosDataContractCardAdapter";
import IXIAosFace1CardRuntime from "../../card-runtime/modules/IXIAosFace1CardRuntime";
import IXIAosCardHeaderIdentity from "../../card-runtime/modules/IXIAosCardHeaderIdentity";
import IXIAosCommercialEditorBridge from "../../card-runtime/modules/IXIAosCommercialEditorBridge";
import {
  BUSINESS_IDENTIFIER_FIELD_ID,
  BUSINESS_IDENTIFIER_ROLE,
  createBusinessIdentifierDefinition,
  getBusinessIdentifierValue
} from "../../card-runtime/IXIAosObjectDataContract";
import {
  clean,
  getFieldDefinitions,
  getObjectFields
} from "../../card-runtime/IXIAosSemanticObjectPresentation";
import IXIAosCard004CommercialFace1 from "./IXIAosCard004CommercialFace1";

export const AOS_CARD_004_PERSONNEL = Object.freeze({cardNumber:4,cardId:"004-generic-container-v12",templateSlug:"personnel-container-004",label:"Container Layout 004",version:12,variant:"summary"});

function isBusinessIdentifier(definition = {}) {
  const role = clean(definition?.presentationRole || definition?.semanticRole).toLowerCase();
  return clean(definition?.fieldId) === BUSINESS_IDENTIFIER_FIELD_ID || role === BUSINESS_IDENTIFIER_ROLE;
}

function card004EditableObject(object = {}) {
  const sourceDefinitions = getFieldDefinitions(object);
  const existing = sourceDefinitions.find(isBusinessIdentifier);
  const businessIdentifier = {
    ...(existing || createBusinessIdentifierDefinition(object, 0)),
    fieldId: BUSINESS_IDENTIFIER_FIELD_ID,
    label: "ID",
    type: "text",
    fieldType: "text",
    semanticRole: BUSINESS_IDENTIFIER_ROLE,
    presentationRole: BUSINESS_IDENTIFIER_ROLE,
    presentationOrder: 0,
    editable: true
  };
  const fieldDefinitions = [
    businessIdentifier,
    ...sourceDefinitions
      .filter(definition => !isBusinessIdentifier(definition))
      .map((definition, index) => ({ ...definition, presentationOrder: index + 1 }))
  ];
  const fields = {
    ...getObjectFields(object),
    [BUSINESS_IDENTIFIER_FIELD_ID]: getBusinessIdentifierValue(object)
  };

  return {
    ...object,
    fields,
    fieldDefinitions,
    metadata: { ...(object?.metadata || {}), fieldDefinitions }
  };
}

export default function IXIAosCard004Personnel({ children: containedObjects = [], ...props }){return <IXIAosDataContractCardAdapter {...props} showBusinessIdentifier={false}>{contractProps=><IXIAosCommercialEditorBridge object={contractProps.object} onSaveObject={contractProps.onSaveObject} persistenceAdapter={contractProps.hasPersistenceAdapter?contractProps.onSaveObject:null} onCancelDraft={contractProps.onDeleteObject} mediaEnabled={false}>{({object:runtimeObject})=><IXIAosFace1CardRuntime cardNumber={4} object={card004EditableObject(runtimeObject)} onSaveObject={contractProps.onSaveObject} includeBusinessIdentifier fixedBusinessIdentifierLabel allowAddFields>{face1=><IXIAosCardHeaderIdentity object={face1.object}><IXIAosCard004CommercialFace1 object={face1.object} children={containedObjects} onSaveObject={face1.onSaveObject} childrenRenderer={renderObject=><><IXIAosGenericCardRailShell {...contractProps} object={renderObject} face={1}><IXIAosGenericContainerLayoutV12 {...contractProps} object={renderObject} children={containedObjects} onSaveObject={face1.onSaveObject} variant={1} stretchRelationships/></IXIAosGenericCardRailShell><IXIAosV12CardPolish/></>}/></IXIAosCardHeaderIdentity>}</IXIAosFace1CardRuntime>}</IXIAosCommercialEditorBridge>}</IXIAosDataContractCardAdapter>}

import {createIXIAosObjectFinancialDocument,createIXIAosFinancialObjectReference} from "../../../financial-runtime/IXIAosFinancialRuntimeAdapter";
import {runIXIActionNoticeLifecycle} from "../../../ixi-object-system/IXIActionNoticeEngine";
import {createIXIAssetAcquisitionDraft,validateIXIAssetAcquisition} from "./IXIAssetAcquisitionContract";

const clean=value=>String(value??"").trim();
function pushUnique(refs,ref){if(!ref)return;const key=[ref.passportId,ref.externalId,ref.role,ref.label].map(clean).join("|");if(!refs.some(item=>[item.passportId,item.externalId,item.role,item.label].map(clean).join("|")===key))refs.push(ref);}

export async function createIXIAssetAcquisition({object={},context={},input={},commandId="",idempotencyKey="",metadata={},apiBaseUrl="",headers={},signal}={}){
  const draft=createIXIAssetAcquisitionDraft({context,input});
  const validation=validateIXIAssetAcquisition(draft);
  if(!validation.valid){const error=new Error("Asset Acquisition is incomplete");error.validation=validation;throw error;}
  const resolvedCommandId=clean(commandId||draft.identity.clientRequestId||`ACQ-${Date.now()}`);
  const resolvedObject={...object,passportId:clean(object.passportId||draft.context.primaryPassportId),objectId:clean(object.objectId||draft.context.primaryObjectId),objectType:clean(object.objectType||draft.context.primaryObjectType),label:clean(object.label||draft.context.primaryLabel)};
  const noticeObjectId=clean(context.primary?.objectId||context.primary?.passportId||resolvedObject.objectId||resolvedObject.passportId);

  return runIXIActionNoticeLifecycle({
    objectId:noticeObjectId,
    commandId:resolvedCommandId,
    source:"ixi-transact-asset-acquisition",
    savingMessage:"RECORDING ASSET ACQUISITION...",
    successMessage:result=>`ASSET ACQUISITION ${clean(result?.record?.identity?.number||result?.record?.identity?.acquisitionId)||"RECORDED"}`,
    errorMessage:"ASSET ACQUISITION SAVE FAILED",
    operation:async()=>{
      const refs=[];
      pushUnique(refs,createIXIAosFinancialObjectReference({object:context.primary||resolvedObject,role:"asset"}));
      pushUnique(refs,createIXIAosFinancialObjectReference({object:context.entity||{},role:"entity"}));
      pushUnique(refs,createIXIAosFinancialObjectReference({object:context.location||{},role:"location"}));
      pushUnique(refs,createIXIAosFinancialObjectReference({object:context.actor||{},role:"employee"}));
      if(clean(draft.acquisition.sellerLabel))pushUnique(refs,{role:"vendor",label:draft.acquisition.sellerLabel,objectType:"entity",passportId:draft.acquisition.sellerPassportId,externalId:draft.acquisition.sellerId});
      for(const owner of draft.ownership.owners)pushUnique(refs,{role:"owner",label:owner.partyLabel,objectType:"entity",passportId:owner.partyPassportId,externalId:owner.partyId});

      const response=await createIXIAosObjectFinancialDocument({
        object:resolvedObject,
        documentType:"asset-acquisition",
        input:{
          currency:"USD",
          amount:draft.acquisition.directAcquisitionCost,
          description:`Asset Acquisition · ${draft.context.primaryLabel}`,
          status:"posted",
          financialState:"incurred",
          acquisition:draft.acquisition,
          funding:draft.funding,
          ownership:draft.ownership,
          title:draft.title,
          condition:draft.condition,
          logistics:draft.logistics,
          makeReady:draft.makeReady,
          settlementTerms:draft.settlementTerms,
          attachments:draft.documents,
          references:refs
        },
        additionalReferences:refs,
        commandId:resolvedCommandId,
        idempotencyKey:clean(idempotencyKey||`ixi-asset-acquisition:${resolvedCommandId}`),
        metadata:{...metadata,transactModule:"asset-acquisition",acquisitionSchema:draft.schema,assetPassportId:draft.context.primaryPassportId,assetObjectId:draft.context.primaryObjectId,purchaseDate:draft.acquisition.purchaseDate,inServiceDate:draft.makeReady.inServiceDate},
        apiBaseUrl,headers,signal
      });
      const acquisitionId=clean(response?.document?.documentId||response?.financialDocument?.documentId||response?.documentId||resolvedCommandId);
      const number=clean(response?.document?.documentNumber||response?.financialDocument?.documentNumber)||`ACQ-${acquisitionId.replace(/^ACQ-/i,"").slice(-6).toUpperCase()}`;
      return {record:{...draft,identity:{...draft.identity,acquisitionId,number},status:"recorded",audit:{...draft.audit,updatedAt:new Date().toISOString()}},response};
    }
  });
}

export default {createIXIAssetAcquisition};

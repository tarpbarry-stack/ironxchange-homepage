import { createIXIAosObjectFinancialDocument, createIXIAosFinancialObjectReference } from "../../../financial-runtime/IXIAosFinancialRuntimeAdapter";
import { patchIXIAosFinancialDocument } from "../../../financial-runtime/IXIAosFinancialReadClient";
import { runIXIActionNoticeLifecycle } from "../../../../ixi-object-system/IXIActionNoticeEngine";
import { createIXIAssetAcquisitionDraft, validateIXIAssetAcquisition } from "./IXIAssetAcquisitionContract";

const clean = (value) => String(value ?? "").trim();
function pushUnique(refs, ref) {
  if (!ref) return;
  const key = [ref.passportId, ref.externalId, ref.role, ref.label].map(clean).join("|");
  if (!refs.some((item) => [item.passportId, item.externalId, item.role, item.label].map(clean).join("|") === key)) refs.push(ref);
}
function responseRecord(response = {}) {
  return response?.data?.record || response?.record || {};
}
function canonicalize(draft, response) {
  const stored = responseRecord(response),
    document = stored?.financialDocument || response?.financialDocument || {};
  const financialDocumentId = clean(document.financialDocumentId);
  if (!financialDocumentId) {
    const error = new Error("IXI Financial did not return a canonical Asset Acquisition identity.");
    error.code = "IXI_ASSET_ACQUISITION_IDENTITY_MISSING";
    throw error;
  }
  return {
    ...(document.assetAcquisition || draft),
    identity: {
      ...(document.assetAcquisition?.identity || draft.identity),
      clientRequestId: clean(draft.identity?.clientRequestId),
      acquisitionId: financialDocumentId,
      financialDocumentId,
      number: clean(document.documentNumber) || financialDocumentId,
    },
    financialBinding: {
      financialDocumentId,
      revision: Number(stored?.server?.revision || stored?.revision || 1),
      financialLineId: clean(document?.lines?.[0]?.financialLineId),
    },
  };
}

export async function createIXIAssetAcquisition({ object = {}, context = {}, input = {}, commandId = "", idempotencyKey = "", metadata = {}, apiBaseUrl = "", headers = {}, signal } = {}) {
  const draft = createIXIAssetAcquisitionDraft({ context, input });
  const validation = validateIXIAssetAcquisition(draft);
  if (!validation.valid) {
    const error = new Error("Asset Acquisition is incomplete");
    error.validation = validation;
    throw error;
  }
  const resolvedCommandId = clean(commandId || draft.identity.clientRequestId || `ACQ-${Date.now()}`);
  const resolvedObject = {
    ...object,
    passportId: clean(object.passportId || draft.context.primaryPassportId),
    objectId: clean(object.objectId || draft.context.primaryObjectId),
    objectType: clean(object.objectType || draft.context.primaryObjectType),
    label: clean(object.label || draft.context.primaryLabel),
  };
  const noticeObjectId = clean(context.primary?.objectId || context.primary?.passportId || resolvedObject.objectId || resolvedObject.passportId);

  return runIXIActionNoticeLifecycle({
    objectId: noticeObjectId,
    commandId: resolvedCommandId,
    source: "ixi-transact-asset-acquisition",
    savingMessage: "RECORDING ASSET ACQUISITION...",
    successMessage: (result) => `ASSET ACQUISITION ${clean(result?.record?.identity?.number || result?.record?.identity?.acquisitionId) || "RECORDED"}`,
    errorMessage: "ASSET ACQUISITION SAVE FAILED",
    operation: async () => {
      const refs = [];
      pushUnique(
        refs,
        createIXIAosFinancialObjectReference({
          object: context.primary || resolvedObject,
          role: "asset",
        }),
      );
      pushUnique(
        refs,
        createIXIAosFinancialObjectReference({
          object: context.entity || {},
          role: "entity",
        }),
      );
      pushUnique(
        refs,
        createIXIAosFinancialObjectReference({
          object: context.location || {},
          role: "location",
        }),
      );
      pushUnique(
        refs,
        createIXIAosFinancialObjectReference({
          object: context.actor || {},
          role: "employee",
        }),
      );
      if (clean(draft.acquisition.sellerLabel))
        pushUnique(refs, {
          role: "vendor",
          label: draft.acquisition.sellerLabel,
          objectType: "entity",
          passportId: draft.acquisition.sellerPassportId,
          externalId: draft.acquisition.sellerId,
        });
      for (const owner of draft.ownership.owners)
        pushUnique(refs, {
          role: "owner",
          label: owner.partyLabel,
          objectType: "entity",
          passportId: owner.partyPassportId,
          externalId: owner.partyId,
        });

      const response = await createIXIAosObjectFinancialDocument({
        object: resolvedObject,
        documentType: "asset-acquisition",
        input: {
          currency: "USD",
          amount: draft.acquisition.directAcquisitionCost,
          occurredAt: `${draft.acquisition.purchaseDate}T12:00:00.000Z`,
          description: `Asset Acquisition · ${draft.context.primaryLabel}`,
          status: "posted",
          financialState: "incurred",
          assetAcquisition: draft,
          acquisition: draft.acquisition,
          funding: draft.funding,
          ownership: draft.ownership,
          title: draft.title,
          condition: draft.condition,
          logistics: draft.logistics,
          makeReady: draft.makeReady,
          settlementTerms: draft.settlementTerms,
          attachments: draft.documents,
          references: refs,
        },
        additionalReferences: refs,
        commandId: resolvedCommandId,
        idempotencyKey: clean(idempotencyKey || `ixi-asset-acquisition:${resolvedCommandId}`),
        metadata: {
          ...metadata,
          transactModule: "asset-acquisition",
          acquisitionSchema: draft.schema,
          assetPassportId: draft.context.primaryPassportId,
          assetObjectId: draft.context.primaryObjectId,
          purchaseDate: draft.acquisition.purchaseDate,
          inServiceDate: draft.makeReady.inServiceDate,
        },
        apiBaseUrl,
        headers,
        signal,
      });
      return { record: canonicalize(draft, response), response };
    },
  });
}

export async function updateIXIAssetAcquisition({ record = {}, action = "update", metadata = {}, signal } = {}) {
  const financialDocumentId = clean(record?.financialBinding?.financialDocumentId || record?.identity?.financialDocumentId || record?.identity?.acquisitionId);
  const expectedRevision = Number(record?.financialBinding?.revision);
  if (!financialDocumentId || !Number.isInteger(expectedRevision) || expectedRevision < 1) {
    const error = new Error("Asset Acquisition is not bound to a current IXI Financial revision.");
    error.code = "IXI_ASSET_ACQUISITION_BINDING_REQUIRED";
    throw error;
  }
  const commandId = globalThis.crypto?.randomUUID?.() || `acq-update-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const response = await patchIXIAosFinancialDocument({
    financialDocumentId,
    expectedRevision,
    commandId,
    idempotencyKey: `ixi-asset-acquisition:${action}:${commandId}`,
    patch: {
      assetAcquisition: record,
      acquisition: record.acquisition,
      funding: record.funding,
      ownership: record.ownership,
      title: record.title,
      condition: record.condition,
      logistics: record.logistics,
      makeReady: record.makeReady,
      settlementTerms: record.settlementTerms,
    },
    metadata: { ...metadata, transactModule: "asset-acquisition", action },
    signal,
  });
  return { record: canonicalize(record, response), response };
}

export default { createIXIAssetAcquisition, updateIXIAssetAcquisition };

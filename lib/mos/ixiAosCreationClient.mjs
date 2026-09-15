import { validateAosProvisioningInput } from "./ixiAosProvisioningContract.js";
import { assertAosCreationReceipt } from "./ixiAosCreationBoundary.js";

async function request(path, { body, commandId, method = "POST" } = {}) {
  let response;
  try {
    response = await fetch(`/api/aos/mos${path}`, { method, credentials: "same-origin",
      headers: { Accept: "application/json", "Content-Type": "application/json",
        ...(commandId ? { "Idempotency-Key": commandId } : {}) },
      ...(method !== "GET" ? { body: JSON.stringify(body || {}) } : {}) });
  } catch (cause) {
    throw Object.assign(new Error("The save could not be confirmed. Resume the saved request when the connection returns."),
      { code: "AOS_CREATION_NETWORK_UNCONFIRMED", cause });
  }
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.ok) {
    throw Object.assign(new Error(payload?.error?.message || "The save could not be confirmed. Resume the saved request."),
      { code: payload?.error?.code || "AOS_CREATION_UNCONFIRMED", status: response.status,
        details: payload?.error?.details || null });
  }
  return payload;
}

export function assertCompleteAosCreation(payload, { entityId, membership = null, objectType, definitionId, commandId, draftId } = {}) {
  const receipt = assertAosCreationReceipt(payload, { expectedEntityId: entityId });
  const creation = payload?.creation;
  if (creation?.schema !== "aos.create-and-attach.v1" || creation.state !== "complete" || !creation.commandId) {
    throw Object.assign(new Error("IX-Core has not confirmed the complete save."), { code: "AOS_CREATION_RECEIPT_REQUIRED" });
  }
  if ((commandId && creation.commandId !== commandId) || (draftId && creation.draftId !== draftId)) {
    throw Object.assign(new Error("IX-Core returned a different save request."), { code: "AOS_CREATION_COMMAND_MISMATCH" });
  }
  if ((definitionId && receipt.object.definitionId !== definitionId) ||
      (!definitionId && objectType && receipt.object.objectType !== objectType)) {
    throw Object.assign(new Error("IX-Core has not confirmed the requested classification."), { code: "AOS_CREATION_CLASSIFICATION_MISMATCH" });
  }
  if (membership) {
    const edge = creation.relationship;
    if (creation.membership?.parentObjectId !== membership.parentObjectId ||
        creation.membership?.parentPassportId !== membership.parentPassportId ||
        edge?.status !== "active" || edge.behaviorId !== "aos.rail-membership.v1" ||
        edge.sourceObjectId !== receipt.object.objectId || edge.targetObjectId !== membership.parentObjectId ||
        edge.entityId !== entityId) {
      throw Object.assign(new Error("IX-Core has not confirmed this Object in its intended container."), { code: "AOS_CREATION_ATTACHMENT_UNCONFIRMED" });
    }
  }
  return { ...payload, object: receipt.object, identity: receipt.identity, passport: receipt.passport };
}

export async function createAndAttachAosObject(input) {
  const validation = validateAosProvisioningInput(input);
  if (!validation.valid) throw Object.assign(new Error(validation.errors[0]?.message || "Complete the Object details before saving."),
    { code: "AOS_CREATION_INPUT_INVALID" });
  const commandId = validation.provisioningKey;
  const payload = await request("/objects/create", { commandId, body: {
    ...validation.input, commandId, membership: input.membership || null
  } });
  return assertCompleteAosCreation(payload, { ...input, commandId, entityId: validation.input.entityId });
}

export const listAosCreationCommands = () => request("/objects/creation-commands", { method: "GET" });
export async function resumeAosCreation(commandId, entityId) {
  const payload = await request(`/objects/creation-commands/${encodeURIComponent(commandId)}/resume`);
  return assertCompleteAosCreation(payload, { entityId, commandId, membership: payload.creation?.membership });
}
export const acknowledgeAosCreation = commandId => request(`/objects/creation-commands/${encodeURIComponent(commandId)}/acknowledge`);

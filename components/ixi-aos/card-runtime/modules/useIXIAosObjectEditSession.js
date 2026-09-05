import { useCallback, useEffect, useRef, useState } from "react";

import { commitMosObjectCommand, fetchMosObject } from "../../../../lib/mos/ixiMosClient";
import {
  acceptIXIAosCanonicalObject,
  createIXIAosEditSession,
  createIXIAosObjectUpdateCommand,
  getIXIAosObjectId,
  synchronizeIXIAosBusinessIdentifier
} from "../IXIAosFoundationEngine.mjs";

const clean = value => String(value ?? "").trim();

function commandId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `ixi-aos-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function draftFingerprint(draft = {}) {
  return JSON.stringify({
    objectId: getIXIAosObjectId(draft),
    displayName: clean(draft?.displayName),
    businessIdentifiers: draft?.businessIdentifiers || [],
    fields: draft?.fields || {},
    fieldDefinitions: draft?.fieldDefinitions || draft?.metadata?.fieldDefinitions || [],
    media: draft?.media || [],
    metadata: draft?.metadata || {}
  });
}

function canonicalFromAdapter(result) {
  if (!result || typeof result !== "object") return null;
  return result.object || result.data?.object || result.record || result.data?.record ||
    (getIXIAosObjectId(result) ? result : null);
}

function isConflict(error) {
  return Number(error?.status) === 409 || Number(error?.status) === 412 ||
    ["CONFLICT", "PRECONDITION_FAILED", "AOS_OBJECT_REVISION_CONFLICT"].includes(clean(error?.code).toUpperCase());
}

/*
 * One edit-session state machine for every AOS card and face.
 * Presentation components propose a draft; this hook owns command identity,
 * concurrency, canonical readback, conflict state and the accepted runtime value.
 */
export default function useIXIAosObjectEditSession({
  object = {},
  persistenceAdapter = null
} = {}) {
  const [runtimeObject, setRuntimeObject] = useState(() => synchronizeIXIAosBusinessIdentifier(object));
  const [session, setSession] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [conflict, setConflict] = useState(null);
  const pendingCommandRef = useRef(null);
  const conflictDraftRef = useRef(null);

  useEffect(() => {
    if (!session && !saving) setRuntimeObject(synchronizeIXIAosBusinessIdentifier(object));
  }, [object, saving, session]);

  const begin = useCallback(() => {
    setError(null);
    setConflict(null);
    conflictDraftRef.current = null;
    setSession(createIXIAosEditSession(runtimeObject));
  }, [runtimeObject]);

  const cancel = useCallback(() => {
    if (saving) return;
    pendingCommandRef.current = null;
    conflictDraftRef.current = null;
    setError(null);
    setConflict(null);
    setSession(null);
  }, [saving]);

  const save = useCallback(async proposedObject => {
    if (saving) return runtimeObject;

    const activeSession = session || createIXIAosEditSession(runtimeObject);
    const draft = synchronizeIXIAosBusinessIdentifier(proposedObject || activeSession.draft);
    const fingerprint = draftFingerprint(draft);
    const pending = pendingCommandRef.current;
    const command = pending?.fingerprint === fingerprint
      ? pending.command
      : createIXIAosObjectUpdateCommand({
          session: activeSession,
          draft,
          commandId: commandId()
        });

    pendingCommandRef.current = { command, fingerprint };
    setSaving(true);
    setError(null);
    setConflict(null);

    try {
      const result = typeof persistenceAdapter === "function"
        ? await persistenceAdapter({
            objectId: command.objectId,
            object: draft,
            displayName: command.patch.displayName,
            businessIdentifiers: command.patch.businessIdentifiers,
            fields: command.patch.fields,
            fieldDefinitions: command.patch.fieldDefinitions,
            metadata: command.patch.metadata,
            media: command.patch.media,
            command,
            commandId: command.commandId,
            idempotencyKey: command.idempotencyKey,
            expectedRevision: command.expectedRevision,
            definitionVersion: command.definitionVersion
          })
        : await commitMosObjectCommand(command);

      const adapterObject = canonicalFromAdapter(result);
      if (!adapterObject) {
        const readbackError = new Error("The AOS save adapter did not return the canonical saved object.");
        readbackError.code = "IXI_AOS_CANONICAL_READBACK_REQUIRED";
        throw readbackError;
      }

      const canonical = acceptIXIAosCanonicalObject(command, { object: adapterObject });
      pendingCommandRef.current = null;
      conflictDraftRef.current = null;
      setRuntimeObject(canonical);
      setSession(null);
      return canonical;
    } catch (caught) {
      setError(caught);
      if (isConflict(caught)) {
        conflictDraftRef.current = draft;
        setSession(current => current ? { ...current, draft } : current);
        setConflict({
          code: clean(caught?.code) || "AOS_OBJECT_REVISION_CONFLICT",
          message: clean(caught?.message) || "This object changed in another session.",
          expectedRevision: command.expectedRevision,
          details: caught?.details || null
        });
      }
      throw caught;
    } finally {
      setSaving(false);
    }
  }, [persistenceAdapter, runtimeObject, saving, session]);

  const reloadLatest = useCallback(async () => {
    const objectId = getIXIAosObjectId(runtimeObject);
    if (!objectId || saving) return runtimeObject;

    setSaving(true);
    try {
      const response = await fetchMosObject(objectId);
      const canonical = canonicalFromAdapter(response);
      if (!canonical) {
        const readbackError = new Error("IX Core did not return the latest AOS object.");
        readbackError.code = "IXI_AOS_CANONICAL_READBACK_REQUIRED";
        throw readbackError;
      }

      const draft = conflictDraftRef.current;
      const rebased = draft
        ? synchronizeIXIAosBusinessIdentifier({
            ...canonical,
            displayName: draft.displayName,
            businessIdentifiers: draft.businessIdentifiers,
            fields: draft.fields,
            fieldDefinitions: draft.fieldDefinitions,
            media: draft.media,
            metadata: draft.metadata
          })
        : synchronizeIXIAosBusinessIdentifier(canonical);

      pendingCommandRef.current = null;
      conflictDraftRef.current = null;
      setRuntimeObject(synchronizeIXIAosBusinessIdentifier(canonical));
      setSession({
        ...createIXIAosEditSession(canonical),
        draft: rebased
      });
      setError(null);
      setConflict(null);
      return rebased;
    } catch (caught) {
      setError(caught);
      throw caught;
    } finally {
      setSaving(false);
    }
  }, [runtimeObject, saving]);

  const retry = useCallback(
    proposedObject => save(proposedObject || session?.draft || runtimeObject),
    [runtimeObject, save, session]
  );

  return {
    runtimeObject,
    editorObject: session?.draft || runtimeObject,
    editing: Boolean(session),
    saving,
    session,
    error,
    conflict,
    begin,
    cancel,
    save,
    retry,
    reloadLatest
  };
}

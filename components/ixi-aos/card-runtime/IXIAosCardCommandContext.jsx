import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import {
  IXI_ACTION_NOTICE_EVENT,
  IXI_ACTION_NOTICE_TONES,
  createIXIActionNotice
} from "../../ixi-object-system/IXIActionNoticeEngine";

const clean = value => String(value || "").trim();

const IXIAosCardCommandContext = createContext({
  objectId: "",
  object: null,
  onOpenTransact: null,
  actionNotice: null,
  showNotice: null,
  clearNotice: null,
  runWithNotice: null
});

export function IXIAosCardCommandProvider({
  object = null,
  objectId = "",
  ixiState = {},
  onIxiStateChange = null,
  onOpenTransact = null,
  children
}) {
  const resolvedObjectId = clean(
    objectId ||
    object?.objectId ||
    object?.id ||
    object?.uuid ||
    object?.passportId
  );

  const externalNotice = ixiState?.actionNotice || null;
  const [localNotice, setLocalNotice] = useState(externalNotice);
  const noticeRef = useRef(externalNotice);
  const timersRef = useRef(new Map());
  const externalUpdateRef = useRef(onIxiStateChange);
  const objectIdRef = useRef(resolvedObjectId);

  externalUpdateRef.current = onIxiStateChange;
  objectIdRef.current = resolvedObjectId;

  useEffect(() => {
    noticeRef.current = externalNotice;
    setLocalNotice(externalNotice);
  }, [externalNotice]);

  useEffect(() => () => {
    if (typeof window === "undefined") return;

    for (const timeoutId of timersRef.current.values()) {
      window.clearTimeout(timeoutId);
    }
    timersRef.current.clear();

    const currentNotice = noticeRef.current;
    const currentObjectId = objectIdRef.current;
    const updateExternalState = externalUpdateRef.current;

    // Action notices are deliberately transient. If the card surface closes
    // before its timer fires, clear the shared notice so it cannot remain
    // painted over the listing card indefinitely.
    if (
      currentNotice?.message &&
      currentObjectId &&
      typeof updateExternalState === "function"
    ) {
      updateExternalState(currentObjectId, { actionNotice: null });
    }
  }, []);

  const publishNotice = useCallback((notice) => {
    noticeRef.current = notice || null;
    setLocalNotice(notice || null);

    if (resolvedObjectId && typeof onIxiStateChange === "function") {
      onIxiStateChange(resolvedObjectId, {
        actionNotice: notice || null
      });
    }
  }, [resolvedObjectId, onIxiStateChange]);

  const clearNotice = useCallback((expectedNoticeId = "") => {
    const current = noticeRef.current;

    if (
      expectedNoticeId &&
      current?.noticeId &&
      current.noticeId !== expectedNoticeId
    ) {
      return false;
    }

    if (
      current?.noticeId &&
      timersRef.current.has(current.noticeId) &&
      typeof window !== "undefined"
    ) {
      window.clearTimeout(timersRef.current.get(current.noticeId));
      timersRef.current.delete(current.noticeId);
    }

    publishNotice(null);
    return true;
  }, [publishNotice]);

  const showNotice = useCallback(({
    noticeId = "",
    createdAt = 0,
    message = "",
    tone = IXI_ACTION_NOTICE_TONES.SUCCESS,
    duration = 1600,
    blocking = false,
    commandId = "",
    source = "aos-card-command"
  } = {}) => {
    const notice = createIXIActionNotice({
      noticeId,
      createdAt,
      message,
      tone,
      duration,
      blocking,
      commandId,
      source
    });

    publishNotice(notice);

    if (
      notice.duration > 0 &&
      typeof window !== "undefined"
    ) {
      const timeoutId = window.setTimeout(() => {
        timersRef.current.delete(notice.noticeId);
        clearNotice(notice.noticeId);
      }, notice.duration);

      timersRef.current.set(notice.noticeId, timeoutId);
    }

    return notice;
  }, [publishNotice, clearNotice]);

  useEffect(() => {
    if (
      !resolvedObjectId ||
      typeof window === "undefined"
    ) {
      return undefined;
    }

    function handleNoticeEvent(event) {
      const detail = event?.detail || {};
      const eventObjectId = clean(detail.objectId || detail.listingId);

      if (eventObjectId !== resolvedObjectId) {
        return;
      }

      const notice = detail.notice || detail;

      showNotice({
        noticeId: notice.noticeId,
        createdAt: notice.createdAt,
        message: notice.message,
        tone: notice.tone,
        duration: notice.duration,
        blocking: notice.blocking,
        commandId: notice.commandId,
        source: notice.source || "ixi-action-notice-event"
      });
    }

    window.addEventListener(
      IXI_ACTION_NOTICE_EVENT,
      handleNoticeEvent
    );

    return () => {
      window.removeEventListener(
        IXI_ACTION_NOTICE_EVENT,
        handleNoticeEvent
      );
    };
  }, [resolvedObjectId, showNotice]);

  const runWithNotice = useCallback(async ({
    operation,
    savingMessage = "WORKING...",
    successMessage = "COMPLETE",
    errorMessage = "COMMAND FAILED",
    commandId = "",
    source = "aos-command",
    successDuration = 1800,
    errorDuration = 2600
  } = {}) => {
    if (typeof operation !== "function") {
      throw new Error("runWithNotice requires an operation function.");
    }

    showNotice({
      message: savingMessage,
      tone: IXI_ACTION_NOTICE_TONES.INFO,
      duration: 0,
      blocking: true,
      commandId,
      source
    });

    try {
      const result = await operation();
      const resolvedSuccessMessage =
        typeof successMessage === "function"
          ? successMessage(result)
          : successMessage;

      showNotice({
        message: resolvedSuccessMessage,
        tone: IXI_ACTION_NOTICE_TONES.SUCCESS,
        duration: successDuration,
        blocking: false,
        commandId,
        source
      });

      return result;
    } catch (error) {
      const resolvedErrorMessage =
        typeof errorMessage === "function"
          ? errorMessage(error)
          : errorMessage;

      showNotice({
        message: resolvedErrorMessage,
        tone: IXI_ACTION_NOTICE_TONES.ERROR,
        duration: errorDuration,
        blocking: false,
        commandId,
        source
      });

      throw error;
    }
  }, [showNotice]);

  const value = useMemo(() => ({
    objectId: resolvedObjectId,
    object,
    onOpenTransact:
      typeof onOpenTransact === "function"
        ? onOpenTransact
        : null,
    actionNotice: localNotice,
    showNotice,
    clearNotice,
    runWithNotice
  }), [
    resolvedObjectId,
    object,
    onOpenTransact,
    localNotice,
    showNotice,
    clearNotice,
    runWithNotice
  ]);

  return (
    <IXIAosCardCommandContext.Provider value={value}>
      {children}
    </IXIAosCardCommandContext.Provider>
  );
}

export function useIXIAosCardCommands() {
  return useContext(IXIAosCardCommandContext);
}

export default IXIAosCardCommandContext;

export const IXI_ACTION_NOTICE_TONES = Object.freeze({
  SUCCESS: "success",
  INFO: "info",
  WARNING: "warning",
  ERROR: "error"
});

export const IXI_ACTION_NOTICE_EVENT = "ixi:aos-action-notice";

function clean(value) {
  return String(value || "").trim();
}

export function resolveIXIActionNoticeObjectId({
  objectId = "",
  listingId = ""
} = {}) {
  return clean(objectId || listingId);
}

export function createIXIActionNotice({
  noticeId = "",
  createdAt = 0,
  message = "",
  tone = IXI_ACTION_NOTICE_TONES.SUCCESS,
  duration = 1600,
  blocking = false,
  commandId = "",
  source = ""
} = {}) {
  const timestamp = Number(createdAt) > 0
    ? Number(createdAt)
    : Date.now();

  return Object.freeze({
    noticeId:
      clean(noticeId) ||
      `IXI-NOTICE-${timestamp}-${Math.random().toString(36).slice(2, 8)}`,
    message: clean(message).toUpperCase(),
    tone: clean(tone) || IXI_ACTION_NOTICE_TONES.SUCCESS,
    duration: Number.isFinite(Number(duration)) ? Number(duration) : 1600,
    blocking: Boolean(blocking),
    commandId: clean(commandId),
    source: clean(source),
    createdAt: timestamp
  });
}

export function createIXIActionNoticePatch(notice = null) {
  return {
    actionNotice: notice || null
  };
}

export function emitIXIActionNotice({
  objectId = "",
  listingId = "",
  message = "",
  tone = IXI_ACTION_NOTICE_TONES.SUCCESS,
  duration = 1600,
  blocking = false,
  commandId = "",
  source = ""
} = {}) {
  const id = resolveIXIActionNoticeObjectId({ objectId, listingId });

  if (!id || !clean(message)) {
    return null;
  }

  const notice = createIXIActionNotice({
    message,
    tone,
    duration,
    blocking,
    commandId,
    source
  });

  const detail = Object.freeze({
    objectId: id,
    notice
  });

  if (
    typeof window !== "undefined" &&
    typeof window.dispatchEvent === "function" &&
    typeof CustomEvent === "function"
  ) {
    window.dispatchEvent(
      new CustomEvent(IXI_ACTION_NOTICE_EVENT, { detail })
    );
  }

  return detail;
}

export async function runIXIActionNoticeLifecycle({
  objectId = "",
  listingId = "",
  operation,
  savingMessage = "WORKING...",
  successMessage = "COMPLETE",
  errorMessage = "COMMAND FAILED",
  commandId = "",
  source = "ixi-command",
  successDuration = 1800,
  errorDuration = 2600
} = {}) {
  if (typeof operation !== "function") {
    throw new Error("runIXIActionNoticeLifecycle requires an operation function.");
  }

  const id = resolveIXIActionNoticeObjectId({ objectId, listingId });

  emitIXIActionNotice({
    objectId: id,
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

    emitIXIActionNotice({
      objectId: id,
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

    emitIXIActionNotice({
      objectId: id,
      message: resolvedErrorMessage,
      tone: IXI_ACTION_NOTICE_TONES.ERROR,
      duration: errorDuration,
      blocking: false,
      commandId,
      source
    });

    throw error;
  }
}

export function setIXIActionNotice({
  setState,
  objectId = "",
  listingId = "",
  message,
  tone = IXI_ACTION_NOTICE_TONES.SUCCESS,
  duration = 1600,
  blocking = false,
  commandId = "",
  source = ""
}) {
  const id = resolveIXIActionNoticeObjectId({ objectId, listingId });

  if (!id || typeof setState !== "function") {
    return null;
  }

  const notice = createIXIActionNotice({
    message,
    tone,
    duration,
    blocking,
    commandId,
    source
  });

  setState(current => ({
    ...(current || {}),
    [id]: {
      ...((current || {})[id] || {}),
      ...createIXIActionNoticePatch(notice)
    }
  }));

  if (notice.duration <= 0 || typeof window === "undefined") {
    return notice;
  }

  window.setTimeout(() => {
    setState(current => {
      const existing = current?.[id]?.actionNotice;

      if (!existing || existing.noticeId !== notice.noticeId) {
        return current;
      }

      return {
        ...(current || {}),
        [id]: {
          ...((current || {})[id] || {}),
          ...createIXIActionNoticePatch(null)
        }
      };
    });
  }, notice.duration);

  return notice;
}

export function clearIXIActionNotice({
  setState,
  objectId = "",
  listingId = "",
  expectedNoticeId = ""
}) {
  const id = resolveIXIActionNoticeObjectId({ objectId, listingId });

  if (!id || typeof setState !== "function") {
    return;
  }

  setState(current => {
    const existing = current?.[id]?.actionNotice;

    if (
      expectedNoticeId &&
      existing?.noticeId &&
      existing.noticeId !== expectedNoticeId
    ) {
      return current;
    }

    return {
      ...(current || {}),
      [id]: {
        ...((current || {})[id] || {}),
        ...createIXIActionNoticePatch(null)
      }
    };
  });
}

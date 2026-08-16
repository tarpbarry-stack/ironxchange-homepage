export const IXI_ACTION_NOTICE_TONES = Object.freeze({
  SUCCESS: "success",
  INFO: "info",
  WARNING: "warning",
  ERROR: "error"
});

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
  message = "",
  tone = IXI_ACTION_NOTICE_TONES.SUCCESS,
  duration = 1600,
  blocking = false,
  commandId = "",
  source = ""
} = {}) {
  const createdAt = Date.now();

  return {
    noticeId: `IXI-NOTICE-${createdAt}-${Math.random().toString(36).slice(2, 8)}`,
    message: clean(message).toUpperCase(),
    tone: clean(tone) || IXI_ACTION_NOTICE_TONES.SUCCESS,
    duration: Number.isFinite(Number(duration)) ? Number(duration) : 1600,
    blocking: Boolean(blocking),
    commandId: clean(commandId),
    source: clean(source),
    createdAt
  };
}

export function createIXIActionNoticePatch(notice = null) {
  return {
    actionNotice: notice || null
  };
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

  // duration <= 0 means the command/promise lifecycle owns clearing/replacement.
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

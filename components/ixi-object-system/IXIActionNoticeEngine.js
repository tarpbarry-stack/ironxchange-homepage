export const IXI_ACTION_NOTICE_TONES = {
  SUCCESS: "success",
  INFO: "info",
  WARNING: "warning",
  ERROR: "error"
};

export function createIXIActionNotice({
  message = "",
  tone = IXI_ACTION_NOTICE_TONES.SUCCESS,
  duration = 1600,
  blocking = false
}) {
  return {
    message: String(message || "").toUpperCase(),
    tone,
    duration: Number(duration || 0),
    blocking: Boolean(blocking),
    createdAt: Date.now()
  };
}

export function setIXIActionNotice({
  setState,
  listingId,
  message,
  tone = IXI_ACTION_NOTICE_TONES.SUCCESS,
  duration = 1600,
  blocking = false
}) {
  const id = String(listingId || "");

  if (!id || typeof setState !== "function") {
    return null;
  }

  const notice = createIXIActionNotice({
    message,
    tone,
    duration,
    blocking
  });

  setState(current => ({
    ...(current || {}),
    [id]: {
      ...((current || {})[id] || {}),
      actionNotice: notice
    }
  }));

  /*
   * duration <= 0 means the notice is controlled
   * by the actual Promise lifecycle.
   */
  if (notice.duration <= 0) {
    return notice;
  }

  window.setTimeout(() => {
    setState(current => {
      const existing =
        current?.[id]?.actionNotice;

      if (
        !existing ||
        existing.createdAt !== notice.createdAt
      ) {
        return current;
      }

      return {
        ...(current || {}),
        [id]: {
          ...((current || {})[id] || {}),
          actionNotice: null
        }
      };
    });
  }, notice.duration);

  return notice;
}

export function clearIXIActionNotice({
  setState,
  listingId
}) {
  const id = String(listingId || "");

  if (!id || typeof setState !== "function") {
    return;
  }

  setState(current => ({
    ...(current || {}),
    [id]: {
      ...((current || {})[id] || {}),
      actionNotice: null
    }
  }));
}

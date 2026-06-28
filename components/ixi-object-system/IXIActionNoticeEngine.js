export const IXI_ACTION_NOTICE_TONES = {
  SUCCESS: "success",
  INFO: "info",
  ERROR: "error"
};

export function createIXIActionNotice({
  message = "",
  tone = IXI_ACTION_NOTICE_TONES.SUCCESS,
  duration = 1600
}) {
  return {
    message: String(message || "").toUpperCase(),
    tone,
    duration,
    createdAt: Date.now()
  };
}

export function setIXIActionNotice({
  setState,
  listingId,
  message,
  tone = IXI_ACTION_NOTICE_TONES.SUCCESS,
  duration = 1600
}) {
  const id = String(listingId || "");

  if (!id || typeof setState !== "function") return;

  const notice = createIXIActionNotice({
    message,
    tone,
    duration
  });

  setState(current => ({
    ...(current || {}),
    [id]: {
      ...((current || {})[id] || {}),
      actionNotice: notice
    }
  }));

  window.setTimeout(() => {
    setState(current => {
      const existing = current?.[id]?.actionNotice;

      if (!existing || existing.createdAt !== notice.createdAt) {
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
  }, duration);
}

export function buildMachineMediaNotice({
  beforeCount = 0,
  afterCount = 0,
  reordered = false,
  verified = false
}) {
  if (!verified) return "MEDIA SAVE FAILED";

  if (afterCount > beforeCount) {
    return "PHOTO ADDED";
  }

  if (afterCount < beforeCount) {
    return "PHOTO REMOVED";
  }

  if (reordered) {
    return "PHOTO ORDER UPDATED";
  }

  return "MEDIA UPDATED";
}

export function hasMediaOrderChanged(beforeImageIds = [], afterImageIds = []) {
  if (beforeImageIds.length !== afterImageIds.length) return true;

  return beforeImageIds.some(
    (id, index) => String(id) !== String(afterImageIds[index])
  );
}

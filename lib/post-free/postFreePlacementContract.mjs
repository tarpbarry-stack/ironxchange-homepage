// IX-Core currently stores private placement as channel "private"; the
// frontend's canonical machine channel for a private listing is "none".
export function toCorePostFreePlacement(input) {
  const publicData = input?.payload?.publicData;
  if (publicData?.machineAccess !== "private" || publicData.machineChannel !== "none") return input;
  return {
    ...input,
    payload: {
      ...input.payload,
      publicData: { ...publicData, machineChannel: "private" }
    }
  };
}

export function toListingPostFreePlacement(publicData = {}) {
  if (publicData.machineAccess !== "private" || publicData.machineChannel !== "private") return publicData;
  return { ...publicData, machineChannel: "none" };
}

export const IXI_PASSPORT_EMAIL_EVENT =
  "ixi:marketplace-distribution-open";

export function openIXIPassportEmail(listing) {
  if (!listing || typeof window === "undefined") return false;

  window.dispatchEvent(
    new CustomEvent(IXI_PASSPORT_EMAIL_EVENT, {
      detail: { listing }
    })
  );

  return true;
}

export function getPocketFrontMachine({
  machineIds = [],
  getListingById
}) {
  if (!Array.isArray(machineIds) || machineIds.length === 0) {
    return null;
  }

  const frontMachineId = machineIds[machineIds.length - 1];
  return getListingById?.(frontMachineId) || null;
}

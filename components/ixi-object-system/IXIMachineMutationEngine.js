export function getUpdatedMachineFactMessages({
  before = {},
  after = {}
}) {
  const messages = [];

  const beforePrice = String(before.price || "").replace(/[^0-9]/g, "");
  const afterPrice = String(after.price || "").replace(/[^0-9]/g, "");

  const beforeHours = String(before.hours || "").replace(/[^0-9]/g, "");
  const afterHours = String(after.hours || "").replace(/[^0-9]/g, "");

  const beforeLocation = String(before.location || "");
  const afterLocation = String(after.location || "");

    const beforeDescription = String(before.description || "");
  const afterDescription = String(after.description || "");

  const beforeKeywords = Array.isArray(before.keywords)
    ? before.keywords.map(String).sort()
    : [];

  const afterKeywords = Array.isArray(after.keywords)
    ? after.keywords.map(String).sort()
    : [];

  if (beforePrice !== afterPrice) {
    messages.push("PRICE UPDATED");
  }

  if (beforeHours !== afterHours) {
    messages.push("HOURS UPDATED");
  }

  if (beforeLocation !== afterLocation) {
    messages.push("LOCATION UPDATED");
  }

    if (beforeDescription !== afterDescription) {
    messages.push("DESCRIPTION UPDATED");
  }

  if (JSON.stringify(beforeKeywords) !== JSON.stringify(afterKeywords)) {
    messages.push("KEYWORDS UPDATED");
  }

  if (!messages.length) {
    messages.push("LISTING UPDATED");
  }

  return messages;
}

export async function updateMachineFacts({
  commandBus,
  listingId,
  title = "",
  before = {},
  after = {},
  context = ""
}) {
  if (!listingId) {
    throw new Error("Missing listingId");
  }

  if (!commandBus?.updateMachineFacts) {
    throw new Error("Missing updateMachineFacts command");
  }

  const result = await commandBus.updateMachineFacts({
    listingId,
    title,
    price: after.price,
    hours: after.hours,
    location: after.location,
    description: after.description,
    keywords: after.keywords || []
  });

  const notices = getUpdatedMachineFactMessages({
    before,
    after
  });

  return {
    ok: true,
    command: "UPDATE_MACHINE_FACTS",
    context,
    listingId: String(listingId),
    requested: {
      title,
      price: after.price,
      hours: after.hours,
      location: after.location,
      description: after.description,
      keywords: after.keywords || []
    },
    result,
    listing: result?.listing,
    verification: result?.verification,
    notices
  };
}

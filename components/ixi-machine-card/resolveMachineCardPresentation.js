export default function resolveMachineCardPresentation({
  cardFamily,
  cardContext,
  sellerMode = false
}) {
  /*
   * Context selects how the object is being used.
   * This takes priority over what family the object belongs to.
   */

  if (
    sellerMode ||
    cardContext === "inventory" ||
    cardContext === "enterprise"
  ) {
    return "seller";
  }

  if (
    cardContext === "auction-work" ||
    cardContext === "auction-market"
  ) {
    return "auction";
  }

  if (cardContext === "marketplace") {
    return "buyer";
  }

  if (cardContext === "workspace") {
    return "comparison";
  }

  /*
   * Family fallback for callers that have not supplied
   * an explicit context yet.
   */

  if (cardFamily === "auction") {
    return "auction";
  }

  if (cardFamily === "marketplace") {
    return "buyer";
  }

  if (cardFamily === "private") {
    return "comparison";
  }

  return "comparison";
}

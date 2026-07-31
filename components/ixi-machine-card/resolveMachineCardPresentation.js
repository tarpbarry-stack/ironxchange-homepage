export default function resolveMachineCardPresentation({
  cardFamily,
  cardContext,
  sellerMode = false
}) {
  if (cardFamily === "auction") {
    return "auction";
  }

  if (cardFamily === "marketplace") {
    return "buyer";
  }

  if (cardFamily === "private") {
    if (
      sellerMode ||
      cardContext === "inventory" ||
      cardContext === "enterprise"
    ) {
      return "seller";
    }

    return "comparison";
  }

  return "comparison";
}

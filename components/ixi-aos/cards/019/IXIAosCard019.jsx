import IXIAosCard018 from "../018/IXIAosCard018";

export const CARD_019 = Object.freeze({
  cardNumber: 19,
  templateSlug: "aos-card-019",
  nativeWidth: 298,
  nativeHeight: 471,
  railReserve: 23,
  version: 12,
  renderer: "system-index-locations-container"
});

export default function IXIAosCard019(props) {
  return (
    <IXIAosCard018
      {...props}
      cardDefinition={CARD_019}
      defaultDisplayName="LOCATIONS"
      editHeading="EDIT LOCATIONS INDEX"
      childCardMode="object"
      loopChildDeck={false}
    />
  );
}

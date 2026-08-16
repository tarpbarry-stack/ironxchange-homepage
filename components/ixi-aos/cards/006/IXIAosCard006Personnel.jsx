import IXIAosGenericContainerLayoutV12 from "../generic/IXIAosGenericContainerLayoutV12";

export const AOS_CARD_006_PERSONNEL = Object.freeze({
  cardNumber: 6,
  cardId: "006-generic-container-v12",
  templateSlug: "personnel-container-006",
  label: "Container Layout 006",
  version: 12,
  variant: "dashboard"
});

export default function IXIAosCard006Personnel(props) {
  return <IXIAosGenericContainerLayoutV12 {...props} variant={3} />;
}

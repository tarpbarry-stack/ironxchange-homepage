import IXIAosPersonnelContainerApplication from "../personnel/IXIAosPersonnelContainerApplication";

export const AOS_CARD_006_PERSONNEL = Object.freeze({
  cardNumber: 6,
  cardId: "006-personnel-v12",
  templateSlug: "personnel-container-006",
  label: "Employees / Personnel",
  version: 12,
  variant: "dashboard"
});

export default function IXIAosCard006Personnel(props) {
  return <IXIAosPersonnelContainerApplication {...props} variant={3} />;
}

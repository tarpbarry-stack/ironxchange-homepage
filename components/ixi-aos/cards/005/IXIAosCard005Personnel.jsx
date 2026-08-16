import IXIAosPersonnelContainerApplication from "../personnel/IXIAosPersonnelContainerApplication";

export const AOS_CARD_005_PERSONNEL = Object.freeze({
  cardNumber: 5,
  cardId: "005-personnel-v12",
  templateSlug: "personnel-container-005",
  label: "Employees / Personnel",
  version: 12,
  variant: "analytic"
});

export default function IXIAosCard005Personnel(props) {
  return <IXIAosPersonnelContainerApplication {...props} variant={2} />;
}

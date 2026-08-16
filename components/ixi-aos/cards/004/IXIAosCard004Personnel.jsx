import IXIAosCard004PersonnelV12 from "./IXIAosCard004PersonnelV12";

export const AOS_CARD_004_PERSONNEL = Object.freeze({
  cardNumber: 4,
  cardId: "004-personnel-v12",
  templateSlug: "personnel-container-004",
  label: "Employees / Personnel",
  version: 12,
  variant: "summary"
});

export default function IXIAosCard004Personnel(props) {
  return <IXIAosCard004PersonnelV12 {...props} />;
}

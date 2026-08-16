import IXIAosGenericContainerLayoutV12 from "../generic/IXIAosGenericContainerLayoutV12";
import IXIAosGenericCardRailShell from "../generic/IXIAosGenericCardRailShell";

export const AOS_CARD_005_PERSONNEL = Object.freeze({
  cardNumber: 5,
  cardId: "005-generic-container-v12",
  templateSlug: "personnel-container-005",
  label: "Container Layout 005",
  version: 12,
  variant: "analytic"
});

export default function IXIAosCard005Personnel(props) {
  return (
    <IXIAosGenericCardRailShell object={props.object} {...props} face={1}>
      <IXIAosGenericContainerLayoutV12 {...props} variant={2} />
    </IXIAosGenericCardRailShell>
  );
}

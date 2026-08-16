import IXIAosGenericContainerLayoutV12 from "../generic/IXIAosGenericContainerLayoutV12";
import IXIAosGenericCardRailShell from "../generic/IXIAosGenericCardRailShell";
import IXIAosV12CardPolish from "../../card-runtime/modules/IXIAosV12CardPolish";

export const AOS_CARD_004_PERSONNEL = Object.freeze({
  cardNumber: 4,
  cardId: "004-generic-container-v12",
  templateSlug: "personnel-container-004",
  label: "Container Layout 004",
  version: 12,
  variant: "summary"
});

export default function IXIAosCard004Personnel(props) {
  return (
    <>
      <IXIAosGenericCardRailShell object={props.object} {...props} face={1}>
        <IXIAosGenericContainerLayoutV12 {...props} variant={1} />
      </IXIAosGenericCardRailShell>
      <IXIAosV12CardPolish />
    </>
  );
}

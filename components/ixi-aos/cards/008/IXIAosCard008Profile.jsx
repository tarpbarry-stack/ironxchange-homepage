import IXIAosGenericObjectLayout007 from "../generic/IXIAosGenericObjectLayout007";
import IXIAosGenericCardRailShell from "../generic/IXIAosGenericCardRailShell";

/*
 * Card 008 — profile / identity presentation recipe.
 * The renderer remains noun-agnostic; John Carter is sample content only.
 */
export default function IXIAosCard008Profile(props) {
  return (
    <IXIAosGenericCardRailShell object={props.object} {...props} face={1}>
      <IXIAosGenericObjectLayout007 {...props} />
    </IXIAosGenericCardRailShell>
  );
}

import IXIAosGenericObjectLayout007 from "../generic/IXIAosGenericObjectLayout007";
import IXIAosGenericCardRailShell from "../generic/IXIAosGenericCardRailShell";

export default function IXIAosCard007Employee(props) {
  return (
    <IXIAosGenericCardRailShell object={props.object} {...props} face={1}>
      <IXIAosGenericObjectLayout007 {...props} />
    </IXIAosGenericCardRailShell>
  );
}

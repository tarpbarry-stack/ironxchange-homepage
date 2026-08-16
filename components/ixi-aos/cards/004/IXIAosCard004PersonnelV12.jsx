import IXIAosGenericContainerLayoutV12 from "../generic/IXIAosGenericContainerLayoutV12";

/*
 * Compatibility filename only.
 * Card 004 is a generic AOS container layout. Customer schema/nomenclature
 * supplies all business meaning.
 */
export default function IXIAosCard004PersonnelV12(props) {
  return <IXIAosGenericContainerLayoutV12 {...props} variant={1} />;
}

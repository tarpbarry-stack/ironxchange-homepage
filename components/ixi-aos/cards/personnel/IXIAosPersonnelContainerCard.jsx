import IXIAosGenericContainerLayoutV12 from "../generic/IXIAosGenericContainerLayoutV12";

/*
 * Compatibility entry point only.
 * The renderer is generic. Customer schema/nomenclature defines all meaning.
 */
export default function IXIAosPersonnelContainerCard({
  variant = 1,
  ...props
}) {
  return (
    <IXIAosGenericContainerLayoutV12
      {...props}
      variant={variant}
    />
  );
}

import IXIAosGenericContainerLayoutV12 from "../generic/IXIAosGenericContainerLayoutV12";

/*
 * Compatibility entry point only.
 * Business meaning must come from persisted schema and customer nomenclature.
 */
export default function IXIAosPersonnelContainerApplication({
  variant = 2,
  ...props
}) {
  return (
    <IXIAosGenericContainerLayoutV12
      {...props}
      variant={variant}
    />
  );
}

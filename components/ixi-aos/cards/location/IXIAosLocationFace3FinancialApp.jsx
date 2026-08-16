import IXIAosLocationFace3Financial from "./IXIAosLocationFace3Financial";

export default function IXIAosLocationFace3FinancialApp({
  financialSnapshot = {},
  ...props
}) {
  return (
    <IXIAosLocationFace3Financial
      {...props}
      runtimeData={financialSnapshot}
    />
  );
}

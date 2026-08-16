import IXIBillApp from "./IXIBillApp";
import IXIBillStandaloneStyles from "./IXIBillStandaloneStyles";

export default function IXIBillStandaloneApp(props) {
  return (
    <div className="ixi-bill-standalone">
      <IXIBillApp {...props} />
      <IXIBillStandaloneStyles />
      <style jsx>{`
        .ixi-bill-standalone {
          position: relative;
          width: 298px;
          height: 471px;
          overflow: hidden;
        }
        :global(.ixi-bill-standalone > .ixi-bill-app) {
          width: 298px !important;
          height: 471px !important;
          min-height: 471px !important;
        }
      `}</style>
    </div>
  );
}

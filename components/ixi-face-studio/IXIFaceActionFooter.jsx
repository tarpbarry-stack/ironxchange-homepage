import IXIMachineObjectActions
  from "../ixi-machine-object/IXIMachineObjectActions";

export default function IXIFaceActionFooter({
  labels,
  children = null
}) {
  return (
    <div className="ixi-face-action-footer">
      {children || (
        <IXIMachineObjectActions
          labels={labels}
        />
      )}

      <style jsx>{`
        .ixi-face-action-footer {
          box-sizing: border-box;

          width: 100%;
          height: 100%;
          min-width: 0;

          display: flex;
          align-items: center;
          justify-content: center;

          overflow: hidden;
        }

        .ixi-face-action-footer
          :global(.mof-actions) {
          position: static !important;

          top: auto !important;
          right: auto !important;
          bottom: auto !important;
          left: auto !important;

          width: 100% !important;
          max-width: 100% !important;

          height: 26px;
          min-height: 26px;

          margin: 0 !important;
          padding: 0 !important;

          display: flex;
          align-items: center;
          justify-content: center;

          gap: 10px;
        }

        .ixi-face-action-footer
          :global(.mof-actions button) {
          position: relative;

          height: 26px;
          min-height: 26px;
          max-height: 26px;

          margin: 0;
        }
      `}</style>
    </div>
  );
}

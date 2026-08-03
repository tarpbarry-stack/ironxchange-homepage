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

          gap: 7px;
        }

       .ixi-face-action-footer
  :global(.mof-actions button) {
  position: relative;

  min-width: 82px;
  height: 20px;
  min-height: 20px;
  max-height: 20px;

  margin: 0;
  padding: 0 14px;

  border:
    1px solid
    rgba(255,255,255,.10);

  border-radius: 3px;

  background:
    linear-gradient(
      180deg,
      rgba(255,255,255,.035),
      rgba(255,255,255,.012)
    ),
    rgba(8,8,8,.88);

  color:
    rgba(255,255,255,.58);

  font-size: 6.6px;
  font-weight: 950;
  line-height: 1;
  letter-spacing: .48px;

  text-transform: uppercase;

  box-shadow:
    inset 0 1px 0
    rgba(255,255,255,.035);

  cursor: pointer;
}

.ixi-face-action-footer
  :global(.mof-actions button:hover) {
  border-color:
    rgba(255,196,0,.42);

  background:
    linear-gradient(
      180deg,
      rgba(255,196,0,.08),
      rgba(255,196,0,.025)
    ),
    rgba(8,8,8,.92);

  color: #ffc400;
}

.ixi-face-action-footer
  :global(.mof-actions button:active) {
  transform: translateY(1px);
}

.ixi-face-action-footer
  :global(.mof-actions button:disabled) {
  opacity: .34;
  cursor: default;
}

`}</style>
    </div>
  );
}

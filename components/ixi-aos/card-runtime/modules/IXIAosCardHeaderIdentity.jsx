import IXIAosCommercialCardTypography from "./IXIAosCommercialCardTypography";
import {
  getAosPassportDisplaySerial
} from "../../../../lib/mos/ixiAosPassportPresentation.mjs";

export default function IXIAosCardHeaderIdentity({ object = {}, children = null, className = "" }) {
  return (
    <div className={`ixi-aos-header-identity-shell ${className}`.trim()}>
      {children}
      <span className="ixi-aos-header-ixi-number">IXI - {getAosPassportDisplaySerial(object)}</span>
      <IXIAosCommercialCardTypography />
      <style jsx>{`
        .ixi-aos-header-identity-shell{position:relative;width:298px;height:471px}
        .ixi-aos-header-ixi-number{position:absolute;top:7px;right:9px;z-index:190;color:#858c87;font-family:inherit;font-size:7px;font-weight:850;line-height:1;letter-spacing:.06em;white-space:nowrap;pointer-events:none}
        :global(.ixi-aos-header-identity-shell .ixi-aos-card-header-controls){top:17px!important}
      `}</style>
    </div>
  );
}

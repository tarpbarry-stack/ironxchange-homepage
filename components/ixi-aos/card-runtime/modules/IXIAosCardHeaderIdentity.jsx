function clean(value) {
  return String(value || "").trim();
}

function ixiNumberFor(object = {}) {
  const isPreview = object?.metadata?.source === "aos-card-catalog-preview";
  if (isPreview) return "XXXXXX";

  const explicit = clean(
    object?.ixiNumber ||
    object?.ixiId ||
    object?.metadata?.ixiNumber ||
    object?.metadata?.ixiId
  );
  if (explicit) return explicit.replace(/^IXI\s*[-#:]?\s*/i, "").toUpperCase();

  const objectId = clean(object?.objectId || object?.id);
  if (!objectId) return "XXXXXX";
  const compact = objectId.replace(/[^a-z0-9]/gi, "").toUpperCase();
  return compact.slice(-6).padStart(6, "X");
}

export default function IXIAosCardHeaderIdentity({ object = {}, children = null, className = "" }) {
  return (
    <div className={`ixi-aos-header-identity-shell ${className}`.trim()}>
      {children}
      <span className="ixi-aos-header-ixi-number">IXI - {ixiNumberFor(object)}</span>
      <style jsx>{`
        .ixi-aos-header-identity-shell{position:relative;width:298px;height:471px}
        .ixi-aos-header-ixi-number{position:absolute;top:7px;right:9px;z-index:190;color:#858c87;font-family:Arial,Helvetica,sans-serif;font-size:6px;font-weight:950;line-height:1;letter-spacing:.08em;white-space:nowrap;pointer-events:none}
        :global(.ixi-aos-header-identity-shell .ixi-aos-card-header-controls){top:17px!important}
      `}</style>
    </div>
  );
}

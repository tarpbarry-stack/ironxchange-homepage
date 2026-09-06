import { useEffect, useMemo, useState } from "react";

import {
  IXI_AOS_MEDIA_ACCEPT,
  validateIXIAosMediaFile
} from "../../../../lib/media/ixiAosMediaContract.mjs";

function clean(value) {
  return String(value ?? "").trim();
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function mediaUrl(item) {
  if (typeof item === "string") return clean(item);
  return clean(item?.url || item?.src || item?.imageUrl || item?.previewUrl);
}

export default function IXIAosPrimaryMediaEditor({
  media = [],
  onChange = null,
  label = "PRIMARY PHOTO",
  status = "",
  error = "",
  disabled = false
}) {
  const items = asArray(media);
  const preview = useMemo(() => items.map(mediaUrl).find(Boolean) || "", [items]);
  const [selectionError, setSelectionError] = useState("");

  useEffect(() => () => {
    items.forEach(item => {
      if (item?.pendingUpload && String(item?.url || "").startsWith("blob:")) {
        URL.revokeObjectURL(item.url);
      }
    });
  }, [items]);

  function choosePhoto(event) {
    const file = event?.target?.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const validated = validateIXIAosMediaFile(file);
      const next = {
        file,
        url: URL.createObjectURL(file),
        name: clean(file.name),
        type: validated.contentType,
        size: validated.sizeBytes,
        source: "aos-object-photo-upload",
        pendingUpload: true
      };
      onChange?.([next, ...items.slice(1)]);
      setSelectionError("");
    } catch (caught) {
      setSelectionError(clean(caught?.message) || "The selected photo cannot be uploaded.");
    }
  }

  const message = clean(error) || selectionError || clean(status);
  const messageTone = clean(error) || selectionError ? "error" : "status";

  return (
    <section className="ixi-aos-primary-media-editor">
      <div className="ixi-aos-primary-media-preview">
        {preview ? <img src={preview} alt="Object" /> : <div><b>IXI</b><span>NO PHOTO</span></div>}
      </div>
      <div className="ixi-aos-primary-media-copy">
        <strong>{label}</strong>
        <small>ADD OR REPLACE THE CARD PHOTO</small>
        <div>
          <label aria-disabled={disabled}>ADD / CHANGE<input disabled={disabled} type="file" accept={IXI_AOS_MEDIA_ACCEPT} onChange={choosePhoto} /></label>
          {preview ? <button type="button" disabled={disabled} onClick={() => onChange?.([])}>REMOVE</button> : null}
        </div>
        {message ? <em className={messageTone}>{message}</em> : <em>20 MB MAX · JPG PNG WEBP AVIF HEIC HEIF</em>}
      </div>
      <style jsx global>{`
        .ixi-aos-primary-media-editor,.ixi-aos-primary-media-editor *{box-sizing:border-box}.ixi-aos-primary-media-editor{display:grid;grid-template-columns:82px 1fr;gap:8px;min-height:72px;padding:7px;border:1px solid #343a35;border-radius:5px;background:#101310}.ixi-aos-primary-media-preview{width:82px;height:62px;display:grid;place-items:center;overflow:hidden;border:1px solid #353c37;border-radius:4px;background:#090c0a}.ixi-aos-primary-media-preview img{display:block;width:100%;height:100%;object-fit:contain;background:#090c0a}.ixi-aos-primary-media-preview>div{display:flex;flex-direction:column;align-items:center;gap:4px;color:#68716b}.ixi-aos-primary-media-preview b{color:#ffc400;font-size:10px}.ixi-aos-primary-media-preview span{font-size:5px;font-weight:900}.ixi-aos-primary-media-copy{min-width:0;display:flex;flex-direction:column;justify-content:center}.ixi-aos-primary-media-copy>strong{color:#ffc400;font-size:6px;font-weight:950}.ixi-aos-primary-media-copy>small{margin-top:3px;color:#7f8882;font-size:5px;font-weight:850}.ixi-aos-primary-media-copy>div{display:flex;gap:4px;margin-top:8px}.ixi-aos-primary-media-copy label,.ixi-aos-primary-media-copy button{height:23px;display:flex;align-items:center;justify-content:center;padding:0 7px;border:1px solid #3b423d;border-radius:4px;background:#111512;color:#dfe3e0;font-size:5.5px;font-weight:950;cursor:pointer}.ixi-aos-primary-media-copy label{color:#ffc400;border-color:#ffc40055}.ixi-aos-primary-media-copy label[aria-disabled="true"],.ixi-aos-primary-media-copy button:disabled{cursor:wait;opacity:.45}.ixi-aos-primary-media-copy input{display:none}.ixi-aos-primary-media-copy>em{display:block;margin-top:4px;overflow:hidden;color:#68716b;font-size:4.5px;font-style:normal;font-weight:850;text-overflow:ellipsis;white-space:nowrap}.ixi-aos-primary-media-copy>em.status{color:#00c2ff}.ixi-aos-primary-media-copy>em.error{color:#ff6b6b;white-space:normal}
      `}</style>
    </section>
  );
}

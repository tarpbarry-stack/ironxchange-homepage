import { useMemo } from "react";

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
  label = "PRIMARY PHOTO"
}) {
  const items = asArray(media);
  const preview = useMemo(() => items.map(mediaUrl).find(Boolean) || "", [items]);

  function choosePhoto(event) {
    const file = event?.target?.files?.[0];
    if (!file || !String(file.type || "").startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = () => {
      const next = {
        url: String(reader.result || ""),
        name: clean(file.name),
        type: clean(file.type),
        size: Number(file.size || 0),
        source: "aos-object-photo-upload",
        pendingUpload: true
      };
      onChange?.([next, ...items.slice(1)]);
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  return (
    <section className="ixi-aos-primary-media-editor">
      <div className="ixi-aos-primary-media-preview">
        {preview ? <img src={preview} alt="Object" /> : <div><b>IXI</b><span>NO PHOTO</span></div>}
      </div>
      <div className="ixi-aos-primary-media-copy">
        <strong>{label}</strong>
        <small>ADD OR REPLACE THE CARD PHOTO</small>
        <div>
          <label>ADD / CHANGE<input type="file" accept="image/*" onChange={choosePhoto} /></label>
          {preview ? <button type="button" onClick={() => onChange?.([])}>REMOVE</button> : null}
        </div>
      </div>
      <style jsx global>{`
        .ixi-aos-primary-media-editor,.ixi-aos-primary-media-editor *{box-sizing:border-box}.ixi-aos-primary-media-editor{display:grid;grid-template-columns:82px 1fr;gap:8px;min-height:72px;padding:7px;border:1px solid #343a35;border-radius:5px;background:#101310}.ixi-aos-primary-media-preview{width:82px;height:62px;display:grid;place-items:center;overflow:hidden;border:1px solid #353c37;border-radius:4px;background:#090c0a}.ixi-aos-primary-media-preview img{display:block;width:100%;height:100%;object-fit:contain;background:#090c0a}.ixi-aos-primary-media-preview>div{display:flex;flex-direction:column;align-items:center;gap:4px;color:#68716b}.ixi-aos-primary-media-preview b{color:#ffc400;font-size:10px}.ixi-aos-primary-media-preview span{font-size:5px;font-weight:900}.ixi-aos-primary-media-copy{min-width:0;display:flex;flex-direction:column;justify-content:center}.ixi-aos-primary-media-copy>strong{color:#ffc400;font-size:6px;font-weight:950}.ixi-aos-primary-media-copy>small{margin-top:3px;color:#7f8882;font-size:5px;font-weight:850}.ixi-aos-primary-media-copy>div{display:flex;gap:4px;margin-top:8px}.ixi-aos-primary-media-copy label,.ixi-aos-primary-media-copy button{height:23px;display:flex;align-items:center;justify-content:center;padding:0 7px;border:1px solid #3b423d;border-radius:4px;background:#111512;color:#dfe3e0;font-size:5.5px;font-weight:950;cursor:pointer}.ixi-aos-primary-media-copy label{color:#ffc400;border-color:#ffc40055}.ixi-aos-primary-media-copy input{display:none}
      `}</style>
    </section>
  );
}

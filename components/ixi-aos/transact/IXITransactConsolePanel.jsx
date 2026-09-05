import { useState } from "react";

import IXITransactRecordIndex from "./IXITransactRecordIndex";

const clean = value => String(value ?? "").trim();

export default function IXITransactConsolePanel({
  context = {},
  financialRecords = [],
  onOpenModule = null,
  onOpenWorksheet = null
}) {
  const [selectedFace, setSelectedFace] = useState("");

  if (selectedFace === "transact-f1") {
    return (
      <IXITransactRecordIndex
        context={context}
        financialRecords={financialRecords}
        onOpenModule={onOpenModule}
        onOpenWorksheet={onOpenWorksheet}
        onBack={() => setSelectedFace("")}
      />
    );
  }

  return (
    <div className="ixi-machine-face-directory">
      <main>
        <div className="face-heading">
          <strong>SELECT FACE</strong>
          <span>{clean(context?.primary?.label) || "MACHINE"}</span>
        </div>

        <div className="face-grid">
          <button
            type="button"
            onClick={() => setSelectedFace("transact-f1")}
          >
            <strong>TRAN$ACT</strong>
            <span>$F1 · RECORD INDEX</span>
          </button>
        </div>
      </main>

      <style jsx>{`
        .ixi-machine-face-directory,.ixi-machine-face-directory *{box-sizing:border-box}
        .ixi-machine-face-directory{position:relative;width:298px;height:471px;overflow:hidden;border:1px solid rgba(255,255,255,.11);border-radius:14px;background:linear-gradient(180deg,rgba(255,196,0,.018),transparent 34%),#111212;color:#f2f2f2;font-family:Inter,Arial,sans-serif;box-shadow:0 18px 34px rgba(0,0,0,.42)}
        main{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;padding:36px 24px 54px}
        .face-heading{text-align:center}
        .face-heading strong{display:block;color:#ffc400;font-size:17px;line-height:1;font-weight:950;letter-spacing:.075em}
        .face-heading span{display:block;max-width:220px;margin:11px auto 0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#858a87;font-size:8px;line-height:1;font-weight:900;letter-spacing:.12em;text-transform:uppercase}
        .face-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:23px}
        .face-grid button{position:relative;min-width:0;height:68px;padding:12px;border:1px solid rgba(255,255,255,.11);border-radius:7px;background:linear-gradient(180deg,#171818,#131414);color:#f1f1f1;text-align:left;cursor:pointer;box-shadow:inset 0 1px 0 rgba(255,255,255,.025)}
        .face-grid button:hover,.face-grid button:focus-visible{outline:none;border-color:rgba(255,196,0,.65);background:#191a17;box-shadow:0 0 0 1px rgba(255,196,0,.1)}
        .face-grid button strong{display:block;color:#ffc400;font-size:12px;line-height:1.1;font-weight:950;letter-spacing:.035em}
        .face-grid button span{display:block;margin-top:7px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#b7bbb8;font-size:8px;line-height:1;font-weight:850;letter-spacing:.035em}
      `}</style>
    </div>
  );
}

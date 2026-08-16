export default function IXIBillStandaloneStyles() {
  return (
    <style jsx global>{`
      .ixi-bill-app,
      .ixi-bill-app * {
        box-sizing: border-box;
      }

      .ixi-bill-app {
        position: relative;
        width: 298px;
        height: 471px;
        overflow: hidden;
        border: 1px solid #303432;
        border-radius: 14px;
        background:
          radial-gradient(circle at 40% -8%, rgba(255,255,255,.045), transparent 30%),
          linear-gradient(#0c0e0d, #090b0a 55%, #0d100e);
        color: #f4f5f4;
        font-family: Arial, Helvetica, sans-serif;
        box-shadow:
          0 20px 48px rgba(0,0,0,.58),
          inset 0 1px rgba(255,255,255,.035);
      }

      .ixi-bill-app > .bill-queue,
      .ixi-bill-app > .bill-new {
        position: absolute;
        inset: 0;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 9px 10px 14px;
        scrollbar-width: thin;
        scrollbar-color: rgba(255,255,255,.16) transparent;
      }

      .ixi-bill-app .bill-app-head {
        min-height: 44px;
        padding-bottom: 7px;
        border-bottom: 1px solid rgba(255,255,255,.07);
      }

      .ixi-bill-app .bill-app-head div strong {
        color: #f3f4f3;
        font-size: 14px;
      }

      .ixi-bill-app .bill-app-head div small {
        color: #7d837f;
      }

      .ixi-bill-app .bill-app-head::before {
        content: "IXI TRAN$ACT";
        position: absolute;
        top: 3px;
        left: 10px;
        transform: translateY(-100%);
        color: #ffc400;
        font-size: 0;
      }

      .ixi-bill-app .bill-new-actions {
        padding-bottom: 4px;
      }
    `}</style>
  );
}

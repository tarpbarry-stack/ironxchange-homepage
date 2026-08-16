export default function IXIAosV12CardPolish() {
  return (
    <style jsx global>{`
      /* Card 001: reserve a true three-line address/descriptor shell.
         The current sample uses two lines, but the geometry is ready for three. */
      .gov-001 .gov-descriptor {
        flex-basis: 54px !important;
        min-height: 54px !important;
      }
      .gov-001 .gov-descriptor > div {
        min-width: 0;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
      .gov-001 .gov-descriptor strong {
        display: -webkit-box !important;
        overflow: hidden !important;
        white-space: normal !important;
        text-overflow: clip !important;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        line-height: 1.22 !important;
      }
      .gov-001 .gov-descriptor small {
        display: block !important;
        overflow: hidden !important;
        white-space: nowrap !important;
        text-overflow: ellipsis !important;
        line-height: 1.2 !important;
      }

      /* 004/005/006: remove the browser-default 'Windows 95' outer scrollbar.
         Match the black-on-black micro scrollbars used inside V12 shells. */
      .ixi-generic-container-v12 .gcv12-body,
      .ixi-generic-container-v12 .gcv12-section-scroll,
      .ixi-generic-container-v12 .gcv12-editor-scroll {
        scrollbar-width: thin;
        scrollbar-color: #3d4540 #090b0a;
      }
      .ixi-generic-container-v12 .gcv12-body::-webkit-scrollbar,
      .ixi-generic-container-v12 .gcv12-section-scroll::-webkit-scrollbar,
      .ixi-generic-container-v12 .gcv12-editor-scroll::-webkit-scrollbar {
        width: 5px;
        height: 5px;
      }
      .ixi-generic-container-v12 .gcv12-body::-webkit-scrollbar-track,
      .ixi-generic-container-v12 .gcv12-section-scroll::-webkit-scrollbar-track,
      .ixi-generic-container-v12 .gcv12-editor-scroll::-webkit-scrollbar-track {
        background: #090b0a;
      }
      .ixi-generic-container-v12 .gcv12-body::-webkit-scrollbar-thumb,
      .ixi-generic-container-v12 .gcv12-section-scroll::-webkit-scrollbar-thumb,
      .ixi-generic-container-v12 .gcv12-editor-scroll::-webkit-scrollbar-thumb {
        background: #3d4540;
        border: 1px solid #151916;
        border-radius: 999px;
      }
      .ixi-generic-container-v12 .gcv12-body::-webkit-scrollbar-thumb:hover,
      .ixi-generic-container-v12 .gcv12-section-scroll::-webkit-scrollbar-thumb:hover,
      .ixi-generic-container-v12 .gcv12-editor-scroll::-webkit-scrollbar-thumb:hover {
        background: #555f58;
      }
      .ixi-generic-container-v12 .gcv12-body::-webkit-scrollbar-corner,
      .ixi-generic-container-v12 .gcv12-section-scroll::-webkit-scrollbar-corner,
      .ixi-generic-container-v12 .gcv12-editor-scroll::-webkit-scrollbar-corner {
        background: #090b0a;
      }
    `}</style>
  );
}

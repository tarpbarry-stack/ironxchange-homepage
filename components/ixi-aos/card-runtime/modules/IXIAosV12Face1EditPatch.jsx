export default function IXIAosV12Face1EditPatch() {
  return (
    <style jsx global>{`
      /*
       * V12 FACE 1 EDIT PATCH
       * ----------------------
       * Existing card-specific editors remain responsible for persistence, but
       * they may no longer replace the complete card face. The real card shell,
       * header, rails, commands and surrounding visual context stay mounted.
       */
      .ixi-v12-face1-edit [class$="-editor"],
      .ixi-v12-face1-edit .gcv12-editor,
      .ixi-v12-face1-edit .go007-editor,
      .ixi-v12-face1-edit .u007-editor,
      .ixi-v12-face1-edit .c009-editor,
      .ixi-v12-face1-edit .c010-editor,
      .ixi-v12-face1-edit .c011-editor,
      .ixi-v12-face1-edit .c012-editor,
      .ixi-v12-face1-edit .c013-editor,
      .ixi-v12-face1-edit .c014-editor,
      .ixi-v12-face1-edit .c015-editor,
      .ixi-v12-face1-edit .c016-editor,
      .ixi-v12-face1-edit .c017-editor {
        background: transparent !important;
        border: 0 !important;
        border-radius: 0 !important;
        box-shadow: none !important;
      }

      /* Preserve the real header and turn editor chrome into SAVE/CANCEL only. */
      .ixi-v12-face1-edit [class$="-editor"] > header,
      .ixi-v12-face1-edit [class$="-editor-head"],
      .ixi-v12-face1-edit .gcv12-editor-head,
      .ixi-v12-face1-edit .go007-editor-head,
      .ixi-v12-face1-edit .u007-editor-head {
        position: absolute !important;
        top: -43px !important;
        left: 0 !important;
        right: 0 !important;
        height: 43px !important;
        z-index: 20 !important;
        border: 0 !important;
        background: transparent !important;
        pointer-events: none;
      }
      .ixi-v12-face1-edit [class$="-editor"] > header > div,
      .ixi-v12-face1-edit [class$="-editor-head"] > div,
      .ixi-v12-face1-edit .gcv12-editor-head > div,
      .ixi-v12-face1-edit .go007-editor-head > div,
      .ixi-v12-face1-edit .u007-editor-head > div {
        display: none !important;
      }
      .ixi-v12-face1-edit [class$="-editor"] nav,
      .ixi-v12-face1-edit [class$="-editor-head"] nav,
      .ixi-v12-face1-edit .gcv12-editor-head nav,
      .ixi-v12-face1-edit .go007-editor-head nav,
      .ixi-v12-face1-edit .u007-editor-head nav {
        position: absolute !important;
        top: 15px !important;
        right: 1px !important;
        display: flex !important;
        gap: 4px !important;
        pointer-events: auto;
      }
      .ixi-v12-face1-edit [class$="-editor"] nav button,
      .ixi-v12-face1-edit [class$="-editor-head"] nav button,
      .ixi-v12-face1-edit .gcv12-editor-head nav button,
      .ixi-v12-face1-edit .go007-editor-head nav button,
      .ixi-v12-face1-edit .u007-editor-head nav button {
        height: 22px !important;
        padding: 0 7px !important;
        border-radius: 4px !important;
        font-size: 10px !important;
        line-height: 20px !important;
        font-weight: 800 !important;
      }

      /* Editors are now an in-card work surface, not a replacement face. */
      .ixi-v12-face1-edit .gcv12-editor {
        inset: 43px 7px 111px !important;
        z-index: 80 !important;
      }
      .ixi-v12-face1-edit .go007-editor {
        inset: 42px 10px 67px !important;
        z-index: 80 !important;
      }
      .ixi-v12-face1-edit .u007-editor,
      .ixi-v12-face1-edit .c009-editor,
      .ixi-v12-face1-edit .c010-editor,
      .ixi-v12-face1-edit .c011-editor,
      .ixi-v12-face1-edit .c012-editor,
      .ixi-v12-face1-edit .c013-editor,
      .ixi-v12-face1-edit .c014-editor,
      .ixi-v12-face1-edit .c015-editor,
      .ixi-v12-face1-edit .c016-editor,
      .ixi-v12-face1-edit .c017-editor {
        inset: 48px 7px 51px !important;
        z-index: 80 !important;
      }
      .ixi-v12-face1-edit .u007-editor { inset: 43px 7px 111px !important; }
      .ixi-v12-face1-edit .c009-editor { inset: 48px 7px 51px !important; }

      .ixi-v12-face1-edit [class$="-editor"] > main,
      .ixi-v12-face1-edit [class$="-editor-scroll"],
      .ixi-v12-face1-edit .gcv12-editor-scroll,
      .ixi-v12-face1-edit .go007-editor-scroll,
      .ixi-v12-face1-edit .u007-editor-scroll {
        position: absolute !important;
        inset: 0 !important;
        padding: 6px !important;
        overflow-y: auto !important;
        border: 1px solid rgba(75,82,78,.72) !important;
        border-radius: 6px !important;
        background: rgba(8,11,9,.76) !important;
        backdrop-filter: blur(2px);
        scrollbar-width: thin;
        scrollbar-color: #4b514d transparent;
      }

      /* The edit deck uses the same face typography and stays intentionally simple. */
      .ixi-v12-face1-edit [class$="-editor"] label,
      .ixi-v12-face1-edit [class$="-editor-scroll"] label,
      .ixi-v12-face1-edit .gcv12-editor-scroll label,
      .ixi-v12-face1-edit .go007-editor-scroll label,
      .ixi-v12-face1-edit .u007-editor-scroll label {
        display: block !important;
        margin: 0 0 5px !important;
        padding: 5px !important;
        border: 1px solid #303631 !important;
        border-radius: 5px !important;
        background: rgba(17,21,18,.88) !important;
      }
      .ixi-v12-face1-edit [class$="-editor"] label > span,
      .ixi-v12-face1-edit [class$="-editor-scroll"] label > span,
      .ixi-v12-face1-edit .gcv12-editor-scroll label > span,
      .ixi-v12-face1-edit .go007-editor-scroll label > span,
      .ixi-v12-face1-edit .u007-editor-scroll label > span {
        display: block !important;
        margin-bottom: 3px !important;
        color: #aeb5b0 !important;
        font-size: 10px !important;
        line-height: 12px !important;
        font-weight: 700 !important;
      }
      .ixi-v12-face1-edit [class$="-editor"] input,
      .ixi-v12-face1-edit [class$="-editor-scroll"] input,
      .ixi-v12-face1-edit .gcv12-editor-scroll input,
      .ixi-v12-face1-edit .go007-editor-scroll input,
      .ixi-v12-face1-edit .u007-editor-scroll input {
        min-width: 0 !important;
        height: 26px !important;
        padding: 0 6px !important;
        border: 1px solid #59615b !important;
        border-radius: 4px !important;
        background: #090c0a !important;
        color: #f3f5f3 !important;
        font-size: 11px !important;
        line-height: 24px !important;
        font-weight: 700 !important;
        outline: none !important;
      }
      .ixi-v12-face1-edit [class$="-editor"] input:focus,
      .ixi-v12-face1-edit [class$="-editor-scroll"] input:focus {
        border-color: #ffc40099 !important;
      }

      /* Keep media editing only where media is actually part of Face 1. */
      .ixi-v12-face1-edit [class*="media-editor"] {
        background: rgba(17,21,18,.88) !important;
      }
      .ixi-v12-face1-edit .ixi-generic-container-v12[data-card-variant="2"] [class*="media-editor"],
      .ixi-v12-face1-edit .ixi-generic-container-v12[data-card-variant="3"] [class*="media-editor"] {
        display: none !important;
      }

      /* Rail and command strips stay visible but do not execute while editing. */
      .ixi-v12-face1-edit:has([class$="-editor"]) [class*="-commands"],
      .ixi-v12-face1-edit:has([class$="-editor"]) [class*="-actions"],
      .ixi-v12-face1-edit:has([class$="-editor"]) [class*="-rail"] {
        visibility: visible !important;
      }
    `}</style>
  );
}

export default function IXINoteStyles() {
  return (
    <style jsx global>{`
      .tx-note,
      .tx-note * {
        box-sizing: border-box;
      }

      .tx-note {
        position: relative;
        width: 100%;
        padding: 4px 2px 14px;
        color: #eee;
        font-family: "Arial Narrow", "Roboto Condensed", Arial, sans-serif;
      }

      .note-lang {
        position: absolute;
        right: 2px;
        top: 1px;
        display: flex;
        gap: 3px;
        align-items: center;
      }

      .note-lang button {
        border: 0;
        background: none;
        color: #777;
        font-size: 8px;
        font-weight: 950;
      }

      .note-lang button.on {
        color: #ffc400;
      }

      .note-lang i {
        color: #444;
        font-style: normal;
        font-size: 7px;
      }

      .note-head {
        display: flex;
        gap: 10px;
        align-items: flex-start;
        padding: 9px 0 10px;
        border-bottom: 1px solid #2d302e;
      }

      .note-head-icon {
        width: 42px;
        height: 42px;
        display: grid;
        place-items: center;
        flex: none;
        border: 1.5px solid #ffc400;
        border-radius: 5px;
        color: #ffc400;
        font-size: 22px;
      }

      .note-head-copy {
        min-width: 0;
        flex: 1;
      }

      .note-head-copy > strong {
        display: block;
        padding-right: 45px;
        font-size: 16px;
        line-height: 1.05;
        font-weight: 950;
      }

      .note-context {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 5px 7px;
        margin-top: 8px;
      }

      .note-context div {
        min-width: 0;
        padding-left: 6px;
        border-left: 1px solid #514300;
      }

      .note-context b,
      .note-context small {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .note-context b {
        font-size: 8px;
      }

      .note-context small {
        margin-top: 2px;
        color: #929292;
        font-size: 7px;
      }

      .note-section {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 10px 0 7px;
        color: #ffc400;
        font-size: 9px;
        font-weight: 950;
        letter-spacing: .04em;
      }

      .note-section::after {
        content: "";
        height: 1px;
        flex: 1;
        background: #8e7200;
      }

      .tx-note label {
        display: block;
        margin: 8px 1px 4px;
        color: #aaa;
        font-size: 8px;
        font-weight: 950;
      }

      .tx-note em {
        color: #ffc400;
        font-style: normal;
      }

      .note-types {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 4px;
      }

      .note-types button {
        min-height: 42px;
        padding: 5px;
        border: 1px solid #444;
        border-radius: 4px;
        background: #090b0a;
        color: #ddd;
        font-size: 8px;
        font-weight: 950;
      }

      .note-types button.on {
        border-color: #e0ad00;
        background: linear-gradient(#ffd42d, #f1b400);
        color: #111;
      }

      .note-field {
        display: flex;
        align-items: center;
        min-height: 38px;
        border: 1px solid #3b3f3c;
        border-radius: 4px;
        background: #0d100e;
      }

      .note-field.invalid,
      .note-body.invalid,
      .note-attach.invalid {
        border-color: #ff6a55;
      }

      .note-field span {
        width: 34px;
        text-align: center;
        color: #ffc400;
      }

      .note-field input,
      .note-field select {
        width: 100%;
        height: 36px;
        padding: 0 8px;
        border: 0;
        background: transparent;
        color: #eee;
        font-size: 10px;
        outline: 0;
      }

      .note-body {
        position: relative;
        min-height: 132px;
        border: 1px solid #3b3f3c;
        border-radius: 4px;
        background: #0d100e;
      }

      .note-body textarea {
        width: 100%;
        min-height: 132px;
        padding: 11px 10px 27px;
        border: 0;
        background: transparent;
        color: #eee;
        font-size: 11px;
        line-height: 1.45;
        resize: vertical;
        outline: 0;
      }

      .note-count {
        position: absolute;
        right: 8px;
        bottom: 6px;
        color: #777;
        font-size: 7px;
      }

      .note-voice {
        display: grid;
        grid-template-columns: 40px 1fr auto;
        align-items: center;
        min-height: 48px;
        border: 1px solid #3b3f3c;
        border-radius: 4px;
        background: #0d100e;
      }

      .note-voice > span {
        color: #ffc400;
        text-align: center;
        font-size: 18px;
      }

      .note-voice div b,
      .note-voice div small {
        display: block;
      }

      .note-voice div b {
        font-size: 9px;
      }

      .note-voice div small {
        margin-top: 2px;
        color: #888;
        font-size: 7px;
      }

      .note-voice button {
        height: 30px;
        margin-right: 6px;
        padding: 0 8px;
        border: 1px solid #8b6d00;
        border-radius: 4px;
        background: #0a0b0b;
        color: #ffc400;
        font-size: 7px;
        font-weight: 950;
      }

      .note-voice button.on {
        background: #ffc400;
        color: #111;
      }

      .note-two {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 7px;
      }

      .note-attach {
        min-height: 72px;
        display: grid;
        grid-template-columns: 74px 1fr;
        gap: 8px;
        align-items: center;
        padding: 7px;
        border: 1px dashed #a68000;
        border-radius: 4px;
        background: rgba(255,196,0,.015);
      }

      .note-preview {
        height: 58px;
        display: grid;
        place-items: center;
        border: 1px solid #333;
        border-radius: 4px;
        background: #111;
        color: #777;
        font-size: 8px;
        overflow: hidden;
      }

      .note-preview img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .note-file label {
        margin: 0;
        color: #ffc400;
        font-size: 9px;
        cursor: pointer;
      }

      .note-file small {
        display: block;
        margin-top: 4px;
        color: #888;
        font-size: 7px;
      }

      .note-file input {
        position: absolute;
        width: 1px;
        height: 1px;
        opacity: 0;
        pointer-events: none;
      }

      .note-tags {
        display: flex;
        gap: 4px;
        flex-wrap: wrap;
      }

      .note-tags input {
        width: 100%;
        height: 36px;
        padding: 0 8px;
        border: 1px solid #3b3f3c;
        border-radius: 4px;
        background: #0d100e;
        color: #eee;
        font-size: 9px;
        outline: 0;
      }

      .note-policy {
        margin-top: 7px;
        padding: 6px 8px;
        border: 1px solid rgba(255,196,0,.15);
        border-radius: 4px;
        background: rgba(255,196,0,.025);
        color: #999;
        font-size: 7px;
        line-height: 1.35;
      }

      .note-errors {
        margin-top: 8px;
        padding: 7px 8px;
        border: 1px solid rgba(255,106,85,.28);
        border-radius: 4px;
        background: rgba(255,106,85,.055);
        color: #ff7a67;
        font-size: 8px;
      }

      .note-actions {
        display: grid;
        grid-template-columns: .9fr 1.1fr;
        gap: 7px;
        margin-top: 10px;
      }

      .note-actions button {
        min-height: 45px;
        padding: 6px;
        border: 1px solid #d9aa00;
        border-radius: 4px;
        background: #090b0a;
        color: #ffc400;
        font-size: 9px;
        font-weight: 950;
      }

      .note-actions .save {
        background: linear-gradient(#ffd42d, #edb000);
        color: #111;
      }

      .note-actions button:disabled {
        opacity: .48;
        cursor: not-allowed;
      }

      .note-actions small {
        display: block;
        margin-top: 3px;
        font-size: 7px;
      }

      .note-foot {
        margin-top: 8px;
        text-align: center;
        color: #999;
        font-size: 7px;
        line-height: 1.35;
      }
    `}</style>
  );
}

export default function IXIPurchaseStyles() {
  return (
    <style jsx global>{`
      .tx-purchase,
      .tx-purchase * {
        box-sizing: border-box;
      }

      .tx-purchase {
        position: relative;
        width: 100%;
        padding: 4px 2px 14px;
        color: #eee;
        font-family: "Arial Narrow", "Roboto Condensed", Arial, sans-serif;
      }

      .tx-purchase button,
      .tx-purchase input,
      .tx-purchase select,
      .tx-purchase textarea {
        font: inherit;
      }

      .tx-purchase button:disabled,
      .tx-purchase input:disabled,
      .tx-purchase select:disabled,
      .tx-purchase textarea:disabled {
        cursor: wait;
        opacity: .58;
      }

      .po-lang {
        position: absolute;
        right: 2px;
        top: 1px;
        z-index: 5;
        display: flex;
        align-items: center;
        gap: 3px;
      }

      .po-lang button {
        border: 0;
        background: none;
        color: #777;
        font-size: 8px;
        font-weight: 950;
        cursor: pointer;
      }

      .po-lang span {
        color: #444;
        font-size: 7px;
      }

      .po-lang button.on {
        color: #ffc400;
      }

      .po-head {
        display: flex;
        gap: 10px;
        align-items: flex-start;
        padding: 9px 0 10px;
        border-bottom: 1px solid #2d302e;
      }

      .po-icon {
        width: 42px;
        height: 42px;
        display: grid;
        place-items: center;
        flex: none;
        border: 1.5px solid #ffc400;
        border-radius: 5px;
        color: #ffc400;
        font-size: 21px;
      }

      .po-title {
        min-width: 0;
        flex: 1;
      }

      .po-title > strong {
        display: block;
        padding-right: 54px;
        color: #f3f3f3;
        font-size: 16px;
        line-height: 1.05;
        font-weight: 950;
      }

      .po-context {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 5px 7px;
        margin-top: 8px;
      }

      .po-context div {
        min-width: 0;
        padding-left: 6px;
        border-left: 1px solid #514300;
      }

      .po-context b,
      .po-context small {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .po-context b {
        color: #e7e7e7;
        font-size: 8px;
        font-weight: 950;
      }

      .po-context small {
        margin-top: 2px;
        color: #929292;
        font-size: 7px;
      }

      .po-section {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 10px 0 7px;
        color: #ffc400;
        font-size: 9px;
        font-weight: 950;
        letter-spacing: .04em;
      }

      .po-section::after {
        content: "";
        height: 1px;
        flex: 1;
        background: #8e7200;
      }

      .tx-purchase label {
        display: block;
        margin: 8px 1px 4px;
        color: #aaa;
        font-size: 8px;
        font-weight: 950;
      }

      .tx-purchase em {
        color: #ffc400;
        font-style: normal;
      }

      .po-modes {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 4px;
      }

      .po-modes button {
        min-height: 38px;
        padding: 5px 7px;
        border: 1px solid #444;
        border-radius: 4px;
        background: #090b0a;
        color: #ddd;
        font-size: 9px;
        line-height: 1.1;
        font-weight: 950;
        cursor: pointer;
      }

      .po-modes button.on {
        border-color: #e0ad00;
        background: linear-gradient(#ffd42d, #f1b400);
        color: #111;
      }

      .po-field {
        min-height: 38px;
        display: flex;
        align-items: center;
        border: 1px solid #3b3f3c;
        border-radius: 4px;
        background: #0d100e;
      }

      .po-field.invalid,
      .po-lines.invalid {
        border-color: rgba(255, 106, 85, .82);
        box-shadow: 0 0 0 1px rgba(255, 106, 85, .08);
      }

      .po-field > span {
        width: 34px;
        flex: none;
        text-align: center;
        color: #ffc400;
        font-size: 15px;
      }

      .po-field input,
      .po-field select {
        width: 100%;
        min-width: 0;
        height: 36px;
        padding: 0 8px;
        border: 0;
        background: transparent;
        color: #eee;
        font-size: 10px;
        outline: 0;
      }

      .po-field select option {
        background: #111;
      }

      .locked-field {
        background: #090b0a;
      }

      .locked-field input {
        color: #c9c9c9;
      }

      .po-two {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 7px;
      }

      .po-lines {
        padding: 6px;
        border: 1px solid #3b3f3c;
        border-radius: 4px;
        background: #0b0d0c;
      }

      .po-line-head,
      .po-line {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 42px 45px 64px 25px;
        gap: 4px;
        align-items: center;
      }

      .po-line-head {
        padding: 0 0 4px;
        color: #777;
        font-size: 6.5px;
        font-weight: 900;
      }

      .po-line {
        padding: 4px 0;
        border-bottom: 1px solid #222;
      }

      .po-line:last-of-type {
        border-bottom: 0;
      }

      .po-line input,
      .po-line select {
        min-width: 0;
        height: 31px;
        padding: 0 5px;
        border: 1px solid #2f3330;
        border-radius: 3px;
        background: #101312;
        color: #eee;
        font-size: 8px;
        outline: 0;
      }

      .po-line select option {
        background: #111;
      }

      .po-line button {
        height: 28px;
        border: 1px solid #444;
        border-radius: 3px;
        background: #111;
        color: #aaa;
        cursor: pointer;
      }

      .po-line button:hover:not(:disabled) {
        border-color: rgba(255, 106, 85, .62);
        color: #ff7a67;
      }

      .po-add {
        width: 100%;
        min-height: 33px;
        margin-top: 6px;
        border: 1px dashed #9d7b00;
        border-radius: 3px;
        background: #0b0d0c;
        color: #ffc400;
        font-size: 8px;
        font-weight: 950;
        cursor: pointer;
      }

      .po-total {
        color: #ffc400 !important;
        font-size: 12px !important;
        font-weight: 950 !important;
      }

      .po-notes {
        width: 100%;
        min-height: 64px;
        padding: 8px;
        border: 1px solid #3b3f3c;
        border-radius: 4px;
        background: #0d100e;
        color: #eee;
        font-size: 10px;
        line-height: 1.3;
        resize: vertical;
        outline: 0;
      }

      .po-attach {
        min-height: 70px;
        display: grid;
        place-items: center;
        border: 1px dashed #a68000;
        border-radius: 4px;
        background: rgba(255, 196, 0, .015);
      }

      .po-file-button {
        width: 100%;
        min-height: 68px;
        margin: 0 !important;
        display: grid !important;
        place-items: center;
        align-content: center;
        gap: 5px;
        color: #ffc400 !important;
        text-align: center;
        cursor: pointer;
      }

      .po-file-button span {
        font-size: 9px;
        font-weight: 950;
      }

      .po-file-button small {
        max-width: 240px;
        overflow: hidden;
        color: #999;
        font-size: 7px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .po-file-button input {
        position: absolute;
        width: 1px;
        height: 1px;
        opacity: 0;
        pointer-events: none;
      }

      .po-errors {
        margin-top: 8px;
        padding: 7px 8px;
        border: 1px solid rgba(255, 106, 85, .28);
        border-radius: 4px;
        background: rgba(255, 106, 85, .055);
        color: #ff7a67;
        font-size: 8px;
        line-height: 1.3;
      }

      .po-save-error {
        border-color: rgba(255, 106, 85, .46);
      }

      .po-actions {
        display: grid;
        grid-template-columns: .85fr 1.15fr;
        gap: 7px;
        margin-top: 10px;
      }

      .po-actions button {
        min-height: 45px;
        padding: 6px;
        border: 1px solid #d9aa00;
        border-radius: 4px;
        background: #090b0a;
        color: #ffc400;
        font-size: 9px;
        font-weight: 950;
        cursor: pointer;
      }

      .po-actions .save {
        background: linear-gradient(#ffd42d, #edb000);
        color: #111;
      }

      .po-actions small {
        display: block;
        margin-top: 3px;
        font-size: 7px;
        font-weight: 800;
      }

      .po-foot {
        margin-top: 8px;
        color: #aaa;
        text-align: center;
        font-size: 7px;
        line-height: 1.3;
      }

      @media (max-width: 270px) {
        .po-two {
          grid-template-columns: 1fr;
        }

        .po-line-head {
          display: none;
        }

        .po-line {
          grid-template-columns: minmax(0, 1fr) 42px 45px;
        }

        .po-line input:nth-of-type(2) {
          grid-column: 1 / span 2;
        }
      }
    `}</style>
  );
}

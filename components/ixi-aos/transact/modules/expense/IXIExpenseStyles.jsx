export default function IXIExpenseStyles() {
  return (
    <style jsx global>{`
      .tx-expense,
      .tx-expense * {
        box-sizing: border-box;
      }

      .tx-expense {
        position: relative;
        padding: 2px 1px 12px;
        color: #eef0ee;
        font-family: "Arial Narrow", "Roboto Condensed", Arial, sans-serif;
      }

      .ex-lang {
        position: absolute;
        right: 1px;
        top: 1px;
        display: flex;
        align-items: center;
        gap: 2px;
        z-index: 3;
      }

      .ex-lang button {
        border: 0;
        background: transparent;
        color: #666;
        font-size: 7px;
        font-weight: 950;
        padding: 2px;
      }

      .ex-lang button.on {
        color: #ffc400;
      }

      .ex-lang i {
        color: #444;
        font-size: 6px;
      }

      .ex-head {
        display: flex;
        gap: 8px;
        align-items: center;
        padding: 5px 1px 8px;
      }

      .ex-icon {
        width: 39px;
        height: 39px;
        display: grid;
        place-items: center;
        border: 1.5px solid #ffc400;
        border-radius: 6px;
        color: #ffc400;
        background: #0c0f0d;
        font-size: 23px;
        font-weight: 950;
      }

      .ex-title {
        min-width: 0;
        flex: 1;
        padding-right: 36px;
      }

      .ex-title strong {
        display: block;
        font-size: 16px;
        line-height: 1;
        font-weight: 950;
      }

      .ex-title small {
        display: block;
        margin-top: 4px;
        color: #9ba09c;
        font-size: 6px;
      }

      .ex-context-row {
        display: grid;
        grid-template-columns: repeat(2,1fr);
        gap: 4px;
        margin-bottom: 7px;
      }

      .ex-mode-banner {
        margin: 0 0 7px;
        padding: 6px 8px;
        border: 1px solid rgba(255,196,0,.35);
        border-radius: 4px;
        background: rgba(255,196,0,.055);
        color: #ffc400;
        font-size: 6px;
        font-weight: 950;
        letter-spacing: .45px;
      }

      .ex-mode-banner.correction {
        border-color: rgba(255,104,86,.38);
        background: rgba(255,104,86,.05);
        color: #ff8a78;
      }

      .ex-context-row div {
        min-width: 0;
        height: 34px;
        padding: 6px 7px;
        border: 1px solid #323733;
        border-radius: 5px;
        background: #0f1210;
      }

      .ex-context-row b {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: #eee;
        font-size: 7px;
      }

      .ex-context-row small {
        display: block;
        margin-top: 2px;
        color: #7e8580;
        font-size: 5.5px;
      }

      .tx-expense label {
        display: block;
        margin: 7px 1px 3px;
        color: #a8ada9;
        font-size: 6.6px;
        font-weight: 950;
      }

      .tx-expense label em {
        color: #ffc400;
        font-style: normal;
      }

      .ex-field {
        height: 34px;
        display: flex;
        align-items: center;
        border: 1px solid #3a403b;
        border-radius: 4px;
        background: #0f1210;
      }

      .ex-field.bad,
      .ex-paid.bad,
      .ex-upload.bad {
        border-color: #ff6856;
      }

      .ex-field > span {
        width: 28px;
        height: 100%;
        display: grid;
        place-items: center;
        border-right: 1px solid #2c312e;
        color: #969c97;
        font-size: 11px;
      }

      .ex-field input,
      .ex-field select {
        min-width: 0;
        flex: 1;
        height: 100%;
        padding: 0 8px;
        border: 0;
        outline: 0;
        background: transparent;
        color: #f3f4f3;
        font: 700 8.5px Arial;
      }

      .ex-field select {
        appearance: auto;
      }

      .ex-field input::placeholder {
        color: #676d69;
      }

      .field-x {
        width: 28px;
        height: 100%;
        border: 0;
        background: transparent;
        color: #747a76;
        font-size: 15px;
      }

      .ex-money input {
        text-align: right;
        font-size: 11px;
        font-weight: 950;
      }

      .ex-amount-pay {
        display: grid;
        grid-template-columns: .82fr 1.58fr;
        gap: 7px;
      }

      .ex-paid {
        height: 38px;
        display: grid;
        grid-template-columns: repeat(4,1fr);
        overflow: hidden;
        border: 1px solid #3a403b;
        border-radius: 4px;
        background: #0d100e;
      }

      .ex-paid button {
        min-width: 0;
        padding: 2px;
        border: 0;
        border-right: 1px solid #2d322e;
        background: transparent;
        color: #9a9f9b;
        font-size: 5.5px;
        font-weight: 950;
        line-height: 1.15;
      }

      .ex-paid button:last-child {
        border-right: 0;
      }

      .ex-paid button.on {
        background: rgba(255,196,0,.065);
        color: #ffc400;
        box-shadow: inset 0 0 0 1px rgba(255,196,0,.42);
      }

      .ex-reimbursement {
        margin-top: 4px;
        padding: 5px 7px;
        border: 1px solid rgba(255,196,0,.24);
        border-radius: 4px;
        background: rgba(255,196,0,.035);
        color: #ffc400;
        font-size: 6px;
        font-weight: 950;
      }

      .ex-check {
        min-height: 31px;
        display: flex !important;
        align-items: center;
        gap: 7px;
        padding: 7px 8px;
        border: 1px solid rgba(255,104,86,.3);
        border-radius: 4px;
        background: rgba(255,104,86,.04);
        color: #ff8a78 !important;
      }

      .ex-check input {
        accent-color: #ffc400;
      }

      .ex-two {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 6px;
      }

      .ex-locked {
        height: 31px;
        display: flex;
        align-items: center;
        padding: 0 8px;
        border: 1px solid #303530;
        border-radius: 4px;
        background: #0b0e0c;
        color: #cfd2cf;
        font-size: 7.5px;
        font-weight: 900;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .ex-notes {
        width: 100%;
        height: 47px;
        padding: 7px;
        border: 1px solid #3a403b;
        border-radius: 4px;
        background: #0f1210;
        color: #eee;
        font: 700 7.5px/1.35 Arial;
        resize: none;
        outline: 0;
      }

      .ex-upload {
        display: flex;
        gap: 5px;
        min-height: 58px;
        padding: 5px;
        border: 1px dashed #826900;
        border-radius: 4px;
        background: #0c0f0d;
      }

      .ex-upload > input {
        display: none;
      }

      .upload-pick {
        min-height: 48px;
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        border: 0;
        background: transparent;
        color: #ffc400;
        font-size: 15px;
      }

      .upload-pick span {
        color: #b8bcb9;
        font-size: 7px;
        text-align: left;
      }

      .upload-pick small {
        display: block;
        margin-top: 4px;
        color: #777d78;
        font-size: 5px;
      }

      .receipt-card {
        position: relative;
        width: 83px;
        min-width: 83px;
        height: 58px;
        overflow: hidden;
        border: 1px solid #424743;
        border-radius: 3px;
        background: #151815;
      }

      .receipt-card img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .receipt-card span {
        display: none;
      }

      .receipt-card > button {
        position: absolute;
        right: 2px;
        top: 2px;
        width: 17px;
        height: 17px;
        padding: 0;
        border: 1px solid rgba(255,255,255,.25);
        border-radius: 50%;
        background: rgba(0,0,0,.82);
        color: #fff;
        font-size: 12px;
      }

      .pdf-receipt {
        height: 100%;
        display: grid;
        place-items: center;
        color: #ffc400;
        font-size: 13px;
        font-weight: 950;
      }

      .ex-errors {
        margin-top: 5px;
        padding: 5px 7px;
        border: 1px solid rgba(255,104,86,.28);
        border-radius: 4px;
        background: rgba(255,104,86,.05);
        color: #ff7966;
        font-size: 6px;
      }

      .ex-errors.server {
        color: #ff9d8f;
      }

      .ex-actions {
        display: grid;
        grid-template-columns: 1.55fr .75fr;
        gap: 6px;
        margin-top: 8px;
      }

      .ex-actions > button {
        height: 40px;
        border: 1px solid #444944;
        border-radius: 4px;
        background: #0d100e;
        color: #d1d4d2;
        font-size: 8px;
        font-weight: 950;
      }

      .ex-actions .save {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        border-color: #ffd12b;
        background: linear-gradient(#ffd12b,#e9aa00);
        color: #111;
        font-size: 13px;
      }

      .ex-actions .save span {
        font-size: 9px;
        text-align: left;
      }

      .ex-actions .save small {
        display: block;
        margin-top: 1px;
        font-size: 5px;
      }

      .ex-actions button:disabled {
        opacity: .48;
        cursor: not-allowed;
      }

      .ex-success {
        display: grid;
        grid-template-columns: 28px 1fr;
        gap: 7px;
        margin-top: 7px;
        padding: 8px;
        border: 1px solid rgba(100,190,75,.52);
        border-radius: 5px;
        background: rgba(66,126,49,.08);
      }

      .ex-success > b {
        width: 25px;
        height: 25px;
        display: grid;
        place-items: center;
        border: 1px solid #65bd4d;
        border-radius: 50%;
        color: #65bd4d;
        font-size: 12px;
      }

      .ex-success strong {
        display: block;
        color: #67c750;
        font-size: 8px;
      }

      .ex-success span,
      .ex-success small,
      .ex-success em {
        display: block;
        margin-top: 2px;
        color: #d8dbd9;
        font-size: 6.2px;
        font-style: normal;
      }

      .ex-success em {
        margin-top: 5px;
        padding-top: 5px;
        border-top: 1px solid rgba(255,255,255,.06);
        color: #898f8a;
      }

      .ex-policy {
        margin-top: 8px;
        padding-top: 6px;
        border-top: 1px solid rgba(255,255,255,.06);
        color: #757b76;
        font-size: 5px;
        text-align: center;
      }

      .ex-policy i {
        display: inline-block;
        height: 7px;
        margin: 0 6px;
        border-left: 1px solid #454a46;
        vertical-align: middle;
      }

      .ex-record-alert {
        margin: 36px 4px 10px;
        padding: 14px;
        border: 1px solid rgba(255,104,86,.4);
        border-radius: 5px;
        color: #ff9a8b;
        font-size: 8px;
        line-height: 1.5;
      }

      .ex-back {
        width: calc(100% - 8px);
        height: 38px;
        margin: 0 4px;
        border: 1px solid #4b514c;
        border-radius: 4px;
        background: #101311;
        color: #eef0ee;
        font-size: 8px;
        font-weight: 950;
      }

      .ex-record-id {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 9px;
        border: 1px solid #343a35;
        border-radius: 5px 5px 0 0;
        background: #0d100e;
      }

      .ex-record-id div {
        min-width: 0;
      }

      .ex-record-id small,
      .ex-record-amount small,
      .ex-record-grid small {
        display: block;
        color: #8d948f;
        font-size: 5.5px;
        font-weight: 950;
      }

      .ex-record-id strong {
        display: block;
        overflow: hidden;
        margin-top: 3px;
        color: #fff;
        font-size: 9px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .ex-record-id > span {
        flex: none;
        padding: 5px 6px;
        border: 1px solid #3c443d;
        border-radius: 4px;
        font-size: 5px;
        font-weight: 950;
      }

      .ex-record-id > span.open { color: #6bd057; border-color: rgba(107,208,87,.4); }
      .ex-record-id > span.locked { color: #ffc400; border-color: rgba(255,196,0,.4); }

      .ex-record-amount {
        padding: 11px 9px;
        border: 1px solid #836b00;
        border-top: 0;
        background: rgba(255,196,0,.045);
      }

      .ex-record-amount strong {
        display: block;
        margin-top: 2px;
        color: #fff;
        font-size: 22px;
        line-height: 1;
      }

      .ex-record-grid {
        display: grid;
        grid-template-columns: minmax(0,1fr) minmax(0,1fr);
        margin-top: 7px;
        border-top: 1px solid #2d332f;
        border-left: 1px solid #2d332f;
      }

      .ex-record-grid > div {
        min-width: 0;
        min-height: 43px;
        padding: 7px;
        border-right: 1px solid #2d332f;
        border-bottom: 1px solid #2d332f;
      }

      .ex-record-grid > div.wide { grid-column: 1 / -1; }

      .ex-record-grid b {
        display: block;
        overflow-wrap: anywhere;
        margin-top: 4px;
        color: #eef0ee;
        font-size: 7.5px;
        line-height: 1.3;
      }

      .ex-section-title {
        margin-top: 10px;
        padding: 0 1px 5px;
        border-bottom: 1px solid #333934;
        color: #ffc400;
        font-size: 7px;
        font-weight: 950;
        letter-spacing: .6px;
      }

      .ex-audit > div {
        padding: 7px 2px;
        border-bottom: 1px solid #272d29;
      }

      .ex-audit strong,
      .ex-audit span,
      .ex-audit small {
        display: block;
        overflow-wrap: anywhere;
      }

      .ex-audit strong { color: #eef0ee; font-size: 7px; }
      .ex-audit span { margin-top: 3px; color: #929994; font-size: 5.5px; }
      .ex-audit small { margin-top: 3px; color: #b5bab6; font-size: 5.5px; line-height: 1.35; }
      .ex-audit .empty { color: #858c87; font-size: 6.5px; }

      .ex-record-files {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        padding: 7px 0 2px;
      }

      .ex-record-files a,
      .ex-record-files span {
        max-width: 100%;
        overflow: hidden;
        padding: 5px 7px;
        border: 1px solid #373d38;
        border-radius: 4px;
        color: #cbd0cc;
        font-size: 6px;
        text-decoration: none;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .ex-record-actions {
        display: grid;
        gap: 5px;
        margin-top: 9px;
      }

      .ex-record-actions button {
        min-height: 36px;
        border: 1px solid #444a45;
        border-radius: 4px;
        background: #0e110f;
        color: #e4e6e4;
        font-size: 7px;
        font-weight: 950;
      }

      .ex-record-actions .primary { border-color: #ffc400; background: #ffc400; color: #111; }
      .ex-record-actions .danger { border-color: rgba(255,104,86,.55); color: #ff8c7a; }
    `}</style>
  );
}

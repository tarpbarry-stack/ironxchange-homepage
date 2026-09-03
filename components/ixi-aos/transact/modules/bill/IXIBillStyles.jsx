export default function IXIBillStyles() {
  return (
    <style jsx global>{`
      .ixi-bill-card,
      .ixi-bill-card * {
        box-sizing: border-box;
      }

      .ixi-bill-card {
        position: relative;
        width: 298px;
        height: 471px;
        overflow: hidden;
        border: 1px solid rgba(255, 196, 0, 0.48);
        border-radius: 12px;
        background:
          linear-gradient(180deg, rgba(255,255,255,.025), transparent 22%),
          #0a0c0b;
        color: #f2f3f2;
        font-family: Arial, Helvetica, sans-serif;
        box-shadow:
          0 18px 38px rgba(0,0,0,.5),
          inset 0 1px rgba(255,255,255,.04);
      }

      .bill-toolbar {
        height: 26px;
        padding: 0 7px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid rgba(255,255,255,.07);
        background: #0c0e0d;
      }

      .bill-toolbar button,
      .bill-language button {
        border: 0;
        background: transparent;
        color: rgba(255,255,255,.62);
        font-size: 6px;
        font-weight: 950;
        cursor: pointer;
      }

      .bill-toolbar > button {
        width: 24px;
        height: 20px;
        font-size: 13px;
      }

      .bill-language {
        display: flex;
        align-items: center;
        gap: 3px;
      }

      .bill-language .on {
        color: #ffc400;
      }

      .bill-language span {
        color: rgba(255,255,255,.22);
        font-size: 6px;
      }

      .bill-head {
        height: 49px;
        padding: 7px 8px 6px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid rgba(255,255,255,.08);
      }

      .bill-head > div {
        min-width: 0;
      }

      .bill-head > div > strong {
        display: block;
        font-size: 15px;
        line-height: 1;
        font-weight: 950;
      }

      .bill-head > div > span {
        display: block;
        margin-top: 3px;
        color: rgba(255,255,255,.5);
        font-size: 7px;
      }

      .bill-head .status {
        padding: 5px 8px;
        border-radius: 4px;
        background: rgba(255,196,0,.09);
        color: #ffc400;
        font-size: 6px;
        font-weight: 950;
        letter-spacing: .04em;
      }

      .bill-head .status.approved,
      .bill-head .status.paid {
        background: rgba(71,181,54,.18);
        color: #72d85a;
      }

      .bill-head .status.void {
        background: rgba(220,45,45,.15);
        color: #ff5656;
      }

      .bill-scroll {
        position: absolute;
        top: 75px;
        left: 0;
        right: 0;
        bottom: 28px;
        overflow-y: auto;
        overflow-x: hidden;
        scrollbar-width: thin;
        scrollbar-color: rgba(255,255,255,.18) transparent;
      }

      .identity-grid,
      .approval-grid,
      .payment-grid,
      .match-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .identity-grid > div,
      .approval-grid > div,
      .payment-grid > div,
      .match-grid > div {
        min-height: 42px;
        padding: 6px 7px;
        border-right: 1px solid rgba(255,255,255,.07);
        border-bottom: 1px solid rgba(255,255,255,.07);
      }

      .identity-grid .wide,
      .approval-grid .wide {
        grid-column: 1 / -1;
      }

      .identity-grid small,
      .approval-grid small,
      .payment-grid small,
      .match-grid small {
        display: block;
        margin-bottom: 4px;
        color: rgba(255,255,255,.5);
        font-size: 5.5px;
        font-weight: 900;
        letter-spacing: .035em;
      }

      .identity-grid strong,
      .approval-grid strong,
      .payment-grid strong,
      .match-grid strong {
        display: block;
        min-width: 0;
        color: rgba(255,255,255,.9);
        font-size: 7.2px;
        font-weight: 800;
        line-height: 1.25;
        overflow-wrap: anywhere;
      }

      .identity-grid .amount {
        font-size: 13px;
        font-weight: 950;
      }

      .yellow { color: #ffc400 !important; }
      .green { color: #72d85a !important; }
      .red { color: #ff5b48 !important; }

      .bill-section {
        border-bottom: 1px solid rgba(255,255,255,.08);
        padding: 6px 7px 7px;
      }

      .bill-section h3 {
        margin: 0 0 5px;
        color: #ffc400;
        font-size: 6px;
        font-weight: 950;
        letter-spacing: .035em;
      }

      .match-grid,
      .approval-grid,
      .payment-grid {
        border: 1px solid rgba(255,255,255,.07);
        border-radius: 4px;
        overflow: hidden;
      }

      .match-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .match-grid > div:nth-child(4) {
        grid-column: span 2;
      }

      .document-row,
      .activity-row {
        min-height: 38px;
        display: grid;
        grid-template-columns: 24px minmax(0, 1fr) 12px;
        align-items: center;
        gap: 5px;
        padding: 5px 6px;
        border: 1px solid rgba(255,255,255,.07);
        border-radius: 4px;
        background: rgba(255,255,255,.015);
      }

      .document-row > span,
      .activity-row > span {
        color: #ffc400;
        font-size: 13px;
        text-align: center;
      }

      .document-row strong,
      .activity-row strong {
        display: block;
        font-size: 7px;
      }

      .document-row small,
      .activity-row small {
        display: block;
        margin-top: 3px;
        color: rgba(255,255,255,.45);
        font-size: 5.5px;
      }

      .document-row > b {
        color: rgba(255,255,255,.65);
        font-size: 14px;
      }

      .empty-row,
      .notes-row {
        min-height: 31px;
        padding: 7px;
        border: 1px solid rgba(255,255,255,.07);
        border-radius: 4px;
        color: rgba(255,255,255,.62);
        font-size: 6.5px;
        line-height: 1.4;
      }

      .action-needed {
        margin-top: 6px;
        padding: 6px;
        border: 1px solid rgba(255,196,0,.3);
        border-radius: 4px;
        background: rgba(255,196,0,.025);
      }

      .action-needed > small {
        display: block;
        margin-bottom: 5px;
        color: #ffc400;
        font-size: 5.5px;
        font-weight: 950;
      }

      .action-needed > strong {
        display: block;
        padding: 6px;
        color: rgba(255,255,255,.78);
        font-size: 7px;
      }

      .approval-actions,
      .payment-actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 4px;
      }

      .approval-actions button,
      .action-needed .reject,
      .payment-actions button,
      .full-action,
      .inline-form button {
        min-height: 27px;
        border: 1px solid rgba(255,196,0,.32);
        border-radius: 4px;
        background: #0b0d0c;
        color: #ffc400;
        font-size: 6px;
        font-weight: 950;
        cursor: pointer;
      }

      .approval-actions .approve {
        border-color: rgba(80,190,65,.45);
        color: #72d85a;
      }

      .action-needed .reject {
        width: 100%;
        margin-top: 4px;
        border-color: rgba(235,55,55,.42);
        color: #ff5148;
      }

      .full-action {
        width: 100%;
        margin-top: 5px;
      }

      .payment-actions {
        margin-top: 5px;
      }

      .inline-form {
        margin-top: 5px;
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 4px;
      }

      .inline-form.payment-form {
        grid-template-columns: 1fr 72px;
      }

      .inline-form input,
      .inline-form select,
      .inline-form textarea {
        min-width: 0;
        height: 27px;
        padding: 0 6px;
        border: 1px solid rgba(255,255,255,.1);
        border-radius: 4px;
        background: #090b0a;
        color: #f4f4f4;
        font-size: 6px;
      }

      .inline-form textarea {
        min-height: 42px;
        height: auto;
        padding: 6px;
        resize: vertical;
      }

      .inline-form.payment-form > strong,
      .inline-form.payment-form > textarea {
        grid-column: 1 / -1;
      }

      .inline-form button {
        padding: 0 8px;
      }

      .bill-error {
        margin: 6px 7px;
        padding: 7px;
        border: 1px solid rgba(230,60,60,.42);
        border-radius: 4px;
        color: #ff6760;
        font-size: 6px;
        font-weight: 800;
      }

      .bill-footer-actions {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 28px;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
        border-top: 1px solid rgba(255,255,255,.08);
        background: #0a0c0b;
      }

      .bill-footer-actions button {
        border: 0;
        border-right: 1px solid rgba(255,255,255,.07);
        background: transparent;
        color: rgba(255,255,255,.67);
        font-size: 5.7px;
        font-weight: 900;
        cursor: pointer;
      }

      .bill-footer-actions button:hover {
        color: #ffc400;
      }

      .ixi-bill-app {
        width: 100%;
        min-height: 100%;
        color: #f2f3f2;
      }

      .bill-queue,
      .bill-new {
        padding: 4px 5px 8px;
      }

      .bill-app-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 6px;
        margin-bottom: 7px;
      }

      .bill-app-head div strong {
        display: block;
        font-size: 13px;
        font-weight: 950;
      }

      .bill-app-head div small {
        display: block;
        margin-top: 2px;
        color: rgba(255,255,255,.42);
        font-size: 5.5px;
      }

      .bill-app-head button,
      .bill-primary-button,
      .bill-secondary-button {
        min-height: 28px;
        padding: 0 9px;
        border: 1px solid rgba(255,196,0,.35);
        border-radius: 4px;
        background: #0b0d0c;
        color: #ffc400;
        font-size: 6px;
        font-weight: 950;
        cursor: pointer;
      }

      .bill-summary-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 4px;
        margin-bottom: 7px;
      }

      .bill-summary-grid div {
        min-height: 52px;
        padding: 7px;
        border: 1px solid rgba(255,255,255,.08);
        border-radius: 5px;
        background: rgba(255,255,255,.015);
      }

      .bill-summary-grid small {
        display: block;
        color: rgba(255,255,255,.42);
        font-size: 5.4px;
        font-weight: 900;
      }

      .bill-summary-grid strong {
        display: block;
        margin-top: 5px;
        font-size: 12px;
      }

      .bill-queue-list {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .bill-queue-item {
        width: 100%;
        min-height: 53px;
        padding: 7px;
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 4px;
        border: 1px solid rgba(255,255,255,.08);
        border-radius: 5px;
        background: rgba(255,255,255,.014);
        color: #f2f3f2;
        text-align: left;
        cursor: pointer;
      }

      .bill-queue-item strong,
      .bill-queue-item span,
      .bill-queue-item small {
        display: block;
      }

      .bill-queue-item strong { font-size: 7px; }
      .bill-queue-item span { margin-top: 3px; font-size: 9px; font-weight: 950; }
      .bill-queue-item small { margin-top: 2px; color: rgba(255,255,255,.45); font-size: 5.5px; }
      .bill-queue-item b { color: #ffc400; font-size: 5.5px; align-self: center; }

      .bill-form-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 5px;
      }

      .bill-form-grid .wide {
        grid-column: 1 / -1;
      }

      .bill-form-grid label {
        display: block;
        color: rgba(255,255,255,.55);
        font-size: 5.4px;
        font-weight: 900;
      }

      .bill-form-grid input,
      .bill-form-grid select,
      .bill-form-grid textarea {
        width: 100%;
        min-height: 29px;
        margin-top: 3px;
        padding: 5px 7px;
        border: 1px solid rgba(255,255,255,.1);
        border-radius: 4px;
        background: #090b0a;
        color: #f2f3f2;
        font-size: 6.5px;
      }

      .bill-form-grid textarea {
        min-height: 48px;
        resize: vertical;
      }

      .bill-form-grid input.invalid,
      .bill-form-grid textarea.invalid {
        border-color: rgba(240,70,70,.55);
      }

      .bill-file-box {
        min-height: 48px;
        padding: 7px;
        border: 1px dashed rgba(255,196,0,.38);
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }

      .bill-file-box input {
        width: 100%;
        color: rgba(255,255,255,.62);
        font-size: 5.5px;
      }

      .bill-new-actions {
        display: grid;
        grid-template-columns: 1fr 1.7fr;
        gap: 5px;
        margin-top: 7px;
      }

      .bill-primary-button {
        min-height: 36px;
        background: #ffc400;
        color: #080808;
      }
    `}</style>
  );
}

export default function IXISalesDealStyles() {
  return (
    <style jsx global>{`
      .ixi-sales-register {
        height: 100%;
        min-height: 471px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        background: #080a09;
        color: #f3f4f3;
        font-family: Arial, sans-serif;
      }
      .ixi-sales-register > header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 9px 10px;
        border-bottom: 1px solid #343835;
      }
      .ixi-sales-register > header button {
        border: 0;
        background: none;
        color: #ffc400;
        font-size: 22px;
      }
      .ixi-sales-register > header div {
        min-width: 0;
        flex: 1;
      }
      .ixi-sales-register > header span,
      .ixi-sales-register > header strong {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .ixi-sales-register > header span {
        color: #ffc400;
        font-size: 6px;
        font-weight: 950;
        letter-spacing: 1px;
      }
      .ixi-sales-register > header strong {
        margin-top: 3px;
        font-size: 13px;
      }
      .ixi-sales-register > header i {
        display: grid;
        place-items: center;
        min-width: 28px;
        height: 28px;
        border: 1px solid #6c5900;
        border-radius: 4px;
        color: #ffc400;
        font-size: 11px;
        font-style: normal;
        font-weight: 950;
      }
      .ixi-sales-register-summary {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 5px;
        padding: 7px 9px;
      }
      .ixi-sales-register-summary > div {
        padding: 8px;
        border: 1px solid #303532;
        background: #111412;
      }
      .ixi-sales-register-summary span,
      .ixi-sales-register-summary strong {
        display: block;
      }
      .ixi-sales-register-summary span {
        color: #969b97;
        font-size: 6px;
        font-weight: 950;
      }
      .ixi-sales-register-summary strong {
        margin-top: 3px;
        color: #ffc400;
        font-size: 16px;
      }
      .ixi-sales-register-label {
        margin: 0 9px;
        padding: 7px 1px;
        border-bottom: 1px solid #4a4f4b;
        color: #ffc400;
        font-size: 7px;
        font-weight: 950;
        letter-spacing: 1px;
      }
      .ixi-sales-register > main {
        min-height: 0;
        flex: 1;
        overflow-y: auto;
        padding: 5px 9px;
      }
      .ixi-sales-register article {
        margin-bottom: 6px;
        border: 1px solid #343936;
        border-left: 3px solid #ffc400;
        background: #101311;
      }
      .ixi-sales-register article.terminal {
        border-left-color: #686d69;
        opacity: 0.78;
      }
      .ixi-deal-head {
        display: flex;
        width: 100%;
        align-items: flex-start;
        justify-content: space-between;
        gap: 7px;
        padding: 8px;
        border: 0;
        background: transparent;
        color: inherit;
        text-align: left;
        cursor: pointer;
      }
      .ixi-deal-head:focus-visible {
        outline: 2px solid #ffc400;
        outline-offset: -2px;
      }
      .ixi-deal-head > div {
        min-width: 0;
      }
      .ixi-deal-head strong,
      .ixi-deal-head small,
      .ixi-deal-head b,
      .ixi-deal-head span {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .ixi-deal-head strong {
        font-size: 9px;
      }
      .ixi-deal-head small {
        margin-top: 3px;
        color: #838884;
        font-size: 5.5px;
      }
      .ixi-deal-head > div:last-child {
        text-align: right;
      }
      .ixi-deal-head b {
        color: #ffc400;
        font-size: 9px;
      }
      .ixi-deal-head span {
        margin-top: 3px;
        color: #ffc400;
        font-size: 5.5px;
        font-weight: 950;
      }
      .ixi-deal-stage-rail {
        display: grid;
        grid-template-columns: repeat(6, minmax(0, 1fr));
        border-block: 1px solid #292e2b;
      }
      .ixi-deal-stage-rail button {
        min-width: 0;
        padding: 6px 1px;
        border: 0;
        border-right: 1px solid #252a27;
        background: #0b0e0c;
        color: #737874;
        cursor: pointer;
      }
      .ixi-deal-stage-rail button.completed {
        background: #ffc400;
        color: #070907;
        cursor: pointer;
      }
      .ixi-deal-stage-rail button.available-action {
        color: #ffc400;
        background: #0b0e0c;
        box-shadow: inset 0 0 0 1px #5f5216;
        cursor: pointer;
      }
      .ixi-deal-stage-rail button.next {
        color: #ffc400;
        background: #0b0e0c;
        box-shadow: inset 0 0 0 1px #ffc400;
        cursor: pointer;
      }
      .ixi-deal-stage-rail button.completed.selected {
        box-shadow: inset 0 -3px #fff;
      }
      .ixi-deal-stage-rail button.unavailable.selected {
        box-shadow: inset 0 -2px #666;
      }
      .ixi-deal-stage-rail button:focus-visible {
        outline: 2px solid #ffc400;
        outline-offset: -2px;
      }
      .ixi-deal-stage-rail i,
      .ixi-deal-stage-rail span {
        display: block;
      }
      .ixi-deal-stage-rail i {
        font-size: 7px;
        font-style: normal;
        font-weight: 950;
      }
      .ixi-deal-stage-rail span {
        margin-top: 2px;
        overflow: hidden;
        font-size: 4.5px !important;
        font-weight: 900;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .ixi-sales-register article > footer {
        display: flex;
        justify-content: space-between;
        padding: 6px 8px;
        color: #8e938f;
        font-size: 5.5px;
        font-weight: 900;
      }
      .ixi-sales-register article > footer button {
        border: 0;
        background: none;
        color: #d7a700;
        font-size: 5.5px;
        font-weight: 950;
        cursor: pointer;
      }
      .ixi-sales-register-new {
        margin: 7px 9px;
        min-height: 38px;
        border: 0;
        background: #ffc400;
        color: #090a09;
        font-size: 8px;
        font-weight: 950;
        letter-spacing: 0.6px;
      }
      .ixi-sales-register-direct {
        margin: 0 9px 7px;
        min-height: 30px;
        border: 1px solid #6c5900;
        background: #11140f;
        color: #ffc400;
        font-size: 7px;
        font-weight: 950;
      }
      .ixi-sales-register > footer {
        padding: 6px;
        text-align: center;
        border-top: 1px solid #2c312e;
        color: #858a86;
        font-size: 5.5px;
        font-weight: 900;
        letter-spacing: 0.8px;
      }
      .ixi-sales-register-empty {
        display: flex;
        min-height: 150px;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        gap: 6px;
        color: #909591;
        text-align: center;
      }
      .ixi-sales-register-empty strong {
        font-size: 10px;
      }
      .ixi-sales-register-empty span {
        max-width: 220px;
        font-size: 7px;
        line-height: 1.4;
      }
    `}</style>
  );
}

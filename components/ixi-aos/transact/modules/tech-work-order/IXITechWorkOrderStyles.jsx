export default function IXITechWorkOrderStyles() {
  return (
    <style jsx global>{`
      .techwo-v13 .techwo-titlemark {
        color: #ffc400;
        font-size: 6px;
        font-weight: 950;
        letter-spacing: .075em;
      }

      .techwo-v13 .techwo-domain-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 4px;
        margin-bottom: 7px;
      }

      .techwo-v13 .techwo-domain-grid button {
        min-height: 38px;
        padding: 5px 6px;
        border: 1px solid rgba(255,255,255,.09);
        border-radius: 5px;
        background: rgba(255,255,255,.018);
        color: rgba(255,255,255,.68);
        font-size: 5.8px;
        font-weight: 900;
        text-align: left;
        cursor: pointer;
      }

      .techwo-v13 .techwo-domain-grid button.sel {
        border-color: rgba(255,196,0,.48);
        background: rgba(255,196,0,.055);
        color: #ffc400;
      }

      .techwo-v13 .techwo-tech-fields {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 4px;
        margin-bottom: 7px;
      }

      .techwo-v13 .techwo-tech-fields input,
      .techwo-v13 .techwo-tech-fields select {
        width: 100%;
        height: 29px;
        min-width: 0;
        padding: 0 7px;
        border: 1px solid rgba(255,255,255,.09);
        border-radius: 4px;
        background: #090b0a;
        color: #f1f3f1;
        font-size: 6.3px;
        font-weight: 800;
        outline: none;
      }

      .techwo-v13 .techwo-tech-fields input:focus,
      .techwo-v13 .techwo-tech-fields select:focus {
        border-color: rgba(255,196,0,.48);
      }

      .techwo-v13 .techwo-summary {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 3px;
        margin: 5px 0 7px;
      }

      .techwo-v13 .techwo-summary > div {
        min-height: 36px;
        padding: 5px;
        border: 1px solid rgba(255,255,255,.07);
        border-radius: 4px;
        background: rgba(255,255,255,.014);
      }

      .techwo-v13 .techwo-summary small {
        display: block;
        margin-bottom: 4px;
        color: rgba(255,255,255,.38);
        font-size: 4.7px;
        font-weight: 950;
        letter-spacing: .04em;
      }

      .techwo-v13 .techwo-summary strong {
        display: block;
        overflow: hidden;
        color: rgba(255,255,255,.82);
        font-size: 6.2px;
        font-weight: 900;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .techwo-v13 .techwo-activity {
        margin-top: 6px;
        border-top: 1px solid rgba(255,255,255,.06);
      }

      .techwo-v13 .techwo-activity-row {
        min-height: 31px;
        padding: 5px 2px;
        display: grid;
        grid-template-columns: 8px minmax(0,1fr) auto;
        align-items: center;
        gap: 5px;
        border-bottom: 1px solid rgba(255,255,255,.05);
      }

      .techwo-v13 .techwo-activity-row > i {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #ffc400;
      }

      .techwo-v13 .techwo-activity-row strong {
        display: block;
        color: rgba(255,255,255,.78);
        font-size: 5.8px;
      }

      .techwo-v13 .techwo-activity-row small {
        display: block;
        margin-top: 2px;
        color: rgba(255,255,255,.34);
        font-size: 4.8px;
      }

      .techwo-v13 .techwo-activity-row time {
        color: rgba(255,255,255,.3);
        font-size: 4.7px;
      }

      .techwo-v13 .techwo-complete-panel {
        margin-top: 7px;
        padding: 7px;
        border: 1px solid rgba(80,190,65,.24);
        border-radius: 5px;
        background: rgba(80,190,65,.025);
      }

      .techwo-v13 .techwo-complete-panel textarea {
        width: 100%;
        min-height: 50px;
        margin-bottom: 5px;
        padding: 6px;
        resize: vertical;
        border: 1px solid rgba(255,255,255,.09);
        border-radius: 4px;
        background: #090b0a;
        color: #fff;
        font-size: 6px;
      }

      .techwo-v13 .techwo-complete-panel button,
      .techwo-v13 .techwo-reopen {
        width: 100%;
        height: 30px;
        border: 1px solid rgba(80,190,65,.42);
        border-radius: 4px;
        background: rgba(80,190,65,.035);
        color: #72d85a;
        font-size: 6px;
        font-weight: 950;
        cursor: pointer;
      }
    `}</style>
  );
}
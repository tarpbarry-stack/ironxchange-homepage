import { useIXIAosCardCommands } from "../IXIAosCardCommandContext";

const clean = value => String(value || "").trim();

export default function IXIAosActionNotice({
  notice = null,
  variant = "office"
}) {
  const runtime = useIXIAosCardCommands();
  const resolved = notice || runtime?.actionNotice || null;

  if (!resolved?.message) {
    return null;
  }

  const tone = clean(resolved.tone) || "success";

  return (
    <div
      className={`ixi-aos-action-notice-runtime variant-${variant} tone-${tone}`}
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
      data-blocking={resolved.blocking ? "true" : "false"}
      data-notice-id={clean(resolved.noticeId)}
    >
      <span className="notice-light" aria-hidden="true" />
      <strong>{resolved.message}</strong>

      <style jsx>{`
        .ixi-aos-action-notice-runtime {
          position: absolute;
          left: 7px;
          right: 7px;
          top: 34px;
          min-height: 17px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          padding: 3px 7px;
          border: 1px solid rgba(0, 194, 255, .26);
          border-radius: 3px;
          background: rgba(5, 12, 15, .96);
          color: rgba(51, 204, 255, .96);
          box-shadow: 0 4px 12px rgba(0,0,0,.32);
          pointer-events: none;
          z-index: 260;
        }

        .notice-light {
          width: 5px;
          height: 5px;
          flex: 0 0 5px;
          border-radius: 50%;
          background: currentColor;
          box-shadow: 0 0 7px currentColor;
        }

        strong {
          overflow: hidden;
          font-size: 5.7px;
          font-weight: 950;
          letter-spacing: .055em;
          line-height: 1.15;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .tone-success {
          border-color: rgba(82, 210, 133, .34);
          background: rgba(7, 18, 12, .96);
          color: rgb(82, 210, 133);
        }

        .tone-warning {
          border-color: rgba(255, 196, 0, .38);
          background: rgba(22, 17, 2, .96);
          color: #ffc400;
        }

        .tone-error {
          border-color: rgba(255, 96, 96, .42);
          background: rgba(24, 6, 6, .97);
          color: rgb(255, 104, 104);
        }

        .variant-field {
          top: 38px;
          min-height: 27px;
          padding: 6px 9px;
          border-radius: 5px;
        }

        .variant-field strong {
          font-size: 7px;
        }

        .variant-field .notice-light {
          width: 7px;
          height: 7px;
          flex-basis: 7px;
        }
      `}</style>
    </div>
  );
}

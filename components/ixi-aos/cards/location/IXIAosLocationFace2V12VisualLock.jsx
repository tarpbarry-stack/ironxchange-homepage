export default function IXIAosLocationFace2V12VisualLock() {
  return (
    <style jsx global>{`
      /*
       * LOCATION FACE 2 — V12 VISUAL LOCK
       *
       * Presentation only. Do not change the Face 2 information architecture.
       * This deliberately mirrors the Card 001 Location shell/UI grammar:
       * 298×471 native chassis, 43px header, 13px outer radius, dark V12
       * separators, Arial/Helvetica typography, 5px content shells, and the
       * black-on-black micro scrollbar treatment.
       */
      .ixi-aos-location-f2,
      .ixi-aos-location-f2 * {
        box-sizing: border-box !important;
        font-family: Arial, Helvetica, sans-serif !important;
      }

      .ixi-aos-location-f2 {
        --y: #ffc400 !important;
        --line: #343a35 !important;
        --soft: #252a26 !important;
        --surface: #101310 !important;
        --surface2: #0b0e0c !important;
        --text: #f4f5f4 !important;
        --muted: #969d98 !important;
        position: relative !important;
        width: 298px !important;
        min-width: 298px !important;
        max-width: 298px !important;
        height: 471px !important;
        min-height: 471px !important;
        max-height: 471px !important;
        overflow: hidden !important;
        border: 1px solid #454b47 !important;
        border-radius: 13px !important;
        outline: 0 !important;
        background: linear-gradient(180deg, #101310, #080a09) !important;
        color: #f4f5f4 !important;
        box-shadow: inset 0 1px #ffffff12, 0 18px 40px #0008 !important;
      }

      .ixi-aos-location-f2 .ops-header {
        position: absolute !important;
        inset: 0 0 auto 0 !important;
        width: 100% !important;
        height: 43px !important;
        min-height: 43px !important;
        padding: 7px 10px !important;
        border: 0 !important;
        border-bottom: 1px solid #303531 !important;
        outline: 0 !important;
        background: linear-gradient(180deg, #171a18, #101210) !important;
        z-index: 40 !important;
      }

      .ixi-aos-location-f2 .ops-header::before,
      .ixi-aos-location-f2 .ops-header::after {
        display: none !important;
        content: none !important;
      }

      .ixi-aos-location-f2 .ops-identity {
        width: 185px !important;
        min-width: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
      }

      .ixi-aos-location-f2 .ops-identity > span {
        display: block !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
        color: #ffc400 !important;
        font-family: Arial, Helvetica, sans-serif !important;
        font-size: 6px !important;
        font-style: normal !important;
        font-weight: 950 !important;
        line-height: 1 !important;
        letter-spacing: .08em !important;
        text-transform: none !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
      }

      .ixi-aos-location-f2 .ops-identity > strong {
        display: block !important;
        width: 100% !important;
        max-width: 185px !important;
        margin: 4px 0 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
        color: #f6f7f6 !important;
        font-family: Arial, Helvetica, sans-serif !important;
        font-size: 14px !important;
        font-style: normal !important;
        font-weight: 950 !important;
        line-height: 1 !important;
        letter-spacing: 0 !important;
        text-transform: none !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
      }

      .ixi-aos-location-f2 .ops-scroll {
        position: absolute !important;
        top: 43px !important;
        left: 7px !important;
        right: 7px !important;
        width: auto !important;
        margin: 0 !important;
        border: 0 !important;
        border-top: 0 !important;
        outline: 0 !important;
        background: transparent !important;
        overflow-x: hidden !important;
        overflow-y: auto !important;
        scrollbar-width: thin !important;
        scrollbar-color: #3d4540 #090b0a !important;
      }

      .ixi-aos-location-f2 .ops-scroll::-webkit-scrollbar {
        width: 5px !important;
        height: 5px !important;
      }
      .ixi-aos-location-f2 .ops-scroll::-webkit-scrollbar-track {
        background: #090b0a !important;
      }
      .ixi-aos-location-f2 .ops-scroll::-webkit-scrollbar-thumb {
        background: #3d4540 !important;
        border: 1px solid #151916 !important;
        border-radius: 999px !important;
      }
      .ixi-aos-location-f2 .ops-scroll::-webkit-scrollbar-thumb:hover {
        background: #555f58 !important;
      }
      .ixi-aos-location-f2 .ops-scroll::-webkit-scrollbar-corner {
        background: #090b0a !important;
      }

      .ixi-aos-location-f2 .gate-code,
      .ixi-aos-location-f2 .ops-section,
      .ixi-aos-location-f2 .site-instructions,
      .ixi-aos-location-f2 .relationship-list {
        border-color: #343a35 !important;
      }

      .ixi-aos-location-f2 .gate-code,
      .ixi-aos-location-f2 .ops-section {
        border-radius: 5px !important;
        background: #101310 !important;
        box-shadow: none !important;
      }

      .ixi-aos-location-f2 .ops-section h3 {
        height: 19px !important;
        margin: 0 !important;
        padding: 0 7px !important;
        border: 0 !important;
        border-bottom: 1px solid #252a26 !important;
        border-radius: 0 !important;
        background: #151916 !important;
        color: #ffc400 !important;
        font-family: Arial, Helvetica, sans-serif !important;
        font-size: 6px !important;
        font-style: normal !important;
        font-weight: 950 !important;
        line-height: 19px !important;
        letter-spacing: 0 !important;
        text-transform: none !important;
      }

      .ixi-aos-location-f2 .ops-row,
      .ixi-aos-location-f2 .ops-relationship {
        border-color: #252a26 !important;
        background: transparent !important;
      }

      .ixi-aos-location-f2 .ops-label,
      .ixi-aos-location-f2 .rel-label {
        color: #969d98 !important;
        font-family: Arial, Helvetica, sans-serif !important;
        font-style: normal !important;
        font-weight: 900 !important;
      }

      .ixi-aos-location-f2 .ops-row strong,
      .ixi-aos-location-f2 .ops-relationship strong,
      .ixi-aos-location-f2 .site-instructions strong {
        color: #e8ebe9 !important;
        font-family: Arial, Helvetica, sans-serif !important;
        font-style: normal !important;
        font-weight: 900 !important;
      }

      .ixi-aos-location-f2 .ops-row-edit {
        border: 1px solid #343a35 !important;
        border-radius: 3px !important;
        background: #111411 !important;
        color: #969d98 !important;
        font-family: Arial, Helvetica, sans-serif !important;
        font-size: 5px !important;
        font-style: normal !important;
        font-weight: 950 !important;
      }

      .ixi-aos-location-f2 .ops-commands {
        left: 7px !important;
        right: 7px !important;
        border-top: 1px solid #202521 !important;
        background: #090b0a !important;
      }

      .ixi-aos-location-f2 .ops-commands button {
        border: 1px solid #343a35 !important;
        border-radius: 4px !important;
        background: #0f1210 !important;
        color: #bcc2be !important;
        font-family: Arial, Helvetica, sans-serif !important;
        font-size: 6px !important;
        font-style: normal !important;
        font-weight: 950 !important;
      }
    `}</style>
  );
}

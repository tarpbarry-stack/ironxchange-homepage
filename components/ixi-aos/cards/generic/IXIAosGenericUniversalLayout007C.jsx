import IXIAosGenericUniversalLayout007 from "./IXIAosGenericUniversalLayout007";

/*
 * Card 007C
 *
 * Universal noun-agnostic AOS object card using the same shared 007 contract,
 * editor, actions, relationships, child deck and IXI rail as 007A.
 *
 * Presentation difference only:
 * - compact 003-inspired split hero
 * - primary media on the left
 * - DETAILS beside the media on the right
 * - RELATIONSHIPS span the full card below
 */
export default function IXIAosGenericUniversalLayout007C(props) {
  return (
    <div className="ixi-universal-card-007c" data-card-number="007C">
      <IXIAosGenericUniversalLayout007 {...props} showMediaBusinessIdentifier={false} />

      <style jsx global>{`
        .ixi-universal-card-007c {
          position: relative;
          width: 298px;
          height: 471px;
        }

        .ixi-universal-card-007c > .ixi-universal-card-007 {
          width: 298px;
          height: 471px;
        }

        /* 003-inspired split hero: media left, object fields right. */
        .ixi-universal-card-007c .u007-body {
          display: grid !important;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
          grid-template-rows: 118px minmax(0, 1fr) !important;
          gap: 5px !important;
          overflow: hidden !important;
        }

        .ixi-universal-card-007c .u007-media-shell {
          grid-column: 1 !important;
          grid-row: 1 !important;
          width: 100% !important;
          height: 118px !important;
          min-height: 118px !important;
          flex: none !important;
          border-color: #3b423d !important;
          background:
            linear-gradient(180deg, rgba(255,255,255,.025), transparent 34%),
            #090c0a !important;
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.035),
            inset 0 -1px 0 rgba(0,0,0,.65) !important;
        }

        .ixi-universal-card-007c .u007-media-shell img {
          object-fit: cover !important;
          object-position: center !important;
        }

        .ixi-universal-card-007c .u007-media-action {
          right: 5px !important;
          bottom: 5px !important;
          height: 18px !important;
          padding: 0 6px !important;
          border-color: rgba(255,196,0,.48) !important;
          background: rgba(7,9,8,.92) !important;
          font-size: 5px !important;
        }

        .ixi-universal-card-007c .u007-details {
          grid-column: 2 !important;
          grid-row: 1 !important;
          width: 100% !important;
          height: 118px !important;
          min-height: 118px !important;
          flex: none !important;
          border-color: #3b423d !important;
          background:
            linear-gradient(180deg, rgba(255,255,255,.018), transparent 44%),
            #101310 !important;
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.025),
            inset 0 -1px 0 rgba(0,0,0,.55) !important;
        }

        .ixi-universal-card-007c .u007-details .u007-section-title {
          height: 22px !important;
          padding: 0 8px !important;
          border-bottom-color: #2b302c !important;
          background:
            linear-gradient(180deg, #191d1a, #131714) !important;
          color: #ffc400 !important;
          font-size: 6px !important;
          letter-spacing: .055em !important;
        }

        .ixi-universal-card-007c .u007-details .u007-section-scroll {
          height: calc(100% - 22px) !important;
          overflow-y: auto !important;
        }

        .ixi-universal-card-007c .u007-detail-row {
          min-height: 23px !important;
          grid-template-columns: minmax(0, 54px) minmax(0, 1fr) !important;
          gap: 5px !important;
          padding: 4px 6px !important;
          border-bottom-color: #242925 !important;
        }

        .ixi-universal-card-007c .u007-detail-row span {
          color: #8d9690 !important;
          font-size: 5px !important;
          letter-spacing: .025em !important;
        }

        .ixi-universal-card-007c .u007-detail-row strong {
          color: #f0f2f0 !important;
          font-size: 7px !important;
          text-align: right !important;
        }

        .ixi-universal-card-007c .u007-relationships {
          grid-column: 1 / -1 !important;
          grid-row: 2 !important;
          width: 100% !important;
          height: auto !important;
          min-height: 0 !important;
          flex: none !important;
          border-color: #343a35 !important;
          background:
            linear-gradient(180deg, rgba(255,255,255,.012), transparent 36%),
            #0f120f !important;
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.025),
            inset 0 -1px 0 rgba(0,0,0,.58) !important;
        }

        .ixi-universal-card-007c .u007-relationships .u007-section-title {
          height: 21px !important;
          padding: 0 8px !important;
          background: linear-gradient(180deg, #171b18, #121512) !important;
          letter-spacing: .06em !important;
        }

        .ixi-universal-card-007c .u007-relationships .u007-section-scroll {
          height: calc(100% - 21px) !important;
        }

        .ixi-universal-card-007c .u007-relationship-row {
          min-height: 29px !important;
          padding-left: 9px !important;
        }

        .ixi-universal-card-007c .u007-relationship-row strong {
          font-size: 7.5px !important;
        }

        /* Keep the standard 007A command strip, child deck and IXI rail intact. */
        .ixi-universal-card-007c .u007-commands {
          background:
            linear-gradient(180deg, #141814, #0d100e) !important;
          border-color: #343a35 !important;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.025) !important;
        }

        .ixi-universal-card-007c .u007-commands button:hover {
          background: rgba(255,196,0,.045) !important;
          color: #ffc400 !important;
        }

        .ixi-universal-card-007c .u007-child-rail {
          border-top-color: #303632 !important;
          background:
            linear-gradient(180deg, #0d100e, #080a09) !important;
        }
      `}</style>
    </div>
  );
}

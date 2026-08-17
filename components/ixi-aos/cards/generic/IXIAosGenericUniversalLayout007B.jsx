import IXIAosGenericUniversalLayout007 from "./IXIAosGenericUniversalLayout007";

/*
 * Card 007B
 *
 * Same noun-agnostic universal AOS object contract and V12 presentation as 007A,
 * but without the bottom child/photo thumbnail rail. The reclaimed vertical space
 * stays with the object body while RECALL / BOARD / RETURN and IXIObjectRail remain.
 */
export default function IXIAosGenericUniversalLayout007B(props) {
  return (
    <div className="ixi-universal-card-007b" data-card-number="007B">
      <IXIAosGenericUniversalLayout007 {...props} />

      <style jsx global>{`
        .ixi-universal-card-007b {
          position: relative;
          width: 298px;
          height: 471px;
        }

        .ixi-universal-card-007b > .ixi-universal-card-007 {
          width: 298px;
          height: 471px;
        }

        .ixi-universal-card-007b .u007-child-rail {
          display: none !important;
        }

        .ixi-universal-card-007b .u007-body {
          bottom: 50px !important;
        }

        .ixi-universal-card-007b .u007-commands {
          bottom: 23px !important;
        }
      `}</style>
    </div>
  );
}

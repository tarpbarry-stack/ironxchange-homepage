import IXIAosGenericObjectLayout007 from "../generic/IXIAosGenericObjectLayout007";
import IXIAosGenericCardRailShell from "../generic/IXIAosGenericCardRailShell";
import IXIAosDataContractCardAdapter from "../../card-runtime/IXIAosDataContractCardAdapter";

function clean(value) {
  return String(value ?? "").trim();
}

function getParentDisplayName(object = {}, explicitParentLabel = "") {
  return clean(
    explicitParentLabel ||
    object?.parentDisplayName ||
    object?.parent?.displayName ||
    object?.parent?.name ||
    object?.parent?.label ||
    object?.metadata?.parentDisplayName
  );
}

/*
 * Card 008 — profile / identity presentation recipe.
 * The renderer remains noun-agnostic; sample content never defines runtime meaning.
 *
 * Parent identity is real runtime data only. FaceLab/card-stock copy never becomes
 * the parent name. The line is reserved even when preview data has no parent yet.
 */
export default function IXIAosCard008Profile(props) {
  return (
    <IXIAosDataContractCardAdapter {...props}>
      {contractProps => {
        const parentDisplayName = getParentDisplayName(
          contractProps.object,
          contractProps.parentLabel
        );

        return (
          <IXIAosGenericCardRailShell object={contractProps.object} {...contractProps} face={1}>
            <div className="aos-card-008-parent-shell">
              <div
                className="aos-card-008-parent-line"
                aria-label="Parent"
                title={parentDisplayName || undefined}
              >
                {parentDisplayName || "\u00a0"}
              </div>

              <IXIAosGenericObjectLayout007 {...contractProps} />

              <style jsx global>{`
                .aos-card-008-parent-shell {
                  position: relative;
                  width: 298px;
                  height: 471px;
                }

                .aos-card-008-parent-line {
                  position: absolute;
                  top: 4px;
                  left: 10px;
                  z-index: 82;
                  max-width: 142px;
                  overflow: hidden;
                  color: rgba(255,255,255,.38);
                  font-size: 5.5px;
                  font-weight: 900;
                  line-height: 1;
                  letter-spacing: .52px;
                  text-overflow: ellipsis;
                  text-transform: uppercase;
                  white-space: nowrap;
                  pointer-events: none;
                }

                .aos-card-008-parent-shell .go007-header-copy {
                  padding-top: 7px;
                }
              `}</style>
            </div>
          </IXIAosGenericCardRailShell>
        );
      }}
    </IXIAosDataContractCardAdapter>
  );
}

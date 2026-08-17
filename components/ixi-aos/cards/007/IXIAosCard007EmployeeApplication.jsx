import { useState } from "react";

import IXIAosGenericUniversalLayout007 from "../generic/IXIAosGenericUniversalLayout007";
import IXIAosGenericUniversalLayout007B from "../generic/IXIAosGenericUniversalLayout007B";
import IXIAosDataContractCardAdapter from "../../card-runtime/IXIAosDataContractCardAdapter";

/*
 * Compatibility export for existing Face Lab/runtime imports.
 * Card 007 is the universal AOS card. The legacy filename carries no business meaning.
 *
 * Face Lab preview objects expose 007A / 007B so both geometries can be compared
 * without changing the production/runtime default, which remains 007A.
 */
export default function IXIAosCard007EmployeeApplication(props) {
  const [faceLabVariant, setFaceLabVariant] = useState("007A");

  const isFaceLabPreview =
    props?.object?.metadata?.source === "aos-card-catalog-preview" ||
    String(props?.object?.objectId || "").startsWith("preview-universal-007");

  return (
    <IXIAosDataContractCardAdapter {...props} minimumCustomFields={8}>
      {contractProps => {
        const CardLayout =
          isFaceLabPreview && faceLabVariant === "007B"
            ? IXIAosGenericUniversalLayout007B
            : IXIAosGenericUniversalLayout007;

        return (
          <div className="u007-face-lab-variant-shell">
            {isFaceLabPreview ? (
              <div className="u007-face-lab-variant-picker">
                <button
                  type="button"
                  className={faceLabVariant === "007A" ? "active" : ""}
                  onClick={() => setFaceLabVariant("007A")}
                >
                  007A
                </button>

                <button
                  type="button"
                  className={faceLabVariant === "007B" ? "active" : ""}
                  onClick={() => setFaceLabVariant("007B")}
                >
                  007B
                </button>
              </div>
            ) : null}

            <CardLayout {...contractProps} />

            <style jsx>{`
              .u007-face-lab-variant-shell {
                position: relative;
                width: 298px;
                height: 471px;
              }

              .u007-face-lab-variant-picker {
                position: absolute;
                left: 50%;
                top: -31px;
                z-index: 500;

                display: flex;
                gap: 4px;

                transform: translateX(-50%);
              }

              .u007-face-lab-variant-picker button {
                height: 23px;
                min-width: 49px;

                padding: 0 8px;

                border: 1px solid rgba(255,255,255,.10);
                border-radius: 4px;

                background: #111411;
                color: rgba(255,255,255,.46);

                font-size: 7px;
                font-weight: 950;
                letter-spacing: .05em;

                cursor: pointer;
              }

              .u007-face-lab-variant-picker button.active {
                border-color: rgba(255,196,0,.55);
                background: rgba(255,196,0,.10);
                color: #ffc400;
              }
            `}</style>
          </div>
        );
      }}
    </IXIAosDataContractCardAdapter>
  );
}

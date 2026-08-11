import {
  useState
} from "react";

import IXIAosCardRenderer
  from "../../components/ixi-aos/card-runtime/IXIAosCardRenderer";

import IXISystemIndexCardTemplate
  from "../../components/ixi-aos/card-templates/IXISystemIndexCardTemplate";


/*
 * IXI AOS V2 — CARD RUNTIME PROOF
 *
 * This page deliberately uses:
 *
 * - NO old AOS page
 * - NO ListingCard
 * - NO IXIMosObjectCard
 * - NO old IXISystemIndexCard
 * - NO Sharetribe
 * - NO old Equipment workspace helper
 *
 * OBJECT
 * +
 * CARD TEMPLATE
 * +
 * CARD RUNTIME
 * =
 * CARD
 */


const EQUIPMENT_OBJECT = {
  objectId:
    "proof:equipment",

  displayName:
    "EQUIPMENT",

  fields: {},

  metadata: {
    proof:
      true
  }
};


const CHILD_OBJECT = {
  objectId:
    "proof:child-1",

  displayName:
    "TEST OBJECT",

  directContainerId:
    "proof:equipment",

  fields: {
    ID:
      "ABC-001",

    OWNER:
      "TEST USER"
  },

  metadata: {
    proof:
      true
  }
};

export default function IXIAosV2CardProofPage() {

  const [
    ixiCardState,
    setIxiCardState
  ] =
    useState({
      "proof:equipment": {
        color:
          "none",

        outline:
          1,

        face:
          1,

        actionNotice:
          null
      }
    });


  function updateIxiCardState(
    objectId,
    patch
  ) {

    const id =
      String(
        objectId || ""
      );


    if (!id) {
      return;
    }


    setIxiCardState(
      current => ({
        ...current,

        [id]: {
          ...(
            current?.[id] ||
            {}
          ),

          ...(
            patch ||
            {}
          )
        }
      })
    );
  }


  function showNotice(
    message
  ) {

    const notice = {
      message:
        String(
          message || ""
        ).toUpperCase(),

      tone:
        "success",

      createdAt:
        Date.now()
    };


    updateIxiCardState(
      EQUIPMENT_OBJECT.objectId,
      {
        actionNotice:
          notice
      }
    );


    window.setTimeout(
      () => {

        setIxiCardState(
          current => {

            const existing =
              current?.[
                EQUIPMENT_OBJECT
                  .objectId
              ]?.actionNotice;


            if (
              existing
                ?.createdAt !==
              notice.createdAt
            ) {
              return current;
            }


            return {
              ...current,

              [
                EQUIPMENT_OBJECT
                  .objectId
              ]: {
                ...(
                  current?.[
                    EQUIPMENT_OBJECT
                      .objectId
                  ] ||
                  {}
                ),

                actionNotice:
                  null
              }
            };
          }
        );

      },
      1600
    );
  }


  return (
    <main className="aos-v2-proof">

      <header className="proof-header">

        <span>
          IXI AOS V2
        </span>

        <strong>
          CARD RUNTIME PROOF
        </strong>

        <small>
          OBJECT → CARD DEFINITION → FACE → CAPABILITIES
        </small>

      </header>


      <section className="proof-board">

        <IXIAosCardRenderer

          object={
            EQUIPMENT_OBJECT
          }

          template={
            IXISystemIndexCardTemplate
          }

           objects={[
    EQUIPMENT_OBJECT,
    CHILD_OBJECT
  ]}

          parentLabel={
            "SYSTEM INDEX"
          }

          ixiState={
            ixiCardState[
              EQUIPMENT_OBJECT
                .objectId
            ]
          }

          onIxiStateChange={
            updateIxiCardState
          }


          /*
           * This first proof has no
           * real Board yet.
           *
           * We prove the Card Runtime
           * before wiring Chassis.
           */

          onSendFront={
            () =>
              showNotice(
                "SEND FRONT"
              )
          }

          onSendBack={
            () =>
              showNotice(
                "SEND BACK"
              )
          }

          onSendToArmedDestination={
            () =>
              showNotice(
                "SEND TO DESTINATION"
              )
          }


          onAddObject={
            () =>
              showNotice(
                "ADD OBJECT"
              )
          }

          onBoard={
            () =>
              showNotice(
                "BOARD"
              )
          }

          onRecall={
            () =>
              showNotice(
                "RECALL"
              )
          }

          onExposeObject={
            () =>
              showNotice(
                "OUT"
              )
          }

          onOpenConsole={
            () =>
              showNotice(
                "CONSOLE"
              )
          }

        />

      </section>


      <section className="proof-doctrine">

        <strong>
          THIS PAGE PROVES
        </strong>

        <span>
          EQUIPMENT IS AN OBJECT.
        </span>

        <span>
          SYSTEM INDEX IS A CARD TEMPLATE.
        </span>

        <span>
          CONTAINER IS A CAPABILITY.
        </span>

        <span>
          THE CARD RUNTIME DOES NOT KNOW WHAT EQUIPMENT MEANS.
        </span>

      </section>


      <style jsx>{`

        .aos-v2-proof {
          width: 100vw;
          min-height: 100vh;

          padding:
            34px 40px 100px;

          background:
            radial-gradient(
              circle at 50% 0%,
              rgba(
                0,
                194,
                255,
                .035
              ),
              transparent 34%
            ),
            #090909;

          color: white;
        }


        .proof-header {
          width: 100%;
          max-width: 1200px;

          margin:
            0 auto 34px;

          display: flex;
          flex-direction: column;

          gap: 5px;
        }


        .proof-header span {
          color: #ffc400;

          font-size: 8px;
          font-weight: 950;

          letter-spacing:
            .12em;
        }


        .proof-header strong {
          color:
            rgba(
              255,
              255,
              255,
              .88
            );

          font-size: 22px;
          font-weight: 950;

          letter-spacing:
            .02em;
        }


        .proof-header small {
          color:
            rgba(
              255,
              255,
              255,
              .28
            );

          font-size: 8px;
          font-weight: 900;

          letter-spacing:
            .05em;
        }


        .proof-board {
          width: 100%;
          max-width: 1200px;

          min-height: 560px;

          margin: 0 auto;

          padding: 34px;

          display: flex;

          align-items:
            flex-start;

          justify-content:
            flex-start;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .045
            );

          border-radius: 12px;

          background:
            rgba(
              255,
              255,
              255,
              .008
            );
        }


        .proof-doctrine {
          width: 100%;
          max-width: 1200px;

          margin:
            22px auto 0;

          padding: 14px 16px;

          display: flex;
          flex-wrap: wrap;

          gap:
            8px 18px;

          border-top:
            1px solid
            rgba(
              255,
              255,
              255,
              .04
            );
        }


        .proof-doctrine strong {
          width: 100%;

          color:
            rgba(
              255,
              196,
              0,
              .62
            );

          font-size: 7px;
          font-weight: 950;
        }


        .proof-doctrine span {
          color:
            rgba(
              255,
              255,
              255,
              .25
            );

          font-size: 6px;
          font-weight: 900;
        }

      `}</style>

    </main>
  );
}

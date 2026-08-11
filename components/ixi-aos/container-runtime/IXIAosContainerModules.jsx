import {
  useMemo
} from "react";

import {
  buildIXIContainerRuntimeModel,
  getNextIXIContainerDeckIndex,
  getPreviousIXIContainerDeckIndex
} from "./IXIContainerCapabilityEngine";


/*
 * IXI AOS CONTAINER MODULES
 *
 * These are FACE MODULES.
 *
 * They are NOT Cards.
 *
 * They can be placed into any Card
 * Definition whose capabilities allow
 * containment.
 *
 * This file never decides what Card
 * a child Object should use.
 *
 * Child presentation is always supplied
 * by renderCard().
 */


/* =========================================================
   HELPERS
   ========================================================= */

function clean(
  value
) {
  return String(
    value || ""
  ).trim();
}


function formatMoney(
  value
) {
  const number =
    Number(
      value || 0
    );

  if (
    !Number.isFinite(
      number
    )
  ) {
    return "$0";
  }

  return new Intl.NumberFormat(
    "en-US",
    {
      style:
        "currency",

      currency:
        "USD",

      maximumFractionDigits:
        0
    }
  ).format(
    number
  );
}


/* =========================================================
   CONTAINER IDENTITY
   ========================================================= */

export function IXIAosContainerIdentityModule({
  object,
  parentLabel = ""
}) {
  const name =
    clean(
      object?.displayName ||
      object?.name ||
      object?.title ||
      ""
    ) ||
    "UNTITLED OBJECT";

  return (
    <div className="ixi-container-identity">

      <span className="ixi-container-path">
        {clean(
          parentLabel
        ) || "SYSTEM INDEX"}
      </span>

      <strong>
        {name}
      </strong>

      <style jsx>{`
        .ixi-container-identity {
          width: 100%;
          min-height: 31px;

          display: flex;
          flex-direction: column;
          justify-content: center;

          padding-bottom: 6px;

          border-bottom:
            1px solid
            rgba(
              255,
              255,
              255,
              .045
            );
        }

        .ixi-container-path {
          color: #ffc400;

          font-size: 6px;
          font-weight: 950;

          letter-spacing: .08em;

          line-height: 1;

          text-transform: uppercase;

          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        strong {
          margin-top: 5px;

          color:
            rgba(
              255,
              255,
              255,
              .84
            );

          font-size: 13px;
          font-weight: 950;

          line-height: 1;

          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      `}</style>

    </div>
  );
}


/* =========================================================
   COLLECTION PREVIEW
   ========================================================= */

/*
 * IMPORTANT:
 *
 * This module DOES NOT know how to render
 * a Location Card, Machine Card, Job Card,
 * Auction Card, etc.
 *
 * It receives renderCard().
 *
 * Therefore:
 *
 * Wichita Falls stays Wichita Falls.
 * A machine stays its machine Card.
 * A Job stays its Job Card.
 */
export function IXIAosContainerCollectionPreview({
  container,
  objects = [],

  selectedIndex = 0,

  onSelectedIndexChange = null,

  renderCard = null,

  onExposeObject = null
}) {

  const model =
    useMemo(
      () =>
        buildIXIContainerRuntimeModel({
          container,
          objects,
          selectedIndex
        }),
      [
        container,
        objects,
        selectedIndex
      ]
    );


  const selectedObject =
    model?.deck
      ?.selectedObject ||
    null;


  const itemCount =
    model?.deck
      ?.itemCount ||
    0;


  function previous() {
    const nextIndex =
      getPreviousIXIContainerDeckIndex({
        selectedIndex:
          model.deck
            .selectedIndex,

        itemCount
      });

    onSelectedIndexChange?.(
      nextIndex
    );
  }


  function next() {
    const nextIndex =
      getNextIXIContainerDeckIndex({
        selectedIndex:
          model.deck
            .selectedIndex,

        itemCount
      });

    onSelectedIndexChange?.(
      nextIndex
    );
  }


  if (
    !selectedObject
  ) {
    return (
      <div className="ixi-container-preview-empty">

        <strong>
          EMPTY
        </strong>

        <span>
          NO OBJECTS
        </span>

        <style jsx>{`
          .ixi-container-preview-empty {
            width: 100%;
            height: 220px;

            display: flex;
            flex-direction: column;

            align-items: center;
            justify-content: center;

            gap: 6px;

            border:
              1px dashed
              rgba(
                255,
                255,
                255,
                .055
              );

            border-radius: 7px;

            background:
              rgba(
                255,
                255,
                255,
                .01
              );
          }

          strong {
            color:
              rgba(
                255,
                196,
                0,
                .42
              );

            font-size: 11px;
            font-weight: 950;

            letter-spacing: .05em;
          }

          span {
            color:
              rgba(
                255,
                255,
                255,
                .18
              );

            font-size: 6px;
            font-weight: 900;
          }
        `}</style>

      </div>
    );
  }


  return (
    <div className="ixi-container-preview">

      <div className="ixi-container-preview-stage">

        {typeof renderCard ===
        "function" ? (

          renderCard({
            object:
              selectedObject,

            parent:
              container,

            context:
              "container-preview"
          })

        ) : (

          <div className="ixi-container-no-renderer">
            CARD RENDERER REQUIRED
          </div>

        )}

      </div>


      <div className="ixi-container-preview-controls">

        <button
          type="button"

          onPointerDown={
            event =>
              event
                .stopPropagation()
          }

          onClick={
            event => {
              event.preventDefault();
              event.stopPropagation();

              previous();
            }
          }
        >
          ‹
        </button>


        <span>
          {
            model.deck
              .selectedIndex +
            1
          }
          /
          {itemCount}
        </span>


        <button
          type="button"

          onPointerDown={
            event =>
              event
                .stopPropagation()
          }

          onClick={
            event => {
              event.preventDefault();
              event.stopPropagation();

              next();
            }
          }
        >
          ›
        </button>


        <button
          type="button"

          className="ixi-container-out"

          onPointerDown={
            event =>
              event
                .stopPropagation()
          }

          onClick={
            event => {
              event.preventDefault();
              event.stopPropagation();

              onExposeObject?.(
                selectedObject
              );
            }
          }
        >
          OUT
        </button>

      </div>


      <style jsx>{`

        .ixi-container-preview {
          width: 100%;
        }


        .ixi-container-preview-stage {
          position: relative;

          width: 100%;
          height: 220px;

          overflow: hidden;

          display: flex;

          align-items: flex-start;
          justify-content: center;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .05
            );

          border-radius: 7px;

          background: #080808;
        }


        /*
         * The contained Card is a REAL Card.
         *
         * We scale the visual preview only.
         * We do not replace the Card.
         */
        .ixi-container-preview-stage
        :global(.card) {
          flex: none;

          transform:
            scale(.69);

          transform-origin:
            top center;
        }


        .ixi-container-preview-controls {
          height: 24px;

          margin-top: 5px;

          display: grid;

          grid-template-columns:
            28px
            1fr
            28px
            45px;

          gap: 4px;
        }


        .ixi-container-preview-controls button {
          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .055
            );

          border-radius: 4px;

          background:
            rgba(
              255,
              255,
              255,
              .018
            );

          color:
            rgba(
              255,
              255,
              255,
              .36
            );

          font-size: 8px;
          font-weight: 950;

          cursor: pointer;
        }


        .ixi-container-preview-controls button:hover {
          border-color:
            rgba(
              0,
              194,
              255,
              .28
            );

          color:
            rgba(
              0,
              194,
              255,
              .78
            );
        }


        .ixi-container-preview-controls span {
          display: flex;

          align-items: center;
          justify-content: center;

          color:
            rgba(
              255,
              255,
              255,
              .22
            );

          font-size: 6px;
          font-weight: 950;
        }


        .ixi-container-out {
          color:
            rgba(
              255,
              196,
              0,
              .54
            ) !important;
        }


        .ixi-container-no-renderer {
          width: 100%;
          height: 100%;

          display: flex;

          align-items: center;
          justify-content: center;

          color:
            rgba(
              229,
              62,
              62,
              .72
            );

          font-size: 7px;
          font-weight: 950;
        }

      `}</style>

    </div>
  );
}


/* =========================================================
   CONTAINER SUMMARY
   ========================================================= */

export function IXIAosContainerSummary({
  container,
  objects = []
}) {

  const model =
    useMemo(
      () =>
        buildIXIContainerRuntimeModel({
          container,
          objects
        }),
      [
        container,
        objects
      ]
    );


  return (
    <div className="ixi-container-summary">

      <div>
        <span>
          OBJECTS
        </span>

        <strong>
          {model.directCount}
        </strong>
      </div>


      <div>
        <span>
          VALUE
        </span>

        <strong>
          {formatMoney(
            model.directValue
          )}
        </strong>
      </div>


      <div>
        <span>
          TOTAL
        </span>

        <strong>
          {model.descendantCount}
        </strong>
      </div>


      <style jsx>{`

        .ixi-container-summary {
          height: 39px;

          display: grid;

          grid-template-columns:
            1fr 1.25fr 1fr;

          gap: 4px;
        }


        .ixi-container-summary > div {
          min-width: 0;

          display: flex;

          flex-direction: column;

          align-items: center;
          justify-content: center;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .045
            );

          border-radius: 4px;

          background:
            rgba(
              255,
              255,
              255,
              .012
            );
        }


        span {
          color:
            rgba(
              255,
              255,
              255,
              .22
            );

          font-size: 5.5px;
          font-weight: 950;

          letter-spacing: .04em;
        }


        strong {
          margin-top: 3px;

          max-width: 100%;

          overflow: hidden;

          color:
            rgba(
              255,
              255,
              255,
              .64
            );

          font-size: 8px;
          font-weight: 950;

          text-overflow: ellipsis;
          white-space: nowrap;
        }

      `}</style>

    </div>
  );
}


/* =========================================================
   CONTAINER ACTIONS
   ========================================================= */

export function IXIAosContainerActions({
  container,

  onAddObject = null,

  onBoard = null,

  onRecall = null
}) {

  return (
    <div className="ixi-container-actions">

      <button
        type="button"

        className="ixi-container-add"

        onPointerDown={
          event =>
            event
              .stopPropagation()
        }

        onClick={
          event => {
            event.preventDefault();
            event.stopPropagation();

            onAddObject?.(
              container
            );
          }
        }
      >
        +
      </button>


      <button
        type="button"

        onPointerDown={
          event =>
            event
              .stopPropagation()
        }

        onClick={
          event => {
            event.preventDefault();
            event.stopPropagation();

            onBoard?.(
              container
            );
          }
        }
      >
        BOARD
      </button>


      <button
        type="button"

        onPointerDown={
          event =>
            event
              .stopPropagation()
        }

        onClick={
          event => {
            event.preventDefault();
            event.stopPropagation();

            onRecall?.(
              container
            );
          }
        }
      >
        RECALL
      </button>


      <style jsx>{`

        .ixi-container-actions {
          height: 29px;

          display: grid;

          grid-template-columns:
            34px
            1fr
            1fr;

          gap: 4px;
        }


        button {
          min-width: 0;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .055
            );

          border-radius: 4px;

          background:
            rgba(
              255,
              255,
              255,
              .018
            );

          color:
            rgba(
              255,
              255,
              255,
              .38
            );

          font-size: 6px;
          font-weight: 950;

          letter-spacing: .04em;

          cursor: pointer;
        }


        button:hover {
          border-color:
            rgba(
              0,
              194,
              255,
              .30
            );

          color:
            rgba(
              0,
              194,
              255,
              .82
            );
        }


        .ixi-container-add {
          color: #ffc400;

          font-size: 15px;
          line-height: 1;
        }

      `}</style>

    </div>
  );
}


/* =========================================================
   RELATIONSHIPS FACE PLACEHOLDER
   ========================================================= */

export function IXIAosRelationshipSummaryModule({
  object
}) {

  const relationships =
    Array.isArray(
      object?.relationships
    )
      ? object.relationships
      : [];


  return (
    <div className="ixi-relationship-summary">

      <strong>
        RELATIONSHIPS
      </strong>

      <span>
        {relationships.length}
      </span>


      <style jsx>{`
        .ixi-relationship-summary {
          width: 100%;
          height: 100%;

          display: flex;

          flex-direction: column;

          align-items: center;
          justify-content: center;

          gap: 6px;
        }

        strong {
          color:
            rgba(
              255,
              196,
              0,
              .55
            );

          font-size: 8px;
          font-weight: 950;
        }

        span {
          color:
            rgba(
              255,
              255,
              255,
              .34
            );

          font-size: 18px;
          font-weight: 950;
        }
      `}</style>

    </div>
  );
}


/* =========================================================
   HISTORY FACE PLACEHOLDER
   ========================================================= */

export function IXIAosObjectHistoryModule({
  object
}) {

  const history =
    Array.isArray(
      object?.history
    )
      ? object.history
      : [];


  return (
    <div className="ixi-object-history">

      <strong>
        HISTORY
      </strong>

      <span>
        {history.length}
      </span>


      <style jsx>{`
        .ixi-object-history {
          width: 100%;
          height: 100%;

          display: flex;

          flex-direction: column;

          align-items: center;
          justify-content: center;

          gap: 6px;
        }

        strong {
          color:
            rgba(
              255,
              196,
              0,
              .55
            );

          font-size: 8px;
          font-weight: 950;
        }

        span {
          color:
            rgba(
              255,
              255,
              255,
              .34
            );

          font-size: 18px;
          font-weight: 950;
        }
      `}</style>

    </div>
  );
}


/* =========================================================
   MODULE DISPATCHER
   ========================================================= */

/*
 * This is NOT a Card dispatcher.
 *
 * It only renders modules requested
 * by a Card Definition.
 */
export function renderIXIAosContainerModule({
  moduleType,

  object,
  parentLabel = "",

  objects = [],

  selectedIndex = 0,

  onSelectedIndexChange = null,

  renderCard = null,

  onAddObject = null,

  onBoard = null,

  onRecall = null,

  onExposeObject = null
}) {

  const type =
    clean(
      moduleType
    ).toLowerCase();


  switch (
    type
  ) {

    case "system-index-identity":
      return (
        <IXIAosContainerIdentityModule
          object={
            object
          }

          parentLabel={
            parentLabel
          }
        />
      );


    case "container-collection-preview":
      return (
        <IXIAosContainerCollectionPreview
          container={
            object
          }

          objects={
            objects
          }

          selectedIndex={
            selectedIndex
          }

          onSelectedIndexChange={
            onSelectedIndexChange
          }

          renderCard={
            renderCard
          }

          onExposeObject={
            onExposeObject
          }
        />
      );


    case "container-summary":
      return (
        <IXIAosContainerSummary
          container={
            object
          }

          objects={
            objects
          }
        />
      );


    case "container-actions":
      return (
        <IXIAosContainerActions
          container={
            object
          }

          onAddObject={
            onAddObject
          }

          onBoard={
            onBoard
          }

          onRecall={
            onRecall
          }
        />
      );


    case "relationship-summary":
      return (
        <IXIAosRelationshipSummaryModule
          object={
            object
          }
        />
      );


    case "object-history":
      return (
        <IXIAosObjectHistoryModule
          object={
            object
          }
        />
      );


    default:
      return null;
  }
}


export default renderIXIAosContainerModule;

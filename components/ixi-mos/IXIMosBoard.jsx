import IXIMosObjectCard from "./IXIMosObjectCard";

function getObjectId(object = {}) {
  return String(
    object.objectId ||
    object.id ||
    ""
  );
}

export default function IXIMosBoard({
  objects = [],
  projections = {},
  onOpenObject = null,
  onAddMedia = null,
  onCreateWorkOrder = null,
  onAddExpense = null,
  onOpenQr = null
}) {
  const safeObjects =
    Array.isArray(objects)
      ? objects.filter(object =>
          Boolean(getObjectId(object))
        )
      : [];

  if (!safeObjects.length) {
    return (
      <section className="mos-empty-board">
        <strong>NO OBJECTS</strong>

        <span>
          Create a Job, Yard, Tool, Vehicle,
          Person, Machine, or other Object.
        </span>

        <style jsx>{`
          .mos-empty-board {
            width: min(100%, 620px);
            min-height: 220px;

            margin: 34px auto;
            padding: 32px;

            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 10px;

            text-align: center;

            border:
              1px dashed rgba(255,255,255,.10);
            border-radius: 12px;

            background:
              linear-gradient(
                180deg,
                rgba(255,255,255,.018),
                rgba(255,255,255,0)
              ),
              #0f0f0f;
          }

          strong {
            color: rgba(255,255,255,.62);
            font-size: 14px;
            font-weight: 950;
            letter-spacing: .7px;
          }

          span {
            max-width: 430px;

            color: rgba(255,255,255,.34);
            font-size: 11px;
            font-weight: 700;
            line-height: 1.45;
          }
        `}</style>
      </section>
    );
  }

  return (
    <section className="mos-board">
      {safeObjects.map(object => {
        const objectId =
          getObjectId(object);

        return (
          <IXIMosObjectCard
            key={objectId}
            object={object}
            projection={
              projections?.[objectId] ||
              null
            }
            onOpen={onOpenObject}
            onAddMedia={onAddMedia}
            onCreateWorkOrder={
              onCreateWorkOrder
            }
            onAddExpense={onAddExpense}
            onScanQr={onOpenQr}
          />
        );
      })}

      <style jsx>{`
        .mos-board {
          width: 100%;
          max-width: 1920px;
          min-height: 300px;

          margin: 0 auto;
          padding: 20px 0 100px;

          display: grid;

          grid-template-columns:
            repeat(
              auto-fill,
              minmax(300px, 300px)
            );

          justify-content: center;
          align-items: start;

          column-gap: 26px;
          row-gap: 34px;
        }

        @media (max-width: 850px) {
          .mos-board {
            grid-template-columns: 300px;
            padding-bottom: 50px;
          }
        }
      `}</style>
    </section>
  );
}

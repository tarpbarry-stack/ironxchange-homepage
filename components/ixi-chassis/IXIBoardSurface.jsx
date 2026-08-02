import {
  getIXIScalePreset
} from "../../lib/ixiObjectGeometry";

export default function IXIBoardSurface({
  scaleMode = "xl",

  columnGap,
  rowGap,

  className = "",

  children
}) {
  const preset =
    getIXIScalePreset(
      scaleMode
    );

  const resolvedColumnGap =
    Number.isFinite(
      Number(columnGap)
    )
      ? Number(columnGap)
      : preset.gap;

  const resolvedRowGap =
    Number.isFinite(
      Number(rowGap)
    )
      ? Number(rowGap)
      : preset.gap;

  return (
    <section
      className={[
        "ixi-board-surface",
        className
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        "--ixi-board-column-gap":
          `${resolvedColumnGap}px`,

        "--ixi-board-row-gap":
          `${resolvedRowGap}px`
      }}
      data-ixi-scale-mode={
        scaleMode
      }
    >
      {children}

      <style jsx>{`
        .ixi-board-surface {
          width: 100%;
          min-width: 0;

          display: flex;
          flex-flow: row wrap;

          align-items: flex-start;
          align-content: flex-start;
          justify-content: flex-start;

          column-gap:
            var(
              --ixi-board-column-gap
            );

          row-gap:
            var(
              --ixi-board-row-gap
            );
        }

        .ixi-board-surface
        :global(
          .ixi-board-sortable-card
        ) {
          position: relative;

          flex: 0 0 auto;

          width: max-content;
          max-width: none;
          min-width: 0;

          height: max-content;
          min-height: 0;

          justify-self: auto;
          align-self: flex-start;
        }
      `}</style>
    </section>
  );
}

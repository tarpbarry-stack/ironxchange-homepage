export default function IXIFaceGrid({
  children,

  columns = 2,
  gap = "md",

  align = "stretch",

  className = ""
}) {
  const safeColumns =
    Math.max(
      1,
      Math.min(
        Number(columns) || 1,
        6
      )
    );

  return (
    <div
      className={[
        "ixi-face-grid",
        `ixi-face-grid-gap-${gap}`,
        `ixi-face-grid-align-${align}`,
        className
      ]
        .filter(Boolean)
        .join(" ")}

      style={{
        gridTemplateColumns:
          `repeat(${safeColumns}, minmax(0, 1fr))`
      }}
    >
      {children}

      <style jsx>{`
        .ixi-face-grid,
        .ixi-face-grid * {
          box-sizing: border-box;
        }

        .ixi-face-grid {
          width: 100%;
          min-width: 0;

          display: grid;
        }

        .ixi-face-grid-gap-none {
          gap: 0;
        }

        .ixi-face-grid-gap-xs {
          gap:
            var(
              --ixi-face-gap-xs,
              3px
            );
        }

        .ixi-face-grid-gap-sm {
          gap:
            var(
              --ixi-face-gap-sm,
              6px
            );
        }

        .ixi-face-grid-gap-md {
          gap:
            var(
              --ixi-face-gap-md,
              10px
            );
        }

        .ixi-face-grid-gap-lg {
          gap:
            var(
              --ixi-face-gap-lg,
              14px
            );
        }

        .ixi-face-grid-align-start {
          align-items: start;
        }

        .ixi-face-grid-align-center {
          align-items: center;
        }

        .ixi-face-grid-align-end {
          align-items: end;
        }

        .ixi-face-grid-align-stretch {
          align-items: stretch;
        }

        .ixi-face-grid > :global(*) {
          min-width: 0;
        }
      `}</style>
    </div>
  );
}

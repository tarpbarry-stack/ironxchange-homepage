export default function IXIAosFaceGrid({
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
        Number(
          columns
        ) || 1,
        6
      )
    );


  return (
    <div
      className={[
        "ixi-aos-face-grid",

        `gap-${gap}`,

        `align-${align}`,

        className
      ]
        .filter(Boolean)
        .join(" ")}

      style={{
        gridTemplateColumns:
          `repeat(
            ${safeColumns},
            minmax(0, 1fr)
          )`
      }}
    >

      {children}


      <style jsx>{`

        .ixi-aos-face-grid,
        .ixi-aos-face-grid * {
          box-sizing:
            border-box;
        }


        .ixi-aos-face-grid {
          width:
            100%;

          min-width:
            0;

          display:
            grid;
        }


        .gap-none {
          gap:
            0;
        }


        .gap-xs {
          gap:
            var(
              --ixi-face-gap-xs,
              3px
            );
        }


        .gap-sm {
          gap:
            var(
              --ixi-face-gap-sm,
              6px
            );
        }


        .gap-md {
          gap:
            var(
              --ixi-face-gap-md,
              9px
            );
        }


        .gap-lg {
          gap:
            var(
              --ixi-face-gap-lg,
              12px
            );
        }


        .align-start {
          align-items:
            start;
        }


        .align-center {
          align-items:
            center;
        }


        .align-end {
          align-items:
            end;
        }


        .align-stretch {
          align-items:
            stretch;
        }


        .ixi-aos-face-grid
          > :global(*) {

          min-width:
            0;
        }

      `}</style>

    </div>
  );
}

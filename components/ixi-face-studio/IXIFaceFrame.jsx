export default function IXIFaceFrame({
  children,

  footer = null,

  size = "tall",

  className = "",

  contentClassName = "",

  footerClassName = ""
}) {
  const isCompact =
    size === "compact";

  return (
    <section
      className={[
        "ixi-face-frame",

        isCompact
          ? "ixi-face-frame-compact"
          : "ixi-face-frame-tall",

        className
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        className={[
          "ixi-face-frame-content",

          contentClassName
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {children}
      </div>

      {footer ? (
        <div
          className={[
            "ixi-face-frame-footer",

            footerClassName
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {footer}
        </div>
      ) : null}

      <style jsx>{`
        .ixi-face-frame,
        .ixi-face-frame * {
          box-sizing: border-box;
        }

        .ixi-face-frame {
          /*
           * Shared IXI face typography.
           *
           * Individual faces may use these variables,
           * but should not invent arbitrary micro-fonts.
           */
          --ixi-face-font-display: 18px;
          --ixi-face-font-title: 13px;
          --ixi-face-font-section: 9px;
          --ixi-face-font-label: 7px;
          --ixi-face-font-value: 9px;
          --ixi-face-font-micro: 6.5px;

          --ixi-face-gap-xs: 3px;
          --ixi-face-gap-sm: 6px;
          --ixi-face-gap-md: 10px;
          --ixi-face-gap-lg: 14px;

          --ixi-face-pad-x: 12px;
          --ixi-face-pad-top: 9px;

          --ixi-face-footer-height: 44px;

          position: relative;

          width: 100%;
          min-width: 0;
          max-width: 100%;

          display: flex;
          flex-direction: column;

          border-radius: 13px;

          background:
            radial-gradient(
              circle at top,
              rgba(255,196,0,.05),
              transparent 42%
            ),
            linear-gradient(
              180deg,
              rgba(255,255,255,.028),
              rgba(255,255,255,0)
            ),
            #141414;

          color: #f2f2f2;

          overflow: hidden;
        }

        .ixi-face-frame-tall {
          height: 451px;
          min-height: 451px;
          max-height: 451px;
        }

        .ixi-face-frame-compact {
          height: 372px;
          min-height: 372px;
          max-height: 372px;

          --ixi-face-font-display: 16px;
          --ixi-face-font-title: 12px;
          --ixi-face-font-section: 8.5px;
          --ixi-face-font-label: 7px;
          --ixi-face-font-value: 8.5px;
          --ixi-face-font-micro: 6.5px;

          --ixi-face-pad-x: 11px;
          --ixi-face-pad-top: 8px;
        }

        .ixi-face-frame-content {
          width: 100%;
          min-width: 0;
          min-height: 0;

          flex: 1 1 auto;

          padding:
            var(--ixi-face-pad-top)
            var(--ixi-face-pad-x)
            0;

          overflow: hidden;
        }

        .ixi-face-frame-footer {
          width: 100%;

          height:
            var(--ixi-face-footer-height);

          min-height:
            var(--ixi-face-footer-height);

          max-height:
            var(--ixi-face-footer-height);

          margin-top: auto;
          padding: 7px 12px 5px;

          display: flex;
          align-items: center;
          justify-content: center;

          flex: 0 0
            var(--ixi-face-footer-height);

          border-top:
            1px solid
            rgba(255,255,255,.065);

          background:
            linear-gradient(
              180deg,
              rgba(20,20,20,0),
              #141414 24%
            );

          overflow: hidden;
        }

        .ixi-face-frame-footer
          :global(.mof-actions) {
          position: static;

          top: auto;
          bottom: auto;

          width: 100%;

          margin: 0;

          gap: 10px;
        }

        .ixi-face-frame-footer
          :global(.mof-actions button) {
          height: 26px;
        }
      `}</style>
    </section>
  );
}

import {
  getIXIAosSkin,
  getIXIAosSkinCssVars,
  IXI_AOS_DEFAULT_SKIN_ID
} from "./IXIAosSkinLibrary";


function clean(
  value
) {
  return String(
    value || ""
  ).trim();
}


export default function IXIAosSkinRuntime({
  skinId =
    IXI_AOS_DEFAULT_SKIN_ID,

  skinDefinition =
    null,

  children,

  className =
    "",

  style =
    null,

  as =
    "div",

  ...elementProps
}) {
  const resolvedSkin =
    skinDefinition &&
    typeof skinDefinition ===
      "object"
      ? skinDefinition
      : getIXIAosSkin(
          skinId
        );


  const resolvedSkinId =
    clean(
      resolvedSkin?.skinId
    ) ||
    IXI_AOS_DEFAULT_SKIN_ID;


  const skinVars =
    getIXIAosSkinCssVars(
      resolvedSkin
    );


  const Element =
    as;


  return (
    <Element
      {...elementProps}

      className={[
        "ixi-aos-skin-runtime",

        `ixi-aos-skin-${resolvedSkinId
          .replace(
            /[^a-zA-Z0-9_-]/g,
            "-"
          )
          .toLowerCase()}`,

        className
      ]
        .filter(Boolean)
        .join(" ")}

      data-ixi-skin-id={
        resolvedSkinId
      }

      data-ixi-skin-name={
        clean(
          resolvedSkin?.name
        )
      }

      style={{
        ...skinVars,
        ...(style || {})
      }}
    >
      {children}

      <style jsx>{`
        .ixi-aos-skin-runtime {
          box-sizing:
            border-box;

          min-width:
            0;

          /*
           * IMPORTANT:
           *
           * This Runtime applies visual tokens only.
           *
           * It intentionally DOES NOT establish:
           *
           * width
           * height
           * padding
           * gap
           * positioning
           * grid
           * card geometry
           *
           * The native 298 × 471 AOS geometry belongs
           * to the Card / Console / Face Runtime.
           */

          color:
            var(
              --ixi-skin-text,
              rgba(
                255,
                255,
                255,
                .84
              )
            );

          font-family:
            var(
              --ixi-skin-font-family,
              "Inter",
              Arial,
              sans-serif
            );
        }


        /*
         * Keep normal descendants inheriting the
         * Skin's typographic character.
         *
         * Individual Face applications remain free
         * to use their own semantic typography
         * sizing through AOS presentation metrics.
         */

        .ixi-aos-skin-runtime
          :global(button),
        .ixi-aos-skin-runtime
          :global(input),
        .ixi-aos-skin-runtime
          :global(select),
        .ixi-aos-skin-runtime
          :global(textarea) {
          font-family:
            inherit;
        }


        /*
         * Utility hooks.
         *
         * These classes are intentionally generic.
         *
         * They are useful while we migrate existing
         * Face components to Skin variables and can
         * also be used by future specialized apps.
         */

        .ixi-aos-skin-runtime
          :global(.ixi-skin-text) {
          color:
            var(
              --ixi-skin-text
            );
        }

        .ixi-aos-skin-runtime
          :global(.ixi-skin-text-strong) {
          color:
            var(
              --ixi-skin-text-strong
            );
        }

        .ixi-aos-skin-runtime
          :global(.ixi-skin-text-muted) {
          color:
            var(
              --ixi-skin-text-muted
            );
        }

        .ixi-aos-skin-runtime
          :global(.ixi-skin-text-faint) {
          color:
            var(
              --ixi-skin-text-faint
            );
        }


        .ixi-aos-skin-runtime
          :global(.ixi-skin-surface) {
          background:
            var(
              --ixi-skin-surface
            );

          border-color:
            var(
              --ixi-skin-border
            );

          box-shadow:
            var(
              --ixi-skin-shadow-inset
            );
        }

        .ixi-aos-skin-runtime
          :global(.ixi-skin-surface-raised) {
          background:
            var(
              --ixi-skin-surface-raised
            );

          border-color:
            var(
              --ixi-skin-border
            );

          box-shadow:
            var(
              --ixi-skin-shadow-inset
            );
        }

        .ixi-aos-skin-runtime
          :global(.ixi-skin-surface-strong) {
          background:
            var(
              --ixi-skin-surface-strong
            );

          border-color:
            var(
              --ixi-skin-border-strong
            );
        }

        .ixi-aos-skin-runtime
          :global(.ixi-skin-surface-inset) {
          background:
            var(
              --ixi-skin-surface-inset
            );

          border-color:
            var(
              --ixi-skin-border
            );
        }


        .ixi-aos-skin-runtime
          :global(.ixi-skin-accent) {
          color:
            var(
              --ixi-skin-accent
            );
        }

        .ixi-aos-skin-runtime
          :global(.ixi-skin-positive) {
          color:
            var(
              --ixi-skin-positive
            );
        }

        .ixi-aos-skin-runtime
          :global(.ixi-skin-negative) {
          color:
            var(
              --ixi-skin-negative
            );
        }

        .ixi-aos-skin-runtime
          :global(.ixi-skin-warning) {
          color:
            var(
              --ixi-skin-warning
            );
        }


        /*
         * Standard numeric hook.
         *
         * This lets Ledger use a different numeric
         * character from Foundry without changing
         * Face geometry or application logic.
         */

        .ixi-aos-skin-runtime
          :global(.ixi-skin-number) {
          font-family:
            var(
              --ixi-skin-number-font-family,
              var(
                --ixi-skin-font-family,
                "Inter",
                Arial,
                sans-serif
              )
            );
        }


        /*
         * Standard input hook.
         *
         * IMPORTANT:
         * no width or height is established here.
         *
         * Face geometry owns the input footprint.
         */

        .ixi-aos-skin-runtime
          :global(.ixi-skin-input) {
          border-color:
            var(
              --ixi-skin-input-border
            );

          background:
            var(
              --ixi-skin-input-bg
            );

          color:
            var(
              --ixi-skin-input-text
            );
        }

        .ixi-aos-skin-runtime
          :global(.ixi-skin-input:focus) {
          border-color:
            var(
              --ixi-skin-input-focus-border
            );

          box-shadow:
            var(
              --ixi-skin-input-focus-shadow
            );
        }


        /*
         * Standard action hook.
         */

        .ixi-aos-skin-runtime
          :global(.ixi-skin-action) {
          border-color:
            var(
              --ixi-skin-button-border
            );

          background:
            var(
              --ixi-skin-button-bg
            );

          color:
            var(
              --ixi-skin-button-text
            );
        }

        .ixi-aos-skin-runtime
          :global(.ixi-skin-action:hover:not(:disabled)) {
          border-color:
            var(
              --ixi-skin-button-border-hover
            );

          background:
            var(
              --ixi-skin-button-bg-hover
            );

          color:
            var(
              --ixi-skin-button-text-hover
            );
        }


        /*
         * Standard selected / active hook.
         */

        .ixi-aos-skin-runtime
          :global(.ixi-skin-selected) {
          border-color:
            var(
              --ixi-skin-selected-border
            );

          background:
            var(
              --ixi-skin-selected-bg
            );

          color:
            var(
              --ixi-skin-selected-text
            );
        }
      `}</style>
    </Element>
  );
}

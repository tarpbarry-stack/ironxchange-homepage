/*
 * =========================================================
 * IXI AOS SKIN LIBRARY
 * =========================================================
 *
 * PURPOSE
 *
 * A Skin answers:
 *
 *     WHAT DOES AN AOS FACE LOOK LIKE?
 *
 * A Skin does NOT answer:
 *
 *     - what the Object is
 *     - what the Face does
 *     - where modules are located
 *     - how large the Card is
 *     - how the Console behaves
 *     - which fields exist
 *     - which relationships exist
 *
 *
 * =========================================================
 * SACRED GEOMETRY DOCTRINE
 * =========================================================
 *
 * ALL IXI AOS Cards / Faces share the same native
 * design geometry:
 *
 *     298 × 471
 *
 * NO SKIN MAY CHANGE THAT GEOMETRY.
 *
 * Runtime scaling belongs to the AOS presentation /
 * console system.
 *
 * Skin definitions intentionally contain NO:
 *
 *     width
 *     height
 *     padding
 *     gap
 *     grid
 *     position
 *     row height
 *     footer height
 *     rail height
 *
 *
 * =========================================================
 * SKIN CONTRACT
 * =========================================================
 *
 * Skins expose semantic visual tokens.
 *
 * Faces and reusable primitives consume those tokens.
 *
 * Example:
 *
 *     A Work Order Face owns its layout.
 *     LEDGER owns its appearance.
 *
 *     An Expense Face owns its layout.
 *     LEDGER can paint that Face too.
 *
 * This prevents:
 *
 *     FACE × SKIN = hundreds of custom CSS files.
 *
 * Instead:
 *
 *     Face geometry
 *          +
 *     reusable Skin
 *
 * =========================================================
 */


export const IXI_AOS_SKIN_VERSION =
  "ixi-aos-skin-v1";


export const IXI_AOS_DEFAULT_SKIN_ID =
  "ixi:skin:default";


/*
 * =========================================================
 * SKIN IDS
 * =========================================================
 */

export const IXI_AOS_SKIN_IDS =
  Object.freeze({
    DEFAULT:
      "ixi:skin:default",

    LEDGER:
      "ixi:skin:ledger",

    FOUNDRY:
      "ixi:skin:foundry"
  });


/*
 * =========================================================
 * TOKEN CONTRACT
 * =========================================================
 *
 * These are VISUAL tokens only.
 *
 * Do not add geometry here.
 */

export const IXI_AOS_SKIN_TOKEN_KEYS =
  Object.freeze([

    /*
     * SHELL / SURFACES
     */
    "shellBackground",
    "contentBackground",

    "surface",
    "surfaceRaised",
    "surfaceStrong",
    "surfaceInset",

    /*
     * TEXT
     */
    "text",
    "textStrong",
    "textMuted",
    "textFaint",

    /*
     * BORDERS
     */
    "border",
    "borderStrong",
    "divider",

    /*
     * PRIMARY ACCENT
     */
    "accent",
    "accentStrong",
    "accentMuted",
    "accentSurface",

    /*
     * STATE
     */
    "positive",
    "positiveSurface",

    "negative",
    "negativeSurface",

    "warning",
    "warningSurface",

    /*
     * INPUTS
     */
    "inputBackground",
    "inputText",
    "inputBorder",
    "inputFocusBorder",
    "inputFocusShadow",

    /*
     * BUTTONS / ACTIONS
     */
    "buttonBackground",
    "buttonBackgroundHover",
    "buttonText",
    "buttonTextHover",
    "buttonBorder",
    "buttonBorderHover",

    /*
     * SELECTED / ACTIVE
     */
    "selectedBackground",
    "selectedBorder",
    "selectedText",

    /*
     * MATERIAL / DEPTH
     */
    "shadow",
    "shadowInset",
    "texture",

    /*
     * TYPOGRAPHIC CHARACTER
     *
     * These select families only.
     *
     * Font SIZE remains presentation geometry
     * and does NOT belong to Skin.
     */
    "fontFamily",
    "numberFontFamily"
  ]);


/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function clean(
  value
) {
  return String(
    value || ""
  ).trim();
}


function safeObject(
  value
) {
  return (
    value &&
    typeof value ===
      "object" &&
    !Array.isArray(value)
  )
    ? value
    : {};
}


function clone(
  value
) {
  return JSON.parse(
    JSON.stringify(
      value
    )
  );
}


function sanitizeTokens(
  tokens = {}
) {

  const source =
    safeObject(
      tokens
    );


  return IXI_AOS_SKIN_TOKEN_KEYS
    .reduce(
      (
        output,
        key
      ) => {

        if (
          source[key] ===
            undefined ||
          source[key] ===
            null
        ) {
          return output;
        }


        output[key] =
          String(
            source[key]
          );


        return output;
      },
      {}
    );
}


/*
 * =========================================================
 * DEFAULT / GRAPHITE SYSTEM SKIN
 * =========================================================
 *
 * This intentionally stays close to the existing
 * IXI visual language.
 *
 * That lets us migrate primitives without causing
 * an immediate visual redesign.
 */

const DEFAULT_SKIN = {

  skinVersion:
    IXI_AOS_SKIN_VERSION,

  skinId:
    IXI_AOS_SKIN_IDS.DEFAULT,

  name:
    "DEFAULT",

  label:
    "DEFAULT",

  description:
    "Canonical IXI dark industrial system skin.",

  scope:
    "ixi",

  tokens: {

    shellBackground:
      `
        radial-gradient(
          circle at top,
          rgba(255,196,0,.045),
          transparent 42%
        ),
        linear-gradient(
          180deg,
          rgba(255,255,255,.028),
          rgba(255,255,255,0)
        ),
        #141414
      `,

    contentBackground:
      "transparent",

    surface:
      "rgba(10,10,10,.46)",

    surfaceRaised:
      "rgba(14,14,14,.72)",

    surfaceStrong:
      "rgba(7,7,7,.86)",

    surfaceInset:
      "rgba(4,4,4,.52)",


    text:
      "rgba(255,255,255,.84)",

    textStrong:
      "#f2f2f2",

    textMuted:
      "rgba(255,255,255,.46)",

    textFaint:
      "rgba(255,255,255,.26)",


    border:
      "rgba(255,255,255,.07)",

    borderStrong:
      "rgba(255,255,255,.12)",

    divider:
      "rgba(255,255,255,.045)",


    accent:
      "#ffc400",

    accentStrong:
      "#ffd43b",

    accentMuted:
      "rgba(255,196,0,.46)",

    accentSurface:
      "rgba(255,196,0,.065)",


    positive:
      "rgba(104,232,166,.96)",

    positiveSurface:
      "rgba(62,207,142,.07)",


    negative:
      "rgba(255,111,111,.96)",

    negativeSurface:
      "rgba(255,83,83,.07)",


    warning:
      "rgba(255,181,64,.96)",

    warningSurface:
      "rgba(255,157,0,.07)",


    inputBackground:
      "transparent",

    inputText:
      "rgba(255,255,255,.90)",

    inputBorder:
      "rgba(255,255,255,.18)",

    inputFocusBorder:
      "rgba(255,196,0,.78)",

    inputFocusShadow:
      "0 3px 8px rgba(255,196,0,.10)",


    buttonBackground:
      `
        linear-gradient(
          180deg,
          rgba(255,255,255,.035),
          rgba(255,255,255,.012)
        ),
        rgba(8,8,8,.88)
      `,

    buttonBackgroundHover:
      `
        linear-gradient(
          180deg,
          rgba(255,196,0,.08),
          rgba(255,196,0,.025)
        ),
        rgba(8,8,8,.92)
      `,

    buttonText:
      "rgba(255,255,255,.58)",

    buttonTextHover:
      "#ffc400",

    buttonBorder:
      "rgba(255,255,255,.10)",

    buttonBorderHover:
      "rgba(255,196,0,.42)",


    selectedBackground:
      "rgba(255,196,0,.07)",

    selectedBorder:
      "rgba(255,196,0,.28)",

    selectedText:
      "#ffc400",


    shadow:
      "0 18px 40px rgba(0,0,0,.42)",

    shadowInset:
      "inset 0 1px 0 rgba(255,255,255,.035)",

    texture:
      "none",


    fontFamily:
      `"Inter", Arial, sans-serif`,

    numberFontFamily:
      `"Inter", Arial, sans-serif`
  }
};


/*
 * =========================================================
 * LEDGER
 * =========================================================
 *
 * Ivory / parchment / old financial document character.
 *
 * No image dependency.
 *
 * Texture is produced entirely through CSS gradients.
 */

const LEDGER_SKIN = {

  skinVersion:
    IXI_AOS_SKIN_VERSION,

  skinId:
    IXI_AOS_SKIN_IDS.LEDGER,

  name:
    "LEDGER",

  label:
    "LEDGER",

  description:
    "Warm ivory financial-document skin with restrained antique ledger character.",

  scope:
    "ixi",

  tokens: {

    shellBackground:
      `
        radial-gradient(
          circle at 15% 10%,
          rgba(255,255,255,.62),
          transparent 30%
        ),
        radial-gradient(
          circle at 84% 88%,
          rgba(108,72,34,.055),
          transparent 34%
        ),
        repeating-linear-gradient(
          0deg,
          rgba(79,52,26,.018) 0px,
          rgba(79,52,26,.018) 1px,
          transparent 1px,
          transparent 4px
        ),
        #e7ddc5
      `,

    contentBackground:
      "transparent",

    surface:
      "rgba(255,250,235,.40)",

    surfaceRaised:
      "rgba(255,252,241,.68)",

    surfaceStrong:
      "rgba(244,233,207,.88)",

    surfaceInset:
      "rgba(117,78,40,.055)",


    text:
      "rgba(57,39,25,.86)",

    textStrong:
      "#352316",

    textMuted:
      "rgba(57,39,25,.56)",

    textFaint:
      "rgba(57,39,25,.34)",


    border:
      "rgba(91,61,32,.24)",

    borderStrong:
      "rgba(91,61,32,.44)",

    divider:
      "rgba(91,61,32,.18)",


    accent:
      "#855c28",

    accentStrong:
      "#624019",

    accentMuted:
      "rgba(133,92,40,.58)",

    accentSurface:
      "rgba(133,92,40,.075)",


    positive:
      "#45643e",

    positiveSurface:
      "rgba(69,100,62,.08)",


    negative:
      "#8b4034",

    negativeSurface:
      "rgba(139,64,52,.08)",


    warning:
      "#9a671f",

    warningSurface:
      "rgba(154,103,31,.09)",


    inputBackground:
      "rgba(255,255,255,.20)",

    inputText:
      "#3b2819",

    inputBorder:
      "rgba(91,61,32,.32)",

    inputFocusBorder:
      "rgba(133,92,40,.78)",

    inputFocusShadow:
      "0 3px 8px rgba(91,61,32,.10)",


    buttonBackground:
      `
        linear-gradient(
          180deg,
          rgba(255,255,255,.34),
          rgba(255,255,255,.04)
        ),
        rgba(111,76,39,.06)
      `,

    buttonBackgroundHover:
      `
        linear-gradient(
          180deg,
          rgba(255,255,255,.42),
          rgba(255,255,255,.08)
        ),
        rgba(133,92,40,.12)
      `,

    buttonText:
      "rgba(57,39,25,.70)",

    buttonTextHover:
      "#624019",

    buttonBorder:
      "rgba(91,61,32,.30)",

    buttonBorderHover:
      "rgba(91,61,32,.58)",


    selectedBackground:
      "rgba(133,92,40,.11)",

    selectedBorder:
      "rgba(133,92,40,.56)",

    selectedText:
      "#624019",


    shadow:
      `
        0 16px 34px rgba(54,35,18,.18),
        inset 0 0 0 1px rgba(255,255,255,.24)
      `,

    shadowInset:
      "inset 0 1px 0 rgba(255,255,255,.52)",

    texture:
      `
        repeating-linear-gradient(
          90deg,
          rgba(91,61,32,.012) 0px,
          rgba(91,61,32,.012) 1px,
          transparent 1px,
          transparent 5px
        )
      `,


    fontFamily:
      `Georgia, "Times New Roman", serif`,

    numberFontFamily:
      `"Arial Narrow", "Helvetica Neue", Arial, sans-serif`
  }
};


/*
 * =========================================================
 * FOUNDRY
 * =========================================================
 *
 * Heavy industrial / equipment / shop / yard character.
 *
 * Again: CSS only.
 */

const FOUNDRY_SKIN = {

  skinVersion:
    IXI_AOS_SKIN_VERSION,

  skinId:
    IXI_AOS_SKIN_IDS.FOUNDRY,

  name:
    "FOUNDRY",

  label:
    "FOUNDRY",

  description:
    "Forged industrial skin with dark steel surfaces and restrained equipment-orange accents.",

  scope:
    "ixi",

  tokens: {

    shellBackground:
      `
        linear-gradient(
          135deg,
          rgba(255,255,255,.035) 0%,
          transparent 24%,
          rgba(0,0,0,.14) 54%,
          rgba(255,255,255,.018) 100%
        ),
        repeating-linear-gradient(
          90deg,
          rgba(255,255,255,.012) 0px,
          rgba(255,255,255,.012) 1px,
          transparent 1px,
          transparent 5px
        ),
        #171a1c
      `,

    contentBackground:
      "transparent",

    surface:
      "rgba(22,26,28,.86)",

    surfaceRaised:
      "rgba(29,34,37,.92)",

    surfaceStrong:
      "rgba(12,14,15,.94)",

    surfaceInset:
      "rgba(0,0,0,.28)",


    text:
      "rgba(238,239,235,.82)",

    textStrong:
      "#f0eee7",

    textMuted:
      "rgba(220,221,215,.48)",

    textFaint:
      "rgba(220,221,215,.27)",


    border:
      "rgba(230,232,226,.10)",

    borderStrong:
      "rgba(230,232,226,.19)",

    divider:
      "rgba(230,232,226,.065)",


    accent:
      "#e47d20",

    accentStrong:
      "#f39232",

    accentMuted:
      "rgba(228,125,32,.58)",

    accentSurface:
      "rgba(228,125,32,.075)",


    positive:
      "#79b873",

    positiveSurface:
      "rgba(121,184,115,.075)",


    negative:
      "#e26352",

    negativeSurface:
      "rgba(226,99,82,.075)",


    warning:
      "#e7a340",

    warningSurface:
      "rgba(231,163,64,.08)",


    inputBackground:
      "rgba(0,0,0,.18)",

    inputText:
      "#f1eee5",

    inputBorder:
      "rgba(230,232,226,.18)",

    inputFocusBorder:
      "rgba(228,125,32,.74)",

    inputFocusShadow:
      "0 3px 9px rgba(228,125,32,.11)",


    buttonBackground:
      `
        linear-gradient(
          180deg,
          rgba(255,255,255,.045),
          rgba(255,255,255,.006)
        ),
        #131618
      `,

    buttonBackgroundHover:
      `
        linear-gradient(
          180deg,
          rgba(228,125,32,.10),
          rgba(228,125,32,.025)
        ),
        #151819
      `,

    buttonText:
      "rgba(238,239,235,.61)",

    buttonTextHover:
      "#f39232",

    buttonBorder:
      "rgba(230,232,226,.12)",

    buttonBorderHover:
      "rgba(228,125,32,.48)",


    selectedBackground:
      "rgba(228,125,32,.09)",

    selectedBorder:
      "rgba(228,125,32,.42)",

    selectedText:
      "#f39232",


    shadow:
      `
        0 18px 42px rgba(0,0,0,.48),
        inset 0 1px 0 rgba(255,255,255,.035)
      `,

    shadowInset:
      `
        inset 0 1px 0 rgba(255,255,255,.035),
        inset 0 -1px 0 rgba(0,0,0,.28)
      `,

    texture:
      `
        repeating-linear-gradient(
          0deg,
          rgba(255,255,255,.008) 0px,
          rgba(255,255,255,.008) 1px,
          transparent 1px,
          transparent 4px
        )
      `,


    fontFamily:
      `"Inter", "Arial Narrow", Arial, sans-serif`,

    numberFontFamily:
      `"Arial Narrow", "Inter", Arial, sans-serif`
  }
};


/*
 * =========================================================
 * SYSTEM LIBRARY
 * =========================================================
 */

const IXI_AOS_SYSTEM_SKINS =
  Object.freeze([
    DEFAULT_SKIN,
    LEDGER_SKIN,
    FOUNDRY_SKIN
  ]);


/*
 * =========================================================
 * NORMALIZE SKIN DEFINITION
 * =========================================================
 */

export function normalizeIXIAosSkinDefinition(
  skin = {}
) {

  const source =
    safeObject(
      skin
    );


  const skinId =
    clean(
      source.skinId
    ) ||
    IXI_AOS_DEFAULT_SKIN_ID;


  const name =
    clean(
      source.name ||
      source.label
    ) ||
    "UNTITLED SKIN";


  return {
    skinVersion:
      clean(
        source.skinVersion
      ) ||
      IXI_AOS_SKIN_VERSION,

    skinId,

    name,

    label:
      clean(
        source.label
      ) ||
      name,

    description:
      clean(
        source.description
      ),

    scope:
      clean(
        source.scope
      ) ||
      "ixi",

    tokens:
      sanitizeTokens(
        source.tokens
      )
  };
}


/*
 * =========================================================
 * LIST SKINS
 * =========================================================
 */

export function listIXIAosSkins() {

  return IXI_AOS_SYSTEM_SKINS
    .map(
      skin =>
        clone(
          normalizeIXIAosSkinDefinition(
            skin
          )
        )
    );
}


/*
 * =========================================================
 * GET SKIN
 * =========================================================
 */

export function getIXIAosSkin(
  skinId =
    IXI_AOS_DEFAULT_SKIN_ID
) {

  const requestedId =
    clean(
      skinId
    ) ||
    IXI_AOS_DEFAULT_SKIN_ID;


  const match =
    IXI_AOS_SYSTEM_SKINS
      .find(
        skin =>
          skin.skinId ===
          requestedId
      );


  const resolved =
    match ||
    DEFAULT_SKIN;


  return clone(
    normalizeIXIAosSkinDefinition(
      resolved
    )
  );
}


/*
 * =========================================================
 * SKIN EXISTS
 * =========================================================
 */

export function hasIXIAosSkin(
  skinId = ""
) {

  const requestedId =
    clean(
      skinId
    );


  if (
    !requestedId
  ) {
    return false;
  }


  return IXI_AOS_SYSTEM_SKINS
    .some(
      skin =>
        skin.skinId ===
        requestedId
    );
}


/*
 * =========================================================
 * CSS VARIABLE CONTRACT
 * =========================================================
 *
 * This is the bridge between Skin Definitions and actual
 * Face / Card CSS.
 *
 * Geometry variables are intentionally absent.
 */

export function getIXIAosSkinCssVars(
  skinOrId =
    IXI_AOS_DEFAULT_SKIN_ID
) {

  const skin =
    typeof skinOrId ===
      "string"
      ? getIXIAosSkin(
          skinOrId
        )
      : normalizeIXIAosSkinDefinition(
          skinOrId
        );


  const tokens =
    skin.tokens;


  return {

    /*
     * IDENTITY
     */
    "--ixi-skin-id":
      `"${skin.skinId}"`,


    /*
     * SHELL / SURFACE
     */
    "--ixi-skin-shell-bg":
      tokens.shellBackground,

    "--ixi-skin-content-bg":
      tokens.contentBackground,

    "--ixi-skin-surface":
      tokens.surface,

    "--ixi-skin-surface-raised":
      tokens.surfaceRaised,

    "--ixi-skin-surface-strong":
      tokens.surfaceStrong,

    "--ixi-skin-surface-inset":
      tokens.surfaceInset,


    /*
     * TEXT
     */
    "--ixi-skin-text":
      tokens.text,

    "--ixi-skin-text-strong":
      tokens.textStrong,

    "--ixi-skin-text-muted":
      tokens.textMuted,

    "--ixi-skin-text-faint":
      tokens.textFaint,


    /*
     * BORDER
     */
    "--ixi-skin-border":
      tokens.border,

    "--ixi-skin-border-strong":
      tokens.borderStrong,

    "--ixi-skin-divider":
      tokens.divider,


    /*
     * ACCENT
     */
    "--ixi-skin-accent":
      tokens.accent,

    "--ixi-skin-accent-strong":
      tokens.accentStrong,

    "--ixi-skin-accent-muted":
      tokens.accentMuted,

    "--ixi-skin-accent-surface":
      tokens.accentSurface,


    /*
     * STATES
     */
    "--ixi-skin-positive":
      tokens.positive,

    "--ixi-skin-positive-surface":
      tokens.positiveSurface,

    "--ixi-skin-negative":
      tokens.negative,

    "--ixi-skin-negative-surface":
      tokens.negativeSurface,

    "--ixi-skin-warning":
      tokens.warning,

    "--ixi-skin-warning-surface":
      tokens.warningSurface,


    /*
     * INPUT
     */
    "--ixi-skin-input-bg":
      tokens.inputBackground,

    "--ixi-skin-input-text":
      tokens.inputText,

    "--ixi-skin-input-border":
      tokens.inputBorder,

    "--ixi-skin-input-focus-border":
      tokens.inputFocusBorder,

    "--ixi-skin-input-focus-shadow":
      tokens.inputFocusShadow,


    /*
     * BUTTON / ACTION
     */
    "--ixi-skin-button-bg":
      tokens.buttonBackground,

    "--ixi-skin-button-bg-hover":
      tokens.buttonBackgroundHover,

    "--ixi-skin-button-text":
      tokens.buttonText,

    "--ixi-skin-button-text-hover":
      tokens.buttonTextHover,

    "--ixi-skin-button-border":
      tokens.buttonBorder,

    "--ixi-skin-button-border-hover":
      tokens.buttonBorderHover,


    /*
     * SELECTED
     */
    "--ixi-skin-selected-bg":
      tokens.selectedBackground,

    "--ixi-skin-selected-border":
      tokens.selectedBorder,

    "--ixi-skin-selected-text":
      tokens.selectedText,


    /*
     * MATERIAL
     */
    "--ixi-skin-shadow":
      tokens.shadow,

    "--ixi-skin-shadow-inset":
      tokens.shadowInset,

    "--ixi-skin-texture":
      tokens.texture,


    /*
     * TYPOGRAPHIC CHARACTER
     */
    "--ixi-skin-font-family":
      tokens.fontFamily,

    "--ixi-skin-number-font-family":
      tokens.numberFontFamily
  };
}


/*
 * =========================================================
 * DEFAULT EXPORT
 * =========================================================
 */

export default IXI_AOS_SYSTEM_SKINS;

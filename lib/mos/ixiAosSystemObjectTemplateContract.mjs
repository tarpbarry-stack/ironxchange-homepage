const clean = value => String(value ?? "").trim();

export const IXI_AOS_CARD_NUMBER_MIN = 1;
export const IXI_AOS_CARD_NUMBER_MAX = 19;


export function getAosTemplateNumber(template = {}) {
  const value = Number(
    template?.templateNumber ||
    template?.metadata?.cardNumber ||
    0
  );

  return Number.isInteger(value) &&
    value >= IXI_AOS_CARD_NUMBER_MIN &&
    value <= IXI_AOS_CARD_NUMBER_MAX
    ? value
    : 0;
}


export function getSelectableAosSystemTemplates(
  templates = []
) {
  const byNumber = new Map();

  (Array.isArray(templates) ? templates : [])
    .forEach(template => {
      const number =
        getAosTemplateNumber(template);

      if (!number) return;

      const slug =
        clean(template?.templateSlug)
          .toLowerCase();

      /* 009B is a variant, not a second numbered selector entry. */
      if (slug === "aos-card-009b") return;

      if (!byNumber.has(number)) {
        byNumber.set(number, template);
      }
    });

  return [...byNumber.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, template]) => template);
}


export function isCompleteAosSystemTemplateSet(
  templates = []
) {
  const selectable =
    getSelectableAosSystemTemplates(
      templates
    );

  return selectable.length ===
    IXI_AOS_CARD_NUMBER_MAX;
}


export function formatAosCardNumber(value) {
  return String(
    Number(value) || 0
  ).padStart(3, "0");
}

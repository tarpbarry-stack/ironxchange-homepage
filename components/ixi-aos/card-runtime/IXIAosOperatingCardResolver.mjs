const clean = value => String(value ?? "").trim();

const CARD_BY_SLUG = Object.freeze({
  "location-standard": 1,
  "location-standard-002": 2,
  "location-standard-003": 3,
  "personnel-container-004": 4,
  "personnel-container-005": 5,
  "personnel-container-006": 6,
  "universal-object-007": 7,
  "employee-basic-007": 7,
  "profile-layout-008": 8,
  "aos-card-009": 9,
  "aos-card-009b": 9,
  "aos-card-010": 10,
  "aos-card-011": 11,
  "aos-card-012": 12,
  "aos-card-013": 13,
  "aos-card-014": 14,
  "aos-card-015": 15,
  "aos-card-016": 16,
  "aos-card-017": 17,
  "aos-card-018": 18,
  "universal-object-007b": 7,
  "universal-object-007c": 7
});

function supportedNumber(value) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 1 && number <= 18 ? number : 0;
}

function numberFromSlug(value) {
  const slug = clean(value).toLowerCase();
  if (!slug) return 0;
  if (CARD_BY_SLUG[slug]) return CARD_BY_SLUG[slug];

  const aosCard = slug.match(/aos-card-(\d{3})/);
  if (aosCard) return supportedNumber(Number(aosCard[1]));

  const bounded = slug.match(/(?:^|[-_])(\d{3})(?:$|[-_])/);
  return bounded ? supportedNumber(Number(bounded[1])) : 0;
}

export function resolveIXIAosOperatingCardNumber(object = {}) {
  const directCandidates = [
    object?.selectedPresentation?.templateNumber,
    object?.selectedCardTemplate?.templateNumber,
    object?.presentation?.templateNumber,
    object?.templateNumber,
    object?.cardNumber,
    object?.metadata?.cardNumber,
    object?.definition?.templateNumber,
    object?.definition?.metadata?.cardNumber,
    object?.metadata?.cardDefinition?.templateNumber
  ];

  for (const candidate of directCandidates) {
    const number = supportedNumber(candidate);
    if (number) return number;
  }

  const slugCandidates = [
    object?.selectedPresentation?.templateSlug,
    object?.selectedCardTemplate?.templateSlug,
    object?.presentation?.templateSlug,
    object?.cardTemplateSlug,
    object?.templateSlug,
    object?.definition?.cardTemplateSlug,
    object?.definition?.templateSlug,
    object?.metadata?.cardTemplateSlug,
    object?.metadata?.templateSlug,
    object?.metadata?.cardDefinition?.templateSlug
  ];

  for (const candidate of slugCandidates) {
    const number = numberFromSlug(candidate);
    if (number) return number;
  }

  // Card 007 is the neutral visual fallback. It carries no Person, type,
  // capability, vocabulary, identity, or authority meaning.
  return 7;
}

export default resolveIXIAosOperatingCardNumber;

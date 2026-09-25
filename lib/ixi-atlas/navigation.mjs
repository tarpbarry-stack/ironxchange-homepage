import { knownAtlasTopic } from "./helpRoutes.mjs";
import { machineCardParts } from "./machineCardRegistry.mjs";
import { chassisParts } from "./chassisRegistry.mjs";
import { atlasGuides } from "./guideRegistry.mjs";
import { atlasFamilies } from "./familyRegistry.mjs";

export function atlasFamilyHref(family) {
  return `/atlas?family=${atlasFamilies.some(item => item.id === family) ? family : "private"}`;
}

export function atlasAssemblyHref(assembly = "machine", part = "") {
  const chassis = assembly === "chassis";
  const parts = chassis ? chassisParts : machineCardParts;
  const id = parts.some(item => item.id === part) ? part : parts[0].id;
  return `/atlas?assembly=${chassis ? "chassis" : "machine"}&part=${id}`;
}
export function resolveAtlasView(query = {}) {
  if (Object.hasOwn(query, "family")) {
    const valid = typeof query.family === "string" && atlasFamilies.some(item => item.id === query.family);
    return { kind: "family", family: valid ? query.family : "private", unavailable: !valid };
  }
  if (Object.hasOwn(query, "topic")) {
    const topic = knownAtlasTopic(query.topic);
    return { kind: "guide", topic: topic || "overview", unavailable: !topic };
  }
  const assembly = query.assembly === "chassis" ? "chassis" : "machine";
  const parts = assembly === "chassis" ? chassisParts : machineCardParts;
  const part = parts.find(item => item.id === query.part) || parts[0];
  return { kind: assembly, part: part.id, unavailable: Boolean(query.assembly && !["machine", "chassis"].includes(query.assembly)) || Boolean(query.part && !parts.some(item => item.id === query.part)) };
}
const searchRecords = [
  ...atlasFamilies.map(family => ({ title: family.title, group: "Interactive Machine Card lesson", detail: family.summary, href: atlasFamilyHref(family.id), text: `${family.title} ${family.summary} ${family.principle} ${family.faces.flat().join(" ")}` })),
  ...atlasGuides.map(guide => ({ title: guide.title, group: guide.group, detail: guide.summary, href: `/atlas?topic=${guide.id}`, text: `${guide.title} ${guide.summary} ${guide.steps.flat().join(" ")}` })),
  ...machineCardParts.map(part => ({ title: part.name, group: "Machine Card demonstration", detail: part.short, href: atlasAssemblyHref("machine", part.id), text: `${part.name} ${part.code} ${part.purpose} ${part.specs.join(" ")}` })),
  ...chassisParts.map(part => ({ title: part.name, group: "Chassis blueprint", detail: part.short, href: atlasAssemblyHref("chassis", part.id), text: `${part.id} ${part.name} ${part.short} ${part.code} ${part.purpose}` })),
];
export function searchAtlas(query) {
  const words = String(query || "").trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return searchRecords.filter(item => words.every(word => item.text.toLocaleLowerCase().includes(word)));
}

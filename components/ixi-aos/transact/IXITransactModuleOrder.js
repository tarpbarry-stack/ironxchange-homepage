const cleanId = value => String(value ?? "").trim();

export function reconcileIXITransactModuleOrder(
  savedOrder = [],
  validModuleIds = [],
) {
  const valid = new Set(
    (Array.isArray(validModuleIds) ? validModuleIds : [])
      .map(cleanId)
      .filter(Boolean),
  );
  const seen = new Set();
  const ordered = [];

  (Array.isArray(savedOrder) ? savedOrder : []).forEach(value => {
    const id = cleanId(value);
    if (!id || !valid.has(id) || seen.has(id)) return;
    seen.add(id);
    ordered.push(id);
  });

  valid.forEach(id => {
    if (seen.has(id)) return;
    seen.add(id);
    ordered.push(id);
  });

  return ordered;
}

export function moveIXITransactModule(
  orderedIds = [],
  activeId = "",
  overId = "",
) {
  const current = Array.isArray(orderedIds) ? [...orderedIds] : [];
  const from = current.indexOf(cleanId(activeId));
  const to = current.indexOf(cleanId(overId));

  if (from < 0 || to < 0 || from === to) return current;

  const [moved] = current.splice(from, 1);
  current.splice(to, 0, moved);
  return current;
}

export default {
  reconcileIXITransactModuleOrder,
  moveIXITransactModule,
};

const clean = (value) => String(value ?? "").trim();
const num = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);
const arr = (value) => (Array.isArray(value) ? value : []);
const round = (value) => Math.round(num(value) * 100) / 100;
const iso = () => new Date().toISOString();

const BASIS_FIELD_DIRECTIONS = Object.freeze({
  purchasePrice: 1,
  buyerPremium: 1,
  auctionDocumentFees: 1,
  nonrecoverableTax: 1,
  titleFees: 1,
  brokerFees: 1,
  otherAcquisitionFees: 1,
  tradeAllowance: -1,
  sellerCredits: -1,
});

function actorIdentity(actor = {}) {
  return {
    actorPassportId: clean(actor.passportId),
    actorId: clean(actor.employeeId || actor.userId || actor.id),
    actorLabel: clean(actor.displayName || actor.name || actor.label),
  };
}

function canonicalDocument(item = {}) {
  const envelope = item?.record || item || {};
  const document =
    envelope?.financialDocument || item?.financialDocument || envelope;
  return {
    ...document,
    server: envelope?.server || item?.server || {},
    metadata: { ...(envelope?.metadata || {}), ...(document?.metadata || {}) },
    references: arr(
      document?.references || envelope?.references || item?.references,
    ),
  };
}

function documentAmount(item = {}) {
  const workFinancial = item?.workOrder?.financial || item?.financial || {};
  const workOrderActual =
    num(workFinancial.laborActual) +
    num(workFinancial.materialActual) +
    num(workFinancial.serviceActual) +
    num(workFinancial.otherActual);
  return round(
    item?.amount ||
      item?.total ||
      item?.totals?.total ||
      item?.billRecord?.bill?.amount ||
      item?.lines?.reduce((sum, line) => sum + num(line?.amount), 0) ||
      item?.financial?.amount ||
      workOrderActual,
  );
}

export function getIXIAcquisitionActuals(record = {}, transactions = []) {
  const cutoff = clean(record?.makeReady?.inServiceDate);
  const acquisitionId = clean(
    record?.identity?.acquisitionId || record?.identity?.number,
  );
  const assetPassportId = clean(record?.context?.primaryPassportId);
  const canonical = arr(transactions).map(canonicalDocument);
  const eligible = canonical.filter((item) => {
    const refs = arr(item?.references || item?.additionalReferences);
    const related =
      refs.some(
        (ref) =>
          clean(ref?.externalId) === acquisitionId ||
          clean(ref?.passportId) === assetPassportId,
      ) ||
      clean(item?.acquisitionId) === acquisitionId ||
      clean(item?.assetPassportId) === assetPassportId;
    if (!related) return false;
    const date = clean(
      item?.date ||
        item?.occurredAt ||
        item?.transactionDate ||
        item?.createdAt,
    ).slice(0, 10);
    if (cutoff && date && date > cutoff) return false;
    return (
      clean(
        item?.acquisitionCategory ||
          item?.category ||
          item?.metadata?.acquisitionCategory ||
          item?.metadata?.costPhase,
      ) === "acquisition" ||
      Boolean(item?.metadata?.acquisitionCost) ||
      Boolean(item?.acquisitionCost)
    );
  });
  const grouped = {};
  for (const item of eligible) {
    const category = clean(
      item?.acquisitionCategory ||
        item?.metadata?.acquisitionCategory ||
        item?.category ||
        "other",
    );
    const amount = documentAmount(item);
    if (!grouped[category])
      grouped[category] = {
        category,
        label: category.replace(/-/g, " ").toUpperCase(),
        actualAmount: 0,
        records: [],
      };
    grouped[category].actualAmount = round(
      grouped[category].actualAmount + amount,
    );
    grouped[category].records.push(item);
  }
  const actuals = Object.values(grouped);
  const actualTotal = round(
    actuals.reduce((sum, item) => sum + num(item.actualAmount), 0),
  );
  return { actuals, actualTotal };
}

export function getIXIAcquisitionOperations(record = {}, transactions = []) {
  const acquisitionId = clean(
    record?.identity?.acquisitionId || record?.identity?.number,
  );
  const passportId = clean(record?.context?.primaryPassportId);
  let freightStatus = "not-created";
  let freightOrderCount = 0;
  let inspectionStatus = "not-created";
  let makeReadyOpenCount = 0;
  let makeReadyWorkOrderCount = 0;
  const freightRank = {
    "not-created": 0,
    draft: 1,
    requested: 2,
    awarded: 3,
    dispatched: 4,
    picked_up: 5,
    "picked-up": 5,
    delivered: 6,
    billed: 7,
    reconciled: 8,
    paid: 9,
    closed: 10,
  };
  for (const item of arr(transactions).map(canonicalDocument)) {
    const refs = arr(item?.references || item?.additionalReferences);
    const related =
      refs.some(
        (ref) =>
          clean(ref?.passportId) === passportId ||
          clean(ref?.externalId) === acquisitionId,
      ) ||
      clean(item?.assetPassportId || item?.metadata?.assetPassportId) ===
        passportId ||
      clean(item?.acquisitionId || item?.metadata?.acquisitionId) ===
        acquisitionId;
    if (!related) continue;
    const documentType = clean(
      item?.documentType || item?.metadata?.transactModule,
    );
    const workType = clean(
      item?.workOrder?.work?.type ||
        item?.work?.type ||
        item?.metadata?.workType,
    ).toLowerCase();
    const status = clean(
      item?.freightOrder?.status ||
        item?.status ||
        item?.workOrder?.work?.status ||
        item?.work?.status ||
        "open",
    );
    if (
      documentType === "freight" ||
      clean(item?.metadata?.transactModule) === "freight"
    ) {
      freightOrderCount += 1;
      const candidate = status || "created";
      if ((freightRank[candidate] ?? 1) >= (freightRank[freightStatus] ?? 0))
        freightStatus = candidate;
    }
    if (
      documentType === "work-order" &&
      (workType.includes("inspection") ||
        clean(item?.metadata?.acquisitionWorkflow) === "receiving-inspection")
    ) {
      inspectionStatus = ["complete", "completed", "closed"].includes(status)
        ? "complete"
        : status || "open";
    }
    if (
      documentType === "work-order" &&
      (workType.includes("make ready") ||
        workType.includes("make-ready") ||
        clean(item?.metadata?.acquisitionWorkflow) === "make-ready")
    ) {
      makeReadyWorkOrderCount += 1;
      if (
        !["complete", "completed", "closed", "cancelled", "void"].includes(
          status,
        )
      )
        makeReadyOpenCount += 1;
    }
  }
  return {
    freightStatus,
    freightOrderCount,
    inspectionStatus,
    makeReadyOpenCount,
    makeReadyWorkOrderCount,
  };
}

export function amendIXIAssetAcquisition(
  record = {},
  amendment = {},
  actor = {},
) {
  const field = clean(amendment.field);
  if (!Object.hasOwn(BASIS_FIELD_DIRECTIONS, field))
    throw new Error("Select a valid acquisition cost field.");
  const effectiveDate = clean(amendment.effectiveDate);
  const reason = clean(amendment.reason);
  const reference = clean(amendment.reference);
  const newValue = round(amendment.newValue);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(effectiveDate))
    throw new Error("A valid amendment effective date is required.");
  if (!reason) throw new Error("An amendment reason is required.");
  if (!reference)
    throw new Error("An invoice, document, or approval reference is required.");
  if (newValue < 0)
    throw new Error("Acquisition cost fields cannot be negative.");
  const acquisition = { ...(record.acquisition || {}) };
  const previousValue = round(
    acquisition[field] ?? (field === "nonrecoverableTax" ? acquisition.tax : 0),
  );
  const basisBefore = round(
    acquisition.currentAcquisitionBasis ?? acquisition.directAcquisitionCost,
  );
  const basisDelta = round(
    (newValue - previousValue) * BASIS_FIELD_DIRECTIONS[field],
  );
  const basisAfter = round(basisBefore + basisDelta);
  if (basisAfter < 0)
    throw new Error("The amended acquisition basis cannot be negative.");
  const occurredAt = iso();
  const event = {
    adjustmentId: clean(amendment.adjustmentId) || `ACQ-AMEND-${Date.now()}`,
    type: "acquisition-amendment",
    field,
    previousValue,
    newValue,
    basisDelta,
    basisBefore,
    basisAfter,
    effectiveDate,
    reasonCode: clean(amendment.reasonCode || "other"),
    reason,
    reference,
    documentId: clean(amendment.documentId),
    occurredAt,
    ...actorIdentity(actor),
  };
  return {
    ...record,
    schema: "ixi-asset-acquisition-v3",
    acquisition: {
      ...acquisition,
      [field]: newValue,
      ...(field === "nonrecoverableTax" ? { tax: newValue } : {}),
      amendmentTotal: round(num(acquisition.amendmentTotal) + basisDelta),
      currentAcquisitionBasis: basisAfter,
      directAcquisitionCost: basisAfter,
    },
    funding: {
      ...(record.funding || {}),
      balanceDue: round(
        Math.max(0, basisAfter - num(record?.funding?.amountPaid)),
      ),
    },
    adjustments: [...arr(record.adjustments), event],
    activity: [...arr(record.activity), event],
    audit: { ...(record.audit || {}), updatedAt: occurredAt },
  };
}

export function normalizeIXIPackageAllocation(
  record = {},
  normalization = {},
  actor = {},
) {
  const packageId = clean(normalization.packageId);
  const packageReference = clean(normalization.packageReference);
  const allocationMethod = clean(normalization.allocationMethod);
  const reason = clean(normalization.reason);
  const effectiveDate = clean(normalization.effectiveDate);
  const packageTotal = round(normalization.packageTotal);
  const allocations = arr(normalization.allocations).map((item, index) => ({
    allocationId: clean(item?.allocationId) || `ALLOC-${index + 1}`,
    passportId: clean(item?.passportId),
    label: clean(item?.label),
    amount: round(item?.amount),
  }));
  if (!packageId || !packageReference)
    throw new Error("Package ID and purchase document reference are required.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(effectiveDate))
    throw new Error("A valid normalization effective date is required.");
  if (!reason) throw new Error("A package normalization reason is required.");
  if (!allocationMethod) throw new Error("An allocation method is required.");
  if (!(packageTotal > 0) || allocations.length < 2)
    throw new Error(
      "Package total and at least two machine allocations are required.",
    );
  if (allocations.some((item) => !item.passportId || item.amount < 0))
    throw new Error(
      "Every allocation requires an IXI Passport and a non-negative amount.",
    );
  if (
    new Set(allocations.map((item) => item.passportId)).size !==
    allocations.length
  )
    throw new Error("Package allocations require unique IXI Passports.");
  const allocatedTotal = round(
    allocations.reduce((sum, item) => sum + item.amount, 0),
  );
  if (Math.abs(allocatedTotal - packageTotal) > 0.005)
    throw new Error(
      "Package allocations must equal the authoritative package total.",
    );
  const passportId = clean(record?.context?.primaryPassportId);
  const current = allocations.find((item) => item.passportId === passportId);
  if (!current)
    throw new Error(
      "This acquisition's IXI Passport must be included in the package allocation.",
    );
  const acquisition = { ...(record.acquisition || {}) };
  const basisBefore = round(
    acquisition.currentAcquisitionBasis ?? acquisition.directAcquisitionCost,
  );
  const basisAfter = current.amount;
  const basisDelta = round(basisAfter - basisBefore);
  const occurredAt = iso();
  const event = {
    adjustmentId: clean(normalization.adjustmentId) || `ACQ-NORM-${Date.now()}`,
    type: "package-normalization",
    packageId,
    packageReference,
    packageTotal,
    allocatedTotal,
    allocationMethod,
    allocations,
    currentPassportId: passportId,
    basisBefore,
    basisAfter,
    basisDelta,
    effectiveDate,
    reason,
    occurredAt,
    ...actorIdentity(actor),
  };
  return {
    ...record,
    schema: "ixi-asset-acquisition-v3",
    acquisition: {
      ...acquisition,
      packageNormalizationTotal: round(
        num(acquisition.packageNormalizationTotal) + basisDelta,
      ),
      currentAcquisitionBasis: basisAfter,
      directAcquisitionCost: basisAfter,
    },
    funding: {
      ...(record.funding || {}),
      balanceDue: round(
        Math.max(0, basisAfter - num(record?.funding?.amountPaid)),
      ),
    },
    packageAllocation: {
      packageId,
      packageReference,
      packageTotal,
      allocationMethod,
      allocations,
      events: [...arr(record?.packageAllocation?.events), event],
    },
    adjustments: [...arr(record.adjustments), event],
    activity: [...arr(record.activity), event],
    audit: { ...(record.audit || {}), updatedAt: occurredAt },
  };
}

export function applyIXIAcquisitionActuals(record = {}, transactions = []) {
  const passportId = clean(record?.context?.primaryPassportId);
  let projectedRecord = record;
  const known = new Set(
    arr(record.adjustments).map((item) => clean(item?.adjustmentId)),
  );
  const packageEvents = arr(transactions)
    .map(canonicalDocument)
    .map(
      (item) =>
        item?.packageNormalization || item?.metadata?.packageNormalization,
    )
    .filter(
      (event) =>
        clean(event?.type) === "package-normalization" &&
        !known.has(clean(event?.adjustmentId)),
    )
    .sort((left, right) =>
      clean(left?.occurredAt).localeCompare(clean(right?.occurredAt)),
    );
  for (const event of packageEvents) {
    const allocation = arr(event?.allocations).find(
      (item) => clean(item?.passportId) === passportId,
    );
    if (!allocation) continue;
    const acquisition = { ...(projectedRecord.acquisition || {}) };
    const basisBefore = round(
      acquisition.currentAcquisitionBasis ?? acquisition.directAcquisitionCost,
    );
    const basisAfter = round(allocation.amount);
    const projectedEvent = {
      ...event,
      basisBefore,
      basisAfter,
      basisDelta: round(basisAfter - basisBefore),
      projectedFromControl: true,
    };
    projectedRecord = {
      ...projectedRecord,
      acquisition: {
        ...acquisition,
        packageNormalizationTotal: round(
          num(acquisition.packageNormalizationTotal) +
            projectedEvent.basisDelta,
        ),
        currentAcquisitionBasis: basisAfter,
        directAcquisitionCost: basisAfter,
      },
      funding: {
        ...(projectedRecord.funding || {}),
        balanceDue: round(
          Math.max(0, basisAfter - num(projectedRecord?.funding?.amountPaid)),
        ),
      },
      packageAllocation: {
        ...(projectedRecord.packageAllocation || {}),
        packageId: clean(event.packageId),
        packageReference: clean(event.packageReference),
        packageTotal: round(event.packageTotal),
        allocationMethod: clean(event.allocationMethod),
        allocations: arr(event.allocations),
      },
      adjustments: [...arr(projectedRecord.adjustments), projectedEvent],
    };
  }
  const projection = getIXIAcquisitionActuals(projectedRecord, transactions);
  const estimated = round(
    projectedRecord?.makeReady?.estimates?.reduce(
      (sum, item) => sum + num(item?.estimatedAmount),
      0,
    ),
  );
  return {
    ...projectedRecord,
    makeReady: {
      ...(projectedRecord.makeReady || {}),
      actuals: projection.actuals,
      actualTotal: projection.actualTotal,
      variance: round(projection.actualTotal - estimated),
    },
  };
}

export function addIXIOwnershipCapitalEvent(
  record = {},
  event = {},
  actor = {},
) {
  const type = clean(event.type || "capital-contribution");
  const occurredAt = clean(event.occurredAt) || iso();
  const entry = {
    eventId: clean(event.eventId) || `OWN-${Date.now()}`,
    type,
    partyId: clean(event.partyId),
    partyLabel: clean(event.partyLabel),
    counterpartyId: clean(event.counterpartyId),
    counterpartyLabel: clean(event.counterpartyLabel),
    amount: round(event.amount),
    ownershipPercentChange: num(event.ownershipPercentChange),
    settlementSharePercentChange: num(event.settlementSharePercentChange),
    profitSharePercentChange: num(event.profitSharePercentChange),
    lossSharePercentChange: num(event.lossSharePercentChange),
    effectiveLegalOwnershipPercent:
      event.effectiveLegalOwnershipPercent == null
        ? null
        : num(event.effectiveLegalOwnershipPercent),
    effectiveSettlementSharePercent:
      event.effectiveSettlementSharePercent == null
        ? null
        : num(event.effectiveSettlementSharePercent),
    effectiveProfitSharePercent:
      event.effectiveProfitSharePercent == null
        ? null
        : num(event.effectiveProfitSharePercent),
    effectiveLossSharePercent:
      event.effectiveLossSharePercent == null
        ? null
        : num(event.effectiveLossSharePercent),
    effectiveDate: clean(event.effectiveDate || occurredAt.slice(0, 10)),
    reference: clean(event.reference),
    notes: clean(event.notes),
    occurredAt,
    actorId: clean(
      actor.passportId || actor.employeeId || actor.userId || actor.id,
    ),
    actorLabel: clean(actor.displayName || actor.name || actor.label),
  };
  let owners = arr(record?.ownership?.owners).map((item) => ({ ...item }));
  if (entry.partyLabel) {
    let idx = owners.findIndex(
      (item) =>
        (clean(item.partyId) === entry.partyId && entry.partyId) ||
        clean(item.partyLabel) === entry.partyLabel,
    );
    if (idx < 0) {
      owners.push({
        ownerId: `OWNER-${owners.length + 1}`,
        partyId: entry.partyId,
        partyLabel: entry.partyLabel,
        legalOwnershipPercent: 0,
        settlementSharePercent: 0,
        profitSharePercent: 0,
        lossSharePercent: 0,
        initialContribution: 0,
        contributionDate: "",
        contributionReference: "",
        settlementPriority: "pro-rata",
        notes: "",
      });
      idx = owners.length - 1;
    }
    const current = owners[idx];
    owners[idx] = {
      ...current,
      legalOwnershipPercent:
        entry.effectiveLegalOwnershipPercent == null
          ? round(
              num(current.legalOwnershipPercent) + entry.ownershipPercentChange,
            )
          : entry.effectiveLegalOwnershipPercent,
      settlementSharePercent:
        entry.effectiveSettlementSharePercent == null
          ? round(
              num(current.settlementSharePercent) +
                entry.settlementSharePercentChange,
            )
          : entry.effectiveSettlementSharePercent,
      profitSharePercent:
        entry.effectiveProfitSharePercent == null
          ? round(
              num(
                current.profitSharePercent ?? current.settlementSharePercent,
              ) + entry.profitSharePercentChange,
            )
          : entry.effectiveProfitSharePercent,
      lossSharePercent:
        entry.effectiveLossSharePercent == null
          ? round(
              num(current.lossSharePercent ?? current.settlementSharePercent) +
                entry.lossSharePercentChange,
            )
          : entry.effectiveLossSharePercent,
    };
  }
  if (
    entry.counterpartyLabel &&
    (entry.ownershipPercentChange ||
      entry.settlementSharePercentChange ||
      entry.profitSharePercentChange ||
      entry.lossSharePercentChange)
  ) {
    if (entry.counterpartyLabel === entry.partyLabel) {
      throw new Error("Ownership transfer requires two different parties.");
    }
    const idx = owners.findIndex(
      (item) =>
        (clean(item.partyId) === entry.counterpartyId &&
          entry.counterpartyId) ||
        clean(item.partyLabel) === entry.counterpartyLabel,
    );
    if (idx < 0) {
      throw new Error(
        "Ownership transfer counterparty must be an existing owner.",
      );
    }
    owners[idx] = {
      ...owners[idx],
      legalOwnershipPercent: round(
        num(owners[idx].legalOwnershipPercent) - entry.ownershipPercentChange,
      ),
      settlementSharePercent: round(
        num(owners[idx].settlementSharePercent) -
          entry.settlementSharePercentChange,
      ),
      profitSharePercent: round(
        num(
          owners[idx].profitSharePercent ?? owners[idx].settlementSharePercent,
        ) - entry.profitSharePercentChange,
      ),
      lossSharePercent: round(
        num(
          owners[idx].lossSharePercent ?? owners[idx].settlementSharePercent,
        ) - entry.lossSharePercentChange,
      ),
    };
  }
  const ownership = {
    ...(record.ownership || {}),
    owners,
    legalOwnershipTotal: round(
      owners.reduce((s, i) => s + num(i.legalOwnershipPercent), 0),
    ),
    settlementShareTotal: round(
      owners.reduce((s, i) => s + num(i.settlementSharePercent), 0),
    ),
    profitShareTotal: round(
      owners.reduce(
        (s, i) => s + num(i.profitSharePercent ?? i.settlementSharePercent),
        0,
      ),
    ),
    lossShareTotal: round(
      owners.reduce(
        (s, i) => s + num(i.lossSharePercent ?? i.settlementSharePercent),
        0,
      ),
    ),
    events: [...arr(record?.ownership?.events), entry],
  };
  return {
    ...record,
    ownership,
    audit: { ...(record.audit || {}), updatedAt: iso() },
  };
}

export function putIXIAssetInService(
  record = {},
  inServiceDate = "",
  actor = {},
) {
  const date = clean(inServiceDate);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
    throw new Error("Valid in-service date is required");
  if (clean(record?.acquisition?.purchaseDate) > date)
    throw new Error("In-service date cannot be before the purchase date.");
  const previousDate = clean(record?.makeReady?.inServiceDate);
  const event = {
    eventId: `ACQ-SVC-${Date.now()}`,
    type: previousDate ? "in-service-date-corrected" : "put-in-service",
    previousDate,
    nextDate: date,
    occurredAt: iso(),
    actorId: clean(
      actor.passportId || actor.employeeId || actor.userId || actor.id,
    ),
    actorLabel: clean(actor.displayName || actor.name || actor.label),
  };
  return {
    ...record,
    makeReady: {
      ...(record.makeReady || {}),
      inServiceDate: date,
      inServiceAt: event.occurredAt,
      inServiceBy: event.actorLabel,
      status: "closed",
    },
    activity: [...arr(record.activity), event],
    audit: { ...(record.audit || {}), updatedAt: event.occurredAt },
  };
}

export default {
  getIXIAcquisitionActuals,
  getIXIAcquisitionOperations,
  applyIXIAcquisitionActuals,
  amendIXIAssetAcquisition,
  normalizeIXIPackageAllocation,
  addIXIOwnershipCapitalEvent,
  putIXIAssetInService,
};

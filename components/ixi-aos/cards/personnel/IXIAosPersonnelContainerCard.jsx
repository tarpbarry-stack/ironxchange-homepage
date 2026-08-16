import { useMemo, useState } from "react";

import IXICollectionThumbRail from "../../../ixi-object-system/IXICollectionThumbRail";
import IXIAosCardHeaderControls from "../../card-runtime/modules/IXIAosCardHeaderControls";


/* =========================================================
   PERSONNEL CONTAINER — V12

   Cards 004 / 005 / 006 share one semantic data adapter,
   but each card owns a deliberate presentation layout.

   IMPORTANT
   - Native geometry is always 298 × 471.
   - The container/object owns its identity and nomenclature.
   - Child objects own employee facts.
   - No totals are hardcoded into the card.
   - Recall / Board / Return remain native card commands.
   - IXI child rail remains the standard collection rail.
   ========================================================= */


function clean(value) {
  return String(value ?? "").trim();
}


function asArray(value) {
  return Array.isArray(value) ? value : [];
}


function toUpper(value) {
  return clean(value).toUpperCase();
}


function getFields(object = {}) {
  return object?.fields && typeof object.fields === "object"
    ? object.fields
    : {};
}


function getMetadata(object = {}) {
  return object?.metadata && typeof object.metadata === "object"
    ? object.metadata
    : {};
}


function getObjectId(object = {}) {
  return clean(
    object?.objectId ||
    object?.id?.uuid ||
    object?.id
  );
}


function getDisplayName(object = {}) {
  const fields = getFields(object);

  return clean(
    object?.displayName ||
    object?.label ||
    object?.name ||
    fields?.displayName ||
    fields?.name ||
    fields?.title
  ) || "PERSON";
}


function getPrimaryImage(object = {}) {
  const fields = getFields(object);
  const media = asArray(object?.media);
  const firstMedia = media[0];

  if (typeof firstMedia === "string") {
    return clean(firstMedia);
  }

  return clean(
    firstMedia?.url ||
    firstMedia?.src ||
    object?.image ||
    fields?.photoUrl ||
    fields?.imageUrl
  );
}


function getEmployeeNumber(object = {}) {
  const fields = getFields(object);
  const metadata = getMetadata(object);

  return clean(
    fields?.employeeNumber ||
    fields?.employeeId ||
    metadata?.employeeNumber ||
    metadata?.employeeId ||
    getObjectId(object)
  );
}


function getEmploymentStatus(object = {}) {
  const fields = getFields(object);
  const metadata = getMetadata(object);

  return toUpper(
    fields?.employmentStatus ||
    metadata?.employmentStatus ||
    object?.status ||
    "ACTIVE"
  );
}


function getDepartment(object = {}) {
  const fields = getFields(object);
  const metadata = getMetadata(object);

  return toUpper(
    fields?.department ||
    metadata?.department ||
    "UNASSIGNED"
  );
}


function getCapabilityLabels(object = {}) {
  const fields = getFields(object);
  const metadata = getMetadata(object);

  return [
    ...asArray(object?.capabilities),
    ...asArray(fields?.capabilities),
    ...asArray(fields?.skills),
    ...asArray(fields?.certifications),
    ...asArray(metadata?.capabilities)
  ]
    .map(item => {
      if (typeof item === "string") {
        return clean(item);
      }

      return clean(
        item?.label ||
        item?.name ||
        item?.type ||
        item?.capability
      );
    })
    .filter(Boolean);
}


function countLabels(values = []) {
  return values.reduce((output, value) => {
    const key = toUpper(value);

    if (!key) {
      return output;
    }

    output[key] = (output[key] || 0) + 1;
    return output;
  }, {});
}


function sortedEntries(counts = {}, limit = 6) {
  return Object.entries(counts)
    .sort((a, b) => {
      if (a[1] !== b[1]) {
        return b[1] - a[1];
      }

      return a[0].localeCompare(b[0]);
    })
    .slice(0, limit);
}


function readRelationshipValue(
  object = {},
  needles = [],
  fallback = "—"
) {
  const relationships = asArray(object?.relationships);
  const fields = getFields(object);

  for (const needle of needles) {
    const normalizedNeedle = clean(needle).toLowerCase();

    const match = relationships.find(relationship => {
      const relationshipName = clean(
        relationship?.label ||
        relationship?.type ||
        relationship?.relationshipType ||
        relationship?.name
      ).toLowerCase();

      return relationshipName.includes(normalizedNeedle);
    });

    if (match) {
      return clean(
        match?.value ||
        match?.displayName ||
        match?.targetDisplayName ||
        match?.label
      ) || fallback;
    }
  }

  for (const needle of needles) {
    if (clean(fields?.[needle])) {
      return clean(fields[needle]);
    }
  }

  return fallback;
}


function normalizeStatusCount(statusCounts, keys = []) {
  return keys.reduce(
    (total, key) => total + Number(statusCounts[toUpper(key)] || 0),
    0
  );
}


function PersonnelSection({
  title,
  className = "",
  children
}) {
  return (
    <section className={`pc-section ${className}`.trim()}>
      <div className="pc-section-title">{title}</div>
      <div className="pc-section-body">{children}</div>
    </section>
  );
}


function DistributionBar({
  label,
  value,
  maximum,
  showPercent = false
}) {
  const max = Math.max(1, Number(maximum || 0));
  const numericValue = Number(value || 0);
  const percent = Math.max(
    numericValue > 0 ? 6 : 0,
    Math.min(100, Math.round((numericValue / max) * 100))
  );

  return (
    <div className="pc-distribution-row">
      <span className="pc-distribution-label">{label}</span>

      <span className="pc-distribution-track" aria-hidden="true">
        <span
          className="pc-distribution-fill"
          style={{ width: `${percent}%` }}
        />
      </span>

      <strong>{numericValue}</strong>

      {showPercent ? (
        <small>{Math.round((numericValue / max) * 100)}%</small>
      ) : null}
    </div>
  );
}


function CommandStrip({
  object,
  onRecall,
  onBoard,
  onReturn
}) {
  function invoke(event, callback) {
    event.preventDefault();
    event.stopPropagation();
    callback?.(object);
  }

  return (
    <div className="pc-command-strip">
      <button
        type="button"
        onClick={event => invoke(event, onRecall)}
      >
        <span className="pc-command-icon">↻</span>
        <span>RECALL</span>
      </button>

      <button
        type="button"
        onClick={event => invoke(event, onBoard)}
      >
        <span className="pc-command-icon">▦</span>
        <span>BOARD</span>
      </button>

      <button
        type="button"
        onClick={event => invoke(event, onReturn)}
      >
        <span className="pc-command-icon">↩</span>
        <span>RETURN</span>
      </button>
    </div>
  );
}


function RelationshipRows({
  location,
  company,
  openJobs,
  teams
}) {
  const rows = [
    {
      icon: "◆",
      label: "LOCATION",
      value: location
    },
    {
      icon: "▦",
      label: "COMPANY",
      value: company
    },
    {
      icon: "▣",
      label: "OPEN JOBS",
      value: openJobs
    },
    {
      icon: "♟",
      label: "TEAMS / CREWS",
      value: teams
    }
  ];

  return (
    <div className="pc-relationship-list">
      {rows.map(row => (
        <button
          key={row.label}
          type="button"
          className="pc-relationship-row"
        >
          <span className="pc-relationship-name">
            <i>{row.icon}</i>
            {row.label}
          </span>

          <strong>{row.value}</strong>

          <span className="pc-relationship-arrow">›</span>
        </button>
      ))}
    </div>
  );
}


function Card004Summary({
  total,
  active,
  offDuty,
  departments,
  capabilities,
  maxCapability
}) {
  return (
    <>
      <div className="pc-004-hero">
        <div className="pc-people-emblem" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>

        <div className="pc-hero-total">
          <small>TOTAL PEOPLE</small>
          <strong>{total}</strong>
        </div>

        <div className="pc-hero-status">
          <div>
            <small>ACTIVE</small>
            <strong className="is-positive">{active}</strong>
          </div>

          <div>
            <small>OFF DUTY</small>
            <strong>{offDuty}</strong>
          </div>
        </div>
      </div>

      <PersonnelSection
        title="WORKFORCE SUMMARY"
        className="pc-004-workforce"
      >
        <div className="pc-summary-grid">
          {departments.slice(0, 5).map(([label, value]) => (
            <div className="pc-summary-row" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </PersonnelSection>

      <PersonnelSection
        title="CAPABILITY OVERVIEW"
        className="pc-004-capabilities"
      >
        <div className="pc-capability-bars">
          {capabilities.slice(0, 5).map(([label, value]) => (
            <DistributionBar
              key={label}
              label={label}
              value={value}
              maximum={maxCapability}
            />
          ))}
        </div>
      </PersonnelSection>
    </>
  );
}


function Card005Analytics({
  total,
  active,
  offDuty,
  openJobs,
  departments,
  capabilities
}) {
  const kpis = [
    {
      icon: "♟",
      label: "TOTAL PEOPLE",
      value: total
    },
    {
      icon: "●",
      label: "ACTIVE",
      value: active,
      tone: "positive"
    },
    {
      icon: "●",
      label: "OFF DUTY",
      value: offDuty,
      tone: "warning"
    },
    {
      icon: "▣",
      label: "OPEN JOBS",
      value: openJobs
    }
  ];

  return (
    <>
      <div className="pc-005-kpis">
        {kpis.map(kpi => (
          <div className="pc-kpi" key={kpi.label}>
            <div className="pc-kpi-label">
              <span className={`pc-kpi-icon ${kpi.tone || ""}`.trim()}>
                {kpi.icon}
              </span>
              <small>{kpi.label}</small>
            </div>
            <strong>{kpi.value}</strong>
          </div>
        ))}
      </div>

      <PersonnelSection
        title="DEPARTMENT BREAKDOWN"
        className="pc-005-departments"
      >
        <div className="pc-department-bars">
          {departments.slice(0, 5).map(([label, value]) => (
            <DistributionBar
              key={label}
              label={label}
              value={value}
              maximum={Math.max(1, total)}
              showPercent
            />
          ))}
        </div>
      </PersonnelSection>

      <PersonnelSection
        title="CAPABILITIES AT A GLANCE"
        className="pc-005-capabilities"
      >
        <div className="pc-capability-tiles">
          {capabilities.slice(0, 5).map(([label, value]) => (
            <div className="pc-capability-tile" key={label}>
              <span className="pc-capability-icon">◆</span>
              <small>{label}</small>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </PersonnelSection>
    </>
  );
}


function Card006Dashboard({
  active,
  offDuty,
  onLeave,
  terminated,
  departments,
  capabilities,
  maxCapability
}) {
  const statuses = [
    {
      label: "ACTIVE",
      value: active,
      icon: "♟",
      tone: "positive"
    },
    {
      label: "OFF DUTY",
      value: offDuty,
      icon: "♟",
      tone: "warning"
    },
    {
      label: "ON LEAVE",
      value: onLeave,
      icon: "▦",
      tone: "information"
    },
    {
      label: "TERMINATED",
      value: terminated,
      icon: "♟",
      tone: "muted"
    }
  ];

  return (
    <>
      <PersonnelSection
        title="WORKFORCE STATUS"
        className="pc-006-status"
      >
        <div className="pc-status-grid">
          {statuses.map(status => (
            <div className="pc-status-tile" key={status.label}>
              <span className={`pc-status-icon ${status.tone}`}>
                {status.icon}
              </span>
              <small>{status.label}</small>
              <strong>{status.value}</strong>
            </div>
          ))}
        </div>
      </PersonnelSection>

      <PersonnelSection
        title="QUICK ACCESS"
        className="pc-006-quick"
      >
        <div className="pc-quick-grid">
          {departments.slice(0, 6).map(([label, value]) => (
            <button
              type="button"
              className="pc-quick-tile"
              key={label}
            >
              <span className="pc-quick-icon">◆</span>
              <small>{label}</small>
              <strong>{value}</strong>
            </button>
          ))}
        </div>
      </PersonnelSection>

      <PersonnelSection
        title="KEY CAPABILITIES"
        className="pc-006-capabilities"
      >
        <div className="pc-key-capability-grid">
          {capabilities.slice(0, 6).map(([label, value]) => (
            <DistributionBar
              key={label}
              label={label}
              value={value}
              maximum={maxCapability}
            />
          ))}
        </div>
      </PersonnelSection>
    </>
  );
}


export default function IXIAosPersonnelContainerCard({
  variant = 1,
  object = {},
  children = [],
  onAddObject = null,
  onEdit = null,
  onHideObject = null,
  onDeleteObject = null,
  onOpenConsole = null,
  onRecall = null,
  onBoard = null,
  onReturn = null,
  onExposeObject = null
}) {
  const people = useMemo(
    () => asArray(children).filter(Boolean),
    [children]
  );

  const [activeChildIndex, setActiveChildIndex] = useState(0);

  const statusCounts = useMemo(
    () => countLabels(people.map(getEmploymentStatus)),
    [people]
  );

  const departmentCounts = useMemo(
    () => countLabels(people.map(getDepartment)),
    [people]
  );

  const capabilityCounts = useMemo(
    () => countLabels(people.flatMap(getCapabilityLabels)),
    [people]
  );

  const departments = useMemo(
    () => sortedEntries(departmentCounts, 6),
    [departmentCounts]
  );

  const capabilities = useMemo(
    () => sortedEntries(capabilityCounts, 6),
    [capabilityCounts]
  );

  const total = people.length;

  const active = normalizeStatusCount(
    statusCounts,
    ["ACTIVE", "WORKING", "ON DUTY"]
  );

  const offDuty = normalizeStatusCount(
    statusCounts,
    ["OFF DUTY", "OFF_DUTY", "INACTIVE"]
  );

  const onLeave = normalizeStatusCount(
    statusCounts,
    ["ON LEAVE", "LEAVE"]
  );

  const terminated = normalizeStatusCount(
    statusCounts,
    ["TERMINATED", "ENDED"]
  );

  const maxCapability = Math.max(
    1,
    ...capabilities.map(([, value]) => Number(value || 0))
  );

  const objectFields = getFields(object);
  const objectMetadata = getMetadata(object);

  const openJobs = Number(
    objectFields?.openJobs ??
    objectMetadata?.openJobs ??
    0
  ) || 0;

  const teams = Number(
    objectFields?.teams ??
    objectFields?.crews ??
    objectMetadata?.teams ??
    objectMetadata?.crews ??
    0
  ) || 0;

  const location = readRelationshipValue(
    object,
    ["location", "yard"],
    clean(objectFields?.location) || "—"
  );

  const company = readRelationshipValue(
    object,
    ["company", "employer"],
    clean(objectFields?.company) || "—"
  );

  const containerTitle = getDisplayName(object);

  const containerEyebrow = clean(
    objectFields?.containerLabel ||
    object?.pluralLabel ||
    objectMetadata?.pluralLabel ||
    objectMetadata?.nomenclature?.plural
  ) || "EMPLOYEES";

  const safeActiveChildIndex = Math.min(
    activeChildIndex,
    Math.max(0, total - 1)
  );

  return (
    <div
      className={`ixi-personnel-v12 ixi-personnel-card-${String(variant).padStart(3, "0")}`}
      data-personnel-card={String(variant).padStart(3, "0")}
    >
      <header className="pc-header">
        <div className="pc-identity">
          <span className="pc-eyebrow">
            <i>◆</i>
            {containerEyebrow}
          </span>

          <h2>{containerTitle}</h2>
        </div>

        <IXIAosCardHeaderControls
          canAdd
          canEdit
          onAdd={() => onAddObject?.(object)}
          onToggleEdit={() => onEdit?.(object)}
          onHide={onHideObject}
          onDelete={onDeleteObject}
          onOpenConsole={onOpenConsole}
        />
      </header>

      <div className="pc-content">
        {variant === 1 ? (
          <Card004Summary
            total={total}
            active={active}
            offDuty={offDuty}
            departments={departments}
            capabilities={capabilities}
            maxCapability={maxCapability}
          />
        ) : null}

        {variant === 2 ? (
          <Card005Analytics
            total={total}
            active={active}
            offDuty={offDuty}
            openJobs={openJobs}
            departments={departments}
            capabilities={capabilities}
          />
        ) : null}

        {variant === 3 ? (
          <Card006Dashboard
            active={active}
            offDuty={offDuty}
            onLeave={onLeave}
            terminated={terminated}
            departments={departments}
            capabilities={capabilities}
            maxCapability={maxCapability}
          />
        ) : null}

        <PersonnelSection
          title="RELATIONSHIPS & INFRASTRUCTURE"
          className="pc-relationships"
        >
          <RelationshipRows
            location={location}
            company={company}
            openJobs={openJobs}
            teams={teams}
          />
        </PersonnelSection>
      </div>

      <CommandStrip
        object={object}
        onRecall={onRecall}
        onBoard={onBoard}
        onReturn={onReturn}
      />

      <div className="pc-child-rail">
        <IXICollectionThumbRail
          items={people}
          activeItemIndex={safeActiveChildIndex}
          getItemId={getObjectId}
          getItemImage={getPrimaryImage}
          getItemLabel={person => {
            const employeeNumber = getEmployeeNumber(person);
            return employeeNumber
              ? `${getDisplayName(person)} · ${employeeNumber}`
              : getDisplayName(person);
          }}
          onSelectItem={(item, index) => {
            setActiveChildIndex(index);
            onExposeObject?.(item);
          }}
        />
      </div>

      <div className="pc-bottom-rail" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

      {/*
        GLOBAL is intentional here.

        PersonnelSection / CommandStrip / DistributionBar are child React
        components. The original first pass used scoped styled-jsx in the
        parent, so those child DOM nodes did not receive the styled-jsx scope
        attribute. That is why Face Lab showed browser-default giant headings
        and white command buttons. Everything below is safely namespaced by
        .ixi-personnel-v12 and therefore applies across the complete standalone
        card without leaking to AOS.
      */}
      <style jsx global>{`
        .ixi-personnel-v12,
        .ixi-personnel-v12 * {
          box-sizing: border-box;
        }

        .ixi-personnel-v12 {
          --pc-yellow: #ffc400;
          --pc-cyan: #16c7ff;
          --pc-green: #79d83b;
          --pc-orange: #ff6b38;
          --pc-red: #ff5252;
          --pc-bg: #090b0a;
          --pc-shell: #101310;
          --pc-shell-raised: #151916;
          --pc-shell-strong: #1a1f1b;
          --pc-line: #343a35;
          --pc-line-soft: #262c27;
          --pc-text: #f4f5f4;
          --pc-muted: #969d98;
          --pc-faint: #666d68;

          position: relative;
          width: 298px;
          height: 471px;
          overflow: hidden;
          border: 1px solid #454b47;
          border-radius: 13px;
          background:
            linear-gradient(180deg, rgba(255,255,255,.025), transparent 24%),
            var(--pc-bg);
          color: var(--pc-text);
          font-family: Arial, Helvetica, sans-serif;
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.075),
            inset 0 -1px 0 rgba(0,0,0,.72),
            0 18px 40px rgba(0,0,0,.48);
        }

        .ixi-personnel-v12 button,
        .ixi-personnel-v12 input,
        .ixi-personnel-v12 select,
        .ixi-personnel-v12 textarea {
          font: inherit;
        }

        .ixi-personnel-v12 .pc-header {
          position: absolute;
          inset: 0 0 auto 0;
          height: 43px;
          padding: 7px 10px 6px;
          border-bottom: 1px solid #303531;
          background:
            linear-gradient(180deg, rgba(255,255,255,.035), transparent),
            #101210;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.025);
          z-index: 20;
        }

        .ixi-personnel-v12 .pc-identity {
          min-width: 0;
          max-width: 194px;
        }

        .ixi-personnel-v12 .pc-eyebrow {
          display: flex;
          align-items: center;
          gap: 4px;
          height: 8px;
          overflow: hidden;
          color: var(--pc-yellow);
          font-size: 6px;
          font-weight: 950;
          line-height: 1;
          letter-spacing: .15px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .ixi-personnel-v12 .pc-eyebrow i {
          color: var(--pc-yellow);
          font-size: 5px;
          font-style: normal;
        }

        .ixi-personnel-v12 .pc-identity h2 {
          max-width: 194px;
          margin: 4px 0 0;
          overflow: hidden;
          color: #f6f7f6;
          font-size: 14px;
          font-weight: 950;
          line-height: 1;
          letter-spacing: -.25px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .ixi-personnel-v12 .pc-content {
          position: absolute;
          top: 43px;
          left: 7px;
          right: 7px;
          bottom: 111px;
          display: flex;
          flex-direction: column;
          gap: 5px;
          padding-top: 5px;
          overflow: hidden;
        }

        .ixi-personnel-v12 .pc-section {
          flex: 0 0 auto;
          min-width: 0;
          overflow: hidden;
          border: 1px solid var(--pc-line);
          border-radius: 5px;
          background:
            linear-gradient(180deg, rgba(255,255,255,.018), transparent 22px),
            var(--pc-shell);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.035),
            0 1px 0 rgba(0,0,0,.35);
        }

        .ixi-personnel-v12 .pc-section-title {
          height: 19px;
          display: flex;
          align-items: center;
          padding: 0 6px;
          border-bottom: 1px solid var(--pc-line-soft);
          background: rgba(255,255,255,.012);
          color: var(--pc-yellow);
          font-size: 6px;
          font-weight: 950;
          line-height: 1;
          letter-spacing: .1px;
          white-space: nowrap;
        }

        .ixi-personnel-v12 .pc-section-body {
          min-width: 0;
          height: calc(100% - 19px);
          overflow: hidden;
        }

        /* =====================================================
           CARD 004 — SUMMARY OVERVIEW
           ===================================================== */

        .ixi-personnel-v12 .pc-004-hero {
          flex: 0 0 59px;
          height: 59px;
          display: grid;
          grid-template-columns: 1.15fr .95fr 1fr;
          overflow: hidden;
          border: 1px solid var(--pc-line);
          border-radius: 5px;
          background:
            linear-gradient(180deg, rgba(255,255,255,.018), transparent),
            var(--pc-shell);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.035);
        }

        .ixi-personnel-v12 .pc-004-hero > div {
          min-width: 0;
          border-right: 1px solid var(--pc-line-soft);
        }

        .ixi-personnel-v12 .pc-004-hero > div:last-child {
          border-right: 0;
        }

        .ixi-personnel-v12 .pc-people-emblem {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0;
        }

        .ixi-personnel-v12 .pc-people-emblem span {
          position: relative;
          width: 16px;
          height: 16px;
          margin: 8px -2px 0;
          border-radius: 50% 50% 42% 42%;
          background: var(--pc-yellow);
          box-shadow: 0 0 10px rgba(255,196,0,.08);
        }

        .ixi-personnel-v12 .pc-people-emblem span::before {
          content: "";
          position: absolute;
          top: -9px;
          left: 4px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--pc-yellow);
        }

        .ixi-personnel-v12 .pc-people-emblem span:nth-child(2) {
          z-index: 2;
          transform: scale(1.1);
        }

        .ixi-personnel-v12 .pc-hero-total,
        .ixi-personnel-v12 .pc-hero-status {
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 6px 8px;
        }

        .ixi-personnel-v12 .pc-hero-total small,
        .ixi-personnel-v12 .pc-hero-status small {
          color: var(--pc-muted);
          font-size: 5px;
          font-weight: 900;
          line-height: 1;
        }

        .ixi-personnel-v12 .pc-hero-total > strong {
          margin-top: 4px;
          color: #fff;
          font-size: 19px;
          font-weight: 950;
          line-height: 1;
        }

        .ixi-personnel-v12 .pc-hero-status {
          gap: 4px;
        }

        .ixi-personnel-v12 .pc-hero-status > div {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          min-width: 0;
        }

        .ixi-personnel-v12 .pc-hero-status strong {
          color: #fff;
          font-size: 9px;
          font-weight: 950;
          line-height: 1;
        }

        .ixi-personnel-v12 .pc-hero-status strong.is-positive {
          color: var(--pc-green);
        }

        .ixi-personnel-v12 .pc-004-workforce {
          height: 65px;
        }

        .ixi-personnel-v12 .pc-summary-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0 8px;
          height: 100%;
          padding: 2px 6px 3px;
        }

        .ixi-personnel-v12 .pc-summary-row {
          height: 19px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-width: 0;
          border-bottom: 1px solid var(--pc-line-soft);
        }

        .ixi-personnel-v12 .pc-summary-row span {
          overflow: hidden;
          color: #c7cbc8;
          font-size: 6px;
          font-weight: 800;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .ixi-personnel-v12 .pc-summary-row strong {
          flex: 0 0 auto;
          margin-left: 5px;
          color: #fff;
          font-size: 8px;
          font-weight: 950;
        }

        .ixi-personnel-v12 .pc-004-capabilities {
          height: 88px;
        }

        .ixi-personnel-v12 .pc-capability-bars,
        .ixi-personnel-v12 .pc-department-bars {
          height: 100%;
        }

        /* =====================================================
           SHARED DISTRIBUTION ROWS
           ===================================================== */

        .ixi-personnel-v12 .pc-distribution-row {
          height: 13px;
          display: grid;
          grid-template-columns: minmax(0, 104px) 1fr 18px;
          align-items: center;
          gap: 5px;
          padding: 0 6px;
          border-bottom: 1px solid var(--pc-line-soft);
        }

        .ixi-personnel-v12 .pc-distribution-row:last-child {
          border-bottom: 0;
        }

        .ixi-personnel-v12 .pc-distribution-label {
          overflow: hidden;
          color: #c9cdca;
          font-size: 5.5px;
          font-weight: 800;
          line-height: 1;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .ixi-personnel-v12 .pc-distribution-track {
          height: 4px;
          overflow: hidden;
          border-radius: 2px;
          background: #292d2a;
          box-shadow: inset 0 1px 1px rgba(0,0,0,.55);
        }

        .ixi-personnel-v12 .pc-distribution-fill {
          display: block;
          height: 100%;
          border-radius: 2px;
          background: linear-gradient(90deg, #f7b900, var(--pc-yellow));
          box-shadow: 0 0 5px rgba(255,196,0,.10);
        }

        .ixi-personnel-v12 .pc-distribution-row strong {
          color: #fff;
          font-size: 7px;
          font-weight: 950;
          line-height: 1;
          text-align: right;
        }

        .ixi-personnel-v12 .pc-distribution-row small {
          display: none;
        }

        /* =====================================================
           CARD 005 — ANALYTIC OVERVIEW
           ===================================================== */

        .ixi-personnel-v12 .pc-005-kpis {
          flex: 0 0 47px;
          height: 47px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          overflow: hidden;
          border: 1px solid var(--pc-line);
          border-radius: 5px;
          background:
            linear-gradient(180deg, rgba(255,255,255,.018), transparent),
            var(--pc-shell);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.035);
        }

        .ixi-personnel-v12 .pc-kpi {
          min-width: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          padding: 4px 3px;
          border-right: 1px solid var(--pc-line-soft);
        }

        .ixi-personnel-v12 .pc-kpi:last-child {
          border-right: 0;
        }

        .ixi-personnel-v12 .pc-kpi-label {
          min-width: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 3px;
        }

        .ixi-personnel-v12 .pc-kpi-icon {
          color: #aeb4b0;
          font-size: 6px;
          line-height: 1;
        }

        .ixi-personnel-v12 .pc-kpi-icon.positive {
          color: var(--pc-green);
        }

        .ixi-personnel-v12 .pc-kpi-icon.warning {
          color: var(--pc-orange);
        }

        .ixi-personnel-v12 .pc-kpi small {
          overflow: hidden;
          color: var(--pc-muted);
          font-size: 4.4px;
          font-weight: 900;
          line-height: 1;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .ixi-personnel-v12 .pc-kpi > strong {
          color: #fff;
          font-size: 12px;
          font-weight: 950;
          line-height: 1;
        }

        .ixi-personnel-v12 .pc-005-departments {
          height: 96px;
        }

        .ixi-personnel-v12 .pc-005-departments .pc-distribution-row {
          height: 15px;
          grid-template-columns: 94px 1fr 16px 26px;
        }

        .ixi-personnel-v12 .pc-005-departments .pc-distribution-row small {
          display: block;
          color: var(--pc-muted);
          font-size: 5px;
          font-weight: 800;
          text-align: right;
        }

        .ixi-personnel-v12 .pc-005-capabilities {
          height: 70px;
        }

        .ixi-personnel-v12 .pc-capability-tiles {
          height: 100%;
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 3px;
          padding: 4px;
        }

        .ixi-personnel-v12 .pc-capability-tile {
          min-width: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--pc-line);
          border-radius: 4px;
          background:
            linear-gradient(180deg, rgba(255,255,255,.025), transparent),
            #141714;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.025);
        }

        .ixi-personnel-v12 .pc-capability-icon {
          color: #c8ccc9;
          font-size: 10px;
          line-height: 1;
        }

        .ixi-personnel-v12 .pc-capability-tile small {
          width: 100%;
          margin-top: 3px;
          overflow: hidden;
          padding: 0 2px;
          color: #aeb4b0;
          font-size: 4.2px;
          font-weight: 900;
          line-height: 1.05;
          text-align: center;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .ixi-personnel-v12 .pc-capability-tile strong {
          margin-top: 2px;
          color: #fff;
          font-size: 9px;
          font-weight: 950;
          line-height: 1;
        }

        /* =====================================================
           CARD 006 — DASHBOARD TILE OVERVIEW
           ===================================================== */

        .ixi-personnel-v12 .pc-006-status {
          height: 71px;
        }

        .ixi-personnel-v12 .pc-status-grid {
          height: 100%;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 4px;
          padding: 4px;
        }

        .ixi-personnel-v12 .pc-status-tile {
          min-width: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--pc-line);
          border-radius: 4px;
          background:
            linear-gradient(180deg, rgba(255,255,255,.025), transparent),
            #141714;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.025);
        }

        .ixi-personnel-v12 .pc-status-icon {
          font-size: 13px;
          line-height: 1;
        }

        .ixi-personnel-v12 .pc-status-icon.positive {
          color: var(--pc-green);
        }

        .ixi-personnel-v12 .pc-status-icon.warning {
          color: var(--pc-orange);
        }

        .ixi-personnel-v12 .pc-status-icon.information {
          color: var(--pc-cyan);
        }

        .ixi-personnel-v12 .pc-status-icon.muted {
          color: #b1b6b3;
        }

        .ixi-personnel-v12 .pc-status-tile small {
          margin-top: 3px;
          color: #afb4b1;
          font-size: 4.3px;
          font-weight: 900;
          line-height: 1;
          text-align: center;
        }

        .ixi-personnel-v12 .pc-status-tile strong {
          margin-top: 2px;
          color: #fff;
          font-size: 9px;
          font-weight: 950;
          line-height: 1;
        }

        .ixi-personnel-v12 .pc-006-quick {
          height: 101px;
        }

        .ixi-personnel-v12 .pc-quick-grid {
          height: 100%;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-template-rows: repeat(2, 1fr);
          gap: 4px;
          padding: 4px;
        }

        .ixi-personnel-v12 .pc-quick-tile {
          min-width: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin: 0;
          padding: 0;
          border: 1px solid var(--pc-line);
          border-radius: 4px;
          background:
            linear-gradient(180deg, rgba(255,255,255,.025), transparent),
            #141714;
          color: #fff;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.025);
          cursor: pointer;
        }

        .ixi-personnel-v12 .pc-quick-tile:hover {
          border-color: rgba(255,196,0,.38);
          background:
            linear-gradient(180deg, rgba(255,196,0,.05), transparent),
            #151713;
        }

        .ixi-personnel-v12 .pc-quick-icon {
          color: #cbd0cc;
          font-size: 11px;
          line-height: 1;
        }

        .ixi-personnel-v12 .pc-quick-tile small {
          max-width: 100%;
          margin-top: 3px;
          overflow: hidden;
          padding: 0 3px;
          color: #aeb3af;
          font-size: 4.4px;
          font-weight: 900;
          line-height: 1;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .ixi-personnel-v12 .pc-quick-tile strong {
          margin-top: 2px;
          color: #fff;
          font-size: 9px;
          font-weight: 950;
          line-height: 1;
        }

        .ixi-personnel-v12 .pc-006-capabilities {
          height: 63px;
        }

        .ixi-personnel-v12 .pc-key-capability-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          height: 100%;
        }

        .ixi-personnel-v12 .pc-key-capability-grid .pc-distribution-row {
          height: 14px;
          grid-template-columns: minmax(0, 61px) 1fr 14px;
          gap: 3px;
          padding: 0 5px;
        }

        .ixi-personnel-v12 .pc-key-capability-grid .pc-distribution-label {
          font-size: 4.6px;
        }

        .ixi-personnel-v12 .pc-key-capability-grid .pc-distribution-row:nth-child(odd) {
          border-right: 1px solid var(--pc-line-soft);
        }

        /* =====================================================
           RELATIONSHIPS
           ===================================================== */

        .ixi-personnel-v12 .pc-relationships {
          flex: 1 1 auto;
          min-height: 72px;
        }

        .ixi-personnel-v12 .pc-relationship-list {
          height: 100%;
          padding: 1px 5px 2px;
        }

        .ixi-personnel-v12 .pc-relationship-row {
          width: 100%;
          height: 18px;
          display: grid;
          grid-template-columns: minmax(0, .95fr) minmax(0, 1.2fr) 9px;
          align-items: center;
          margin: 0;
          padding: 0 3px;
          border: 0;
          border-bottom: 1px solid var(--pc-line-soft);
          border-radius: 0;
          background: transparent;
          color: var(--pc-text);
          cursor: pointer;
        }

        .ixi-personnel-v12 .pc-relationship-row:last-child {
          border-bottom: 0;
        }

        .ixi-personnel-v12 .pc-relationship-row:hover {
          background: rgba(255,255,255,.025);
        }

        .ixi-personnel-v12 .pc-relationship-name {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 5px;
          overflow: hidden;
          color: #bfc4c0;
          font-size: 5.4px;
          font-weight: 850;
          line-height: 1;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .ixi-personnel-v12 .pc-relationship-name i {
          flex: 0 0 7px;
          color: #aeb4b0;
          font-size: 6px;
          font-style: normal;
          text-align: center;
        }

        .ixi-personnel-v12 .pc-relationship-row strong {
          min-width: 0;
          overflow: hidden;
          color: #f0f2f0;
          font-size: 5.5px;
          font-weight: 900;
          line-height: 1;
          text-align: right;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .ixi-personnel-v12 .pc-relationship-arrow {
          color: var(--pc-cyan);
          font-size: 11px;
          font-weight: 500;
          line-height: 1;
          text-align: right;
        }

        /* =====================================================
           RECALL / BOARD / RETURN
           ===================================================== */

        .ixi-personnel-v12 .pc-command-strip {
          position: absolute;
          left: 7px;
          right: 7px;
          bottom: 82px;
          height: 25px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          overflow: hidden;
          border: 1px solid #303531;
          border-radius: 4px;
          background: #0c0e0d;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.025);
          z-index: 10;
        }

        .ixi-personnel-v12 .pc-command-strip button {
          min-width: 0;
          height: 23px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          margin: 0;
          padding: 0 4px;
          border: 0;
          border-right: 1px solid var(--pc-line-soft);
          border-radius: 0;
          background: transparent;
          color: #d5d8d6;
          font-size: 6px;
          font-weight: 900;
          line-height: 1;
          cursor: pointer;
        }

        .ixi-personnel-v12 .pc-command-strip button:last-child {
          border-right: 0;
        }

        .ixi-personnel-v12 .pc-command-strip button:hover {
          background: rgba(255,255,255,.025);
          color: #fff;
        }

        .ixi-personnel-v12 .pc-command-icon {
          color: var(--pc-cyan);
          font-size: 8px;
          font-weight: 700;
          line-height: 1;
        }

        /* =====================================================
           EMPLOYEE CHILD RAIL
           ===================================================== */

        .ixi-personnel-v12 .pc-child-rail {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 18px;
          height: 64px;
          overflow: hidden;
          border-top: 1px solid #303531;
          background: #090b0a;
          z-index: 9;
        }

        .ixi-personnel-v12 .pc-child-rail .ixi-collection-thumb-rail {
          height: 64px;
          gap: 5px;
          padding: 5px 7px 6px;
          background:
            linear-gradient(180deg, rgba(255,255,255,.018), transparent),
            #090b0a;
        }

        .ixi-personnel-v12 .pc-child-rail .ixi-collection-thumb {
          flex: 0 0 57px;
          min-width: 57px;
          border-color: #2f3431;
          background:
            linear-gradient(180deg, rgba(255,255,255,.025), transparent),
            #101210;
        }

        .ixi-personnel-v12 .pc-child-rail .ixi-collection-thumb.active {
          border-color: rgba(255,196,0,.80);
          box-shadow:
            inset 0 0 0 1px rgba(255,196,0,.08),
            0 0 8px rgba(255,196,0,.08);
        }

        .ixi-personnel-v12 .pc-bottom-rail {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 18px;
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          align-items: center;
          border-top: 1px solid #26302a;
          background:
            linear-gradient(180deg, rgba(255,255,255,.02), transparent),
            #0b0d0c;
        }

        .ixi-personnel-v12 .pc-bottom-rail span {
          position: relative;
          height: 100%;
          border-right: 1px solid rgba(255,255,255,.035);
        }

        .ixi-personnel-v12 .pc-bottom-rail span:last-child {
          border-right: 0;
        }

        .ixi-personnel-v12 .pc-bottom-rail span::after {
          content: "";
          position: absolute;
          top: 7px;
          left: 50%;
          width: 13px;
          height: 4px;
          border-radius: 3px;
          background: #444846;
          transform: translateX(-50%);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.10);
        }

        /* =====================================================
           VARIANT-SPECIFIC RELATIONSHIP CAPACITY
           ===================================================== */

        .ixi-personnel-card-001 .pc-relationships {
          min-height: 77px;
        }

        .ixi-personnel-card-002 .pc-relationships {
          min-height: 80px;
        }

        .ixi-personnel-card-003 .pc-relationships {
          min-height: 72px;
        }
      `}</style>
    </div>
  );
}

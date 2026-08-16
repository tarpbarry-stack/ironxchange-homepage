import { useEffect, useMemo, useState } from "react";

import IXICollectionThumbRail from "../../../ixi-object-system/IXICollectionThumbRail";
import IXIAosCardHeaderControls from "../../card-runtime/modules/IXIAosCardHeaderControls";

const clean = value => String(value ?? "").trim();
const asArray = value => Array.isArray(value) ? value : [];

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
  return clean(object?.objectId || object?.id?.uuid || object?.id);
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
  const first = media.find(Boolean);

  if (typeof first === "string") return clean(first);

  return clean(
    first?.url ||
    first?.src ||
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
    getObjectId(object)
  );
}

function getEmploymentStatus(object = {}) {
  const fields = getFields(object);
  const metadata = getMetadata(object);
  return clean(
    fields?.employmentStatus ||
    metadata?.employmentStatus ||
    object?.status ||
    "ACTIVE"
  ).toUpperCase();
}

function getDepartment(object = {}) {
  const fields = getFields(object);
  const metadata = getMetadata(object);
  return clean(fields?.department || metadata?.department || "UNASSIGNED").toUpperCase();
}

function getEmployeeLocation(object = {}) {
  const fields = getFields(object);
  const metadata = getMetadata(object);
  return clean(
    fields?.primaryLocation ||
    fields?.location ||
    fields?.yard ||
    metadata?.primaryLocation ||
    metadata?.location
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
      if (typeof item === "string") return clean(item);
      return clean(item?.label || item?.name || item?.type || item?.capability);
    })
    .filter(Boolean);
}

function countValues(values = []) {
  return values.reduce((output, value) => {
    const key = clean(value).toUpperCase();
    if (!key) return output;
    output[key] = (output[key] || 0) + 1;
    return output;
  }, {});
}

function sortedEntries(counts = {}) {
  return Object.entries(counts).sort((a, b) => {
    if (a[1] !== b[1]) return b[1] - a[1];
    return a[0].localeCompare(b[0]);
  });
}

function readRelationshipValue(object = {}, needles = [], fallback = "—") {
  const relationships = asArray(object?.relationships);
  const fields = getFields(object);

  for (const needle of needles) {
    const normalizedNeedle = clean(needle).toLowerCase();
    const match = relationships.find(relationship => {
      const key = clean(
        relationship?.label ||
        relationship?.displayLabel ||
        relationship?.type ||
        relationship?.relationshipType ||
        relationship?.name
      ).toLowerCase();
      return key.includes(normalizedNeedle);
    });

    if (match) {
      return clean(
        match?.value ||
        match?.displayName ||
        match?.targetDisplayName ||
        match?.targetLabel
      ) || fallback;
    }
  }

  for (const needle of needles) {
    if (clean(fields?.[needle])) return clean(fields[needle]);
  }

  return fallback;
}

function PersonMark() {
  return (
    <div className="pc004-people-mark" aria-label="People">
      <div className="pc004-ixi-badge">IXI</div>
      <div className="pc004-people-silhouette" aria-hidden="true">
        <span className="person person-left"><i /><b /></span>
        <span className="person person-center"><i /><b /></span>
        <span className="person person-right"><i /><b /></span>
      </div>
    </div>
  );
}

function ScrollShell({ title, className = "", children }) {
  return (
    <section className={`pc004-shell ${className}`.trim()}>
      <div className="pc004-shell-title">{title}</div>
      <div className="pc004-shell-scroll">{children}</div>
    </section>
  );
}

function DistributionRow({ label, value, maximum }) {
  const max = Math.max(1, Number(maximum || 0));
  const numericValue = Number(value || 0);
  const percent = Math.max(
    numericValue > 0 ? 6 : 0,
    Math.min(100, Math.round((numericValue / max) * 100))
  );

  return (
    <div className="pc004-distribution-row">
      <span>{label}</span>
      <i aria-hidden="true"><b style={{ width: `${percent}%` }} /></i>
      <strong>{numericValue}</strong>
    </div>
  );
}

function CommandStrip({ object, onRecall, onBoard, onReturn }) {
  function invoke(event, callback) {
    event.preventDefault();
    event.stopPropagation();
    callback?.(object);
  }

  return (
    <div className="pc004-command-strip">
      <button type="button" onClick={event => invoke(event, onRecall)}>
        <span>↻</span><b>RECALL</b>
      </button>
      <button type="button" onClick={event => invoke(event, onBoard)}>
        <span>▦</span><b>BOARD</b>
      </button>
      <button type="button" onClick={event => invoke(event, onReturn)}>
        <span>↩</span><b>RETURN</b>
      </button>
    </div>
  );
}

export default function IXIAosCard004PersonnelV12({
  object = {},
  children = [],
  onAddObject = null,
  onEdit = null,
  onSaveObject = null,
  onHideObject = null,
  onDeleteObject = null,
  onOpenConsole = null,
  onOpenTransact = null,
  onRecall = null,
  onBoard = null,
  onReturn = null,
  onExposeObject = null
}) {
  const [localObject, setLocalObject] = useState(object);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draftName, setDraftName] = useState(getDisplayName(object));
  const [draftCompany, setDraftCompany] = useState(
    readRelationshipValue(object, ["company", "employer"], clean(getFields(object)?.company))
  );
  const [activeChildIndex, setActiveChildIndex] = useState(0);

  useEffect(() => {
    setLocalObject(object);
    if (!editing) {
      setDraftName(getDisplayName(object));
      setDraftCompany(
        readRelationshipValue(object, ["company", "employer"], clean(getFields(object)?.company))
      );
    }
  }, [object, editing]);

  const people = useMemo(() => asArray(children).filter(Boolean), [children]);

  const statusCounts = useMemo(
    () => countValues(people.map(getEmploymentStatus)),
    [people]
  );

  const departments = useMemo(
    () => sortedEntries(countValues(people.map(getDepartment))),
    [people]
  );

  const capabilities = useMemo(
    () => sortedEntries(countValues(people.flatMap(getCapabilityLabels))),
    [people]
  );

  const locations = useMemo(
    () => sortedEntries(countValues(people.map(getEmployeeLocation).filter(Boolean))),
    [people]
  );

  const total = people.length;
  const active = Number(statusCounts.ACTIVE || 0) + Number(statusCounts.WORKING || 0) + Number(statusCounts["ON DUTY"] || 0);
  const offDuty = Number(statusCounts["OFF DUTY"] || 0) + Number(statusCounts.INACTIVE || 0);
  const maxCapability = Math.max(1, ...capabilities.map(([, value]) => Number(value || 0)));

  const fields = getFields(localObject);
  const metadata = getMetadata(localObject);
  const containerTitle = getDisplayName(localObject);
  const containerEyebrow = clean(
    fields?.containerLabel ||
    localObject?.pluralLabel ||
    metadata?.pluralLabel ||
    metadata?.nomenclature?.plural
  ) || "EMPLOYEES";

  const company = draftCompany || readRelationshipValue(
    localObject,
    ["company", "employer"],
    clean(fields?.company) || "—"
  );

  const openJobs = Number(fields?.openJobs ?? metadata?.openJobs ?? 0) || 0;
  const teams = Number(fields?.teams ?? fields?.crews ?? metadata?.teams ?? metadata?.crews ?? 0) || 0;
  const safeActiveIndex = Math.min(activeChildIndex, Math.max(0, total - 1));

  function beginEdit() {
    setDraftName(containerTitle);
    setDraftCompany(company === "—" ? "" : company);
    setEditing(true);
    onEdit?.(localObject);
  }

  async function saveEdit() {
    if (saving) return;
    setSaving(true);

    const nextObject = {
      ...localObject,
      displayName: clean(draftName) || containerTitle,
      fields: {
        ...fields,
        company: clean(draftCompany)
      }
    };

    try {
      await onSaveObject?.({
        objectId: getObjectId(nextObject),
        object: nextObject,
        displayName: nextObject.displayName,
        fields: nextObject.fields,
        media: asArray(nextObject.media)
      });
      setLocalObject(nextObject);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit() {
    setDraftName(containerTitle);
    setDraftCompany(company === "—" ? "" : company);
    setEditing(false);
  }

  return (
    <article className="ixi-personnel-004-v12" data-card-number="004">
      <header className="pc004-header">
        <div className="pc004-identity">
          <span className="pc004-eyebrow"><i>IXI</i>{containerEyebrow}</span>
          {editing ? (
            <input
              className="pc004-title-input"
              value={draftName}
              onPointerDown={event => event.stopPropagation()}
              onChange={event => setDraftName(event.target.value)}
            />
          ) : (
            <h2>{containerTitle}</h2>
          )}
        </div>

        {editing ? (
          <div className="pc004-edit-actions">
            <button type="button" disabled={saving} onClick={saveEdit}>SAVE</button>
            <button type="button" disabled={saving} onClick={cancelEdit}>CANCEL</button>
          </div>
        ) : (
          <IXIAosCardHeaderControls
            canAdd
            canEdit
            canTransact
            onAdd={() => onAddObject?.(localObject)}
            onToggleEdit={beginEdit}
            onTransact={() => onOpenTransact?.(localObject)}
            onHide={onHideObject}
            onDelete={onDeleteObject}
            onOpenConsole={onOpenConsole}
          />
        )}
      </header>

      <main className="pc004-content">
        <section className="pc004-hero">
          <PersonMark />

          <div className="pc004-total">
            <small>TOTAL PEOPLE</small>
            <strong>{total}</strong>
          </div>

          <div className="pc004-status">
            <div><small>ACTIVE</small><strong className="positive">{active}</strong></div>
            <div><small>OFF DUTY</small><strong>{offDuty}</strong></div>
          </div>
        </section>

        <ScrollShell title="WORKFORCE SUMMARY" className="pc004-workforce">
          <div className="pc004-summary-grid">
            {departments.length ? departments.map(([label, value]) => (
              <div className="pc004-summary-row" key={label}>
                <span>{label}</span><strong>{value}</strong>
              </div>
            )) : <div className="pc004-empty">NO WORKFORCE CATEGORIES</div>}
          </div>
        </ScrollShell>

        <ScrollShell title="CAPABILITY OVERVIEW" className="pc004-capabilities">
          <div className="pc004-capability-list">
            {capabilities.length ? capabilities.map(([label, value]) => (
              <DistributionRow
                key={label}
                label={label}
                value={value}
                maximum={maxCapability}
              />
            )) : <div className="pc004-empty">NO CAPABILITIES SAVED</div>}
          </div>
        </ScrollShell>

        <ScrollShell title="RELATIONSHIPS & INFRASTRUCTURE" className="pc004-relationships">
          <div className="pc004-relationship-list">
            <div className="pc004-relationship-row company-row">
              <span><i>IXI</i>COMPANY</span>
              {editing ? (
                <input
                  value={draftCompany}
                  placeholder="COMPANY NAME"
                  onPointerDown={event => event.stopPropagation()}
                  onChange={event => setDraftCompany(event.target.value)}
                />
              ) : (
                <strong>{company}</strong>
              )}
              <em>›</em>
            </div>

            {locations.length ? locations.map(([label, value]) => (
              <button type="button" className="pc004-relationship-row" key={label}>
                <span><i>⌖</i>LOCATION</span>
                <strong>{label} · {value}</strong>
                <em>›</em>
              </button>
            )) : (
              <div className="pc004-relationship-row">
                <span><i>⌖</i>LOCATIONS</span>
                <strong>—</strong>
                <em>›</em>
              </div>
            )}

            <button type="button" className="pc004-relationship-row">
              <span><i>▣</i>OPEN JOBS</span><strong>{openJobs}</strong><em>›</em>
            </button>

            <button type="button" className="pc004-relationship-row">
              <span><i>♟</i>TEAMS / CREWS</span><strong>{teams}</strong><em>›</em>
            </button>
          </div>
        </ScrollShell>
      </main>

      <CommandStrip
        object={localObject}
        onRecall={onRecall}
        onBoard={onBoard}
        onReturn={onReturn}
      />

      <div className="pc004-child-rail">
        <IXICollectionThumbRail
          items={people}
          activeItemIndex={safeActiveIndex}
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

      <div className="pc004-bottom-rail" aria-hidden="true">
        <span /><span /><span /><span /><span /><span /><span />
      </div>

      <style jsx global>{`
        .ixi-personnel-004-v12,
        .ixi-personnel-004-v12 * { box-sizing: border-box; }

        .ixi-personnel-004-v12 {
          --yellow:#ffc400;
          --cyan:#16c7ff;
          --green:#79d83b;
          --bg:#090b0a;
          --shell:#101310;
          --raised:#151916;
          --line:#343a35;
          --line-soft:#262c27;
          --text:#f4f5f4;
          --muted:#969d98;
          position:relative;
          width:298px;
          height:471px;
          overflow:hidden;
          border:1px solid #454b47;
          border-radius:13px;
          background:linear-gradient(180deg,rgba(255,255,255,.025),transparent 24%),var(--bg);
          color:var(--text);
          font-family:Arial,Helvetica,sans-serif;
          box-shadow:inset 0 1px 0 rgba(255,255,255,.075),inset 0 -1px 0 rgba(0,0,0,.72),0 18px 40px rgba(0,0,0,.48);
        }

        .ixi-personnel-004-v12 button,
        .ixi-personnel-004-v12 input { font:inherit; }

        .pc004-header {
          position:absolute;inset:0 0 auto 0;height:43px;padding:7px 10px 6px;
          border-bottom:1px solid #303531;background:linear-gradient(180deg,rgba(255,255,255,.035),transparent),#101210;z-index:20;
        }

        .pc004-identity{min-width:0;max-width:194px}.pc004-eyebrow{display:flex;align-items:center;gap:5px;height:8px;color:var(--yellow);font-size:6px;font-weight:950;letter-spacing:.16px}.pc004-eyebrow i{display:grid;place-items:center;height:11px;padding:0 3px;border:1px solid rgba(255,196,0,.35);border-radius:2px;background:#191a12;color:var(--yellow);font-size:5px;font-style:normal}.pc004-identity h2{max-width:194px;margin:4px 0 0;overflow:hidden;color:#f6f7f6;font-size:14px;font-weight:950;line-height:1;text-overflow:ellipsis;white-space:nowrap}.pc004-title-input{width:190px;height:21px;margin-top:2px;padding:0 6px;border:1px solid rgba(255,196,0,.45);border-radius:3px;background:#0b0d0c;color:#fff;font-size:10px;font-weight:900;outline:none}.pc004-edit-actions{position:absolute;top:10px;right:8px;display:flex;gap:3px}.pc004-edit-actions button{height:21px;padding:0 7px;border:1px solid #343a35;border-radius:3px;background:#121512;color:#c9cecb;font-size:5.5px;font-weight:950}.pc004-edit-actions button:first-child{border-color:rgba(255,196,0,.42);color:var(--yellow)}

        .pc004-content{position:absolute;top:43px;left:7px;right:7px;bottom:111px;display:flex;flex-direction:column;gap:5px;padding-top:5px;overflow:hidden}

        .pc004-hero{flex:0 0 59px;height:59px;display:grid;grid-template-columns:1.18fr .92fr 1fr;overflow:hidden;border:1px solid var(--line);border-radius:5px;background:linear-gradient(180deg,rgba(255,255,255,.018),transparent),var(--shell);box-shadow:inset 0 1px 0 rgba(255,255,255,.035)}.pc004-hero>div{min-width:0;border-right:1px solid var(--line-soft)}.pc004-hero>div:last-child{border-right:0}

        .pc004-people-mark{position:relative;display:flex;align-items:center;justify-content:center;overflow:hidden}.pc004-ixi-badge{position:absolute;left:7px;top:6px;height:12px;display:grid;place-items:center;padding:0 4px;border:1px solid rgba(255,196,0,.35);border-radius:2px;background:#11130d;color:var(--yellow);font-size:5px;font-weight:950;letter-spacing:.4px}.pc004-people-silhouette{position:absolute;left:17px;right:12px;bottom:7px;height:34px}.person{position:absolute;bottom:0;width:27px;height:32px}.person i{position:absolute;top:0;left:8px;width:11px;height:11px;border-radius:50%;background:#d5d9d6}.person b{position:absolute;left:2px;bottom:0;width:23px;height:20px;border-radius:12px 12px 4px 4px;background:linear-gradient(180deg,#bfc5c1,#747b77)}.person-left{left:0;transform:scale(.78);opacity:.72}.person-center{left:21px;z-index:2}.person-right{left:43px;transform:scale(.82);opacity:.78}.person-center i{background:#f1f3f2}.person-center b{background:linear-gradient(180deg,#f0c649,#b98500)}

        .pc004-total,.pc004-status{display:flex;flex-direction:column;justify-content:center;padding:6px 8px}.pc004-total small,.pc004-status small{color:var(--muted);font-size:5px;font-weight:900;line-height:1}.pc004-total>strong{margin-top:4px;color:#fff;font-size:19px;font-weight:950;line-height:1}.pc004-status{gap:4px}.pc004-status>div{display:grid;grid-template-columns:1fr auto;align-items:center}.pc004-status strong{color:#fff;font-size:9px;font-weight:950}.pc004-status .positive{color:var(--green)}

        .pc004-shell{flex:0 0 auto;min-width:0;overflow:hidden;border:1px solid var(--line);border-radius:5px;background:linear-gradient(180deg,rgba(255,255,255,.018),transparent 22px),var(--shell);box-shadow:inset 0 1px 0 rgba(255,255,255,.035)}.pc004-shell-title{height:19px;display:flex;align-items:center;padding:0 6px;border-bottom:1px solid var(--line-soft);background:rgba(255,255,255,.012);color:var(--yellow);font-size:6px;font-weight:950;line-height:1;white-space:nowrap}.pc004-shell-scroll{height:calc(100% - 19px);overflow-y:auto;overflow-x:hidden;scrollbar-width:thin;scrollbar-color:#4b514d #0d100e}.pc004-shell-scroll::-webkit-scrollbar{width:4px}.pc004-shell-scroll::-webkit-scrollbar-track{background:#0d100e}.pc004-shell-scroll::-webkit-scrollbar-thumb{border-radius:4px;background:#4b514d}

        .pc004-workforce{height:65px}.pc004-capabilities{height:88px}.pc004-relationships{flex:1;min-height:71px}.pc004-summary-grid{display:grid;grid-template-columns:1fr 1fr;gap:0 8px;padding:2px 6px 3px}.pc004-summary-row{height:19px;display:flex;align-items:center;justify-content:space-between;min-width:0;border-bottom:1px solid var(--line-soft)}.pc004-summary-row span{overflow:hidden;color:#c7cbc8;font-size:6px;font-weight:800;text-overflow:ellipsis;white-space:nowrap}.pc004-summary-row strong{margin-left:5px;color:#fff;font-size:8px;font-weight:950}.pc004-empty{padding:10px 7px;color:#646b67;font-size:5.5px;font-weight:900}

        .pc004-distribution-row{height:13px;display:grid;grid-template-columns:minmax(0,104px) 1fr 18px;align-items:center;gap:5px;padding:0 6px;border-bottom:1px solid var(--line-soft)}.pc004-distribution-row>span{overflow:hidden;color:#c9cdca;font-size:5.5px;font-weight:800;text-overflow:ellipsis;white-space:nowrap}.pc004-distribution-row>i{height:4px;overflow:hidden;border-radius:2px;background:#292d2a;box-shadow:inset 0 1px 1px rgba(0,0,0,.55)}.pc004-distribution-row>i>b{display:block;height:100%;border-radius:2px;background:linear-gradient(90deg,#f7b900,var(--yellow))}.pc004-distribution-row>strong{color:#fff;font-size:7px;font-weight:950;text-align:right}

        .pc004-relationship-row{width:100%;height:19px;display:grid;grid-template-columns:88px 1fr 10px;align-items:center;gap:4px;padding:0 6px;border:0;border-bottom:1px solid var(--line-soft);background:transparent;color:#fff;text-align:left}.pc004-relationship-row>span{display:flex;align-items:center;gap:4px;overflow:hidden;color:#adb4b0;font-size:5.4px;font-weight:900;white-space:nowrap}.pc004-relationship-row>span i{width:12px;color:var(--cyan);font-size:6px;font-style:normal;text-align:center}.pc004-relationship-row>strong{overflow:hidden;color:#f1f3f2;font-size:5.7px;font-weight:900;text-align:right;text-overflow:ellipsis;white-space:nowrap}.pc004-relationship-row>em{color:var(--cyan);font-size:10px;font-style:normal;text-align:right}.pc004-relationship-row input{width:100%;height:14px;padding:0 4px;border:1px solid rgba(255,196,0,.35);border-radius:2px;background:#090b0a;color:#fff;font-size:5.7px;font-weight:900;outline:none}.pc004-relationship-row.company-row>span i{color:var(--yellow);font-size:5px;font-weight:950}

        .pc004-command-strip{position:absolute;left:7px;right:7px;bottom:82px;height:24px;display:grid;grid-template-columns:repeat(3,1fr);overflow:hidden;border:1px solid #303632;border-radius:4px;background:#0d100e}.pc004-command-strip button{display:flex;align-items:center;justify-content:center;gap:5px;border:0;border-right:1px solid #2b302c;background:transparent;color:var(--cyan);cursor:pointer}.pc004-command-strip button:last-child{border-right:0}.pc004-command-strip button span{font-size:7px}.pc004-command-strip button b{color:#e7e9e8;font-size:6px;font-weight:950}

        .pc004-child-rail{position:absolute;left:0;right:0;bottom:18px;height:64px;overflow:hidden;border-top:1px solid #303632}.pc004-bottom-rail{position:absolute;left:0;right:0;bottom:0;height:18px;display:grid;grid-template-columns:repeat(7,1fr);align-items:end;border-top:1px solid #282d29;background:#080a09}.pc004-bottom-rail span{height:5px;border-right:1px solid #1c201d;background:#111411}.pc004-bottom-rail span:nth-child(4){background:#392f05;box-shadow:inset 0 1px var(--yellow)}
      `}</style>
    </article>
  );
}

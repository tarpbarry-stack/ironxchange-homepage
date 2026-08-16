import IXIAosCardHeaderControls
  from "../../card-runtime/modules/IXIAosCardHeaderControls";

function clean(value) {
  return String(value ?? "").trim();
}

function objectFields(object = {}) {
  return object?.fields && typeof object.fields === "object"
    ? object.fields
    : {};
}

function objectMetadata(object = {}) {
  return object?.metadata && typeof object.metadata === "object"
    ? object.metadata
    : {};
}

function getDisplayName(object = {}) {
  const fields = objectFields(object);

  return (
    clean(object?.displayName) ||
    clean(object?.label) ||
    clean(fields?.displayName) ||
    clean(fields?.name) ||
    "EMPLOYEE"
  );
}

function getEmployeeLabel(object = {}) {
  const fields = objectFields(object);
  const metadata = objectMetadata(object);

  return (
    clean(object?.singularLabel) ||
    clean(fields?.singularLabel) ||
    clean(metadata?.nomenclature?.singular) ||
    clean(fields?.objectLabel) ||
    "EMPLOYEE"
  );
}

function getStatus(object = {}) {
  const fields = objectFields(object);

  return (
    clean(fields?.employmentStatus) ||
    clean(object?.status) ||
    "ACTIVE"
  ).toUpperCase();
}

function getPhotoUrl(object = {}) {
  const fields = objectFields(object);
  const media = Array.isArray(object?.media) ? object.media : [];

  for (const item of media) {
    const url =
      typeof item === "string"
        ? clean(item)
        : clean(item?.url || item?.src);

    if (url) return url;
  }

  return clean(fields?.photoUrl || fields?.imageUrl);
}

function getInitials(name = "") {
  const parts = clean(name)
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "IX";

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function getRelationships(object = {}) {
  const source = Array.isArray(object?.relationships)
    ? object.relationships
    : [];

  return source
    .map((relationship, index) => ({
      id:
        clean(relationship?.id) ||
        clean(relationship?.relationshipId) ||
        `employee-relationship-${index}`,
      label:
        clean(relationship?.displayLabel) ||
        clean(relationship?.label) ||
        clean(relationship?.relationshipLabel) ||
        clean(relationship?.type) ||
        "RELATIONSHIP",
      value:
        clean(relationship?.displayName) ||
        clean(relationship?.value) ||
        clean(relationship?.targetDisplayName) ||
        clean(relationship?.targetLabel) ||
        "—",
      secondary:
        clean(relationship?.secondary) ||
        clean(relationship?.subtitle) ||
        ""
    }))
    .filter(item => item.label || item.value);
}

function relationshipGlyph(label = "") {
  const normalized = clean(label).toLowerCase();

  if (normalized.includes("report") || normalized.includes("supervisor")) {
    return "♙";
  }

  if (normalized.includes("team") || normalized.includes("crew")) {
    return "♟";
  }

  if (normalized.includes("location") || normalized.includes("yard")) {
    return "⌖";
  }

  if (normalized.includes("department") || normalized.includes("group")) {
    return "⌘";
  }

  return "◇";
}

export default function IXIAosCard007Employee({
  object = {},
  onEdit = null,
  onHideObject = null,
  onDeleteObject = null,
  onOpenConsole = null,
  onOpenTransact = null,
  onMessage = null,
  onCall = null,
  onEmail = null,
  onRecords = null,
  skinId = "v12",
  onSkinChange = null
}) {
  const fields = objectFields(object);
  const displayName = getDisplayName(object);
  const employeeLabel = getEmployeeLabel(object);
  const status = getStatus(object);
  const photoUrl = getPhotoUrl(object);
  const relationships = getRelationships(object).slice(0, 4);

  const role =
    clean(fields?.jobTitle) ||
    clean(fields?.role) ||
    clean(fields?.position) ||
    "—";

  const employeeId =
    clean(fields?.employeeNumber) ||
    clean(fields?.employeeId) ||
    clean(object?.employeeId) ||
    "—";

  const department =
    clean(fields?.department) ||
    clean(fields?.workGroup) ||
    "—";

  const locationName =
    clean(fields?.primaryLocation) ||
    clean(fields?.location) ||
    clean(fields?.yard) ||
    "—";

  const locationSecondary =
    [clean(fields?.city), clean(fields?.state)]
      .filter(Boolean)
      .join(", ");

  const phone =
    clean(fields?.workPhone) ||
    clean(fields?.phone) ||
    "—";

  const email =
    clean(fields?.workEmail) ||
    clean(fields?.email) ||
    "—";

  const isActive =
    ["active", "working", "available"].includes(status.toLowerCase());

  function stop(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
  }

  function invoke(event, callback, value = object) {
    stop(event);
    callback?.(value);
  }

  return (
    <article
      className="ixi-card-007-employee"
      data-card-number="007"
      data-card-family="employee"
      data-card-skin={skinId || "v12"}
    >
      <header className="employee-header">
        <div className="employee-header-identity">
          <div className="employee-header-icon" aria-hidden="true">
            ♙
          </div>

          <div className="employee-header-copy">
            <span>{employeeLabel}</span>
          </div>
        </div>

        <div
          className={`employee-status ${isActive ? "is-active" : ""}`}
          title="Employment status"
        >
          <i aria-hidden="true" />
          <b>{status}</b>
        </div>

        <IXIAosCardHeaderControls
          canEdit={typeof onEdit === "function"}
          canTransact={false}
          onToggleEdit={() => onEdit?.(object)}
          onHide={onHideObject}
          onDelete={onDeleteObject}
          onOpenConsole={onOpenConsole}
          skinId={skinId}
          onSkinChange={onSkinChange}
        />
      </header>

      <section className="employee-identity-panel">
        <div className="employee-photo-shell">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={displayName}
              draggable={false}
            />
          ) : (
            <div className="employee-photo-placeholder">
              <span>{getInitials(displayName)}</span>
              <small>EMPLOYEE PHOTO</small>
            </div>
          )}

          <div className={`photo-status ${isActive ? "is-active" : ""}`}>
            {status}
          </div>
        </div>

        <div className="employee-identity-copy">
          <h2>{displayName}</h2>
          <p>{role}</p>

          <div className="identity-fact employee-number">
            <span className="fact-icon">▣</span>
            <div>
              <strong>{employeeId}</strong>
              <small>EMPLOYEE ID</small>
            </div>
          </div>

          <div className="identity-divider" />

          <div className="identity-fact">
            <span className="fact-icon">⌘</span>
            <div>
              <strong>{department}</strong>
              <small>DEPARTMENT</small>
            </div>
          </div>

          <div className="identity-fact location-fact">
            <span className="fact-icon">⌖</span>
            <div>
              <strong>{locationName}</strong>
              {locationSecondary ? (
                <small>{locationSecondary}</small>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="employee-contact-panel">
        <button
          type="button"
          className="contact-cell"
          onClick={event => invoke(event, onCall, phone)}
        >
          <span className="contact-icon">☎</span>
          <div>
            <small>WORK PHONE</small>
            <strong>{phone}</strong>
          </div>
        </button>

        <button
          type="button"
          className="contact-cell"
          onClick={event => invoke(event, onEmail, email)}
        >
          <span className="contact-icon">✉</span>
          <div>
            <small>WORK EMAIL</small>
            <strong>{email}</strong>
          </div>
        </button>
      </section>

      <section className="employee-relationships-panel">
        <div className="section-heading">
          <span className="section-icon">⌘</span>
          <h3>RELATIONSHIPS &amp; ASSOCIATIONS</h3>
        </div>

        <div className="relationship-list">
          {relationships.length ? (
            relationships.map(relationship => (
              <button
                key={relationship.id}
                type="button"
                className="relationship-row"
                onClick={event => stop(event)}
              >
                <span className="relationship-icon">
                  {relationshipGlyph(relationship.label)}
                </span>

                <span className="relationship-copy">
                  <small>{relationship.label}</small>
                  <strong>{relationship.value}</strong>
                  {relationship.secondary ? (
                    <em>{relationship.secondary}</em>
                  ) : null}
                </span>

                <span className="relationship-arrow">›</span>
              </button>
            ))
          ) : (
            <div className="relationship-empty">
              NO RELATIONSHIPS SAVED
            </div>
          )}
        </div>
      </section>

      <nav className="employee-action-strip" aria-label="Employee actions">
        <button
          type="button"
          onClick={event => invoke(event, onOpenTransact)}
        >
          <span>$</span>
          <b>TRAN$ACT</b>
        </button>

        <button
          type="button"
          onClick={event => invoke(event, onMessage)}
        >
          <span>▢</span>
          <b>MESSAGE</b>
        </button>

        <button
          type="button"
          onClick={event => invoke(event, onCall, phone)}
        >
          <span>☎</span>
          <b>CALL</b>
        </button>

        <button
          type="button"
          onClick={event => invoke(event, onEmail, email)}
        >
          <span>✉</span>
          <b>EMAIL</b>
        </button>

        <button
          type="button"
          onClick={event => invoke(event, onRecords)}
        >
          <span>▱</span>
          <b>RECORDS</b>
        </button>
      </nav>

      <div className="ixi-card-rail" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>

      <style jsx>{`
        .ixi-card-007-employee,
        .ixi-card-007-employee * {
          box-sizing: border-box;
        }

        .ixi-card-007-employee {
          --yellow: #ffc400;
          --green: #7bcf2a;
          --cyan: #16c7ff;
          --panel: #121615;
          --panel-raised: #171b1a;
          --line: rgba(207, 217, 214, .17);
          --line-soft: rgba(207, 217, 214, .09);
          --primary: #f3f5f4;
          --secondary: #aeb5b2;
          --muted: #747b78;

          position: relative;
          width: 298px;
          height: 471px;
          overflow: hidden;

          border: 1px solid #505653;
          border-radius: 13px;

          background:
            radial-gradient(
              circle at 82% 12%,
              rgba(23, 73, 94, .13),
              transparent 27%
            ),
            linear-gradient(180deg, #101413 0%, #080b0a 100%);

          color: var(--primary);
          font-family:
            Arial,
            Helvetica,
            sans-serif;

          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, .08),
            inset 0 0 0 1px rgba(0, 0, 0, .30),
            0 18px 42px rgba(0, 0, 0, .48);
        }

        .employee-header {
          position: relative;
          height: 42px;
          display: flex;
          align-items: center;
          padding: 0 10px;

          border-bottom: 1px solid var(--line);
          background:
            linear-gradient(180deg, #171b1a 0%, #101312 100%);
        }

        .employee-header-identity {
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
        }

        .employee-header-icon {
          display: grid;
          place-items: center;
          width: 17px;
          height: 17px;
          color: var(--green);
          font-size: 14px;
          line-height: 1;
        }

        .employee-header-copy span {
          display: block;
          color: #e8ebea;
          font-size: 11px;
          line-height: 1;
          font-weight: 900;
          letter-spacing: .8px;
        }

        .employee-status {
          position: absolute;
          top: 9px;
          right: 83px;
          height: 24px;
          max-width: 82px;
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 0 9px;

          border: 1px solid rgba(255, 255, 255, .16);
          border-radius: 12px;
          background: #101312;
          color: #b8bfbc;
        }

        .employee-status i {
          width: 7px;
          height: 7px;
          flex: 0 0 auto;
          border-radius: 50%;
          background: #747b78;
        }

        .employee-status b {
          overflow: hidden;
          font-size: 7px;
          line-height: 1;
          letter-spacing: .35px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .employee-status.is-active {
          border-color: rgba(123, 207, 42, .52);
          color: #f3f6f1;
        }

        .employee-status.is-active i {
          background: var(--green);
          box-shadow: 0 0 7px rgba(123, 207, 42, .35);
        }

        .employee-identity-panel {
          height: 132px;
          display: grid;
          grid-template-columns: 104px 1fr;
          gap: 10px;
          padding: 9px 10px;
        }

        .employee-photo-shell {
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, .12);
          border-radius: 8px;
          background:
            linear-gradient(145deg, #1a201e, #0c0f0e);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, .05),
            0 4px 14px rgba(0, 0, 0, .26);
        }

        .employee-photo-shell img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }

        .employee-photo-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 5px;
          background:
            radial-gradient(
              circle at 50% 34%,
              rgba(255, 196, 0, .09),
              transparent 26%
            ),
            linear-gradient(145deg, #1b201e, #0d100f);
        }

        .employee-photo-placeholder span {
          color: #dfe4e1;
          font-size: 27px;
          line-height: 1;
          font-weight: 900;
          letter-spacing: -1px;
        }

        .employee-photo-placeholder small {
          color: var(--muted);
          font-size: 4.5px;
          font-weight: 900;
          letter-spacing: .45px;
        }

        .photo-status {
          position: absolute;
          left: 6px;
          bottom: 6px;
          max-width: 86px;
          overflow: hidden;
          padding: 3px 5px;
          border: 1px solid rgba(255, 255, 255, .13);
          border-radius: 4px;
          background: rgba(5, 7, 6, .88);
          color: #aeb5b2;
          font-size: 5.5px;
          font-weight: 950;
          letter-spacing: .3px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .photo-status.is-active {
          border-color: rgba(123, 207, 42, .33);
          color: var(--green);
        }

        .employee-identity-copy {
          min-width: 0;
          padding-top: 1px;
        }

        .employee-identity-copy h2 {
          margin: 0;
          overflow: hidden;
          color: #ffffff;
          font-size: 20px;
          line-height: 1.02;
          font-weight: 900;
          letter-spacing: -.6px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .employee-identity-copy > p {
          margin: 4px 0 7px;
          overflow: hidden;
          color: #c3c9c6;
          font-size: 8px;
          line-height: 1.15;
          font-weight: 700;
          letter-spacing: .3px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .identity-fact {
          min-height: 24px;
          display: grid;
          grid-template-columns: 20px 1fr;
          align-items: center;
          gap: 5px;
        }

        .identity-fact .fact-icon {
          color: #abb4b0;
          font-size: 15px;
          line-height: 1;
          text-align: center;
        }

        .identity-fact strong {
          display: block;
          overflow: hidden;
          color: #e4e8e6;
          font-size: 8px;
          line-height: 1.1;
          font-weight: 800;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .identity-fact small {
          display: block;
          margin-top: 2px;
          overflow: hidden;
          color: var(--muted);
          font-size: 5px;
          line-height: 1;
          font-weight: 750;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .identity-divider {
          height: 1px;
          margin: 2px 0 2px 25px;
          background: var(--line);
        }

        .employee-contact-panel {
          height: 49px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          margin: 0 10px;
          overflow: hidden;

          border: 1px solid var(--line);
          border-radius: 7px;
          background:
            linear-gradient(180deg, #161a19 0%, #111514 100%);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, .035);
        }

        .contact-cell {
          min-width: 0;
          display: grid;
          grid-template-columns: 28px 1fr;
          align-items: center;
          gap: 5px;
          padding: 0 8px;

          border: 0;
          border-right: 1px solid var(--line);
          background: transparent;
          color: inherit;
          text-align: left;
          cursor: pointer;
        }

        .contact-cell:last-child {
          border-right: 0;
        }

        .contact-cell:hover {
          background: rgba(255, 255, 255, .025);
        }

        .contact-icon {
          color: var(--green);
          font-size: 20px;
          line-height: 1;
          text-align: center;
        }

        .contact-cell small {
          display: block;
          color: #89918d;
          font-size: 5px;
          line-height: 1;
          font-weight: 800;
        }

        .contact-cell strong {
          display: block;
          margin-top: 4px;
          overflow: hidden;
          color: #f1f3f2;
          font-size: 8px;
          line-height: 1;
          font-weight: 800;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .employee-relationships-panel {
          position: absolute;
          top: 231px;
          left: 10px;
          right: 10px;
          height: 165px;
          overflow: hidden;

          border: 1px solid var(--line);
          border-radius: 7px;
          background:
            linear-gradient(180deg, #141817 0%, #0e1211 100%);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, .035),
            0 5px 18px rgba(0, 0, 0, .16);
        }

        .section-heading {
          height: 34px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 10px;
          border-bottom: 1px solid var(--line);
        }

        .section-icon {
          color: var(--green);
          font-size: 16px;
          line-height: 1;
        }

        .section-heading h3 {
          margin: 0;
          color: #eef1ef;
          font-size: 8px;
          line-height: 1;
          font-weight: 900;
          letter-spacing: .5px;
        }

        .relationship-list {
          padding: 6px 7px;
        }

        .relationship-row {
          width: 100%;
          height: 29px;
          display: grid;
          grid-template-columns: 28px 1fr 13px;
          align-items: center;
          padding: 0;

          border: 0;
          border-bottom: 1px solid var(--line-soft);
          background: transparent;
          color: inherit;
          text-align: left;
          cursor: pointer;
        }

        .relationship-row:last-child {
          border-bottom: 0;
        }

        .relationship-row:hover {
          background: rgba(255, 255, 255, .025);
        }

        .relationship-icon {
          display: grid;
          place-items: center;
          width: 28px;
          height: 100%;
          color: #bfc6c3;
          font-size: 16px;
        }

        .relationship-copy {
          min-width: 0;
        }

        .relationship-copy small {
          display: block;
          color: #89918d;
          font-size: 4.8px;
          line-height: 1;
          font-weight: 850;
          letter-spacing: .2px;
        }

        .relationship-copy strong {
          display: block;
          margin-top: 3px;
          overflow: hidden;
          color: #f0f2f1;
          font-size: 7px;
          line-height: 1;
          font-weight: 850;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .relationship-copy em {
          display: block;
          margin-top: 2px;
          overflow: hidden;
          color: #777e7b;
          font-size: 4.6px;
          line-height: 1;
          font-style: normal;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .relationship-arrow {
          color: #c7ceca;
          font-size: 17px;
          line-height: 1;
          text-align: center;
        }

        .relationship-empty {
          height: 110px;
          display: grid;
          place-items: center;
          color: #686f6c;
          font-size: 6px;
          font-weight: 900;
          letter-spacing: .35px;
        }

        .employee-action-strip {
          position: absolute;
          left: 7px;
          right: 7px;
          bottom: 18px;
          height: 50px;
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          overflow: hidden;

          border: 1px solid var(--line);
          border-radius: 7px 7px 0 0;
          background:
            linear-gradient(180deg, #151918 0%, #0d100f 100%);
        }

        .employee-action-strip button {
          min-width: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;

          border: 0;
          border-right: 1px solid var(--line);
          background: transparent;
          color: #dce1de;
          cursor: pointer;
        }

        .employee-action-strip button:last-child {
          border-right: 0;
        }

        .employee-action-strip button:hover {
          background: rgba(255, 255, 255, .025);
          color: #ffffff;
        }

        .employee-action-strip span {
          color: #c7ceca;
          font-size: 16px;
          line-height: 1;
        }

        .employee-action-strip button:first-child span {
          color: var(--green);
        }

        .employee-action-strip b {
          overflow: hidden;
          max-width: 100%;
          padding: 0 3px;
          font-size: 4.8px;
          line-height: 1;
          font-weight: 900;
          letter-spacing: .2px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .ixi-card-rail {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 18px;
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          align-items: center;
          justify-items: center;

          border-top: 1px solid rgba(22, 199, 255, .17);
          background:
            linear-gradient(180deg, #111412 0%, #0b0d0c 100%);
        }

        .ixi-card-rail i {
          width: 15px;
          height: 4px;
          border-radius: 4px;
          background: rgba(212, 218, 215, .26);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, .08);
        }
      `}</style>
    </article>
  );
}

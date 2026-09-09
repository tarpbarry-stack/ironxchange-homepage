import styles from "./IXITechnicalAtlas.module.css";

export const PASSPORT_ENVELOPES = Object.freeze([
  {
    id: "marketplace",
    index: "01",
    name: "MARKETPLACE",
    access: "PUBLIC",
    relation: "LISTED FOR SALE",
    authority: "SELLER CONTROLLED",
    route: "listingId → passportId",
    summary: "Public buyer surface with price, seller contact and distribution.",
    facts: ["Public discovery", "Buyer decision faces", "Seller remains authority"],
  },
  {
    id: "auction",
    index: "02",
    name: "AUCTION",
    access: "EVENT",
    relation: "ENTERED AS LOT",
    authority: "AUCTION TERMS",
    route: "lotId → passportId",
    summary: "Auction event data wraps the same machine identity as a temporary lot.",
    facts: ["Lot + event context", "Bid state is temporary", "Passport survives close"],
  },
  {
    id: "private",
    index: "03",
    name: "PRIVATE",
    access: "AUTHORIZED",
    relation: "OWNED / CONTROLLED",
    authority: "ENTITY PERMISSIONS",
    route: "objectId → passportId",
    summary: "Protected operations, records and TRAN$ACT attach through ownership and authority.",
    facts: ["Protected financials", "Operational records", "Ownership is a relationship"],
  },
  {
    id: "work",
    index: "04",
    name: "URL WORK",
    access: "NON-OWNED",
    relation: "WORKING REFERENCE",
    authority: "SOURCE RETAINED",
    route: "source URL → resolve → passportId",
    summary: "An imported source becomes a working reference without granting ownership or source control.",
    facts: ["Resolve before admission", "Source evidence retained", "No ownership implied"],
  },
]);

export function IXIAtlasPassportInspector({ envelope, detail, onDetailChange }) {
  const active = PASSPORT_ENVELOPES.find((item) => item.id === envelope) || PASSPORT_ENVELOPES[0];

  return (
    <div className={styles.passportInspector}>
      <div className={styles.inspectorIdentity}>
        <span>SELECTED COMPONENT</span><strong>02</strong><i>CANONICAL</i>
      </div>
      <p className={styles.inspectorCode}>IXI-ID-PASS / REV 1.1</p>
      <h2>IXI PASSPORT</h2>
      <p className={styles.inspectorShort}>Permanent identity beneath every commercial presentation.</p>
      <div className={styles.detailSwitch} aria-label="IXI Passport detail level">
        <button type="button" className={detail === "FIELD" ? styles.detailActive : ""} onClick={() => onDetailChange("FIELD")}>FIELD</button>
        <button type="button" className={detail === "ENGINEERING" ? styles.detailActive : ""} onClick={() => onDetailChange("ENGINEERING")}>ENGINEERING</button>
      </div>
      <section><h3>ACTIVE ENVELOPE</h3><p>{active.name} / {active.relation}</p></section>
      <section><h3>IDENTITY RULE</h3><p>One Object ↔ One Passport. A listing, lot, workspace placement or URL reference cannot create a second machine.</p></section>
      <section><h3>AUTHORITY RULE</h3><p>{active.authority}. Presentation and access may change; identity does not.</p></section>
      {detail === "ENGINEERING" && (
        <>
          <section><h3>ADMISSION RULE</h3><p>Resolve first. Admit only through an authorized creation event. Reject unresolved identities and collisions.</p></section>
          <section><h3>URL IMPORT RULE</h3><p>Parsing returns normalized evidence. It does not silently create a Passport, claim ownership or rewrite the source machine.</p></section>
          <section className={styles.inspectorSources}><h3>SOURCE OF TRUTH</h3><code>pages/p/[passportId].js</code><code>POST /mos/v1/identity/admit</code><code>pages/url-import.js</code></section>
        </>
      )}
    </div>
  );
}

export default function IXIAtlasPassportDrilldown({
  item,
  envelope,
  onSelectEnvelope,
  mode,
  onModeChange,
  onBack,
}) {
  const active = PASSPORT_ENVELOPES.find((entry) => entry.id === envelope) || PASSPORT_ENVELOPES[0];

  return (
    <div className={styles.passportDrilldown}>
      <div className={styles.passportDrillHeader}>
        <button type="button" className={styles.drillBack} onClick={onBack}>← BACK TO MACHINE CARD</button>
        <div><span>TA-001 / COMPONENT 02</span><b>IXI PASSPORT IDENTITY</b></div>
        <i>ONE OBJECT ↔ ONE PASSPORT</i>
      </div>

      <div className={styles.passportTelemetry}>
        <span>OBJECT <b>IXI-ATLAS-WA475</b></span>
        <span>PASSPORT <b>{item.passportId}</b></span>
        <span>ENVELOPE <b>{active.name}</b></span>
        <span>ACCESS <b>{active.access}</b></span>
        <i>IDENTITY VERIFIED</i>
      </div>

      <div className={styles.passportModeBar}>
        <div className={styles.modeSwitch} aria-label="Passport identity mode">
          {["INSPECT", "OPERATE"].map((value) => (
            <button key={value} type="button" className={mode === value ? styles.modeActive : ""}
              onClick={() => onModeChange(value)} aria-pressed={mode === value}>{value}</button>
          ))}
        </div>
        <span>SELECT AN ENVELOPE · THE PASSPORT NUMBER NEVER CHANGES</span>
      </div>

      <div className={styles.passportStage}>
        <section className={styles.passportObjectPlate}>
          <div className={styles.passportPhoto} style={{ backgroundImage: `url(${item.imageUrls?.[0] || ""})` }}>
            <span>CANONICAL MACHINE</span>
          </div>
          <div className={styles.passportMachineIdentity}>
            <span>OBJECT</span>
            <h3>{item.title}</h3>
            <dl>
              <div><dt>HOURS</dt><dd>{Number(item.hours).toLocaleString()}</dd></div>
              <div><dt>LOCATION</dt><dd>{item.location}</dd></div>
              <div><dt>CATEGORY</dt><dd>{item.category}</dd></div>
            </dl>
          </div>
        </section>

        <section className={styles.passportCore} aria-label={`Permanent Passport ${item.passportId}`}>
          <span>IXI MACHINE PASSPORT</span>
          <strong>{item.passportId}</strong>
          <i>PERMANENT IDENTITY</i>
          <div className={styles.passportCoreRule}>ONE OBJECT<br />ONE PASSPORT</div>
          <small>/p/{item.passportId}</small>
        </section>

        <section className={styles.passportEnvelopePlate}>
          <div className={styles.envelopeHeader}>
            <span>ACTIVE COMMERCIAL ENVELOPE</span>
            <b>{active.name}</b>
          </div>
          <p>{active.summary}</p>
          <dl>
            <div><dt>ACCESS</dt><dd>{active.access}</dd></div>
            <div><dt>RELATION</dt><dd>{active.relation}</dd></div>
            <div><dt>AUTHORITY</dt><dd>{active.authority}</dd></div>
            <div><dt>RESOLUTION</dt><dd>{active.route}</dd></div>
          </dl>
          <div className={styles.envelopeFacts}>{active.facts.map((fact) => <span key={fact}>{fact}</span>)}</div>
          {mode === "INSPECT" && (
            <div className={styles.identityInvariant}>
              <b>WHAT CHANGED</b><span>Envelope · relationship · permissions</span>
              <b>WHAT DID NOT</b><span>Machine · objectId · Passport</span>
            </div>
          )}
        </section>
      </div>

      <div className={styles.passportEnvelopeRail} aria-label="Passport commercial envelopes">
        {PASSPORT_ENVELOPES.map((entry) => (
          <button key={entry.id} type="button" className={envelope === entry.id ? styles.envelopeSelected : ""}
            onClick={() => onSelectEnvelope(entry.id)} aria-pressed={envelope === entry.id}>
            <b>{entry.index}</b><span>{entry.name}</span><small>{entry.relation}</small><i>{entry.access}</i>
          </button>
        ))}
      </div>
    </div>
  );
}

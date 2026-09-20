import Link from "next/link";
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import IXIMachineCard from "../ixi-machine-card/IXIMachineCard";
import IXIObjectConsoleRouter from "../ixi-chassis/IXIObjectConsoleRouter";
import { createConsoleSlot, createConsoleSlotsPatch, insertConsoleSlot, IXI_CONSOLE_SLOT_TYPES } from "../ixi-chassis/IXIObjectConsoleEngine";
import { familyControls, getAtlasFamily } from "../../lib/ixi-atlas/familyRegistry.mjs";
import { createFamilySample, FAMILY_SCALE_MODES, patchSampleFacts, SAMPLE_OBJECT_ID, SAMPLE_PASSPORT_ID, sampleDisposition } from "../../lib/ixi-atlas/familyDemo.mjs";
import AtlasFamilyNav from "./AtlasFamilyNav";
import { atlasLessonHref } from "../../lib/ixi-atlas/helpRoutes.mjs";
import { getAtlasGuide } from "../../lib/ixi-atlas/guideRegistry.mjs";
import AtlasDemoBoundary from "./AtlasDemoBoundary";
import styles from "./AtlasFamilyWorkbench.module.css";


function InspectionRig({ children, control, active, revision }) {
  const rootRef = useRef(null);
  const [box, setBox] = useState(null);
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || !active) { setBox(null); return; }
    let frame;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const target = root.querySelector(`[data-atlas-primary] ${control.selector.split(", ").join(", [data-atlas-primary] ")}`);
        if (!target) { setBox(null); return; }
        const rect = target.getBoundingClientRect();
        const outer = root.getBoundingClientRect();
        const next = { left: rect.left - outer.left, top: rect.top - outer.top, width: rect.width, height: rect.height };
        setBox(previous => previous && Object.keys(next).every(key => Math.abs(next[key] - previous[key]) < 0.5) ? previous : next);
      });
    };
    const resize = new ResizeObserver(measure);
    const mutation = new MutationObserver(measure);
    resize.observe(root);
    mutation.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style"] });
    measure();
    return () => { cancelAnimationFrame(frame); resize.disconnect(); mutation.disconnect(); };
  }, [control, active, revision]);
  return <div ref={rootRef} className={styles.rig}>{children}{active && box && box.width > 0 && <div aria-hidden="true" data-atlas-callout={control.id} className={styles.callout} style={box}><span>{familyControls.indexOf(control) + 1}</span></div>}</div>;
}

export default function AtlasFamilyWorkbench({ familyId }) {
  const family = getAtlasFamily(familyId);
  const auction = familyId === "auction";
  const [sample, setSample] = useState(() => createFamilySample(familyId));
  const [mode, setMode] = useState("inspect");
  const [face, setFace] = useState(1);
  const [controlId, setControlId] = useState("identity");
  const [gear, setGear] = useState(3);
  const [generation, setGeneration] = useState(0);
  const [state, setState] = useState({ color: "none", outline: 1, consoleSlots: [createConsoleSlot({ type: IXI_CONSOLE_SLOT_TYPES.LISTING })] });
  const [bidPack, setBidPack] = useState({});
  const [armed, setArmed] = useState(false);
  const [events, setEvents] = useState(["Ready. All actions use a fictional sample."]);
  const sequence = useRef(0);
  const record = useCallback((action, detail = "") => {
    sequence.current += 1;
    setEvents(previous => [`${sequence.current}. ${action}${detail ? ` — ${detail}` : " — Practice action captured; your records are unchanged."}`, ...previous].slice(0, 5));
  }, []);
  const saveFacts = useCallback((_listing, changes) => {
    setSample(previous => patchSampleFacts(previous, changes));
    record("Sample facts saved", "Object, Passport and ownership status retained.");
    return true;
  }, [record]);
  const updateState = useCallback((_id, patch) => {
    setState(previous => ({ ...previous, ...patch }));
    if (patch.consoleSlots) {
      setGear(previous => Math.max(previous, Math.min(7, patch.consoleSlots.length + 2)));
      record("Console adjusted", `${patch.consoleSlots.length} panels share this machine.`);
    }
  }, [record]);
  const ixiCardState = useMemo(() => ({ [SAMPLE_OBJECT_ID]: state }), [state]);
  const control = familyControls.find(item => item.id === controlId) || familyControls[0];
  const depth = state.consoleSlots.length;
  const selectFace = next => { setFace(next); record("Primary face", family.faceNames[next - 1]); };
  const sellerCardProps = {
    dealerBidPack: bidPack,
    onSaveDealerBidPack: values => { setBidPack(values); record("Bid pack saved", "Planning values saved for this practice session. No bid submitted."); },
    onAuctionDisposition: async (_listing, action) => { record("Closeout", sampleDisposition(action)); },
    lotNumberValue: sample.lotNumber,
    onLotNumberChange: value => saveFacts(sample, { lotNumber: value }),
    hoursValue: sample.hours,
    onHoursChange: value => saveFacts(sample, { hours: value }),
    onOwnedObjectSaved: updated => setSample(previous => patchSampleFacts(previous, updated)),
    onMachinePlacementChange: (_listing, placement) => record("Placement request", `Practice request captured (${typeof placement === "string" ? placement : "review access and channel"}). The sample keeps its original access and ownership.`),
  };
  const renderCard = consoleProps => <div data-atlas-primary>
    <IXIMachineCard listing={sample} cardContext={auction ? "auction-work" : "inventory"} sellerMode={!auction}
      suppressFamilyLog machineFace={face} onCycleMachineFace={() => selectFace(face === 4 ? 1 : face + 1)}
      ixiState={state} onIxiStateChange={updateState} sourceListingUrl={sample.sourceUrl}
      armedDestination={armed ? { label: "Sample stack", type: "stack", id: "atlas-sample-stack" } : null}
      onSendFront={() => record("Bring forward")} onSendBack={() => record("Send backward")}
      onSendToArmedDestination={() => record("Deliver machine", armed ? "Delivery to the sample stack captured." : "Choose a destination first.")}
      onAddObject={() => record("Add machine")} showSave={false} showListingManagementActions={false}
      {...sellerCardProps} {...consoleProps} />
  </div>;
  function addPanel(side) {
    if (depth >= 5) return;
    updateState(SAMPLE_OBJECT_ID, createConsoleSlotsPatch(insertConsoleSlot({ slots: state.consoleSlots, side, face: depth === 1 ? 2 : 3 })));
  }
  function reset() {
    setSample(createFamilySample(familyId)); setFace(1); setGear(3); setBidPack({}); setArmed(false);
    setState({ color: "none", outline: 1, consoleSlots: [createConsoleSlot({ type: IXI_CONSOLE_SLOT_TYPES.LISTING })] });
    setGeneration(previous => previous + 1); sequence.current = 0; setEvents(["Reset complete. Original facts and controls restored."]);
  }
  return <section className={styles.workbench} aria-label={`${family.title} workbench`}>
    <AtlasFamilyNav selected={familyId} />
    <header className={styles.hero}><div><span className={styles.eyebrow}>MACHINE CARD / LESSON {family.number}</span><h1>{family.title}</h1><p>{family.summary}</p></div><span className={styles.practiceBadge}>INTERACTIVE PRACTICE</span></header>
    <div className={styles.principle}><strong>{family.context}</strong><p>{family.principle}</p>{familyId === "reference" && <div className={styles.source}><b>NON-OWNED REFERENCE</b><span>Fictional source: example.com/atlas/sample-wa475</span></div>}</div>
    <div className={styles.layout}>
      <section className={styles.bench} aria-label="Practice controls">
        <div className={styles.toolbar}><div role="group" aria-label="Workbench mode">{["inspect", "operate"].map(value => <button type="button" key={value} aria-pressed={mode === value} onClick={() => setMode(value)}>{value === "inspect" ? "Inspect" : "Operate"}</button>)}</div><button type="button" onClick={reset}>Reset sample</button></div>
        <div className={styles.faceNav} role="group" aria-label="Primary machine face">{family.faceNames.map((name, index) => <button type="button" key={name} aria-pressed={face === index + 1} onClick={() => selectFace(index + 1)}><small>0{index + 1}</small>{name}</button>)}</div>
        <div className={styles.gearRow}><div className={styles.gears} role="group" aria-label="Card and Console size"><button type="button" aria-label="Make sample larger" disabled={gear === 1} onClick={() => setGear(value => value - 1)}>+</button><span aria-live="polite">GEAR {gear} / 7</span><button type="button" aria-label="Make sample smaller" disabled={gear === 7} onClick={() => setGear(value => value + 1)}>−</button></div><span>{depth} / 5 panels · {mode === "inspect" ? "Selected control outlined" : "Pointers hidden"}</span></div>
        <AtlasDemoBoundary key={generation} onPracticeAction={record} onSaveMachineFacts={saveFacts}>
          <div className={styles.viewport} role="region" aria-label="Sample machine and attached Console; scroll horizontally for larger views" tabIndex={0}>
            <InspectionRig control={control} active={mode === "inspect"} revision={`${face}:${gear}:${depth}:${generation}`}>
              <IXIObjectConsoleRouter cardFamily={auction ? "auction" : "private"} cardContext={auction ? "auction-work" : "inventory"}
                objectId={SAMPLE_OBJECT_ID} item={sample} sellerCardProps={sellerCardProps} ixiCardState={ixiCardState}
                updateIxiCardState={updateState} enableCardScaling cardScaleMode={FAMILY_SCALE_MODES[gear - 1]} renderParentCard={renderCard} />
            </InspectionRig>
          </div>
        </AtlasDemoBoundary>
        <p className={styles.panHint}>Use + for a closer view. Scroll sideways inside the workbench when the assembly is wider than your screen.</p>
        <div className={styles.quickControls} aria-label="Console and rail practice shortcuts"><button type="button" disabled={depth >= 5} onClick={() => addPanel("left")}>+ Left panel</button><button type="button" disabled={depth >= 5} onClick={() => addPanel("right")}>+ Right panel</button><button type="button" aria-pressed={armed} onClick={() => setArmed(value => !value)}>{armed ? "Sample destination armed" : "Arm sample destination"}</button></div>
      </section>
      <aside className={styles.instructions} aria-label="Instructions for selected face">
        <span className={styles.eyebrow}>FACE 0{face} / {family.faceNames[face - 1]}</span><h2>{family.faces[face - 1][0]}</h2><p>{family.faces[face - 1][1]}</p><div className={styles.check}><strong>Check the result</strong><p>{family.faces[face - 1][2]}</p></div>
        <h3>Inspect a control</h3><div className={styles.controlList}>{familyControls.map((item, index) => <button type="button" key={item.id} aria-pressed={controlId === item.id} onClick={() => { setControlId(item.id); setMode("inspect"); }}><span>0{index + 1}</span>{item.name}</button>)}</div><p className={styles.controlText}>{control.text}</p>
      </aside>
    </div>
    <div className={styles.bottomGrid}>
      <section className={styles.exercise}><span className={styles.eyebrow}>PUT IT TO WORK</span><h2>Try this sequence</h2><ol>{family.tasks.map(task => <li key={task}>{task}</li>)}</ol></section>
      <section className={styles.receipt} aria-label="Sample receipt"><span className={styles.eyebrow}>PRACTICE RECEIPT</span><h2>One machine. Same identity.</h2><dl><div><dt>Object</dt><dd>{SAMPLE_OBJECT_ID}</dd></div><div><dt>Passport</dt><dd>{SAMPLE_PASSPORT_ID}</dd></div><div><dt>Relationship</dt><dd>{sample.ownershipStatus === "owned" ? "Owned sample" : "Non-owned reference"}</dd></div><div><dt>Hours / location</dt><dd>{sample.hours} / {sample.location}</dd></div></dl><ol className={styles.events} aria-live="polite" aria-label="Recent practice actions">{events.map(event => <li key={event}>{event}</li>)}</ol><p>Sample values are fictional. Reloading or leaving this lesson clears the practice session.</p></section>
    </div>
    <nav className={styles.related} aria-label="Continue this workflow">{family.related.map(id => <Link shallow key={id} href={atlasLessonHref(id)}>{getAtlasGuide(id).title}<span aria-hidden="true">↗</span></Link>)}</nav>
  </section>;
}

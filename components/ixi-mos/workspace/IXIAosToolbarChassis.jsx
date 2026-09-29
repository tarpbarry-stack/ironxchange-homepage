import { useEffect, useRef, useState } from "react";
import { useDndContext, useDraggable, useDroppable } from "@dnd-kit/core";
import { evaluateAosSystemIndexMembership } from "../../../lib/mos/IXIAosSystemIndexMembershipPolicy";
import IXIWorkspaceRailTile from "../../ixi-os/IXIWorkspaceRailTile";
import IXIWorkspaceRailHeader from "../../ixi-os/IXIWorkspaceRailHeader";
import {
  AOS_TOOLBAR_SURFACES, getAosToolbarContents, getAosToolbarName,
  getAosToolbarObjectIds, getAosToolbarReturnOperation, getAosToolbarPresentation
} from "./IXIAosToolbarModel.mjs";
import styles from "./IXIAosToolbarChassis.module.css";

function PreviewImage({ src, name }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return src && !failed
    ? <img src={src} alt="" loading="lazy" decoding="async" draggable={false} onError={() => setFailed(true)} />
    : <span className={styles.monogram} aria-hidden="true">{name.split(/\s+/).slice(0, 2).map(word => word[0]).join("")}</span>;
}

function ToolbarReference({ object, registry, selected, referenceId, surfaceId, group, onBoard, onBrowse, onMove, onReturn, returnable, ready, onConnect, connectTarget }) {
  const name = getAosToolbarName(object);
  const view = getAosToolbarPresentation(object, registry);
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } = useDraggable({
    id: referenceId,
    disabled: !ready,
    data: { type: "aos-toolbar-reference", objectId: object.objectId, objectType: object.objectType,
      object, sourceObject: object, metadata: object.metadata, definitionId: object.definitionId, containerId: surfaceId, group }
  });
  const rowDrop = useDroppable({
    id: referenceId,
    disabled: group === "review" || !ready,
    data: { group, objectId: object.objectId, containerId: surfaceId }
  });
  const canConnect = connectTarget && connectTarget.objectId !== object.objectId &&
    object.actorAuthority?.canRelate === true && connectTarget.actorAuthority?.canRelate === true &&
    evaluateAosSystemIndexMembership({ sourceObject: object, targetObject: connectTarget }).allowed;
  return (
    <article ref={element => { setNodeRef(element); rowDrop.setNodeRef(element); }} className={`${styles.reference} ${selected ? styles.selected : ""}`} data-object-id={object.objectId} data-dragging={isDragging}>
      <IXIWorkspaceRailTile title={name} image={view.image} side={surfaceId === AOS_TOOLBAR_SURFACES.right ? "right" : surfaceId === AOS_TOOLBAR_SURFACES.left ? "left" : referenceId.startsWith("aos-toolbar:right:") ? "right" : "left"}
        media={!view.image && view.previews.length ? <div className={`${styles.previewMedia} ${view.previews.length > 1 ? styles.collage : ""}`}>
          {view.previews.map(preview => <div key={preview.objectId} className={styles.previewCell}><PreviewImage src={preview.image} name={preview.name} /></div>)}
        </div> : undefined}
        selected={selected} disabled={!ready}
        facts={view.machine ? [
          { label: "SN", value: object.presentationSource?.serialNumber || object.attributes?.serialNumber || "—" },
          { label: "ID", value: object.passportId || "—" }
        ] : [{ label: "MEMBERS", value: String(view.count) }, { label: "ID", value: object.passportId || "—" }]}
        onSelect={!view.machine ? () => onBrowse(object.objectId) : undefined}
        onBoard={() => onBoard(object.objectId)} dragHandleRef={setActivatorNodeRef} dragHandleProps={{ ...attributes, ...listeners }}>
        <select aria-label={`Actions for ${name}`} value="" disabled={!ready}
          onChange={event => {
            const action = event.target.value;
            if (action === "return") onReturn(object.objectId);
            else if (action === "connect") onConnect(object.objectId, connectTarget.objectId);
            else if (action) onMove(object.objectId, AOS_TOOLBAR_SURFACES[action]);
          }}>
          <option value="">Actions</option>
          <option value="left">Dock left</option>
          <option value="right">Dock right</option>
          {returnable && <option value="return">Return</option>}
          {canConnect && <option value="connect">Connect to {getAosToolbarName(connectTarget)}</option>}
        </select>
      </IXIWorkspaceRailTile>
    </article>
  );
}

function Toolbar({ side, folded, onFold, registry, indexes, placements, session, browseId, onSelect,
  onBrowse, onMove, onBoard, onReturn, onConnect, connectTarget, ready, requiresSignIn, loadError, run, armed, onArm, claimedIds }) {
  const title = side === "left" ? "Left toolbar" : "Right toolbar";
  const surfaceId = AOS_TOOLBAR_SURFACES[side];
  const { setNodeRef, isOver } = useDroppable({
    id: surfaceId, disabled: folded || !ready,
    data: { type: "workspace", containerId: surfaceId, targetSurface: surfaceId, dropIntent: "root" }
  });
  const parent = registry.get(browseId);
  const occupied = new Set([
    ...(placements.board || []),
    ...getAosToolbarObjectIds(placements, "left"),
    ...getAosToolbarObjectIds(placements, "right")
  ]);
  const parked = getAosToolbarObjectIds(placements, side).filter(id => !placements.board?.includes(id) &&
    (side === "left" || !getAosToolbarObjectIds(placements, "left").includes(id)))
    .map(id => registry.get(id)).filter(Boolean);
  const contents = (browseId === "all" ? [...registry.values()] : parent
    ? getAosToolbarContents(parent, registry) : indexes)
    .filter(object => !occupied.has(object.objectId) && !claimedIds?.has(object.objectId));
  const { active } = useDndContext();
  const draggedId = active?.data?.current?.objectId || active?.id;
  const draggedObject = registry.get(draggedId);
  const allowed = Boolean(!folded && ready && parent && draggedObject && draggedId !== parent.objectId &&
    draggedObject.actorAuthority?.canRelate === true && parent.actorAuthority?.canRelate === true &&
    evaluateAosSystemIndexMembership({ sourceObject: draggedObject, targetObject: parent }).allowed);
  const connectDrop = useDroppable({
    id: `ixi-drop-on:toolbar-${side}:${browseId}`, disabled: !allowed,
    data: { dropIntent: "on", aosToolbarConnect: true, targetObjectId: parent?.objectId,
      targetSurface: parent?.indexId === "equipment" ? "indexEquipment" : `container:${parent?.objectId}`,
      accepted: allowed }
  });
  const review = parent?.membershipReview;
  const issues = parent?.membershipReviewObjects || [];
  const row = (object, group) => (
    <ToolbarReference key={object.objectId} object={object} group={group} referenceId={`aos-toolbar:${side}:${group}:${object.objectId}`}
      registry={registry} selected={connectTarget?.objectId === object.objectId}
      surfaceId={Object.keys(placements).find(surface => placements[surface]?.includes(object.objectId)) || ""}
      ready={ready && !folded} returnable={Boolean(getAosToolbarReturnOperation(session, object.objectId))}
      onBrowse={onBrowse} onBoard={id => run(() => onBoard(id, parent?.objectId))}
      onMove={(id, surface) => run(() => onMove(id, surface))}
      onReturn={id => run(() => onReturn(id))}
      onConnect={(id, target) => run(() => onConnect(id, target))} connectTarget={connectTarget}/>
  );
  return (
    <aside ref={setNodeRef} id={`aos-${side}-toolbar`} aria-label={title}
      className={`${styles.toolbar} ${styles[side]} ${folded ? styles.folded : ""} ${isOver ? styles.over : ""}`}
      inert={folded ? true : undefined} aria-hidden={folded || undefined}>
      <IXIWorkspaceRailHeader title={side === "left" ? "LEFT RAIL" : "RIGHT RAIL"} count={parked.length + contents.length} side={side} armed={armed} onArm={onArm} onClose={onFold} />
      <div className={styles.toolbarTools}>
        <label className={styles.browseLabel} htmlFor={`aos-${side}-browse`}>Browse</label>
        <select id={`aos-${side}-browse`} className={styles.browserSelect} value={browseId} onChange={event => onSelect(event.target.value)}>
          <option value="">System Indexes</option><option value="all">All Objects</option>
          {indexes.map(object => <option key={object.objectId} value={object.objectId}>{getAosToolbarName(object)}</option>)}
          {parent && !indexes.some(object => object.objectId === parent.objectId) &&
            <option value={parent.objectId}>{getAosToolbarName(parent)}</option>}
          {browseId && browseId !== "all" && !parent && <option value={browseId}>Unavailable Object</option>}
        </select>
        {parent && <div className={styles.containerHeading}>
          <button type="button" disabled={!ready} onClick={() => run(() => onBoard(parent.objectId))}>Open container on Board</button>
          <div ref={connectDrop.setNodeRef} className={`${styles.connectDrop} ${allowed ? styles.connectAvailable : ""} ${connectDrop.isOver ? styles.over : ""}`}>
            {allowed ? `Drop to connect to ${getAosToolbarName(parent)}` : ""}
          </div>
        </div>}
      </div>
      <div className={styles.toolbarScroll}>
        {!ready && <p className={styles.hint}>{requiresSignIn
          ? <a href="/login?returnTo=%2Faos%2Fwork">Sign in to open your workspace</a>
          : loadError || "Loading authorized workspace…"}</p>}
        {ready && browseId && browseId !== "all" && !parent && <p role="status" className={styles.hint}>This Object is unavailable in the current workspace.</p>}
        {parent && review && (review.state === "unresolved" || issues.length > 0) &&
          <p className={styles.review}>Membership needs review. Open the container on Board to inspect its configuration.</p>}
        <div className={styles.sectionTitle}>{parent ? "Contents" : browseId === "all" ? "All Objects" : "System Indexes"}<span>{contents.length}</span></div>
        {ready && !contents.length && <p className={styles.hint}>{issues.length || (review && review.state === "unresolved") ? "No confirmed members to display." : "No members in this view."}</p>}
        {contents.map(object => row(object, "contents"))}
        {issues.length > 0 && <section aria-label="Membership review">
          <div className={styles.sectionTitle}>Needs review<span>{issues.length}</span></div>
          <p className={styles.hint}>These connections are not confirmed valid members.</p>
          {issues.map(object => registry.get(object.objectId)).filter(Boolean).map(object => row(object, "review"))}
        </section>}
        <section className={`${styles.parked} ${!parked.length ? styles.emptyParked : ""}`} aria-label={`Parked in ${side} toolbar`}>
          <div className={styles.sectionTitle}>Parked here<span>{parked.length}</span></div>
          {!parked.length && <p className={styles.hint}>Dock or drop Objects here to keep them at hand.</p>}
          {parked.map(object => row(object, "parked"))}
        </section>
      </div>
      <footer className={styles.toolbarFooter}><span>{contents.length} {contents.length === 1 ? "Object" : "Objects"}</span><span>{parked.length} parked</span></footer>
    </aside>
  );
}

export default function IXIAosToolbarChassis({ children, controls, registry, indexes, placements, session, ready,
  preferenceKey, onMove, onBoard, onReturn, onConnect, armedDestination, toggleArmedDestination, requiresSignIn = false, loadError = "" }) {
  // Register the entire visible Board, including gaps between cards. Without
  // this target, closest-center fallback can dock a drop in a nearby toolbar.
  const boardDrop = useDroppable({
    id: "board", disabled: !ready,
    data: { type: "workspace", containerId: "board", targetSurface: "board", dropIntent: "root" }
  });
  // Give the board the width it needs on first visit. A saved rail preference
  // still wins, and the right rail remains available through its fold control.
  const [folded, setFolded] = useState({ left: false, right: true });
  const [browse, setBrowse] = useState({ left: "", right: "" });
  const [mobileQuery, setMobileQuery] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(0);
  const [loadedKey, setLoadedKey] = useState("");
  const openButtons = useRef({});
  const chassisRef = useRef(null);
  useEffect(() => {
    const chassis = chassisRef.current;
    if (!chassis) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const viewport = window.visualViewport;
      const bottom = (viewport?.offsetTop || 0) + (viewport?.height || window.innerHeight);
      const stickyTop = window.matchMedia("(max-width: 999px)").matches ? 0 : 90;
      const top = Math.max(stickyTop, chassis.getBoundingClientRect().top);
      chassis.style.setProperty("--toolbar-height", `${Math.max(0, bottom - top - 12)}px`);
    };
    const schedule = () => { if (!frame) frame = window.requestAnimationFrame(measure); };
    const observer = typeof window.ResizeObserver === "function" ? new window.ResizeObserver(schedule) : null;
    observer?.observe(chassis.parentElement || chassis);
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, { passive: true });
    window.visualViewport?.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("scroll", schedule);
    measure();
    return () => {
      observer?.disconnect();
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule);
      window.visualViewport?.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("scroll", schedule);
    };
  }, []);
  useEffect(() => {
    const smallScreen = window.matchMedia("(max-width: 999px)").matches;
    setFolded({ left: smallScreen, right: true }); setBrowse({ left: "", right: "" });
    if (!preferenceKey) return;
    try {
      const saved = JSON.parse(localStorage.getItem(preferenceKey) || "null");
      if (saved) {
        if (!smallScreen) setFolded({ left: saved.folded?.left === true, right: saved.folded?.right === true });
        setBrowse({ left: typeof saved.browse?.left === "string" ? saved.browse.left : "",
          right: typeof saved.browse?.right === "string" ? saved.browse.right : "" });
      }
    } catch { /* Workspace commands do not depend on browser preference storage. */ }
    setLoadedKey(preferenceKey);
  }, [preferenceKey]);
  useEffect(() => {
    if (!preferenceKey || loadedKey !== preferenceKey) return;
    if (window.matchMedia("(max-width: 999px)").matches) return;
    try { localStorage.setItem(preferenceKey, JSON.stringify({ folded, browse })); } catch { /* Optional presentation preference. */ }
  }, [folded, browse, preferenceKey, loadedKey]);
  async function run(action) {
    setError(""); setPending(count => count + 1);
    try { await action(); } catch (failure) { setError(failure?.message || "The workspace action could not be confirmed. Please retry."); }
    finally { setPending(count => count - 1); }
  }
  function browseOther(side, objectId) {
    const other = side === "left" ? "right" : "left";
    setBrowse(current => ({ ...current, [other]: objectId }));
    setFolded(current => ({ ...current, [other]: false }));
  }
  const quickIds = [...new Set([
    ...indexes.map(object => object.objectId),
    ...getAosToolbarObjectIds(placements, "left"),
    ...getAosToolbarObjectIds(placements, "right")
  ])];
  const visibleIds = mobileQuery.trim() ? [...new Set([...quickIds, ...registry.keys()])] : quickIds;
  const quickObjects = visibleIds.filter(id => !placements.board?.includes(id)).map(id => registry.get(id)).filter(Boolean)
    .filter(object => `${getAosToolbarName(object)} ${object.passportId || ""}`.toLowerCase().includes(mobileQuery.toLowerCase()));
  const leftBrowseParent = registry.get(browse.left);
  const leftBrowseContents = browse.left === "all" ? [...registry.values()] : leftBrowseParent
    ? getAosToolbarContents(leftBrowseParent, registry) : indexes;
  const claimedLeft = new Set(folded.left ? [] : leftBrowseContents.map(object => object.objectId));
  return (
    <section ref={chassisRef} className={`${styles.chassis} ${folded.left ? styles.leftClosed : ""} ${folded.right ? styles.rightClosed : ""}`} aria-label="AOS workspace">
      {["left", "right"].map(side => <Toolbar key={side} side={side} folded={folded[side]}
        onFold={() => { setFolded(current => ({ ...current, [side]: true })); openButtons.current[side]?.focus(); }}
        browseId={browse[side]} onSelect={value => setBrowse(current => ({ ...current, [side]: value }))}
        onBrowse={id => browseOther(side, id)} registry={registry} indexes={indexes} placements={placements}
        session={session} ready={ready} requiresSignIn={requiresSignIn} loadError={loadError} run={run} onMove={onMove} onBoard={onBoard} onReturn={onReturn}
        armed={armedDestination === AOS_TOOLBAR_SURFACES[side]} onArm={() => toggleArmedDestination(AOS_TOOLBAR_SURFACES[side])}
        claimedIds={side === "right" ? claimedLeft : undefined}
        onConnect={onConnect} connectTarget={registry.get(browse[side === "left" ? "right" : "left"])}/>
      )}
      <div className={styles.center}>
        {controls}
        <section className={styles.mobilePicker} aria-label="AOS objects and machines">
          <div className={styles.mobilePickerHead}><strong>AOS / WORK</strong><span>{quickObjects.length} OBJECTS</span></div>
          <input type="search" aria-label="Find an AOS object or machine" placeholder="Find object, machine or Passport…" value={mobileQuery} onChange={event => setMobileQuery(event.target.value)} />
          <div className={styles.mobilePickerScroll} role="group" aria-label="AOS objects">
            {quickObjects.map(object => {
              const view = getAosToolbarPresentation(object, registry);
              return <button type="button" key={object.objectId} disabled={!ready} onClick={() => run(() => onBoard(object.objectId))}>
                <span className={styles.mobilePickerImage}><PreviewImage src={view.image || view.previews[0]?.image} name={getAosToolbarName(object)} /></span>
                <strong>{getAosToolbarName(object)}</strong><small>{view.machine ? "OPEN ON BOARD ↗" : `${view.count} MEMBERS · OPEN ↗`}</small>
              </button>;
            })}
            {ready && !quickObjects.length && <p>No matching Objects in the system indexes or toolbars.</p>}
          </div>
        </section>
        <div className={styles.edgeControls}>
          {["left", "right"].map(side => <button key={side} type="button" ref={node => { openButtons.current[side] = node; }}
            className={`${styles.railToggle} ${!folded[side] ? styles.railActive : ""}`}
            aria-label={`${folded[side] ? "Open" : "Fold"} ${side} toolbar`}
            title={`${folded[side] ? "Open" : "Fold"} ${side} toolbar`}
            aria-expanded={!folded[side]} aria-controls={`aos-${side}-toolbar`}
            onClick={() => setFolded(current => ({ ...current, [side]: !current[side] }))}>
            <span aria-hidden="true">{side === "left" ? (folded.left ? "›" : "‹") : (folded.right ? "‹" : "›")}</span>
          </button>)}
        </div>
        <div role="status" aria-live="polite" className={styles.status}>{pending ? "Saving workspace…" : ""}</div>
        {error && <p role="alert" className={styles.error}>{error}</p>}
        <div ref={boardDrop.setNodeRef} className={styles.board} aria-label="Working Board">{children}</div>
      </div>
    </section>
  );
}

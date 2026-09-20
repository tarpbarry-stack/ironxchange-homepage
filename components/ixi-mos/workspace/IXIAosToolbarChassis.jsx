import { useEffect, useRef, useState } from "react";
import { useDndContext, useDraggable, useDroppable } from "@dnd-kit/core";
import { evaluateAosSystemIndexMembership } from "../../../lib/mos/IXIAosSystemIndexMembershipPolicy";
import {
  AOS_TOOLBAR_SURFACES, getAosToolbarContents, getAosToolbarName,
  getAosToolbarObjectIds, getAosToolbarReturnOperation
} from "./IXIAosToolbarModel.mjs";
import styles from "./IXIAosToolbarChassis.module.css";

function ToolbarReference({ object, referenceId, surfaceId, onBoard, onBrowse, onMove, onReturn, returnable, ready, onConnect, connectTarget }) {
  const name = getAosToolbarName(object);
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } = useDraggable({
    id: referenceId,
    disabled: !ready,
    data: { type: "aos-toolbar-reference", objectId: object.objectId, objectType: object.objectType,
      object, sourceObject: object, metadata: object.metadata, definitionId: object.definitionId, containerId: surfaceId }
  });
  const canConnect = connectTarget && connectTarget.objectId !== object.objectId &&
    object.actorAuthority?.canRelate === true && connectTarget.actorAuthority?.canRelate === true &&
    evaluateAosSystemIndexMembership({ sourceObject: object, targetObject: connectTarget }).allowed;
  return (
    <article ref={setNodeRef} className={styles.reference} data-object-id={object.objectId} data-dragging={isDragging}>
      <div className={styles.referenceHead}>
        <button type="button" ref={setActivatorNodeRef} {...attributes} {...listeners}
          className={styles.dragHandle} disabled={!ready} aria-label={`Drag ${name}`}>⠿</button>
        <button type="button" className={styles.objectName} onClick={() => onBrowse(object.objectId)}
          title={`Browse ${name}`}>{name}</button>
      </div>
      <div className={styles.referenceMeta}>
        <span>{object.passportId}</span><span>{surfaceId === "board" ? "On Board" : ""}</span>
      </div>
      <div className={styles.referenceActions}>
        <button type="button" disabled={!ready} onClick={() => onBoard(object.objectId)}>
          {surfaceId === "board" ? "Focus on Board" : "Open on Board"}
        </button>
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
      </div>
    </article>
  );
}

function Toolbar({ side, folded, onFold, registry, indexes, placements, session, browseId, onSelect,
  onBrowse, onMove, onBoard, onReturn, onConnect, connectTarget, ready, requiresSignIn, loadError, run }) {
  const title = side === "left" ? "Left toolbar" : "Right toolbar";
  const surfaceId = AOS_TOOLBAR_SURFACES[side];
  const { setNodeRef, isOver } = useDroppable({
    id: surfaceId, disabled: folded || !ready,
    data: { type: "workspace", containerId: surfaceId, targetSurface: surfaceId, dropIntent: "root" }
  });
  const parent = registry.get(browseId);
  const contents = browseId === "all" ? [...registry.values()] : parent
    ? getAosToolbarContents(parent, registry) : indexes;
  const parked = getAosToolbarObjectIds(placements, side).map(id => registry.get(id)).filter(Boolean);
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
    <ToolbarReference key={object.objectId} object={object} referenceId={`aos-toolbar:${side}:${group}:${object.objectId}`}
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
      <header className={styles.toolbarHeader}>
        <strong>{title}</strong>
        <button type="button" aria-label={`Fold ${side} toolbar`} onClick={onFold}>{side === "left" ? "‹" : "›"}</button>
      </header>
      <div className={styles.toolbarScroll}>
        <label className={styles.browseLabel} htmlFor={`aos-${side}-browse`}>Browse</label>
        <select id={`aos-${side}-browse`} className={styles.browserSelect} value={browseId} onChange={event => onSelect(event.target.value)}>
          <option value="">System Indexes</option><option value="all">All Objects</option>
          {indexes.map(object => <option key={object.objectId} value={object.objectId}>{getAosToolbarName(object)}</option>)}
          {parent && !indexes.some(object => object.objectId === parent.objectId) &&
            <option value={parent.objectId}>{getAosToolbarName(parent)}</option>}
          {browseId && browseId !== "all" && !parent && <option value={browseId}>Unavailable Object</option>}
        </select>
        {parent && <div className={styles.containerHeading}>
          <strong>{getAosToolbarName(parent)}</strong>
          <button type="button" disabled={!ready} onClick={() => run(() => onBoard(parent.objectId))}>Open container on Board</button>
          <div ref={connectDrop.setNodeRef} className={`${styles.connectDrop} ${connectDrop.isOver ? styles.over : ""}`}>
            {allowed ? `Drop to connect to ${getAosToolbarName(parent)}` : "Drag onto this area to connect a member"}
          </div>
        </div>}
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
        <section className={styles.parked} aria-label={`Parked in ${side} toolbar`}>
          <div className={styles.sectionTitle}>Parked here<span>{parked.length}</span></div>
          {!parked.length && <p className={styles.hint}>Dock or drop Objects here to keep them at hand.</p>}
          {parked.map(object => row(object, "parked"))}
        </section>
      </div>
    </aside>
  );
}

export default function IXIAosToolbarChassis({ children, registry, indexes, placements, session, ready,
  preferenceKey, onMove, onBoard, onReturn, onConnect, requiresSignIn = false, loadError = "" }) {
  const [folded, setFolded] = useState({ left: false, right: false });
  const [browse, setBrowse] = useState({ left: "", right: "" });
  const [error, setError] = useState("");
  const [pending, setPending] = useState(0);
  const [loadedKey, setLoadedKey] = useState("");
  const openButtons = useRef({});
  useEffect(() => {
    const smallScreen = window.matchMedia("(max-width: 999px)").matches;
    setFolded({ left: smallScreen, right: smallScreen }); setBrowse({ left: "", right: "" });
    if (!preferenceKey) return;
    try {
      const saved = JSON.parse(localStorage.getItem(preferenceKey) || "null");
      if (saved) {
        setFolded({ left: saved.folded?.left === true, right: saved.folded?.right === true });
        setBrowse({ left: typeof saved.browse?.left === "string" ? saved.browse.left : "",
          right: typeof saved.browse?.right === "string" ? saved.browse.right : "" });
      }
    } catch { /* Workspace commands do not depend on browser preference storage. */ }
    setLoadedKey(preferenceKey);
  }, [preferenceKey]);
  useEffect(() => {
    if (!preferenceKey || loadedKey !== preferenceKey) return;
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
  return (
    <section className={`${styles.chassis} ${folded.left ? styles.leftClosed : ""} ${folded.right ? styles.rightClosed : ""}`} aria-label="AOS workspace">
      {["left", "right"].map(side => <Toolbar key={side} side={side} folded={folded[side]}
        onFold={() => { setFolded(current => ({ ...current, [side]: true })); openButtons.current[side]?.focus(); }}
        browseId={browse[side]} onSelect={value => setBrowse(current => ({ ...current, [side]: value }))}
        onBrowse={id => browseOther(side, id)} registry={registry} indexes={indexes} placements={placements}
        session={session} ready={ready} requiresSignIn={requiresSignIn} loadError={loadError} run={run} onMove={onMove} onBoard={onBoard} onReturn={onReturn}
        onConnect={onConnect} connectTarget={registry.get(browse[side === "left" ? "right" : "left"])}/>
      )}
      <div className={styles.center}>
        <div className={styles.boardTools}>
          {["left", "right"].map(side => <button key={side} type="button" ref={node => { openButtons.current[side] = node; }}
            aria-expanded={!folded[side]} aria-controls={`aos-${side}-toolbar`}
            onClick={() => setFolded(current => ({ ...current, [side]: !current[side] }))}>
            {side === "left" ? "‹ " : ""}{folded[side] ? "Open" : "Fold"} {side} toolbar{side === "right" ? " ›" : ""}
          </button>)}
        </div>
        <div role="status" aria-live="polite" className={styles.status}>{pending ? "Saving workspace…" : ""}</div>
        {error && <p role="alert" className={styles.error}>{error}</p>}
        {children}
      </div>
    </section>
  );
}

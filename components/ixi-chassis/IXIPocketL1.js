 <section
  data-pocket-target="pocketLeft"
  className={`ixi-pocket-left pocket-mode-${leftPocketMode} ${
    (machineContainers.pocketLeft || []).length ? "occupied" : ""
  } ${
    armedDestination === "pocketLeft" ? "destination-armed" : ""
  }`}
>
<WorkspaceDropPad
  id="pocketLeft"
  data-pocket-pad-target="pocketLeft"
  className="ixi-pocket-catch-pad catch-l1"
  style={{
    position: "absolute",
    left: 0,
    right: "auto",
    top: "12px",
    width: "340px",
    height: "140px",
    pointerEvents: "auto",
    zIndex: 1,
    background: "transparent",
    outline: "none"
  }}
/>

  <div className="ixi-pocket-topline">
  <span>I</span>
  <strong>IX-256</strong>
</div>
  
    <div
  className={`ixi-pocket-action-rail left ${
    (machineContainers.pocketLeft || []).length === 0
      ? "is-empty"
      : "has-machines"
  } pocket-mode-${leftPocketMode}`}
>
 <button type="button" className="ixi-pocket-rail-action theater" data-label="IXI THEATER" />

<button
  type="button"
  className="ixi-pocket-rail-action stack"
  data-label="ACTIVE STACK"
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();

    movePocketToStack(
      "pocketLeft",
      "top"
    );
  }}
/>

<button
  type="button"
  className="ixi-pocket-rail-action board"
  data-label="BOARD"
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    recallPocketToBoard("pocketLeft");
  }}
/>

<button type="button" className="ixi-pocket-rail-action send" data-label="SEND" />
</div>

<button
  type="button"
  className={`ixi-pocket-loop-square left ${
  (machineContainers.pocketLeft || []).length > 0 &&
  leftPocketMode !== "closed"
    ? "is-visible"
    : ""
}`}
  title="Loop Pocket"
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    rotatePocket("pocketLeft");
  }}
/>
    
<button
  type="button"
  className={`ixi-pocket-direct-button left ${
  (machineContainers.pocketLeft || []).length > 0 &&
  leftPocketMode === "closed"
    ? "has-load"
    : ""
} ${
  (machineContainers.pocketLeft || []).length > 0 &&
  leftPocketMode !== "closed"
    ? "is-live"
    : ""
}`}
title="Left pocket"
onClick={(e) => {
  e.preventDefault();
  e.stopPropagation();

  toggleArmedDestination("pocketLeft");
}}
/>
    
{leftPocketMode !== "closed" &&
 (machineContainers.pocketLeft || []).length > 0 && (
  <div className={`ixi-pocket-thumbs thumb-size-${pocketThumbSize}`}>
      {(machineContainers.pocketLeft || []).slice(0, 7).map((machineId, index) => {
        const machine = getListingById(machineId);
        if (!machine) return null;

        const image =
          machine.image ||
          machine.imageUrl ||
          machine.images?.[0] ||
          machine.images?.[0]?.url ||
          machine.publicData?.image ||
          machine.publicData?.imageUrl ||
          machine.publicData?.images?.[0] ||
          machine.attributes?.publicData?.image ||
          machine.attributes?.publicData?.imageUrl ||
          machine.attributes?.publicData?.images?.[0];

               return (
  <IXISortableMachineCard
  key={`left-pocket-thumb-${machineId}`}
  id={machineId}
  containerId="pocketLeft"
  className="ixi-pocket-thumb-dnd"
  style={{
    right: `${leftPocketMode === "open" ? index * 44 : leftPocketMode === "peek" ? index * 16 : index * 8}px`,
    zIndex: index + 1
  }}
>
    {({ dragHandleProps }) => (
    <div
  className="ixi-pocket-thumb"
  {...dragHandleProps}
  style={{
    borderColor: getIxiColorValue(
      ixiCardState[String(machineId)]?.color
    ),
    boxShadow: `0 0 0 ${Number(ixiCardState[String(machineId)]?.outline || 1)}px ${getIxiColorValue(
      ixiCardState[String(machineId)]?.color
    )}`
  }}
>
        {image ? (
          <img
            src={typeof image === "string" ? image : image?.url}
            alt=""
          />
        ) : (
          <span>
            {machine.year || machine.publicData?.year || ""}{" "}
            {machine.make || machine.publicData?.make || ""}
          </span>
        )}
      </div>
    )}
  </IXISortableMachineCard>
);
      })}
    </div>
  )}
</section>
);
}

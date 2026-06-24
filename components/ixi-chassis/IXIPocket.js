export default function IXIPocket({
  pocketId,
  pocketMode,
  side = "left",
  label = "I",
  code = "IX-256",
  title = "Pocket",
  dropPadClassName = "",
  dropPadStyle = {},
  stackTarget = "top",
  machineContainers = {},
  armedDestination,
  WorkspaceDropPad,
  IXISortableMachineCard,
  movePocketToStack,
  recallPocketToBoard,
  rotatePocket,
  toggleArmedDestination,
  pocketThumbSize,
  getListingById,
  getIxiColorValue,
  ixiCardState = {}
}) {
  const machines = machineContainers[pocketId] || [];
  const hasMachines = machines.length > 0;
  const isLeft = side === "left";
  const offsetProp = isLeft ? "right" : "left";

  return (
    <section
      data-pocket-target={pocketId}
      className={`ixi-pocket-left ${
        !isLeft ? "ixi-pocket-right" : ""
      } pocket-mode-${pocketMode} ${
        hasMachines ? "occupied" : ""
      } ${
        armedDestination === pocketId ? "destination-armed" : ""
      }`}
    >
      <WorkspaceDropPad
        id={pocketId}
        data-pocket-pad-target={pocketId}
        className={dropPadClassName}
        style={dropPadStyle}
      />

      <div className="ixi-pocket-topline">
        <span>{label}</span>
        <strong>{code}</strong>
      </div>

      <div
        className={`ixi-pocket-action-rail ${side} ${
          hasMachines ? "has-machines" : "is-empty"
        } pocket-mode-${pocketMode}`}
      >
        {isLeft && (
          <button
            type="button"
            className="ixi-pocket-rail-action theater"
            data-label="IXI THEATER"
          />
        )}

        {isLeft && (
          <button
            type="button"
            className="ixi-pocket-rail-action stack"
            data-label="ACTIVE STACK"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              movePocketToStack(pocketId, stackTarget);
            }}
          />
        )}

        {isLeft && (
          <button
            type="button"
            className="ixi-pocket-rail-action board"
            data-label="BOARD"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              recallPocketToBoard(pocketId);
            }}
          />
        )}

        {isLeft && (
          <button
            type="button"
            className="ixi-pocket-rail-action send"
            data-label="SEND"
          />
        )}

        {!isLeft && (
          <button
            type="button"
            className="ixi-pocket-rail-action send"
            data-label="SEND"
          />
        )}

        {!isLeft && (
          <button
            type="button"
            className="ixi-pocket-rail-action board"
            data-label="BOARD"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              recallPocketToBoard(pocketId);
            }}
          />
        )}

        {!isLeft && (
          <button
            type="button"
            className="ixi-pocket-rail-action stack"
            data-label="ACTIVE STACK"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              movePocketToStack(pocketId, stackTarget);
            }}
          />
        )}

        {!isLeft && (
          <button
            type="button"
            className="ixi-pocket-rail-action theater"
            data-label="IXI THEATER"
          />
        )}
      </div>

      <button
        type="button"
        className={`ixi-pocket-loop-square ${side} ${
          hasMachines && pocketMode !== "closed" ? "is-visible" : ""
        }`}
        title="Loop Pocket"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          rotatePocket(pocketId);
        }}
      />

      <button
        type="button"
        className={`ixi-pocket-direct-button ${side} ${
          hasMachines && pocketMode === "closed" ? "has-load" : ""
        } ${
          hasMachines && pocketMode !== "closed" ? "is-live" : ""
        }`}
        title={title}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleArmedDestination(pocketId);
        }}
      />

      {pocketMode !== "closed" && hasMachines && (
        <div className={`ixi-pocket-thumbs thumb-size-${pocketThumbSize}`}>
          {machines.map((machineId, index) => {
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
                key={`${pocketId}-thumb-${machineId}`}
                id={machineId}
                containerId={pocketId}
                className="ixi-pocket-thumb-dnd"
                style={{
                  [offsetProp]: `${
                    pocketMode === "open"
                      ? index * 44
                      : pocketMode === "peek"
                        ? index * 16
                        : index * 8
                  }px`,
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
                      boxShadow: `0 0 0 ${Number(
                        ixiCardState[String(machineId)]?.outline || 1
                      )}px ${getIxiColorValue(
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

import IXIActiveStack from "./IXIActiveStack";

export default function IXIActiveStackZone({
  WorkspaceDropZone,
  activeStacksOpen = {},
  activeStackHover = "",
  machineContainers = {},
  armedDestination,
  toggleArmedDestination,
  toggleActiveStack,
  toggleActiveStackLayout,
  moveActiveStackToContainer,
  sendActiveStackToTheater,
  activeStackSendMenu,
  setActiveStackSendMenu,
  activeStackLayouts = {},
  getListingById,
  getListingId,
  savedIds = [],
  ixiCardState = {},
  IXISortableMachineCard,
  toggleSave,
  updateIxiCardState,
  cycleMachineFace,
  sendListingToFront,
  sendListingToBack,
  sendMachineToArmedDestination,
  cardScaleMode = "xl",
  cardContext = "workspace"
}) {
  return (
  <section className="active-stack-zone">
    {["top", "bottom"].map(stackKey => (
      <WorkspaceDropZone
        key={stackKey}
        id={stackKey === "top" ? "stackTop" : "stackBottom"}
        data-active-stack={stackKey}
        className={`active-stack ${
          activeStacksOpen[stackKey] ? "open" : ""
        } ${
          (
            machineContainers[
              stackKey === "top" ? "stackTop" : "stackBottom"
            ] || []
          ).length > 0
            ? "has-machines"
            : ""
        }`}
      >
        <button
          type="button"
          className="active-stack-dash"
          onClick={() => toggleActiveStack(stackKey)}
        />

        {activeStacksOpen[stackKey] && (
          <section
            className={`active-stack-tray ${
              activeStackHover === stackKey ? "stack-armed" : ""
            }`}
          >
            <div className="active-stack-pocket-corners">
              <button
  type="button"
  className="stack-pocket-power top-left"
  data-label="L1"
  title="Send stack to L1"
  onClick={() =>
    moveActiveStackToContainer(stackKey, "pocketLeft")
  }
/>

              <button
                type="button"
                className="stack-pocket-power top-right"
                data-label="R1"
                title="Send stack to R1"
                onClick={() =>
                  moveActiveStackToContainer(stackKey, "pocketRight")
                }
              />

              <button
                type="button"
                className="stack-pocket-power bottom-left"
                data-label="L2"
                title="Send stack to L2"
                onClick={() =>
                  moveActiveStackToContainer(stackKey, "pocketLeft2")
                }
              />

              <button
                type="button"
                className="stack-pocket-power bottom-right"
                data-label="R2"
                title="Send stack to R2"
                onClick={() =>
                  moveActiveStackToContainer(stackKey, "pocketRight2")
                }
              />
            </div>

            <div className="active-stack-command-pad">
              <button
                type="button"
                className="stack-rail-action theater"
                data-label="IXI THEATER"
                title="IXI Theater"
                onClick={() => sendActiveStackToTheater(stackKey)}
              />

              <button
                type="button"
                className="stack-rail-action layout"
                data-label="LAYOUT"
                title="Toggle layout"
                onClick={() => toggleActiveStackLayout(stackKey)}
              />

              <button
                type="button"
                className="stack-rail-action board"
                data-label="BOARD"
                title="Send stack to board"
                onClick={() => moveActiveStackToContainer(stackKey, "board")}
              />

              <button
                type="button"
                className="stack-rail-action send"
                data-label="SEND"
                title="Send stack"
                onClick={() =>
                  setActiveStackSendMenu(current =>
                    current === stackKey ? "" : stackKey
                  )
                }
              />
            </div>

            {activeStackSendMenu === stackKey && (
              <div className="active-stack-send-menu">
                <button
  type="button"
  className="stack-send-option"
  data-label="L1"
  title="Send stack to L1"
  onClick={() =>
    moveActiveStackToContainer(stackKey, "pocketLeft")
  }
/>

                <button
                  type="button"
                  className="stack-send-option"
                  data-label="L2"
                  onClick={() =>
                    moveActiveStackToContainer(stackKey, "pocketLeft2")
                  }
                />

                <button
                  type="button"
                  className="stack-send-option"
                  data-label="BOARD"
                  onClick={() => moveActiveStackToContainer(stackKey, "board")}
                />

                <button
                  type="button"
                  className="stack-send-option"
                  data-label="R1"
                  onClick={() =>
                    moveActiveStackToContainer(stackKey, "pocketRight")
                  }
                />

                <button
                  type="button"
                  className="stack-send-option"
                  data-label="R2"
                  onClick={() =>
                    moveActiveStackToContainer(stackKey, "pocketRight2")
                  }
                />
              </div>
            )}

            <div
              className={`active-stack-dropzone ${
                activeStackLayouts[stackKey] === "vertical"
                  ? "stack-vertical"
                  : "stack-horizontal"
              }`}
            >
              <IXIActiveStack
                stackKey={stackKey}
                machineIds={
                  machineContainers[
                    stackKey === "top" ? "stackTop" : "stackBottom"
                  ] || []
                }
                getListingById={getListingById}
                getListingId={getListingId}
                savedIds={savedIds}
                ixiCardState={ixiCardState}
                activeStackLayouts={activeStackLayouts}
                IXISortableMachineCard={IXISortableMachineCard}
                toggleSave={toggleSave}
                updateIxiCardState={updateIxiCardState}
                sendListingToFront={sendListingToFront}
                sendListingToBack={sendListingToBack}
                armedDestination={armedDestination}
                sendMachineToArmedDestination={sendMachineToArmedDestination}
                enableCardScaling={true}
                cardScaleMode={cardScaleMode}
                cardContext={cardContext}
                cycleMachineFace={cycleMachineFace}
              />
            </div>
          </section>
        )}
      </WorkspaceDropZone>
    ))}
  </section>
);
}

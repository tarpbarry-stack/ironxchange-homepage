import {
  useMemo,
  useState
} from "react";

import IXIAosCardRuntime
  from "./IXIAosCardRuntime";

import {
  resolveIXICardDefinition
} from "./IXICardDefinitionEngine";

import {
  renderIXIAosContainerModule
} from "../container-runtime/IXIAosContainerModules";

import IXIAosEditableFieldGroup
  from "./modules/IXIAosEditableFieldGroup";

import IXIAosCardHeaderControls
  from "./modules/IXIAosCardHeaderControls";

import IXIAosEditSessionActions
  from "./modules/IXIAosEditSessionActions";

import IXIAosInlineMetricStrip
  from "./modules/IXIAosInlineMetricStrip";

import IXIAosContainerViewer
  from "./modules/IXIAosContainerViewer";

import IXIAosRelationshipInfrastructurePanel
  from "./modules/IXIAosRelationshipInfrastructurePanel";

import IXIAosContainerCommandStrip
  from "./modules/IXIAosContainerCommandStrip";

import IXIAosContainerDeckDock
  from "./modules/IXIAosContainerDeckDock";

import IXIAosPrimaryMediaPanel
  from "./modules/IXIAosPrimaryMediaPanel";


function safeObject(
  value
) {
  return (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  )
    ? value
    : {};
}


export default function IXIAosCardRenderer({
  object = {},
  projection = null,
  cardDefinition = null,
  template = null,
  objects = [],
  parentLabel = "",
  dragHandleProps = null,
  ixiState = {},
  onIxiStateChange = null,
  saved = false,
  armedDestination = "",
  onSendFront = null,
  onSendBack = null,
  onCycleColor = null,
  onCycleOutline = null,
  onSendToArmedDestination = null,
  onObjectFieldChange = null,
  onSaveObject = null,
  onHideObject = null,
  onDeleteObject = null,
  onAddObject = null,
  onBoard = null,
  onRecall = null,
  onReturn = null,
  onExposeObject = null,
  onOpenConsole = null,
  onExpandConsoleLeft = null,
  onExpandConsoleRight = null,
  consoleLeftOpen = false,
  consoleRightOpen = false,
  forcedFaceIndex = null,
  faceOnly = false,
  studioEditing = false,
  selectedModuleId = "",
  onSelectModule = null,
  renderCard = null
}) {
  const [savingEdit, setSavingEdit] =
    useState(false);

  const objectId =
    String(
      object?.objectId ||
      object?.id ||
      ""
    );

  const resolvedDefinition =
    useMemo(
      () =>
        cardDefinition ||
        resolveIXICardDefinition({
          object,
          template
        }),
      [object, cardDefinition, template]
    );

  const capabilities =
    resolvedDefinition?.capabilities || {};

  const editDraft =
    safeObject(ixiState?.editDraft);

  const draftFields =
    safeObject(editDraft?.fields);

  const runtimeObject =
    useMemo(
      () => ({
        ...object,
        fields: {
          ...safeObject(object?.fields),
          ...draftFields
        }
      }),
      [object, draftFields]
    );

  function patchEditDraftFields(
    fieldId,
    value
  ) {
    if (
      typeof onObjectFieldChange ===
      "function"
    ) {
      onObjectFieldChange(fieldId, value);
      return;
    }

    if (!objectId) {
      return;
    }

    onIxiStateChange?.(
      objectId,
      {
        editDraft: {
          ...editDraft,
          fields: {
            ...draftFields,
            [fieldId]: value
          }
        }
      }
    );
  }

  const [
    selectedChildIndex,
    setSelectedChildIndex
  ] = useState(0);

  function renderContainedCard({
    object: childObject,
    parent,
    context
  }) {
    if (
      typeof renderCard ===
      "function"
    ) {
      return renderCard({
        object: childObject,
        parent,
        context
      });
    }

    return (
      <IXIAosCardRenderer
        object={childObject}
        objects={objects}
        parentLabel={
          parent?.displayName ||
          parent?.name ||
          ""
        }
        dragHandleProps={{}}
        ixiState={{}}
        onIxiStateChange={() => {}}
        saved={false}
        armedDestination=""
        onSendFront={() => {}}
        onSendBack={() => {}}
        onCycleColor={() => {}}
        onCycleOutline={() => {}}
        onSendToArmedDestination={() => {}}
        onAddObject={onAddObject}
        onBoard={onBoard}
        onRecall={onRecall}
        onReturn={onReturn}
        onExposeObject={onExposeObject}
        onOpenConsole={onOpenConsole}
        renderCard={renderCard}
      />
    );
  }

  function beginEditing() {
    if (!objectId) {
      return;
    }

    onIxiStateChange?.(
      objectId,
      {
        editing: true,
        editDraft: {
          fields: {
            ...safeObject(object?.fields)
          }
        }
      }
    );
  }

  function cancelEditing() {
    if (!objectId || savingEdit) {
      return;
    }

    onIxiStateChange?.(
      objectId,
      {
        editing: false,
        editDraft: null
      }
    );
  }

  async function saveEditing() {
    if (!objectId || savingEdit) {
      return;
    }

    setSavingEdit(true);

    try {
      if (
        typeof onSaveObject ===
        "function"
      ) {
        await onSaveObject({
          objectId,
          object: runtimeObject,
          fields: {
            ...safeObject(
              runtimeObject?.fields
            )
          }
        });

        onIxiStateChange?.(
          objectId,
          {
            editing: false,
            editDraft: null
          }
        );

        return;
      }

      onIxiStateChange?.(
        objectId,
        {
          editing: false
        }
      );
    } finally {
      setSavingEdit(false);
    }
  }

  function renderModule({ module }) {
    const moduleType =
      String(module?.moduleType || "")
        .trim()
        .toLowerCase();

    if (
      moduleType ===
      "card-header-actions"
    ) {
      return (
        <IXIAosCardHeaderControls
          canAdd={Boolean(
            capabilities?.canContain
          )}
          canEdit={
            capabilities?.editable !== false
          }
          editing={Boolean(
            ixiState?.editing
          )}
          onAdd={onAddObject}
          onToggleEdit={beginEditing}
          onHide={onHideObject}
          onDelete={onDeleteObject}
          onOpenConsole={onOpenConsole}
        />
      );
    }

    if (
      moduleType ===
        "editable-field-group" ||
      moduleType ===
        "weighted-field-row"
    ) {
      return (
        <IXIAosEditableFieldGroup
          object={runtimeObject}
          moduleDefinition={module}
          editing={Boolean(
            ixiState?.editing
          )}
          onFieldChange={
            patchEditDraftFields
          }
        />
      );
    }

    if (
      moduleType ===
      "edit-session-actions"
    ) {
      return (
        <IXIAosEditSessionActions
          editing={Boolean(
            ixiState?.editing
          )}
          saving={savingEdit}
          onSave={saveEditing}
          onCancel={cancelEditing}
        />
      );
    }

    if (
      moduleType ===
      "inline-metric-strip"
    ) {
      return (
        <IXIAosInlineMetricStrip
          object={runtimeObject}
          projection={projection}
          moduleDefinition={module}
        />
      );
    }

    if (
      moduleType ===
      "primary-media-panel"
    ) {
      return (
        <IXIAosPrimaryMediaPanel
          object={runtimeObject}
          moduleDefinition={module}
        />
      );
    }

    if (
      moduleType ===
      "relationship-infrastructure-panel"
    ) {
      return (
        <IXIAosRelationshipInfrastructurePanel
          object={runtimeObject}
          moduleDefinition={module}
        />
      );
    }

    if (
      moduleType ===
      "container-command-strip"
    ) {
      return (
        <IXIAosContainerCommandStrip
          object={runtimeObject}
          onRecall={onRecall}
          onBoard={onBoard}
          onReturn={onReturn}
        />
      );
    }

    if (
      moduleType ===
      "container-deck-dock"
    ) {
      return (
        <IXIAosContainerDeckDock
          container={runtimeObject}
          objects={objects}
          selectedIndex={
            selectedChildIndex
          }
          onSelectedIndexChange={
            setSelectedChildIndex
          }
          onExposeObject={onExposeObject}
          onRecall={onRecall}
          onBoard={onBoard}
          onReturn={onReturn}
          bottom={
            module?.config?.bottom ?? 20
          }
        />
      );
    }

    if (
      moduleType ===
      "container-collection-preview"
    ) {
      return (
        <IXIAosContainerViewer
          container={runtimeObject}
          objects={objects}
          selectedIndex={
            selectedChildIndex
          }
          onSelectedIndexChange={
            setSelectedChildIndex
          }
          onExposeObject={
            onExposeObject
          }
        />
      );
    }

    const containerModule =
      renderIXIAosContainerModule({
        moduleType,
        object: runtimeObject,
        parentLabel,
        objects,
        selectedIndex:
          selectedChildIndex,
        onSelectedIndexChange:
          setSelectedChildIndex,
        renderCard:
          renderContainedCard,
        onAddObject,
        onBoard,
        onRecall,
        onExposeObject
      });

    if (
      containerModule !== null &&
      containerModule !== undefined
    ) {
      return containerModule;
    }

    return null;
  }

  return (
    <IXIAosCardRuntime
      object={runtimeObject}
      projection={projection}
      cardDefinition={resolvedDefinition}
      parentLabel={parentLabel}
      dragHandleProps={dragHandleProps}
      ixiState={ixiState}
      onIxiStateChange={
        onIxiStateChange
      }
      saved={saved}
      armedDestination={armedDestination}
      onSendFront={onSendFront}
      onSendBack={onSendBack}
      onCycleColor={onCycleColor}
      onCycleOutline={onCycleOutline}
      onSendToArmedDestination={
        onSendToArmedDestination
      }
      onOpenConsole={onOpenConsole}
      onExpandConsoleLeft={
        onExpandConsoleLeft
      }
      onExpandConsoleRight={
        onExpandConsoleRight
      }
      consoleLeftOpen={consoleLeftOpen}
      consoleRightOpen={consoleRightOpen}
      forcedFaceIndex={forcedFaceIndex}
      faceOnly={faceOnly}
      studioEditing={studioEditing}
      selectedModuleId={
        selectedModuleId
      }
      onSelectModule={onSelectModule}
      renderModule={renderModule}
    />
  );
}

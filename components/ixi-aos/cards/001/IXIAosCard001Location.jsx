import { useMemo, useState } from "react";

import IXIMachineRail from "../../../IXIMachineRail";
import IXIAosPrimaryMediaPanel from "../../card-runtime/modules/IXIAosPrimaryMediaPanel";
import IXIAosInlineAddress from "../../card-runtime/modules/IXIAosInlineAddress";
import IXIAosInlineMetricStrip from "../../card-runtime/modules/IXIAosInlineMetricStrip";
import IXIAosEditableFieldGroup from "../../card-runtime/modules/IXIAosEditableFieldGroup";
import IXIAosRelationshipInfrastructurePanel from "../../card-runtime/modules/IXIAosRelationshipInfrastructurePanel";
import IXIAosContainerDeckDock from "../../card-runtime/modules/IXIAosContainerDeckDock";
import IXIAosCardHeaderControls from "../../card-runtime/modules/IXIAosCardHeaderControls";

const NATIVE_WIDTH = 298;
const NATIVE_HEIGHT = 471;
const RAIL_RESERVE = 19;
const HEADER_HEIGHT = 52;
const DECK_HEIGHT = 88;

function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

export const CARD_001_LOCATION = Object.freeze({
  cardNumber: 1,
  templateSlug: "location-standard",
  nativeWidth: NATIVE_WIDTH,
  nativeHeight: NATIVE_HEIGHT,
  railReserve: RAIL_RESERVE,
  label: "Location",
  section: "LOCATIONS & FACILITIES"
});

export default function IXIAosCard001Location({
  object = {},
  projection = null,
  objects = [],
  ixiState = {},
  onIxiStateChange = null,
  onSaveObject = null,
  onAddObject = null,
  onHideObject = null,
  onDeleteObject = null,
  onOpenConsole = null,
  onRecall = null,
  onBoard = null,
  onReturn = null,
  onExposeObject = null,
  onSendFront = null,
  onSendBack = null,
  onCycleColor = null,
  onCycleOutline = null,
  armedDestination = "",
  onSendToArmedDestination = null
}) {
  const objectId = String(object?.objectId || object?.id || "");
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  const editDraft = safeObject(ixiState?.editDraft);
  const draftFields = safeObject(editDraft?.fields);
  const editing = Boolean(ixiState?.editing);

  const runtimeObject = useMemo(() => ({
    ...object,
    fields: {
      ...safeObject(object?.fields),
      ...draftFields
    }
  }), [object, draftFields]);

  function patchField(fieldId, value) {
    if (!objectId) return;
    onIxiStateChange?.(objectId, {
      editDraft: {
        ...editDraft,
        fields: {
          ...draftFields,
          [fieldId]: value
        }
      }
    });
  }

  function beginEdit() {
    if (!objectId) return;
    onIxiStateChange?.(objectId, {
      editing: true,
      editDraft: { fields: { ...safeObject(object?.fields) } }
    });
  }

  async function saveEdit() {
    if (!objectId || saving) return;
    setSaving(true);
    try {
      await onSaveObject?.({
        objectId,
        object: runtimeObject,
        fields: { ...safeObject(runtimeObject?.fields) }
      });
      onIxiStateChange?.(objectId, { editing: false, editDraft: null });
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit() {
    onIxiStateChange?.(objectId, { editing: false, editDraft: null });
  }

  const metrics = {
    moduleType: "inline-metric-strip",
    config: {
      metrics: [
        { metricId: "assets", label: "ASSETS", source: "projection", key: "assetCount", type: "number" },
        { metricId: "value", label: "VALUE", source: "projection", key: "totalAssetValue", type: "money" },
        { metricId: "employees", label: "EMPLOYEES", source: "projection", key: "employeeCount", type: "number" }
      ]
    }
  };

  const quickFacts = {
    moduleType: "weighted-field-row",
    config: {
      fields: [
        { fieldId: "yardHours", label: "YARD HOURS", width: "1fr" },
        { fieldId: "yardContact", label: "YARD CONTACT", width: "1fr" },
        { fieldId: "yardPhone", label: "PHONE", width: 82 }
      ]
    }
  };

  return (
    <div className="card001 card board-color-none board-outline-1">
      <header className="header">
        <div className="identity">
          <span>LOCATIONS &amp; FACILITIES</span>
          <strong>{runtimeObject?.displayName || "MIDLAND YARD"}</strong>
        </div>
        <IXIAosCardHeaderControls
          canAdd
          canEdit
          editing={editing}
          onAdd={onAddObject}
          onToggleEdit={beginEdit}
          onHide={onHideObject}
          onDelete={onDeleteObject}
          onOpenConsole={onOpenConsole}
        />
      </header>

      <main className="body">
        <div className="photo">
          <IXIAosPrimaryMediaPanel
            object={runtimeObject}
            moduleDefinition={{ config: { height: 108 } }}
          />
        </div>

        <div className="address">
          <IXIAosInlineAddress
            object={runtimeObject}
            editing={editing}
            onFieldChange={patchField}
          />
        </div>

        <div className="metrics">
          <IXIAosInlineMetricStrip
            object={runtimeObject}
            projection={projection}
            moduleDefinition={metrics}
          />
        </div>

        <div className="facts">
          <IXIAosEditableFieldGroup
            object={runtimeObject}
            moduleDefinition={quickFacts}
            editing={editing}
            onFieldChange={patchField}
          />
        </div>

        <div className="relationships">
          <IXIAosRelationshipInfrastructurePanel
            object={runtimeObject}
            moduleDefinition={{
              config: {
                title: "RELATIONSHIPS & INFRASTRUCTURE",
                height: 86
              }
            }}
          />
        </div>

        {editing ? (
          <div className="edit-actions">
            <button type="button" disabled={saving} onClick={saveEdit}>SAVE</button>
            <button type="button" disabled={saving} onClick={cancelEdit}>CANCEL</button>
          </div>
        ) : null}
      </main>

      <IXIAosContainerDeckDock
        container={runtimeObject}
        objects={objects}
        selectedIndex={selectedChildIndex}
        onSelectedIndexChange={setSelectedChildIndex}
        onExposeObject={onExposeObject}
        onRecall={onRecall}
        onBoard={onBoard}
        onReturn={onReturn}
        bottom={RAIL_RESERVE}
      />

      <IXIMachineRail
        listing={runtimeObject}
        saved={false}
        boardColor="none"
        boardOutline={1}
        machineFace={1}
        onSendFront={onSendFront}
        onSendBack={onSendBack}
        onCycleColor={onCycleColor}
        onCycleOutline={onCycleOutline}
        armedDestination={armedDestination}
        onSendToArmedDestination={onSendToArmedDestination}
      />

      <style jsx>{`
        .card001, .card001 * { box-sizing: border-box; }
        .card001 {
          position: relative;
          width: ${NATIVE_WIDTH}px;
          min-width: ${NATIVE_WIDTH}px;
          max-width: ${NATIVE_WIDTH}px;
          height: ${NATIVE_HEIGHT}px;
          min-height: ${NATIVE_HEIGHT}px;
          max-height: ${NATIVE_HEIGHT}px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,.10);
          border-radius: 14px;
          background: linear-gradient(180deg, rgba(255,255,255,.025), transparent 30%), #101010;
          color: #f4f4f4;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.04), 0 18px 34px rgba(0,0,0,.42);
        }
        .header {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: ${HEADER_HEIGHT}px;
          padding: 10px 12px 6px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 8px;
          border-bottom: 1px solid rgba(255,255,255,.045);
          z-index: 5;
        }
        .identity { min-width: 0; flex: 1; }
        .identity span {
          display: block;
          color: #ffc400;
          font-size: 6.5px;
          font-weight: 950;
          letter-spacing: .08em;
        }
        .identity strong {
          display: block;
          margin-top: 5px;
          overflow: hidden;
          color: #f4f4f4;
          font-size: 17px;
          font-weight: 950;
          line-height: 1;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .body {
          position: absolute;
          top: ${HEADER_HEIGHT}px;
          left: 0; right: 0;
          bottom: ${RAIL_RESERVE + DECK_HEIGHT}px;
          overflow: hidden;
          padding: 5px 0 0;
        }
        .photo { margin: 0 0 6px; }
        .address, .metrics, .facts, .relationships { margin: 0 6px 5px; }
        .relationships { margin-bottom: 0; }
        .edit-actions {
          position: absolute;
          right: 7px;
          top: 2px;
          display: flex;
          gap: 4px;
          z-index: 10;
        }
        .edit-actions button {
          height: 20px;
          padding: 0 7px;
          border: 1px solid rgba(255,196,0,.22);
          border-radius: 4px;
          background: #0a0a0a;
          color: #ffc400;
          font-size: 6px;
          font-weight: 950;
        }
        :global(.card001 .ixi-aos-primary-media-panel) {
          border-left: 0;
          border-right: 0;
          border-radius: 0;
        }
        :global(.card001 .ixi-aos-container-deck-dock) {
          left: 0 !important;
          right: 0 !important;
          width: ${NATIVE_WIDTH}px !important;
          max-width: ${NATIVE_WIDTH}px !important;
        }
      `}</style>
    </div>
  );
}

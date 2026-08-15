import IXIFaceFrame
  from "../../../ixi-face-studio/IXIFaceFrame";

import IXIFaceSection
  from "../../../ixi-face-studio/IXIFaceSection";

import IXIFaceGrid
  from "../../../ixi-face-studio/IXIFaceGrid";

import IXIFaceRow
  from "../../../ixi-face-studio/IXIFaceRow";

import IXIFaceActionFooter
  from "../../../ixi-face-studio/IXIFaceActionFooter";


function clean(value) {
  return String(value || "").trim();
}


function safeObject(value) {
  return (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  )
    ? value
    : {};
}


function getSourceValue({
  object = {},
  projection = null,
  source = "fields",
  key = ""
}) {
  const resolvedKey =
    clean(key);

  if (!resolvedKey) {
    return "";
  }

  const resolvedSource =
    clean(source).toLowerCase();

  if (
    resolvedSource ===
    "projection"
  ) {
    return projection?.[resolvedKey] ?? "";
  }

  if (
    resolvedSource ===
    "object"
  ) {
    return object?.[resolvedKey] ?? "";
  }

  if (
    resolvedSource ===
    "metadata"
  ) {
    return object?.metadata?.[resolvedKey] ?? "";
  }

  return object?.fields?.[resolvedKey] ?? "";
}


function formatValue(
  value,
  type = ""
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  const resolvedType =
    clean(type).toLowerCase();

  const number = Number(value);

  if (
    resolvedType === "money" &&
    Number.isFinite(number)
  ) {
    return new Intl.NumberFormat(
      "en-US",
      {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0
      }
    ).format(number);
  }

  if (
    resolvedType === "number" &&
    Number.isFinite(number)
  ) {
    return new Intl.NumberFormat(
      "en-US",
      {
        maximumFractionDigits: 0
      }
    ).format(number);
  }

  return String(value);
}


export function isAosFaceLayoutPrimitive(
  moduleType = ""
) {
  return [
    "face-frame",
    "face-section",
    "face-grid",
    "face-row",
    "face-action-footer"
  ].includes(
    clean(moduleType).toLowerCase()
  );
}


export default function IXIAosFaceLayoutPrimitive({
  moduleDefinition = {},
  object = {},
  projection = null,
  editing = false,
  onFieldChange = null,
  renderChild = null
}) {
  const moduleType =
    clean(
      moduleDefinition?.moduleType
    ).toLowerCase();

  const config =
    safeObject(
      moduleDefinition?.config
    );

  const childModules =
    Array.isArray(config?.modules)
      ? config.modules
      : [];

  const renderedChildren =
    childModules.map(
      (child, index) =>
        renderChild?.(
          child,
          index
        )
    );

  if (
    moduleType ===
    "face-frame"
  ) {
    return (
      <IXIFaceFrame
        size={
          clean(config?.size) ||
          "tall"
        }
        height={
          config?.height ?? null
        }
        flush={
          Boolean(config?.flush)
        }
      >
        {renderedChildren}
      </IXIFaceFrame>
    );
  }

  if (
    moduleType ===
    "face-section"
  ) {
    return (
      <IXIFaceSection
        title={
          clean(config?.title)
        }
        meta={
          clean(config?.meta)
        }
        accent={
          Boolean(config?.accent)
        }
        dense={
          Boolean(config?.dense)
        }
      >
        {renderedChildren}
      </IXIFaceSection>
    );
  }

  if (
    moduleType ===
    "face-grid"
  ) {
    return (
      <IXIFaceGrid
        columns={
          config?.columns ?? 2
        }
        gap={
          clean(config?.gap) ||
          "sm"
        }
        align={
          clean(config?.align) ||
          "stretch"
        }
      >
        {renderedChildren}
      </IXIFaceGrid>
    );
  }

  if (
    moduleType ===
    "face-row"
  ) {
    const fieldId =
      clean(
        config?.fieldId ||
        moduleDefinition?.fieldId
      );

    const source =
      clean(config?.source) ||
      "fields";

    const key =
      clean(
        config?.key ||
        fieldId
      );

    const rawValue =
      getSourceValue({
        object,
        projection,
        source,
        key
      });

    const canEdit =
      Boolean(
        editing &&
        fieldId &&
        source === "fields" &&
        typeof onFieldChange ===
          "function"
      );

    return (
      <IXIFaceRow
        label={
          clean(
            config?.label ||
            moduleDefinition?.label ||
            fieldId ||
            key
          )
        }
        value={
          canEdit
            ? ""
            : formatValue(
                rawValue,
                config?.type
              )
        }
        emphasized={
          Boolean(config?.emphasized)
        }
        muted={
          Boolean(config?.muted)
        }
        editable={canEdit}
      >
        {canEdit ? (
          <input
            value={
              rawValue ?? ""
            }
            onPointerDown={event =>
              event.stopPropagation()
            }
            onChange={event =>
              onFieldChange?.(
                fieldId,
                event.target.value
              )
            }
          />
        ) : null}
      </IXIFaceRow>
    );
  }

  if (
    moduleType ===
    "face-action-footer"
  ) {
    return (
      <IXIFaceActionFooter
        labels={
          Array.isArray(config?.labels)
            ? config.labels
            : undefined
        }
      >
        {renderedChildren.length
          ? renderedChildren
          : null}
      </IXIFaceActionFooter>
    );
  }

  return null;
}

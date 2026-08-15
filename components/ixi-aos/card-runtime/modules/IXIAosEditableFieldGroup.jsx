import {
  useEffect,
  useMemo,
  useState
} from "react";


function clean(
  value
) {
  return String(
    value ?? ""
  ).trim();
}


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


function normalizeWidth(
  width
) {
  if (
    width === null ||
    width === undefined ||
    width === ""
  ) {
    return "1fr";
  }

  if (
    typeof width === "number" &&
    Number.isFinite(width)
  ) {
    return `${width}px`;
  }

  const value =
    clean(width);

  return value || "1fr";
}


function getFieldDefinition(
  object,
  fieldId
) {
  const definitions =
    Array.isArray(
      object?.fieldDefinitions
    )
      ? object.fieldDefinitions
      : [];

  return definitions.find(
    definition =>
      clean(
        definition?.fieldId ||
        definition?.field
      ) ===
      clean(fieldId)
  ) || null;
}


function normalizeFieldSpec(
  object,
  rawField,
  index
) {
  const source =
    typeof rawField === "string"
      ? {
          fieldId:
            rawField
        }
      : safeObject(
          rawField
        );

  const fieldId =
    clean(
      source.fieldId ||
      source.field
    );

  const definition =
    getFieldDefinition(
      object,
      fieldId
    );

  return {
    fieldId,

    label:
      clean(
        source.label ||
        definition?.label ||
        fieldId
      ).toUpperCase(),

    fieldType:
      clean(
        source.fieldType ||
        source.type ||
        definition?.fieldType ||
        definition?.type ||
        "text"
      ).toLowerCase(),

    placeholder:
      clean(
        source.placeholder
      ),

    width:
      normalizeWidth(
        source.width
      ),

    hidden:
      Boolean(
        source.hidden
      ),

    readOnly:
      Boolean(
        source.readOnly
      ),

    index
  };
}


function formatDisplayValue(
  value,
  fieldType
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  const number =
    Number(value);

  if (
    fieldType === "money" &&
    Number.isFinite(number)
  ) {
    return new Intl.NumberFormat(
      "en-US",
      {
        style:
          "currency",

        currency:
          "USD",

        maximumFractionDigits:
          0
      }
    ).format(number);
  }

  if (
    fieldType === "number" &&
    Number.isFinite(number)
  ) {
    return new Intl.NumberFormat(
      "en-US",
      {
        maximumFractionDigits:
          0
      }
    ).format(number);
  }

  return String(value);
}


function getInputType(
  fieldType
) {
  if (
    fieldType === "number" ||
    fieldType === "money"
  ) {
    return "number";
  }

  if (
    fieldType === "email"
  ) {
    return "email";
  }

  if (
    fieldType === "tel" ||
    fieldType === "phone"
  ) {
    return "tel";
  }

  if (
    fieldType === "date"
  ) {
    return "date";
  }

  if (
    fieldType === "time"
  ) {
    return "time";
  }

  return "text";
}


export default function IXIAosEditableFieldGroup({
  object = {},

  moduleDefinition = {},

  editing = false,

  onFieldChange = null,

  className = ""
}) {
  const config =
    safeObject(
      moduleDefinition?.config
    );

  const fieldSpecs =
    useMemo(
      () =>
        (
          Array.isArray(
            config.fields
          )
            ? config.fields
            : []
        )
          .map(
            (field, index) =>
              normalizeFieldSpec(
                object,
                field,
                index
              )
          )
          .filter(
            field =>
              Boolean(
                field.fieldId
              ) &&
              !field.hidden
          ),
      [
        config.fields,
        object
      ]
    );

  const [
    draft,
    setDraft
  ] =
    useState(() => ({
      ...safeObject(
        object?.fields
      )
    }));


  useEffect(
    () => {
      setDraft({
        ...safeObject(
          object?.fields
        )
      });
    },
    [
      object?.fields
    ]
  );


  function setField(
    fieldId,
    value
  ) {
    setDraft(
      current => ({
        ...current,
        [fieldId]:
          value
      })
    );

    onFieldChange?.(
      fieldId,
      value
    );
  }


  if (
    !fieldSpecs.length
  ) {
    return null;
  }


  return (
    <div
      className={[
        "ixi-aos-editable-field-group",
        className
      ]
        .filter(Boolean)
        .join(" ")}

      style={{
        gridTemplateColumns:
          fieldSpecs
            .map(
              field =>
                field.width
            )
            .join(" ")
      }}
    >
      {fieldSpecs.map(
        field => {
          const value =
            draft?.[
              field.fieldId
            ] ??
            "";

          return (
            <label
              key={
                field.fieldId
              }

              className="ixi-aos-editable-field"
            >
              <span>
                {field.label}
              </span>

              {editing ? (
                <input
                  className="ixi-skin-input"

                  type={
                    getInputType(
                      field.fieldType
                    )
                  }

                  value={
                    value
                  }

                  placeholder={
                    field.placeholder
                  }

                  readOnly={
                    field.readOnly
                  }

                  onPointerDown={
                    event =>
                      event.stopPropagation()
                  }

                  onClick={
                    event =>
                      event.stopPropagation()
                  }

                  onChange={
                    event =>
                      setField(
                        field.fieldId,
                        event.target.value
                      )
                  }
                />
              ) : (
                <strong>
                  {formatDisplayValue(
                    value,
                    field.fieldType
                  )}
                </strong>
              )}
            </label>
          );
        }
      )}

      <style jsx>{`
        .ixi-aos-editable-field-group {
          width: 100%;

          display: grid;

          gap: 7px;

          align-items: end;
        }

        .ixi-aos-editable-field {
          min-width: 0;

          display: flex;
          flex-direction: column;

          gap: 4px;
        }

        .ixi-aos-editable-field > span {
          overflow: hidden;

          color:
            rgba(
              255,
              255,
              255,
              .34
            );

          font-size: 6px;
          font-weight: 950;

          letter-spacing: .05em;

          line-height: 1;

          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .ixi-aos-editable-field > strong {
          min-width: 0;

          overflow: hidden;

          color:
            rgba(
              255,
              255,
              255,
              .86
            );

          font-size: 10px;
          font-weight: 900;

          line-height: 1.15;

          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .ixi-aos-editable-field input {
          width: 100%;
          min-width: 0;

          height: 27px;

          padding: 0 7px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .10
            );

          border-radius: 5px;

          background:
            rgba(
              0,
              0,
              0,
              .22
            );

          color: white;

          font-size: 9px;
          font-weight: 850;

          outline: none;
        }

        .ixi-aos-editable-field input:focus {
          border-color:
            rgba(
              255,
              196,
              0,
              .52
            );

          box-shadow:
            0 0 0 1px
            rgba(
              255,
              196,
              0,
              .10
            );
        }
      `}</style>
    </div>
  );
}

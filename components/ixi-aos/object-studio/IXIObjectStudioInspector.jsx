export default function IXIObjectStudioInspector({
  studio
}) {

  const object =
    studio?.objectDraft ||
    {};


  const selectedFace =
    studio?.selectedFace;


  const selectedModule =
    studio?.selectedModule;


  const selectionType =
    studio
      ?.selection
      ?.selectionType ||
    "card";


  return (
    <aside className="studio-inspector">

      <div className="inspector-title">

        <strong>
          INSPECTOR
        </strong>

        <span>
          {selectionType.toUpperCase()}
        </span>

      </div>


      <section>

        <label>
          OBJECT NAME
        </label>

        <input
          value={
            object.displayName ||
            ""
          }

          onChange={
            event =>
              studio
                ?.setObjectName?.(
                  event.target.value
                )
          }
        />

      </section>


      {selectedFace ? (
        <section>

          <label>
            FACE NAME
          </label>

          <input
            value={
              selectedFace.label ||
              ""
            }

            onChange={
              event =>
                studio
                  ?.updateFace?.(
                    selectedFace
                      .faceId,

                    {
                      label:
                        event
                          .target
                          .value
                    }
                  )
            }
          />

        </section>
      ) : null}


      <section>

        <div className="section-heading">

          <label>
            OBJECT FIELDS
          </label>

          <button
            type="button"

            onClick={
              () =>
                studio
                  ?.addField?.(
                    {
                      label:
                        "NEW FIELD",

                      fieldType:
                        "text"
                    },
                    ""
                  )
            }
          >
            +
          </button>

        </div>


        <div className="field-list">

          {(
            object
              .fieldDefinitions ||
            []
          ).map(
            field => (

              <div
                key={
                  field.fieldId
                }

                className="field-row"
              >

                <input
                  className="field-label"

                  value={
                    field.label ||
                    ""
                  }

                  onChange={
                    event =>
                      studio
                        ?.updateField?.(
                          field.fieldId,
                          {
                            label:
                              event
                                .target
                                .value
                          }
                        )
                  }
                />


                <input
                  className="field-value"

                  value={
                    object
                      .fields?.[
                        field.fieldId
                      ] ??
                    ""
                  }

                  onChange={
                    event =>
                      studio
                        ?.setFieldValue?.(
                          field.fieldId,
                          event
                            .target
                            .value
                        )
                  }
                />

              </div>

            )
          )}

        </div>

      </section>


      <section>

        <label>
          CAPABILITIES
        </label>


        <CapabilityToggle
          label="CONTAINER"

          checked={
            Boolean(
              studio
                ?.cardDefinitionDraft
                ?.capabilities
                ?.canContain
            )
          }

          onChange={
            value =>
              studio
                ?.setCapability?.(
                  "canContain",
                  value
                )
          }
        />


        <CapabilityToggle
          label="RECEIVE DROPS"

          checked={
            Boolean(
              studio
                ?.cardDefinitionDraft
                ?.capabilities
                ?.canReceiveDrop
            )
          }

          onChange={
            value =>
              studio
                ?.setCapability?.(
                  "canReceiveDrop",
                  value
                )
          }
        />


        <CapabilityToggle
          label="CONSOLE"

          checked={
            Boolean(
              studio
                ?.cardDefinitionDraft
                ?.capabilities
                ?.hasConsole
            )
          }

          onChange={
            value =>
              studio
                ?.setCapability?.(
                  "hasConsole",
                  value
                )
          }
        />

      </section>


      {selectedModule ? (
        <section>

          <label>
            SELECTED MODULE
          </label>

          <div className="selected-module">
            {
              selectedModule
                .moduleType
            }
          </div>

        </section>
      ) : null}


      <style jsx>{`

        .studio-inspector {
          min-height: 590px;

          padding:
            12px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .05
            );

          border-radius: 9px;

          background:
            rgba(
              255,
              255,
              255,
              .01
            );
        }


        .inspector-title {
          display: flex;

          justify-content:
            space-between;

          align-items: center;

          margin-bottom: 15px;
        }


        .inspector-title strong {
          color: #ffc400;

          font-size: 7px;
          font-weight: 950;
        }


        .inspector-title span {
          color:
            rgba(
              255,
              255,
              255,
              .22
            );

          font-size: 6px;
          font-weight: 900;
        }


        section {
          margin-bottom: 18px;
        }


        label {
          display: block;

          margin-bottom: 6px;

          color:
            rgba(
              255,
              255,
              255,
              .24
            );

          font-size: 6px;
          font-weight: 950;
        }


        input {
          box-sizing:
            border-box;

          width: 100%;
          height: 29px;

          padding:
            0 8px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .055
            );

          border-radius: 4px;

          outline: none;

          background:
            rgba(
              255,
              255,
              255,
              .018
            );

          color:
            rgba(
              255,
              255,
              255,
              .68
            );

          font-size: 7px;
          font-weight: 850;
        }


        input:focus {
          border-color:
            rgba(
              0,
              194,
              255,
              .32
            );
        }


        .section-heading {
          display: flex;

          justify-content:
            space-between;

          align-items: center;
        }


        .section-heading button {
          width: 25px;
          height: 22px;

          border:
            1px solid
            rgba(
              255,
              196,
              0,
              .24
            );

          border-radius: 4px;

          background:
            rgba(
              255,
              196,
              0,
              .05
            );

          color: #ffc400;

          font-weight: 950;

          cursor: pointer;
        }


        .field-list {
          display: flex;

          flex-direction: column;

          gap: 5px;
        }


        .field-row {
          display: grid;

          grid-template-columns:
            .8fr
            1.2fr;

          gap: 4px;
        }


        .field-label {
          color: #ffc400;
        }


        .selected-module {
          padding: 9px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .045
            );

          border-radius: 4px;

          color:
            rgba(
              255,
              255,
              255,
              .48
            );

          font-size: 7px;
          font-weight: 900;
        }

      `}</style>

    </aside>
  );
}


function CapabilityToggle({
  label,
  checked,
  onChange
}) {

  return (
    <button
      type="button"

      className={
        checked
          ? "capability active"
          : "capability"
      }

      onClick={
        () =>
          onChange?.(
            !checked
          )
      }
    >

      <span>
        {label}
      </span>

      <strong>
        {checked
          ? "ON"
          : "OFF"}
      </strong>


      <style jsx>{`

        .capability {
          width: 100%;
          height: 29px;

          margin-bottom: 5px;

          padding:
            0 8px;

          display: flex;

          align-items: center;

          justify-content:
            space-between;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .045
            );

          border-radius: 4px;

          background:
            rgba(
              255,
              255,
              255,
              .012
            );

          cursor: pointer;
        }


        span {
          color:
            rgba(
              255,
              255,
              255,
              .30
            );

          font-size: 6px;
          font-weight: 900;
        }


        strong {
          color:
            rgba(
              255,
              255,
              255,
              .22
            );

          font-size: 6px;
          font-weight: 950;
        }


        .active {
          border-color:
            rgba(
              0,
              194,
              255,
              .22
            );
        }


        .active strong {
          color:
            rgba(
              0,
              194,
              255,
              .82
            );
        }

      `}</style>

    </button>
  );
}

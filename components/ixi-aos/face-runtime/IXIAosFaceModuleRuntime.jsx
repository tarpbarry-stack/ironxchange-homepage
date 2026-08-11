import IXIAosFaceRow
  from "./IXIAosFaceRow";

import IXIAosFaceSection
  from "./IXIAosFaceSection";

import IXIAosFaceGrid
  from "./IXIAosFaceGrid";

import IXIAosFaceSummary
  from "./IXIAosFaceSummary";

import IXIAosFaceNotes
  from "./IXIAosFaceNotes";

import IXIAosRelationshipList
  from "./IXIAosRelationshipList";

import {
  shouldShowIXIAosPresentationPriority
} from "../presentation-runtime/IXIAosPresentationMetrics";


function getObjectFieldValue(
  object = {},
  fieldId = ""
) {

  if (
    !fieldId
  ) {
    return "";
  }


  return (
    object
      ?.fields
      ?.[fieldId] ??
    object
      ?.[fieldId] ??
    ""
  );
}


export default function IXIAosFaceModuleRuntime({
  module = {},

  object = {},

  presentationMode =
    "medium",

  renderModule = null,

  onSaveNotes = null,

  relationships = [],

  onOpenRelationship = null,

  onRemoveRelationship = null,

  onOpenContainer = null,

  studioEditing = false,

  selected = false,

  onSelect = null
}) {

  const moduleType =
    String(
      module?.moduleType ||
      module?.type ||
      ""
    )
      .trim()
      .toLowerCase();


  const priority =
    String(
      module?.priority ||
      "primary"
    )
      .trim()
      .toLowerCase();


  if (
    !shouldShowIXIAosPresentationPriority({
      mode:
        presentationMode,

      priority
    })
  ) {
    return null;
  }


  /*
   * Existing runtime / specialized module packs
   * get first chance.
   *
   * This preserves all current AOS capability
   * renderers while V2 grows around them.
   */
  if (
    typeof renderModule ===
    "function"
  ) {

    const external =
      renderModule({
        object,
        module
      });


    if (
      external !==
      null &&
      external !==
      undefined
    ) {

      return (
        <div
          className={[
            "ixi-aos-module-host",

            selected
              ? "is-selected"
              : ""
          ]
            .filter(Boolean)
            .join(" ")}

          onClick={
            event => {

              if (
                !studioEditing
              ) {
                return;
              }

              event.stopPropagation();

              onSelect?.(
                module
              );
            }
          }
        >

          {external}

          <style jsx>{`

            .ixi-aos-module-host {
              min-width:
                0;

              position:
                relative;
            }


            .is-selected {
              outline:
                1px solid
                rgba(
                  255,
                  196,
                  0,
                  .5
                );

              outline-offset:
                2px;
            }

          `}</style>

        </div>
      );
    }
  }


  function renderBuiltInModule() {

    if (
      moduleType ===
      "field" ||
      moduleType ===
      "object-field"
    ) {

      const fieldId =
        String(
          module?.fieldId ||
          ""
        );


      return (
        <IXIAosFaceRow
          fieldId={
            fieldId
          }

          label={
            module?.label ||
            fieldId
              .replace(
                /[-_]/g,
                " "
              )
              .toUpperCase()
          }

          value={
            getObjectFieldValue(
              object,
              fieldId
            )
          }

          valueChars={
            module?.valueChars
          }

          flexible={
            module?.flexible ===
            true
          }

          emphasized={
            module?.emphasized ===
            true
          }
        />
      );
    }


    if (
      moduleType ===
      "summary" ||
      moduleType ===
      "metric"
    ) {

      const fieldId =
        String(
          module?.fieldId ||
          ""
        );


      return (
        <IXIAosFaceSummary
          label={
            module?.label ||
            fieldId
          }

          value={
            module?.value ??
            getObjectFieldValue(
              object,
              fieldId
            )
          }

          detail={
            module?.detail ||
            ""
          }

          tone={
            module?.tone ||
            "default"
          }

          align={
            module?.align ||
            "left"
          }
        />
      );
    }


    if (
      moduleType ===
      "relationships"
    ) {

      return (
        <IXIAosRelationshipList
          relationships={
            module
              ?.relationships ||
            relationships
          }

          onOpenRelationship={
            onOpenRelationship
          }

          onRemoveRelationship={
            onRemoveRelationship
          }

          onOpenContainer={
            onOpenContainer
          }
        />
      );
    }


    if (
      moduleType ===
      "notes"
    ) {

      const fieldId =
        module?.fieldId ||
        "notes";


      return (
        <IXIAosFaceNotes
          value={
            getObjectFieldValue(
              object,
              fieldId
            )
          }

          label={
            module?.label ||
            "NOTES"
          }

          onSave={
            value =>
              onSaveNotes?.({
                object,
                module,
                fieldId,
                value
              })
          }
        />
      );
    }


    if (
      moduleType ===
      "section"
    ) {

      return (
        <IXIAosFaceSection
          title={
            module?.label ||
            module?.title ||
            ""
          }

          meta={
            module?.meta ||
            ""
          }

          accent={
            module?.accent ===
            true
          }
        >

          {
            module?.content ||
            null
          }

        </IXIAosFaceSection>
      );
    }


    return (
      <div className="unknown-module">

        {
          module?.label ||
          moduleType ||
          "MODULE"
        }

        <style jsx>{`

          .unknown-module {
            min-height:
              38px;

            padding:
              9px;

            border:
              1px dashed
              rgba(
                255,
                255,
                255,
                .12
              );

            border-radius:
              6px;

            color:
              rgba(
                255,
                255,
                255,
                .4
              );

            font-size:
              var(
                --ixi-face-font-value,
                10.5px
              );

            font-weight:
              900;
          }

        `}</style>

      </div>
    );
  }


  return (
    <div
      className={[
        "ixi-aos-module-host",

        selected
          ? "is-selected"
          : ""
      ]
        .filter(Boolean)
        .join(" ")}

      onClick={
        event => {

          if (
            !studioEditing
          ) {
            return;
          }

          event.stopPropagation();

          onSelect?.(
            module
          );
        }
      }
    >

      {renderBuiltInModule()}


      <style jsx>{`

        .ixi-aos-module-host {
          min-width:
            0;

          position:
            relative;
        }


        .is-selected {
          outline:
            1px solid
            rgba(
              255,
              196,
              0,
              .5
            );

          outline-offset:
            2px;
        }

      `}</style>

    </div>
  );
}

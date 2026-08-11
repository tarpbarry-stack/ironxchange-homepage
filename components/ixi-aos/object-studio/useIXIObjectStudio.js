import {
  useCallback,
  useMemo,
  useState
} from "react";

import {
  installIXIStudioCardDesign,
  installIXIStudioFaceDesign,
  installIXIStudioModuleDesign
} from "./libraries/IXIStudioDraftLibraryBridge";

import {
  createIXIObjectStudioDraft,
  normalizeIXIObjectStudioDraft,

  setIXIStudioObjectName,

  setIXIStudioObjectFieldValue,
  removeIXIStudioObjectFieldValue,

  addIXIStudioFieldDefinition,
  updateIXIStudioFieldDefinition,
  removeIXIStudioFieldDefinition,

  setIXIStudioMedia,
  addIXIStudioMedia,
  removeIXIStudioMediaAtIndex,

  addIXIStudioFace,
  updateIXIStudioFace,
  removeIXIStudioFace,
  reorderIXIStudioFace,
  duplicateIXIStudioFace,

  addIXIStudioModule,
  updateIXIStudioModule,
  removeIXIStudioModule,
  reorderIXIStudioModule,

  setIXIStudioCapability,

  selectIXIStudioCard,
  selectIXIStudioFace,
  selectIXIStudioModule,

  applyIXIStudioTemplate,

  getIXIStudioSelectedFace,
  getIXIStudioSelectedModule,

  getIXIStudioPreviewObject,
  getIXIStudioPreviewCardDefinition,

  validateIXIObjectStudioDraft,
  buildIXIObjectStudioLaunchPayload,

  markIXIStudioDraftCommitted,
  serializeIXIObjectStudioDraft
} from "./IXIObjectStudioDraftEngine";


/*
 * IXI OBJECT STUDIO CONTROLLER
 *
 * PURPOSE
 * -------
 *
 * This hook is the React controller between:
 *
 * Object Studio UI
 *       ↓
 * Draft Engine
 *       ↓
 * Card Runtime
 *
 *
 * It does NOT:
 *
 * - render UI
 * - know what kind of Object exists
 * - know Equipment / Locations / Jobs
 * - own AWS persistence
 * - own Console physics
 * - own Board behavior
 *
 *
 * Every Studio component consumes this
 * controller instead of independently
 * inventing state.
 */


export default function useIXIObjectStudio({
  object = null,

  objectDraft = null,

  cardDefinition = null,

  template = null,

  templateSource = null,

  mode = "create",

  initialDraft = null
} = {}) {

  /* =======================================================
     DRAFT
     ======================================================= */

  const [
    draft,
    setDraft
  ] =
    useState(
      () => {

        if (
          initialDraft
        ) {
          return normalizeIXIObjectStudioDraft(
            initialDraft
          );
        }

        return createIXIObjectStudioDraft({
          object,
          objectDraft,
          cardDefinition,
          template,
          templateSource,
          mode
        });
      }
    );


  /* =======================================================
     GENERIC APPLY
     ======================================================= */

  const apply =
    useCallback(
      transformer => {

        setDraft(
          current => {

            if (
              typeof transformer !==
              "function"
            ) {
              return current;
            }

            return transformer(
              current
            );
          }
        );
      },
      []
    );


  /* =======================================================
     OBJECT
     ======================================================= */

  const setObjectName =
    useCallback(
      displayName => {

        apply(
          current =>
            setIXIStudioObjectName(
              current,
              displayName
            )
        );
      },
      [
        apply
      ]
    );


  /* =======================================================
     FIELD VALUES
     ======================================================= */

  const setFieldValue =
    useCallback(
      (
        fieldId,
        value
      ) => {

        apply(
          current =>
            setIXIStudioObjectFieldValue(
              current,
              fieldId,
              value
            )
        );
      },
      [
        apply
      ]
    );


  const removeFieldValue =
    useCallback(
      fieldId => {

        apply(
          current =>
            removeIXIStudioObjectFieldValue(
              current,
              fieldId
            )
        );
      },
      [
        apply
      ]
    );


  /* =======================================================
     FIELD DEFINITIONS
     ======================================================= */

  const addField =
    useCallback(
      (
        definition = {},
        initialValue = ""
      ) => {

        apply(
          current =>
            addIXIStudioFieldDefinition(
              current,
              definition,
              initialValue
            )
        );
      },
      [
        apply
      ]
    );


  const updateField =
    useCallback(
      (
        fieldId,
        patch = {}
      ) => {

        apply(
          current =>
            updateIXIStudioFieldDefinition(
              current,
              fieldId,
              patch
            )
        );
      },
      [
        apply
      ]
    );


  const removeField =
    useCallback(
      (
        fieldId,
        options = {}
      ) => {

        apply(
          current =>
            removeIXIStudioFieldDefinition(
              current,
              fieldId,
              options
            )
        );
      },
      [
        apply
      ]
    );


  /* =======================================================
     MEDIA
     ======================================================= */

  const setMedia =
    useCallback(
      media => {

        apply(
          current =>
            setIXIStudioMedia(
              current,
              media
            )
        );
      },
      [
        apply
      ]
    );


  const addMedia =
    useCallback(
      mediaItem => {

        apply(
          current =>
            addIXIStudioMedia(
              current,
              mediaItem
            )
        );
      },
      [
        apply
      ]
    );


  const removeMedia =
    useCallback(
      index => {

        apply(
          current =>
            removeIXIStudioMediaAtIndex(
              current,
              index
            )
        );
      },
      [
        apply
      ]
    );


  /* =======================================================
     FACES
     ======================================================= */

  const addFace =
    useCallback(
      face => {

        apply(
          current =>
            addIXIStudioFace(
              current,
              face
            )
        );
      },
      [
        apply
      ]
    );


  const updateFace =
    useCallback(
      (
        faceId,
        patch
      ) => {

        apply(
          current =>
            updateIXIStudioFace(
              current,
              faceId,
              patch
            )
        );
      },
      [
        apply
      ]
    );


  const removeFace =
    useCallback(
      faceId => {

        apply(
          current =>
            removeIXIStudioFace(
              current,
              faceId
            )
        );
      },
      [
        apply
      ]
    );


  const moveFace =
    useCallback(
      (
        fromIndex,
        toIndex
      ) => {

        apply(
          current =>
            reorderIXIStudioFace(
              current,
              fromIndex,
              toIndex
            )
        );
      },
      [
        apply
      ]
    );


  const duplicateFace =
    useCallback(
      faceId => {

        apply(
          current =>
            duplicateIXIStudioFace(
              current,
              faceId
            )
        );
      },
      [
        apply
      ]
    );


  /* =======================================================
     MODULES
     ======================================================= */

  const addModule =
    useCallback(
      (
        faceId,
        module
      ) => {

        apply(
          current =>
            addIXIStudioModule({
              draft:
                current,

              faceId,

              module
            })
        );
      },
      [
        apply
      ]
    );


  const updateModule =
    useCallback(
      (
        faceId,
        moduleId,
        patch
      ) => {

        apply(
          current =>
            updateIXIStudioModule({
              draft:
                current,

              faceId,

              moduleId,

              patch
            })
        );
      },
      [
        apply
      ]
    );


  const removeModule =
    useCallback(
      (
        faceId,
        moduleId
      ) => {

        apply(
          current =>
            removeIXIStudioModule({
              draft:
                current,

              faceId,

              moduleId
            })
        );
      },
      [
        apply
      ]
    );


  const moveModule =
    useCallback(
      (
        faceId,
        fromIndex,
        toIndex
      ) => {

        apply(
          current =>
            reorderIXIStudioModule({
              draft:
                current,

              faceId,

              fromIndex,

              toIndex
            })
        );
      },
      [
        apply
      ]
    );


  /* =======================================================
     CAPABILITIES
     ======================================================= */

  const setCapability =
    useCallback(
      (
        capabilityName,
        value
      ) => {

        apply(
          current =>
            setIXIStudioCapability(
              current,
              capabilityName,
              value
            )
        );
      },
      [
        apply
      ]
    );


  /* =======================================================
     SELECTION
     ======================================================= */

  const selectCard =
    useCallback(
      () => {

        apply(
          current =>
            selectIXIStudioCard(
              current
            )
        );
      },
      [
        apply
      ]
    );


  const selectFace =
    useCallback(
      faceId => {

        apply(
          current =>
            selectIXIStudioFace(
              current,
              faceId
            )
        );
      },
      [
        apply
      ]
    );


  const selectModule =
    useCallback(
      (
        faceId,
        moduleId
      ) => {

        apply(
          current =>
            selectIXIStudioModule(
              current,
              faceId,
              moduleId
            )
        );
      },
      [
        apply
      ]
    );


  /* =======================================================
     TEMPLATE
     ======================================================= */

  const applyTemplate =
    useCallback(
      (
        nextTemplate,
        nextTemplateSource = null
      ) => {

        apply(
          current =>
            applyIXIStudioTemplate({
              draft:
                current,

              template:
                nextTemplate,

              templateSource:
                nextTemplateSource
            })
        );
      },
      [
        apply
      ]
    );


  /* =======================================================
     RESET / LOAD
     ======================================================= */

  const replaceDraft =
    useCallback(
      nextDraft => {

        setDraft(
          normalizeIXIObjectStudioDraft(
            nextDraft
          )
        );
      },
      []
    );


  const resetStudio =
    useCallback(
      options => {

        setDraft(
          createIXIObjectStudioDraft({
            object:
              options?.object ??
              object,

            objectDraft:
              options?.objectDraft ??
              null,

            cardDefinition:
              options?.cardDefinition ??
              null,

            template:
              options?.template ??
              null,

            templateSource:
              options?.templateSource ??
              null,

            mode:
              options?.mode ??
              mode
          })
        );
      },
      [
        object,
        mode
      ]
    );

  /* =======================================================
     DESIGN LIBRARY
     ======================================================= */

  const installCardDesign =
    useCallback(
      design => {

        apply(
          current =>
            installIXIStudioCardDesign({
              draft:
                current,

              design
            })
        );
      },
      [
        apply
      ]
    );


  const installFaceDesign =
    useCallback(
      design => {

        apply(
          current =>
            installIXIStudioFaceDesign({
              draft:
                current,

              design
            })
        );
      },
      [
        apply
      ]
    );


  const installModuleDesign =
    useCallback(
      (
        design,
        faceId = ""
      ) => {

        apply(
          current =>
            installIXIStudioModuleDesign({
              draft:
                current,

              design,

              faceId
            })
        );
      },
      [
        apply
      ]
    );
  
  /* =======================================================
     DERIVED STATE
     ======================================================= */

  const selectedFace =
    useMemo(
      () =>
        getIXIStudioSelectedFace(
          draft
        ),
      [
        draft
      ]
    );


  const selectedModule =
    useMemo(
      () =>
        getIXIStudioSelectedModule(
          draft
        ),
      [
        draft
      ]
    );


  const previewObject =
    useMemo(
      () =>
        getIXIStudioPreviewObject(
          draft
        ),
      [
        draft
      ]
    );


  const previewCardDefinition =
    useMemo(
      () =>
        getIXIStudioPreviewCardDefinition(
          draft
        ),
      [
        draft
      ]
    );


  const validation =
    useMemo(
      () =>
        validateIXIObjectStudioDraft(
          draft
        ),
      [
        draft
      ]
    );


  /* =======================================================
     LAUNCH
     ======================================================= */

  const buildLaunchPayload =
    useCallback(
      () =>
        buildIXIObjectStudioLaunchPayload(
          draft
        ),
      [
        draft
      ]
    );


  const markCommitted =
    useCallback(
      () => {

        setDraft(
          current =>
            markIXIStudioDraftCommitted(
              current
            )
        );
      },
      []
    );


  /* =======================================================
     SNAPSHOT
     ======================================================= */

  const getSnapshot =
    useCallback(
      () =>
        serializeIXIObjectStudioDraft(
          draft
        ),
      [
        draft
      ]
    );


  /* =======================================================
     PUBLIC CONTROLLER
     ======================================================= */

  return {

    /*
     * RAW STATE
     */
    draft,

    objectDraft:
      draft.objectDraft,

    cardDefinitionDraft:
      draft.cardDefinitionDraft,

    templateSource:
      draft.templateSource,

    selection:
      draft.selection,


    /*
     * STATUS
     */
    dirty:
      draft.dirty,

    revision:
      draft.revision,

    valid:
      validation.valid,

    validationErrors:
      validation.errors,


    /*
     * LIVE PREVIEW
     */
    previewObject,

    previewCardDefinition,

    selectedFace,

    selectedModule,


    /*
     * OBJECT ACTIONS
     */
    setObjectName,


    /*
     * FIELD ACTIONS
     */
    setFieldValue,
    removeFieldValue,

    addField,
    updateField,
    removeField,


    /*
     * MEDIA
     */
    setMedia,
    addMedia,
    removeMedia,


    /*
     * FACE ACTIONS
     */
    addFace,
    updateFace,
    removeFace,
    moveFace,
    duplicateFace,


    /*
     * MODULE ACTIONS
     */
    addModule,
    updateModule,
    removeModule,
    moveModule,


    /*
     * CAPABILITIES
     */
    setCapability,


    /*
     * SELECTION
     */
    selectCard,
    selectFace,
    selectModule,


    /*
     * DESIGNS / TEMPLATES
     */
    applyTemplate,

        /*
     * DESIGN LIBRARY
     */
    installCardDesign,
    installFaceDesign,
    installModuleDesign,


    /*
     * DRAFT CONTROL
     */
    replaceDraft,
    resetStudio,

    getSnapshot,


    /*
     * LAUNCH BOUNDARY
     */
    buildLaunchPayload,
    markCommitted
  };
}

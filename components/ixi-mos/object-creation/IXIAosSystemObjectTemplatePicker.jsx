import {
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import IXIAosCardCatalogPreview
  from "../../ixi-aos-card-library/IXIAosCardCatalogPreview";

import {
  loadAosCardCatalog
} from "../../ixi-aos-card-library/IXIAosCardCatalogClient";

import {
  getAosCardSampleData
} from "../../ixi-aos-card-library/IXIAosCardSampleData";

import {
  formatAosCardNumber,
  getAosTemplateNumber,
  getSelectableAosSystemTemplates,
  isCompleteAosSystemTemplateSet
} from "../../../lib/mos/ixiAosSystemObjectTemplateContract.mjs";

import {
  getAosHierarchyDisplayName
} from "../../../lib/mos/ixiAosHierarchyContract.mjs";


function clean(value) {
  return String(value ?? "").trim();
}


export default function IXIAosSystemObjectTemplatePicker({
  open = false,
  entityId = null,
  parentObject = null,
  onClose = null,
  onCreate = null
}) {
  const [templates, setTemplates] =
    useState([]);
  const [selectedSlug, setSelectedSlug] =
    useState("");
  const [loading, setLoading] =
    useState(false);
  const [creating, setCreating] =
    useState(false);
  const [error, setError] =
    useState("");
  const dialogRef =
    useRef(null);
  const previousFocusRef =
    useRef(null);
  const creatingRef =
    useRef(false);
  const onCloseRef =
    useRef(onClose);

  creatingRef.current = creating;
  onCloseRef.current = onClose;


  useEffect(() => {
    if (!open) return undefined;

    const controller =
      new AbortController();

    async function load() {
      setLoading(true);
      setError("");

      try {
        const result =
          await loadAosCardCatalog({
            entityId,
            signal:
              controller.signal
          });

        const selectable =
          getSelectableAosSystemTemplates(
            result?.templates
          );

        if (!isCompleteAosSystemTemplateSet(selectable)) {
          throw new Error(
            `AOS Card Library returned ${selectable.length} of 17 required layouts.`
          );
        }

        setTemplates(selectable);
        setSelectedSlug(current => {
          if (
            current &&
            selectable.some(
              template =>
                clean(template?.templateSlug) === current
            )
          ) {
            return current;
          }

          return clean(
            selectable[0]?.templateSlug
          );
        });
      } catch (caught) {
        if (caught?.name === "AbortError") return;

        setError(
          caught?.message ||
          "AOS Card Library could not be loaded."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => controller.abort();
  }, [open, entityId]);


  useEffect(() => {
    if (!open) return undefined;

    previousFocusRef.current =
      document.activeElement;

    const focusFrame =
      window.requestAnimationFrame(() => {
        dialogRef.current
          ?.querySelector("button:not(:disabled)")
          ?.focus();
      });

    function closeOnEscape(event) {
      if (
        event.key === "Escape" &&
        !creatingRef.current
      ) {
        onCloseRef.current?.();
      }

      if (event.key !== "Tab") return;

      const focusable = [
        ...(dialogRef.current?.querySelectorAll(
          "button:not(:disabled)"
        ) || [])
      ];

      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener(
      "keydown",
      closeOnEscape
    );

    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener(
        "keydown",
        closeOnEscape
      );

      if (
        previousFocusRef.current &&
        typeof previousFocusRef.current.focus === "function"
      ) {
        previousFocusRef.current.focus();
      }
    };
  }, [open]);


  const selectedTemplate =
    useMemo(
      () =>
        templates.find(
          template =>
            clean(template?.templateSlug) ===
            selectedSlug
        ) || null,
      [templates, selectedSlug]
    );


  const sample =
    useMemo(
      () =>
        getAosCardSampleData(
          selectedTemplate?.templateSlug
        ),
      [selectedTemplate?.templateSlug]
    );


  if (!open) return null;


  async function createSelected() {
    if (!selectedTemplate || creating) return;

    setCreating(true);
    setError("");

    try {
      await onCreate?.(selectedTemplate);
    } catch (caught) {
      setError(
        caught?.message ||
        "The AOS draft could not be opened."
      );
    } finally {
      setCreating(false);
    }
  }


  const number =
    getAosTemplateNumber(selectedTemplate);

  const parentName =
    getAosHierarchyDisplayName(
      parentObject || {}
    );

  const creatingChild =
    Boolean(parentObject);


  return (
    <div
      className="aos-create-backdrop"
      role="presentation"
      onPointerDown={event => {
        event.stopPropagation();
      }}
    >
      <section
        ref={dialogRef}
        className="aos-create-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="aos-create-title"
        aria-describedby="aos-create-description"
      >
        <header className="aos-create-header">
          <div>
            <span>
              {creatingChild
                ? "IXI AOS · CREATE CHILD"
                : "IXI AOS · CREATE"}
            </span>
            <h2 id="aos-create-title">
              {creatingChild
                ? "SELECT CHILD CONTAINER CARD"
                : "SELECT SYSTEM CONTAINER CARD"}
            </h2>
            <p id="aos-create-description">
              {creatingChild
                ? `Choose the operating layout inside ${parentName}. You will name and define the child on the card before it receives a Passport.`
                : "Choose the operating layout. You will name and define the container on the card before it receives a Passport."}
            </p>
          </div>

          <button
            type="button"
            className="aos-create-close"
            onClick={() => onClose?.()}
            disabled={creating}
            aria-label="Close AOS card selector"
          >
            ×
          </button>
        </header>

        <div className="aos-create-content">
          <div className="aos-create-directory">
            <div className="aos-create-directory-title">
              <span>CARD LIBRARY</span>
              <strong>{templates.length}/17</strong>
            </div>

            <div className="aos-create-grid">
              {loading ? (
                <div className="aos-create-message">LOADING AOS CARDS…</div>
              ) : null}

              {!loading && templates.map(template => {
                const templateNumber =
                  getAosTemplateNumber(template);
                const slug =
                  clean(template?.templateSlug);
                const selected =
                  slug === selectedSlug;

                return (
                  <button
                    key={`${templateNumber}:${slug}`}
                    type="button"
                    className={selected ? "aos-create-tile selected" : "aos-create-tile"}
                    aria-pressed={selected}
                    onClick={() => setSelectedSlug(slug)}
                    onDoubleClick={createSelected}
                  >
                    <b>{formatAosCardNumber(templateNumber)}</b>
                    <span>{clean(template?.label) || `AOS CARD ${formatAosCardNumber(templateNumber)}`}</span>
                    <small>{clean(template?.metadata?.sampleUse) || clean(template?.librarySection) || "CUSTOMER-DEFINED SYSTEM"}</small>
                  </button>
                );
              })}
            </div>
          </div>

          <aside className="aos-create-preview">
            <div className="aos-create-preview-title">
              <span>SELECTED LAYOUT</span>
              <strong>{number ? `#${formatAosCardNumber(number)}` : "—"}</strong>
            </div>

            <div className="aos-create-preview-card" aria-hidden="true">
              {selectedTemplate ? (
                <IXIAosCardCatalogPreview
                  template={selectedTemplate}
                  sampleData={sample?.sampleData || {}}
                  projection={sample?.projection || null}
                  directItems={sample?.directItems || []}
                  parentLabel={parentName}
                  previewScaleMode="work"
                  showScaleControl={false}
                  onAddChild={() => {}}
                  onSaveObject={async () => {}}
                  onAddMedia={() => {}}
                  onExposeContents={() => {}}
                  onGatherContents={() => {}}
                  onReturnContents={() => {}}
                  onOpenConsole={() => {}}
                  onOpenMenu={() => {}}
                />
              ) : null}
            </div>

            <div className="aos-create-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => onClose?.()}
                disabled={creating}
              >
                CANCEL
              </button>

              <button
                type="button"
                className="primary"
                onClick={createSelected}
                disabled={!selectedTemplate || loading || creating}
              >
                {creating
                  ? "OPENING DRAFT…"
                  : `USE CARD ${number ? formatAosCardNumber(number) : "—"}`}
              </button>
            </div>

            {error ? (
              <div className="aos-create-error" role="alert">{error}</div>
            ) : null}
          </aside>
        </div>
      </section>

      <style jsx global>{`
        .aos-create-backdrop,.aos-create-backdrop *{box-sizing:border-box}.aos-create-backdrop{position:fixed;inset:0;z-index:5000;display:flex;align-items:center;justify-content:center;padding:28px;background:rgba(0,0,0,.82);backdrop-filter:blur(8px)}.aos-create-dialog{width:min(1180px,calc(100vw - 56px));height:min(820px,calc(100vh - 56px));overflow:hidden;border:1px solid rgba(255,196,0,.34);border-radius:18px;background:linear-gradient(180deg,#151816,#090b0a);color:#eef1ef;box-shadow:0 36px 100px #000,inset 0 1px rgba(255,255,255,.08);font-family:Inter,Arial,sans-serif}.aos-create-header{height:108px;display:flex;align-items:center;justify-content:space-between;gap:24px;padding:18px 22px;border-bottom:1px solid rgba(255,255,255,.08);background:linear-gradient(180deg,rgba(255,255,255,.035),transparent)}.aos-create-header span{display:block;color:#ffc400;font-size:11px;font-weight:900;letter-spacing:.09em}.aos-create-header h2{margin:6px 0 0;font-size:24px;line-height:1;font-weight:950;letter-spacing:-.02em}.aos-create-header p{max-width:760px;margin:8px 0 0;color:#929a95;font-size:12px;font-weight:650}.aos-create-close{width:46px;height:46px;flex:0 0 46px;border:1px solid #3d443f;border-radius:10px;background:#101310;color:#ffc400;font-size:28px;line-height:1;cursor:pointer}.aos-create-content{height:calc(100% - 108px);display:grid;grid-template-columns:minmax(0,1fr) 400px}.aos-create-directory{min-width:0;display:flex;flex-direction:column;border-right:1px solid rgba(255,255,255,.08)}.aos-create-directory-title,.aos-create-preview-title{height:42px;display:flex;align-items:center;justify-content:space-between;padding:0 16px;border-bottom:1px solid rgba(255,255,255,.07);color:#8e9691;font-size:10px;font-weight:900;letter-spacing:.08em}.aos-create-directory-title strong,.aos-create-preview-title strong{color:#ffc400;font-size:12px}.aos-create-grid{min-height:0;flex:1;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-auto-rows:90px;gap:8px;padding:12px;overflow-y:auto}.aos-create-tile{min-width:0;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:5px;padding:11px;border:1px solid #343a36;border-radius:9px;background:linear-gradient(180deg,#171a18,#101311);color:#eef1ef;text-align:left;cursor:pointer;transition:border-color 140ms ease,background 140ms ease,transform 140ms ease}.aos-create-tile:hover{border-color:rgba(255,196,0,.48);background:#191b18;transform:translateY(-1px)}.aos-create-tile.selected{border-color:#ffc400;box-shadow:inset 0 0 0 1px rgba(255,196,0,.22)}.aos-create-tile b{color:#ffc400;font-size:17px;font-weight:950}.aos-create-tile span{max-width:100%;overflow:hidden;font-size:11.5px;font-weight:900;text-overflow:ellipsis;white-space:nowrap}.aos-create-tile small{max-width:100%;overflow:hidden;color:#818984;font-size:8.25px;font-weight:800;letter-spacing:.025em;text-overflow:ellipsis;white-space:nowrap}.aos-create-message{grid-column:1/-1;display:flex;align-items:center;justify-content:center;color:#8d958f;font-size:12px;font-weight:900}.aos-create-preview{min-width:0;display:flex;flex-direction:column;align-items:center}.aos-create-preview-title{width:100%}.aos-create-preview-card{width:360px;height:595px;margin:8px auto 6px;display:flex;align-items:flex-start;justify-content:center;overflow:hidden;pointer-events:none}.aos-create-preview-card .numbered-container-preview .face-switch{display:none}.aos-create-preview-card>div{transform-origin:top center}.aos-create-actions{width:100%;display:grid;grid-template-columns:110px minmax(0,1fr);gap:8px;padding:0 14px}.aos-create-actions button{height:42px;border-radius:7px;font-size:11px;font-weight:950;letter-spacing:.05em;cursor:pointer}.aos-create-actions .secondary{border:1px solid #3a403c;background:#111411;color:#aab0ac}.aos-create-actions .primary{border:1px solid #ffc400;background:#ffc400;color:#090a09}.aos-create-actions button:disabled{opacity:.48;cursor:default}.aos-create-error{width:calc(100% - 28px);margin:10px 14px 0;padding:9px 10px;border:1px solid rgba(255,75,75,.45);border-radius:6px;background:rgba(255,75,75,.08);color:#ff8a8a;font-size:10px;font-weight:850}.aos-create-close:focus-visible,.aos-create-tile:focus-visible,.aos-create-actions button:focus-visible{outline:2px solid #ffc400;outline-offset:2px}@media(max-width:900px){.aos-create-backdrop{padding:10px}.aos-create-dialog{width:calc(100vw - 20px);height:calc(100vh - 20px)}.aos-create-header{height:118px;padding:14px}.aos-create-header h2{font-size:18px}.aos-create-header p{font-size:10px}.aos-create-content{position:relative;height:calc(100% - 118px);grid-template-columns:1fr}.aos-create-directory{height:100%;padding-bottom:70px;border-right:0}.aos-create-grid{grid-template-columns:repeat(2,minmax(0,1fr));grid-auto-rows:82px}.aos-create-preview{position:absolute;left:10px;right:10px;bottom:10px;height:58px;display:flex;justify-content:center;padding:7px;border:1px solid rgba(255,255,255,.1);border-radius:9px;background:#0d100e;box-shadow:0 -10px 30px #000}.aos-create-preview-title,.aos-create-preview-card{display:none}.aos-create-actions{padding:0}.aos-create-error{position:absolute;left:0;right:0;bottom:62px;width:auto;margin:0}}
      `}</style>
    </div>
  );
}

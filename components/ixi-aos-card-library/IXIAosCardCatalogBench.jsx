import {
  useEffect,
  useMemo,
  useState
} from "react";

import IXIAosCardCatalogPreview
  from "./IXIAosCardCatalogPreview";

import {
  loadAosCardCatalog
} from "./IXIAosCardCatalogClient";

import {
  getAosCardSampleData
} from "./IXIAosCardSampleData";


function clean(
  value
) {
  return String(
    value || ""
  ).trim();
}


function sortTemplates(
  templates = []
) {
  return [
    ...templates
  ].sort((a, b) => {
    const aNumber =
      Number(
        a?.templateNumber || 0
      );

    const bNumber =
      Number(
        b?.templateNumber || 0
      );

    if (
      aNumber !== bNumber
    ) {
      return (
        aNumber - bNumber
      );
    }

    return clean(
      a?.label
    ).localeCompare(
      clean(
        b?.label
      )
    );
  });
}


function formatCardNumber(
  value
) {
  const number =
    Number(
      value || 0
    );

  if (!number) {
    return "—";
  }

  return String(
    number
  ).padStart(
    3,
    "0"
  );
}


export default function IXIAosCardCatalogBench({
  entityId = null
}) {
  const [
    templates,
    setTemplates
  ] = useState([]);

  const [
    selectedSlug,
    setSelectedSlug
  ] = useState("");

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    error,
    setError
  ] = useState("");


  useEffect(() => {
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

        const nextTemplates =
          sortTemplates(
            result?.templates || []
          );

        setTemplates(
          nextTemplates
        );

        setSelectedSlug(
          current => {
            if (
              current &&
              nextTemplates.some(
                template =>
                  clean(
                    template
                      ?.templateSlug
                  ) === current
              )
            ) {
              return current;
            }

            return clean(
              nextTemplates[0]
                ?.templateSlug
            );
          }
        );
      } catch (loadError) {
        if (
          loadError?.name ===
          "AbortError"
        ) {
          return;
        }

        console.error(
          "AOS CARD CATALOG LOAD FAILED:",
          loadError
        );

        setError(
          loadError?.message ||
          "Could not load AOS Card Library."
        );
      } finally {
        if (
          !controller
            .signal
            .aborted
        ) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      controller.abort();
    };
  }, [
    entityId
  ]);


  const selectedTemplate =
    useMemo(
      () =>
        templates.find(
          template =>
            clean(
              template?.templateSlug
            ) ===
            selectedSlug
        ) ||
        null,
      [
        templates,
        selectedSlug
      ]
    );


  const selectedIndex =
    selectedTemplate
      ? templates.indexOf(
          selectedTemplate
        )
      : -1;


  const sample =
    useMemo(
      () =>
        getAosCardSampleData(
          selectedTemplate
            ?.templateSlug
        ),
      [
        selectedTemplate
          ?.templateSlug
      ]
    );


  function selectPrevious() {
    if (
      templates.length < 2 ||
      selectedIndex < 0
    ) {
      return;
    }

    const nextIndex =
      selectedIndex === 0
        ? templates.length - 1
        : selectedIndex - 1;

    setSelectedSlug(
      clean(
        templates[nextIndex]
          ?.templateSlug
      )
    );
  }


  function selectNext() {
    if (
      templates.length < 2 ||
      selectedIndex < 0
    ) {
      return;
    }

    const nextIndex =
      (
        selectedIndex + 1
      ) %
      templates.length;

    setSelectedSlug(
      clean(
        templates[nextIndex]
          ?.templateSlug
      )
    );
  }


  return (
    <div className="aos-card-bench">

      <aside className="aos-card-library">

        <div className="panel-title">
          AOS CARD LIBRARY

          <span>
            {
              templates.length
            }
          </span>
        </div>


        <div className="card-list">

          {loading ? (
            <div className="panel-message">
              LOADING CARDS...
            </div>
          ) : null}


          {!loading &&
          error ? (
            <div className="panel-message error">
              {error}
            </div>
          ) : null}


          {!loading &&
          !error &&
          templates.length === 0 ? (
            <div className="panel-message">
              NO CARDS REGISTERED
            </div>
          ) : null}


          {templates.map(
            template => {
              const slug =
                clean(
                  template
                    ?.templateSlug
                );

              const active =
                slug ===
                selectedSlug;

              return (
                <button
                  key={
                    `${
                      slug
                    }:${
                      template?.version ||
                      1
                    }`
                  }

                  type="button"

                  className={
                    active
                      ? "card-picker active"
                      : "card-picker"
                  }

                  onClick={() =>
                    setSelectedSlug(
                      slug
                    )
                  }
                >
                  <span className="card-number">
                    #
                    {
                      formatCardNumber(
                        template
                          ?.templateNumber
                      )
                    }
                  </span>

                  <span className="card-name">
                    {
                      clean(
                        template?.label
                      ) ||
                      slug
                    }
                  </span>

                  <span className="card-section">
                    {
                      clean(
                        template
                          ?.librarySection
                      ) ||
                      "AOS"
                    }
                  </span>
                </button>
              );
            }
          )}

        </div>

      </aside>


      <section className="aos-card-stage">

        <div className="stage-header">

          <button
            type="button"
            onClick={
              selectPrevious
            }
            disabled={
              templates.length < 2
            }
          >
            ← PREV
          </button>


          <div className="stage-identity">

            <strong>
              {
                selectedTemplate
                  ? `#${
                      formatCardNumber(
                        selectedTemplate
                          ?.templateNumber
                      )
                    } ${
                      clean(
                        selectedTemplate
                          ?.label
                      )
                    }`
                  : "NO CARD SELECTED"
              }
            </strong>

            <span>
              {
                selectedTemplate
                  ? `${
                      selectedIndex + 1
                    } / ${
                      templates.length
                    }`
                  : `0 / ${
                      templates.length
                    }`
              }
            </span>

          </div>


          <button
            type="button"
            onClick={
              selectNext
            }
            disabled={
              templates.length < 2
            }
          >
            NEXT →
          </button>

        </div>


        <div className="card-stage">

          <div className="native-label">
            NATIVE CARD ·
            298 × 471
          </div>

          <IXIAosCardCatalogPreview
            template={
              selectedTemplate
            }

            sampleData={
              sample?.sampleData ||
              {}
            }

            projection={
              sample?.projection ||
              null
            }

            directItems={
              sample?.directItems ||
              []
            }

            onAddChild={() => {}}

            onSaveObject={async () => {}}

            onAddMedia={() => {}}

            onExposeContents={() => {}}
            onGatherContents={() => {}}
            onReturnContents={() => {}}

            onOpenConsole={() => {}}
            onOpenMenu={() => {}}
          />

        </div>

      </section>


      <aside className="aos-card-inspector">

        <div className="panel-title">
          TEMPLATE
        </div>


        {selectedTemplate ? (
          <div className="template-facts">

            <div>
              <span>
                CARD
              </span>

              <strong>
                #
                {
                  formatCardNumber(
                    selectedTemplate
                      ?.templateNumber
                  )
                }
              </strong>
            </div>


            <div>
              <span>
                SLUG
              </span>

              <strong>
                {
                  clean(
                    selectedTemplate
                      ?.templateSlug
                  )
                }
              </strong>
            </div>


            <div>
              <span>
                VERSION
              </span>

              <strong>
                {
                  selectedTemplate
                    ?.version ||
                  1
                }
              </strong>
            </div>


            <div>
              <span>
                BASE TYPE
              </span>

              <strong>
                {
                  clean(
                    selectedTemplate
                      ?.baseObjectType
                  ) ||
                  "generic"
                }
              </strong>
            </div>


            <div>
              <span>
                SECTION
              </span>

              <strong>
                {
                  clean(
                    selectedTemplate
                      ?.librarySection
                  ) ||
                  "AOS"
                }
              </strong>
            </div>


            <div>
              <span>
                RENDERER
              </span>

              <strong>
                {
                  clean(
                    selectedTemplate
                      ?.faceSchema?.[0]
                      ?.rendererSlug
                  ) ||
                  "NONE"
                }
              </strong>
            </div>

          </div>
        ) : (
          <div className="panel-message">
            SELECT A CARD
          </div>
        )}

      </aside>


      <style jsx>{`
        .aos-card-bench {
          width: 100%;

          min-height:
            calc(
              100vh - 180px
            );

          display: grid;

          grid-template-columns:
            240px
            minmax(420px, 1fr)
            280px;

          gap: 18px;
        }


        .aos-card-library,
        .aos-card-stage,
        .aos-card-inspector {
          min-width: 0;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .08
            );

          border-radius:
            12px;

          background:
            linear-gradient(
              180deg,
              rgba(
                255,
                255,
                255,
                .02
              ),
              rgba(
                255,
                255,
                255,
                0
              )
            ),
            #121212;

          overflow: hidden;
        }


        .panel-title,
        .stage-header {
          height: 42px;

          display: flex;
          align-items: center;

          border-bottom:
            1px solid
            rgba(
              255,
              255,
              255,
              .06
            );
        }


        .panel-title {
          justify-content:
            space-between;

          padding:
            0 14px;

          color:
            #ffc400;

          font-size:
            9px;

          font-weight:
            950;

          letter-spacing:
            .08em;
        }


        .panel-title span {
          color:
            rgba(
              255,
              255,
              255,
              .34
            );
        }


        .card-list {
          height:
            calc(
              100% - 42px
            );

          overflow-y:
            auto;

          padding:
            10px;
        }


        .card-picker {
          width: 100%;

          min-height:
            48px;

          display: grid;

          grid-template-columns:
            46px
            minmax(0, 1fr);

          gap:
            2px 8px;

          margin-bottom:
            6px;

          padding:
            7px 8px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .05
            );

          border-radius:
            6px;

          background:
            rgba(
              255,
              255,
              255,
              .02
            );

          cursor:
            pointer;

          text-align:
            left;
        }


        .card-picker.active {
          border-color:
            rgba(
              255,
              196,
              0,
              .24
            );

          background:
            rgba(
              255,
              196,
              0,
              .08
            );
        }


        .card-number {
          grid-row:
            1 / span 2;

          color:
            #ffc400;

          font-size:
            9px;

          font-weight:
            950;
        }


        .card-name {
          overflow:
            hidden;

          color:
            rgba(
              255,
              255,
              255,
              .82
            );

          font-size:
            9px;

          font-weight:
            950;

          text-overflow:
            ellipsis;

          white-space:
            nowrap;
        }


        .card-section {
          overflow:
            hidden;

          color:
            rgba(
              255,
              255,
              255,
              .28
            );

          font-size:
            6px;

          font-weight:
            850;

          letter-spacing:
            .06em;

          text-overflow:
            ellipsis;

          text-transform:
            uppercase;

          white-space:
            nowrap;
        }


        .stage-header {
          justify-content:
            space-between;

          padding:
            0 12px;
        }


        .stage-header button {
          height:
            23px;

          padding:
            0 9px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              .08
            );

          border-radius:
            4px;

          background:
            rgba(
              255,
              255,
              255,
              .025
            );

          color:
            rgba(
              255,
              255,
              255,
              .48
            );

          font-size:
            7px;

          font-weight:
            950;

          cursor:
            pointer;
        }


        .stage-header button:disabled {
          opacity:
            .25;

          cursor:
            default;
        }


        .stage-identity {
          min-width: 0;

          display: flex;
          flex-direction:
            column;

          align-items:
            center;

          gap:
            2px;
        }


        .stage-identity strong {
          color:
            #ffc400;

          font-size:
            9px;

          font-weight:
            950;
        }


        .stage-identity span {
          color:
            rgba(
              255,
              255,
              255,
              .30
            );

          font-size:
            6px;

          font-weight:
            900;
        }


        .card-stage {
          min-height:
            560px;

          display: flex;
          flex-direction:
            column;

          align-items:
            center;

          justify-content:
            flex-start;

          gap:
            10px;

          padding:
            28px;
        }


        .native-label {
          color:
            rgba(
              255,
              255,
              255,
              .28
            );

          font-size:
            7px;

          font-weight:
            950;

          letter-spacing:
            .08em;
        }


        .template-facts {
          padding:
            12px;
        }


        .template-facts > div {
          padding:
            9px 0;

          border-bottom:
            1px solid
            rgba(
              255,
              255,
              255,
              .045
            );
        }


        .template-facts span {
          display: block;

          margin-bottom:
            4px;

          color:
            rgba(
              255,
              255,
              255,
              .26
            );

          font-size:
            6px;

          font-weight:
            950;

          letter-spacing:
            .08em;
        }


        .template-facts strong {
          display: block;

          overflow-wrap:
            anywhere;

          color:
            rgba(
              255,
              255,
              255,
              .76
            );

          font-size:
            8px;

          font-weight:
            900;
        }


        .panel-message {
          padding:
            16px;

          color:
            rgba(
              255,
              255,
              255,
              .36
            );

          font-size:
            8px;

          font-weight:
            900;
        }


        .panel-message.error {
          color:
            rgba(
              255,
              90,
              90,
              .86
            );
        }


        @media (
          max-width: 1050px
        ) {
          .aos-card-bench {
            grid-template-columns:
              210px
              minmax(
                340px,
                1fr
              );
          }

          .aos-card-inspector {
            display:
              none;
          }
        }
      `}</style>

    </div>
  );
}

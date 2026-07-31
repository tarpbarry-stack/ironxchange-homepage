import Head from "next/head";
import { useCallback, useEffect, useMemo, useState } from "react";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

import IXIMosBoard from "../../components/ixi-mos/IXIMosBoard";

import loadIXIMosEnvironment from "../../lib/mos/loadIXIMosEnvironment";

import {
  createMosCommandId,
  createMosObject,
  fetchMosContainer,
  fetchMosObjects,
  placeMosObject
} from "../../lib/mos/ixiMosClient";

const OBJECT_TYPE_OPTIONS = [
  {
    value: "job",
    label: "JOB"
  },
  {
    value: "location",
    label: "LOCATION / YARD"
  },
  {
    value: "real-estate",
    label: "REAL ESTATE"
  },
  {
    value: "building",
    label: "BUILDING / SHOP"
  },
  {
    value: "room",
    label: "ROOM / BAY"
  },
  {
    value: "person",
    label: "PERSON"
  },
  {
    value: "vehicle",
    label: "VEHICLE"
  },
  {
    value: "trailer",
    label: "TRAILER"
  },
  {
    value: "tool",
    label: "TOOL"
  },
  {
    value: "generic",
    label: "OTHER OBJECT"
  }
];

function createEmptyForm() {
  return {
    objectType: "job",
    displayName: "",
    customerCategory: "",
    customerAssetId: "",
    factualTitle: "",
    value: "",
    location: ""
  };
}

function clean(value) {
  return String(value || "").trim();
}

function formatMoney(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "$0";
  }

  return number.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  });
}

export default function IXIAosPage() {
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  const [error, setError] = useState("");

  const [userId, setUserId] = useState("");
  const [entity, setEntity] = useState(null);

  const [objects, setObjects] = useState([]);
  const [projections, setProjections] = useState({});

  const [currentContainer, setCurrentContainer] = useState(null);
  const [containerPath, setContainerPath] = useState([]);

  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [form, setForm] = useState(createEmptyForm());

  const entityId = entity?.entityId || "";

  const rootObjects = useMemo(() => {
    return objects.filter(object => !object.directContainerId);
  }, [objects]);

  const visibleObjects = currentContainer
    ? objects
    : rootObjects;

  const visibleObjectCount =
    visibleObjects.length;

  const visibleValue = useMemo(() => {
    return visibleObjects.reduce((sum, object) => {
      const objectId = String(object.objectId || "");

      const projection =
        projections[objectId];

      const value =
        projection?.branchValue ??
        object.value ??
        0;

      const numericValue = Number(value);

      return (
        sum +
        (Number.isFinite(numericValue)
          ? numericValue
          : 0)
      );
    }, 0);
  }, [visibleObjects, projections]);

  const loadContainerProjection = useCallback(
    async object => {
      if (!object?.capabilities?.canContain) {
        return null;
      }

      try {
        const response =
          await fetchMosContainer(
            object.objectId,
            {
              view: "direct"
            }
          );

        return response?.projection || null;
      } catch (projectionError) {
        console.warn(
          "MOS PROJECTION LOAD FAILED:",
          {
            objectId: object.objectId,
            error:
              projectionError?.message ||
              String(projectionError)
          }
        );

        return null;
      }
    },
    []
  );

  const hydrateProjectionMap = useCallback(
    async sourceObjects => {
      const containerObjects =
        sourceObjects.filter(
          object =>
            object?.capabilities?.canContain
        );

      const results =
        await Promise.all(
          containerObjects.map(
            async object => ({
              objectId: object.objectId,
              projection:
                await loadContainerProjection(
                  object
                )
            })
          )
        );

      const nextProjectionMap = {};

      results.forEach(result => {
        if (
          result.objectId &&
          result.projection
        ) {
          nextProjectionMap[
            result.objectId
          ] = result.projection;
        }
      });

      setProjections(
        current => ({
          ...current,
          ...nextProjectionMap
        })
      );

      return nextProjectionMap;
    },
    [loadContainerProjection]
  );

  const loadRootEnvironment = useCallback(
    async () => {
      setLoading(true);
      setError("");

      try {
        const environment =
          await loadIXIMosEnvironment({
            includeObjects: true
          });

        if (!environment.isAuthenticated) {
          window.location.href =
            `/login?returnTo=${encodeURIComponent(
              "/mos"
            )}`;

          return;
        }

        const loadedObjects =
  Array.isArray(
    environment.rootObjects
  )
    ? environment.rootObjects
    : [];

setUserId(
  String(environment.userId || "")
);

setEntity(
  environment.entity || null
);

setObjects(loadedObjects);

setProjections(
  environment.projections &&
  typeof environment.projections ===
    "object"
    ? environment.projections
    : {}
);

setCurrentContainer(null);
setContainerPath([]);
      } catch (loadError) {
        console.error(
          "MOS ENVIRONMENT LOAD FAILED:",
          loadError
        );

        setError(
          loadError?.message ||
          "IXI MOS could not load."
        );
      } finally {
        setLoading(false);
      }
    },
    [hydrateProjectionMap]
  );

  useEffect(() => {
    loadRootEnvironment();
  }, [loadRootEnvironment]);

  async function refreshEntityObjects() {
    if (!entityId) return [];

    const response =
      await fetchMosObjects({
        entityId
      });

    const loadedObjects =
      Array.isArray(response?.objects)
        ? response.objects
        : [];

    setObjects(loadedObjects);

    await hydrateProjectionMap(
      loadedObjects
    );

    return loadedObjects;
  }

  async function openContainer(object) {
    if (!object?.capabilities?.canContain) {
      return;
    }

    setWorking(true);
    setError("");

    try {
      const response =
        await fetchMosContainer(
          object.objectId,
          {
            view: "direct"
          }
        );

      const contents =
        Array.isArray(response?.contents)
          ? response.contents
          : [];

      setCurrentContainer(
        response?.container || object
      );

      setContainerPath(
        response?.effectivePath
          ?.pathObjectIds || []
      );

      setObjects(contents);

      if (response?.projection) {
        setProjections(current => ({
          ...current,
          [object.objectId]:
            response.projection
        }));
      }

      await hydrateProjectionMap(
        contents
      );
    } catch (openError) {
      console.error(
        "MOS CONTAINER OPEN FAILED:",
        openError
      );

      setError(
        openError?.message ||
        "Container could not be opened."
      );
    } finally {
      setWorking(false);
    }
  }

  async function reopenCurrentContainer() {
    if (!currentContainer?.objectId) {
      await loadRootEnvironment();
      return;
    }

    await openContainer(
      currentContainer
    );
  }

  async function createObject(event) {
    event.preventDefault();

    const displayName =
      clean(form.displayName);

    if (!displayName) {
      setError(
        "Object name is required."
      );

      return;
    }

    if (!entityId) {
      setError(
        "Entity is not available."
      );

      return;
    }

    setWorking(true);
    setError("");

    try {
      const createResponse =
        await createMosObject({
          entityId,

          objectType:
            form.objectType,

          displayName,

          customerCategory:
            clean(
              form.customerCategory
            ) || null,

          customerAssetId:
            clean(
              form.customerAssetId
            ) || null,

          factualTitle:
            clean(
              form.factualTitle
            ) || null,

          value:
            clean(form.value)
              ? Number(form.value)
              : null,

          fields: {
            location:
              clean(form.location) ||
              null
          },

          source: "mos-page",

          actorId: userId,

          metadata: {
            createdFrom:
              currentContainer
                ? "container-view"
                : "entity-root"
          }
        });

      const createdObject =
        createResponse?.object;

      if (!createdObject?.objectId) {
        throw new Error(
          "Object creation did not return an object."
        );
      }

      if (
        currentContainer?.objectId
      ) {
        await placeMosObject({
          objectId:
            createdObject.objectId,

          destinationContainerId:
            currentContainer.objectId,

          actorId: userId,

          commandId:
            createMosCommandId(
              "place-created-object"
            ),

          metadata: {
            source: "mos-create-panel"
          }
        });
      }

      setForm(createEmptyForm());
      setShowCreatePanel(false);

      if (currentContainer) {
        await reopenCurrentContainer();
      } else {
        await refreshEntityObjects();
      }
    } catch (createError) {
      console.error(
        "MOS OBJECT CREATE FAILED:",
        createError
      );

      setError(
        createError?.message ||
        "Object could not be created."
      );
    } finally {
      setWorking(false);
    }
  }

  function updateForm(field, value) {
    setForm(current => ({
      ...current,
      [field]: value
    }));
  }

  function openObject(object) {
    if (
      object?.capabilities?.canContain
    ) {
      openContainer(object);
    }
  }

  function returnToRoot() {
    loadRootEnvironment();
  }

  return (
    <>
      <Head>
        <title>
  IXI AOS | IronXchange
</title>
      </Head>

      <Navbar />

      <main>
        <section className="mos-entity-header">
          <div>
            <span className="mos-eyebrow">
              IXI ASSET OPERATING SYSTEM
            </span>

            <h1>
              {entity?.displayName ||
                "IXI ENTITY"}
            </h1>

            <p>
              {currentContainer
                ? currentContainer.displayName
                : "ENTITY ROOT"}
            </p>
          </div>

          <div className="mos-header-stats">
            <div>
              <strong>
                {visibleObjectCount}
              </strong>

              <span>OBJECTS</span>
            </div>

            <div>
              <strong>
                {formatMoney(
                  visibleValue
                )}
              </strong>

              <span>VISIBLE VALUE</span>
            </div>
          </div>

          <div className="mos-header-actions">
            {currentContainer ? (
              <button
                type="button"
                onClick={returnToRoot}
                disabled={working}
              >
                ENTITY ROOT
              </button>
            ) : null}

            <button
              type="button"
              className="primary"
              onClick={() =>
                setShowCreatePanel(
                  current => !current
                )
              }
              disabled={working}
            >
              + ADD
            </button>
          </div>
        </section>

        {currentContainer ? (
          <section className="mos-container-context">
            <div>
              <span>OPEN CONTAINER</span>

              <strong>
                {currentContainer.displayName}
              </strong>
            </div>

            <div>
              <span>OBJECT ID</span>

              <strong>
                {currentContainer.objectId}
              </strong>
            </div>

            <div>
              <span>PATH DEPTH</span>

              <strong>
                {Math.max(
                  containerPath.length - 1,
                  0
                )}
              </strong>
            </div>
          </section>
        ) : null}

        {showCreatePanel ? (
          <form
            className="mos-create-panel"
            onSubmit={createObject}
          >
            <div className="mos-create-head">
              <div>
                <span>CREATE OBJECT</span>

                <strong>
                  {currentContainer
                    ? `INSIDE ${currentContainer.displayName}`
                    : "AT ENTITY ROOT"}
                </strong>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowCreatePanel(false)
                }
              >
                CLOSE
              </button>
            </div>

            <div className="mos-form-grid">
              <label>
                <span>OBJECT TYPE</span>

                <select
                  value={form.objectType}
                  onChange={event =>
                    updateForm(
                      "objectType",
                      event.target.value
                    )
                  }
                >
                  {OBJECT_TYPE_OPTIONS.map(
                    option => (
                      <option
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </option>
                    )
                  )}
                </select>
              </label>

              <label>
                <span>NAME</span>

                <input
                  value={form.displayName}
                  onChange={event =>
                    updateForm(
                      "displayName",
                      event.target.value
                    )
                  }
                  placeholder="TRUCK 18 / JOB 41 / MIDLAND YARD"
                  required
                />
              </label>

              <label>
                <span>CATEGORY</span>

                <input
                  value={
                    form.customerCategory
                  }
                  onChange={event =>
                    updateForm(
                      "customerCategory",
                      event.target.value
                    )
                  }
                  placeholder="TOOLS / CREWS / OFFICES"
                />
              </label>

              <label>
                <span>ASSET / UNIT ID</span>

                <input
                  value={
                    form.customerAssetId
                  }
                  onChange={event =>
                    updateForm(
                      "customerAssetId",
                      event.target.value
                    )
                  }
                  placeholder="UNIT 18"
                />
              </label>

              <label>
                <span>FACTUAL TITLE</span>

                <input
                  value={form.factualTitle}
                  onChange={event =>
                    updateForm(
                      "factualTitle",
                      event.target.value
                    )
                  }
                  placeholder="2018 FORD F-350 SERVICE TRUCK"
                />
              </label>

              <label>
                <span>VALUE</span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.value}
                  onChange={event =>
                    updateForm(
                      "value",
                      event.target.value
                    )
                  }
                  placeholder="48500"
                />
              </label>

              <label className="wide">
                <span>LOCATION</span>

                <input
                  value={form.location}
                  onChange={event =>
                    updateForm(
                      "location",
                      event.target.value
                    )
                  }
                  placeholder="ODESSA, TX"
                />
              </label>
            </div>

            <button
              type="submit"
              className="mos-create-submit"
              disabled={working}
            >
              {working
                ? "CREATING..."
                : "CREATE OBJECT"}
            </button>
          </form>
        ) : null}

        {error ? (
          <div className="mos-error">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="mos-loading">
            LOADING IXI MOS...
          </div>
        ) : (
          <IXIMosBoard
            objects={visibleObjects}
            projections={projections}
            onOpenObject={openObject}
            onAddMedia={object =>
              console.log(
                "MOS ADD MEDIA",
                object
              )
            }
            onCreateWorkOrder={object =>
              console.log(
                "MOS CREATE WORK ORDER",
                object
              )
            }
            onAddExpense={object =>
              console.log(
                "MOS ADD EXPENSE",
                object
              )
            }
            onOpenQr={object =>
              console.log(
                "MOS OPEN QR",
                object
              )
            }
          />
        )}
      </main>

      <Footer />

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        :global(body) {
          margin: 0;
          background: #0b0b0b;
          color: #d6d6d6;
          font-family: Arial, sans-serif;
        }

        main {
          min-height: 76vh;
          padding: 18px 5% 100px;

          background:
            radial-gradient(
              circle at 50% 0%,
              rgba(255,196,0,.05),
              transparent 34%
            ),
            #0b0b0b;
        }

        .mos-entity-header {
          width: 100%;
          margin: 0 auto 16px;
          padding: 14px 16px;

          display: grid;
          grid-template-columns:
            minmax(260px, 1fr)
            auto
            minmax(180px, 1fr);

          align-items: center;
          gap: 20px;

          border:
            1px solid rgba(255,255,255,.07);
          border-radius: 12px;

          background:
            linear-gradient(
              180deg,
              rgba(255,255,255,.025),
              transparent
            ),
            #111;
        }

        .mos-eyebrow {
          display: block;
          margin-bottom: 5px;

          color: #ffc400;
          font-size: 7px;
          font-weight: 950;
          letter-spacing: .75px;
        }

        h1 {
          margin: 0;

          color: #f2f2f2;
          font-size: 20px;
          font-weight: 950;
          text-transform: uppercase;
        }

        .mos-entity-header p {
          margin: 5px 0 0;

          color: rgba(255,255,255,.40);
          font-size: 9px;
          font-weight: 900;
          text-transform: uppercase;
        }

        .mos-header-stats {
          display: flex;
          gap: 30px;
        }

        .mos-header-stats div {
          display: flex;
          align-items: baseline;
          gap: 7px;
        }

        .mos-header-stats strong {
          color: #f2f2f2;
          font-size: 20px;
          font-weight: 950;
        }

        .mos-header-stats span {
          color: rgba(255,255,255,.34);
          font-size: 7px;
          font-weight: 950;
          letter-spacing: .5px;
        }

        .mos-header-actions {
          display: flex;
          justify-content: flex-end;
          gap: 9px;
        }

        button {
          height: 34px;
          padding: 0 14px;

          border:
            1px solid rgba(255,255,255,.10);
          border-radius: 7px;

          background: #101010;
          color: rgba(255,255,255,.66);

          font-size: 8px;
          font-weight: 950;
          letter-spacing: .5px;

          cursor: pointer;
        }

        button.primary {
          border-color:
            rgba(255,196,0,.42);
          color: #ffc400;
        }

        button:disabled {
          opacity: .45;
          cursor: default;
        }

        .mos-container-context {
          margin: 0 auto 14px;
          padding: 10px 14px;

          display: grid;
          grid-template-columns:
            1fr 1fr 140px;
          gap: 18px;

          border:
            1px solid rgba(0,194,255,.14);
          border-radius: 9px;

          background:
            rgba(0,194,255,.025);
        }

        .mos-container-context div {
          min-width: 0;
        }

        .mos-container-context span {
          display: block;

          color: rgba(0,194,255,.70);
          font-size: 7px;
          font-weight: 950;
          letter-spacing: .55px;
        }

        .mos-container-context strong {
          display: block;
          margin-top: 4px;

          overflow: hidden;
          text-overflow: ellipsis;

          color: rgba(255,255,255,.66);
          font-size: 9px;
          white-space: nowrap;
        }

        .mos-create-panel {
          margin: 0 auto 20px;
          padding: 16px;

          border:
            1px solid rgba(255,196,0,.16);
          border-radius: 11px;

          background:
            linear-gradient(
              180deg,
              rgba(255,196,0,.035),
              transparent
            ),
            #101010;
        }

        .mos-create-head {
          display: flex;
          justify-content: space-between;
          align-items: center;

          margin-bottom: 14px;
        }

        .mos-create-head span {
          display: block;

          color: #ffc400;
          font-size: 8px;
          font-weight: 950;
          letter-spacing: .65px;
        }

        .mos-create-head strong {
          display: block;
          margin-top: 4px;

          color: rgba(255,255,255,.52);
          font-size: 10px;
        }

        .mos-form-grid {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(160px, 1fr));
          gap: 12px;
        }

        label {
          display: block;
        }

        label.wide {
          grid-column: span 3;
        }

        label span {
          display: block;
          margin-bottom: 5px;

          color: rgba(255,255,255,.34);
          font-size: 7px;
          font-weight: 950;
          letter-spacing: .45px;
        }

        input,
        select {
          width: 100%;
          height: 38px;

          border:
            1px solid rgba(255,255,255,.09);
          border-radius: 7px;

          background: #0b0b0b;
          color: rgba(255,255,255,.72);

          padding: 0 11px;
          outline: none;

          font-size: 10px;
          font-weight: 850;
        }

        input:focus,
        select:focus {
          border-color:
            rgba(255,196,0,.44);
        }

        .mos-create-submit {
          width: 180px;
          margin-top: 14px;

          border-color:
            rgba(255,196,0,.44);
          color: #ffc400;
        }

        .mos-error,
        .mos-loading {
          margin: 20px auto;
          padding: 18px;

          text-align: center;

          border-radius: 8px;

          font-size: 10px;
          font-weight: 900;
          letter-spacing: .4px;
        }

        .mos-error {
          border:
            1px solid rgba(229,62,62,.32);

          background:
            rgba(229,62,62,.06);

          color: rgba(255,120,120,.88);
        }

        .mos-loading {
          color: rgba(255,255,255,.40);
        }

        @media (max-width: 900px) {
          .mos-entity-header {
            grid-template-columns: 1fr;
          }

          .mos-header-actions {
            justify-content: flex-start;
          }

          .mos-form-grid {
            grid-template-columns: 1fr;
          }

          label.wide {
            grid-column: span 1;
          }

          .mos-container-context {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
